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

export class ServerContext {
    private guild: Guild
    private player: MusicPlayer
    private connection: VoiceConnection | null = null
    private mostRecentTextChannel: string = ''
    private sendChatMessage: (message: string) => void

    constructor(guild: Guild, sendChatMessage: (message: string) => void) {
        this.guild = guild
        this.sendChatMessage = sendChatMessage
        this.player = new MusicPlayer(
            this.onMusicPlayerBegin.bind(this),
            this.onMusicPlayerFinish.bind(this)
        )
        Logger.event(`Initialized context for server ${this.guild.id}`)
    }

    public queueSong(song: VideoMetadata, user: string) {
        this.player.enqueue(user, song)
        this.sendChatMessage(`Added ${song.title} to the queue!`)
        Logger.event(`Queued ${song.title} in server ${this.guild.id}`)
    }

    public skipSong() {
        this.sendChatMessage(`Skipping ${this.player.currentSong?.title}`)
        this.player.skip()
    }

    public updateMostRecentTextChannel(channel: string) {
        this.mostRecentTextChannel = channel
    }

    private joinVoiceChannel(channelId: string) {
        return new Promise<void>((resolve, reject) => {
            this.connection = joinVoiceChannel({
                channelId,
                guildId: this.guild.id,
                adapterCreator: this.guild
                    .voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator, // Annoying but needed after update to discord voice
            })

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

    private onMusicPlayerBegin(user: string, player: AudioPlayer) {
        this.getVoiceChannelFromUserId(user).then((channelId) => {
            if (!channelId) return

            this.joinVoiceChannel(channelId).then(() =>
                this.connection?.subscribe(player)
            )
        })
    }

    private onMusicPlayerFinish() {
        Logger.event('Music player finished')

        setTimeout(() => {
            Logger.event('Disconnecting from voice channel')
            this.connection?.disconnect()
        }, 20_000)
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
