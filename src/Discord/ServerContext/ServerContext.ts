import { Logger } from '../../Logger'
import { VideoMetadata } from '../../Youtube/types'
import { MusicPlayer } from './MusicPlayer'
import { Guild } from 'discord.js'
import { AutoTimeout } from '../../Utilities'
import { VoiceChannelConnection } from './VoiceChannelConnection'
import { UserContextManager } from './UserContext'

export class ServerContext extends AutoTimeout {
    private guild: Guild
    private player: MusicPlayer
    private connection: VoiceChannelConnection
    private userContextManager: UserContextManager
    private reply: (message: string, ephemeral?: boolean) => void
    private announce: (message: string) => void

    constructor(guild: Guild, onIdle: (id: string) => void) {
        // Initialize auto timeout
        super(
            () => onIdle(guild.id),
            () => !this.player.isPlaying()
        )

        this.guild = guild

        this.player = new MusicPlayer(
            this.onMusicPlayerBegin.bind(this),
            this.onMusicPlayerSkip.bind(this),
            this.onMusicPlayerFinish.bind(this),
            this.onMusicPlayerError.bind(this)
        )

        this.connection = new VoiceChannelConnection(
            guild,
            () => !this.player.isPlaying(), // Idling condition
            (connection) => connection.subscribe(this.player.getPlayer()), // On join
            () => this.announce('Unable to join voice channel'), // On join error
            (connection) => connection.disconnect() // On leave
        )

        this.userContextManager = new UserContextManager()

        this.reply = () => {}
        this.announce = () => {}

        Logger.event(`Initialized context for server ${this.guild.id}`)
    }

    public setReply(reply: (message: string, ephemeral?: boolean) => void) {
        this.reply = reply
    }

    public setAnnounce(announce: (message: string) => void) {
        this.announce = announce
    }

    public queueSong(videoId: string, user: string) {
        this.getSongMetadata(videoId, user).then((song) => {
            this.reply(`Added ${song.title} to the queue!`, true)
            this.player.enqueue(user, song)

            Logger.event(
                `Queued ${song.title} in server ${this.guild.name}: ${this.guild.id}`
            )
            this.connection.cancelLeave()
        })
    }

    public skipSong() {
        this.player.skip()
    }

    public updateUserContext(user: string, options: VideoMetadata[]) {
        this.getUserContext(user).then((context) =>
            context.setLastKnownOptions(options)
        )
    }

    private onMusicPlayerBegin(user: string, message: string) {
        this.connection.cancelLeave()
        this.getVoiceChannelFromUserId(user).then((channelId) => {
            if (!channelId) {
                this.announce(
                    `Whoops! I won't be able to play your song until you are in the voice channel @${user}`
                )
                return
            }

            this.announce(message)
            this.connection.join(channelId)
        })
    }

    private onMusicPlayerSkip(message: string) {
        this.announce(message)
    }

    private onMusicPlayerFinish() {
        Logger.event('Music player finished')
        this.announce(
            'Queue is now empty. Harmonix will be disconnecting in 20 seconds'
        )

        this.connection.leave(20000)
    }

    private onMusicPlayerError(message: string) {
        this.announce(message)
    }

    private getVoiceChannelFromUserId(user: string) {
        return this.guild?.members
            .fetch(user)
            .then((member) => member.voice.channelId)
            .catch((err) => {
                Logger.error(`Error while fetching current channel ID: ${err}`)
            })
    }

    private async getUserContext(user: string) {
        let isIdle = () => false
        try {
            const channelId = await this.getVoiceChannelFromUserId(user)
            // User context is idle if user not currently in same voice channel as audio player
            isIdle = () =>
                channelId !== this.connection.getCurrentVoiceChannel()
        } catch (_) {}

        return this.userContextManager.getUserContext(user, isIdle)
    }

    private async getSongMetadata(id: string, user: string) {
        const userContext = await this.getUserContext(user)

        return userContext?.getSelectedOption(id)
    }
}
