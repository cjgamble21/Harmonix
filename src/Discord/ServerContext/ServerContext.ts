import {
    AudioPlayer,
    DiscordGatewayAdapterCreator,
    VoiceConnection,
    VoiceConnectionStatus,
    joinVoiceChannel,
} from '@discordjs/voice'
import { Logger } from '../../Logger'
import { VideoMetadata } from '../../Youtube/types'
import { MusicPlayer } from './MusicPlayer'
import { Guild } from 'discord.js'
import { AutoTimeout } from '../../Utilities'
import { VoiceChannelConnection } from './VoiceChannelConnection'

export class ServerContext extends AutoTimeout {
    private guild: Guild
    private player: MusicPlayer
    private connection: VoiceChannelConnection
    private reply: (message: string, ephemeral?: boolean) => void
    private announce: (message: string) => void

    constructor(guild: Guild, onIdle: (id: string) => void) {
        super(
            () => {
                onIdle(guild.id)
            },
            () => this.player.queueIsEmpty()
        ) // Initialize auto timeout

        this.guild = guild

        this.player = new MusicPlayer(
            this.onMusicPlayerBegin.bind(this),
            this.onMusicPlayerSkip.bind(this),
            this.onMusicPlayerFinish.bind(this),
            this.onMusicPlayerError.bind(this)
        )

        this.connection = new VoiceChannelConnection(
            guild,
            () => this.player.queueIsEmpty(),
            (connection) => connection.subscribe(),
            () => {},
            () => {}
        )

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

    public queueSong(song: VideoMetadata, user: string) {
        this.reply(`Added ${song.title} to the queue!`, true)
        this.player.enqueue(user, song)

        Logger.event(`Queued ${song.title} in server ${this.guild.id}`)
        this.cancelDisconnect()
    }

    public skipSong() {
        this.player.skip()
    }

    private onMusicPlayerBegin(
        user: string,
        player: AudioPlayer,
        message: string
    ) {
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

        this.connection.leave()
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
}
