import {
    AudioPlayer,
    DiscordGatewayAdapterCreator,
    VoiceConnection,
    joinVoiceChannel,
} from '@discordjs/voice'
import { Logger } from '../../Logger'
import { VideoMetadata } from '../../Youtube/types'
import { MusicPlayer } from '../MusicPlayer'
import { Guild } from 'discord.js'
import { AutoTimeout } from '../../Utilities'

export class ServerContext extends AutoTimeout {
    private guild: Guild
    private player: MusicPlayer
    private connection: VoiceConnection | null = null
    private disconnectTimeout: NodeJS.Timeout | null = null
    private reply: (message: string, ephemeral?: boolean) => void
    private announce: (message: string) => void

    constructor(guild: Guild, onIdle: (id: string) => void) {
        super(
            () => {
                this.disconnectFromVoiceChannel(0)
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

    private joinVoiceChannel(channelId: string) {
        return new Promise<void>((resolve, reject) => {
            this.connection = joinVoiceChannel({
                channelId,
                guildId: this.guild.id,
                adapterCreator: this.guild
                    .voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator, // Annoying but needed after update to discord voice
            })

            this.connection?.on('error', () =>
                (() => this.disconnectFromVoiceChannel(0)).bind(this)
            )

            this.connection.on('stateChange', (oldState, newState) => {
                const { status } = newState

                switch (status) {
                    case 'ready':
                        resolve()

                    case 'disconnected':
                    case 'destroyed':
                        reject()
                }
            })
        })
    }

    private disconnectFromVoiceChannel(timeout = 20_000) {
        Logger.event(`Disconnecting from voice channel in ${timeout}`)
        this.disconnectTimeout = setTimeout(
            () => this.connection?.disconnect(),
            timeout
        )
    }

    private cancelDisconnect() {
        if (!this.disconnectTimeout) return

        clearTimeout(this.disconnectTimeout)
    }

    private onMusicPlayerBegin(
        user: string,
        player: AudioPlayer,
        message: string
    ) {
        this.announce(message)
        this.getVoiceChannelFromUserId(user).then((channelId) => {
            if (!channelId) return

            this.joinVoiceChannel(channelId)
                .then(() => this.connection?.subscribe(player))
                .catch(() => {
                    Logger.event(`Disconnected from voice channel ${channelId}`)
                })
        })
    }

    private onMusicPlayerSkip(message: string) {
        this.reply(message)
    }

    private onMusicPlayerFinish() {
        Logger.event('Music player finished')
        this.announce(
            'Queue is now empty. Harmonix will be disconnecting in 20 seconds'
        )

        this.disconnectFromVoiceChannel()
    }

    private onMusicPlayerError(message: string) {
        this.announce(message)
        this.disconnectFromVoiceChannel(0)
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
