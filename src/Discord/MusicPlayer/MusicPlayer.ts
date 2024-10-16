import {
    AudioPlayer,
    AudioPlayerBufferingState,
    AudioPlayerIdleState,
    AudioPlayerPausedState,
    AudioPlayerPlayingState,
    AudioPlayerState,
    AudioPlayerStatus,
    AudioResource,
    DiscordGatewayAdapterCreator,
    PlayerSubscription,
    VoiceConnection,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
} from '@discordjs/voice'
import { Queue } from '../../Queue'
import { VideoMetadata } from '../../Youtube/types/SearchResult.type'
import ytdl from '@distube/ytdl-core'
import { Logger } from '../../Logger'
import { Interaction } from 'discord.js'
import { TimeoutHandler } from '../../Utilities/TimeoutHandler'
import { sendChatMessage, sendEphemeralChatMessage } from '../Chat'
import { formatMillisecondsToMinutesAndSeconds } from '../../Utilities'

export class MusicPlayer {
    queue: Queue<VideoMetadata>
    player: AudioPlayer
    interaction: Interaction
    timeoutHandler: TimeoutHandler
    currentSong: VideoMetadata | null = null
    connection: VoiceConnection | null = null
    subscription: PlayerSubscription | null = null

    constructor(interaction: Interaction, timeout = 20_000) {
        this.queue = new Queue()
        this.player = createAudioPlayer()
        this.interaction = interaction
        this.timeoutHandler = new TimeoutHandler(timeout)

        this.registerLifecycleMethods()
    }

    public start() {
        const metadata = this.queue.pop()

        if (!metadata) {
            Logger.warn('Attempted to start music player with empty queue')
            return
        }

        this.currentSong = metadata

        const song = MusicPlayer.getSongStreamFromVideoMetadata(metadata)

        this.player.play(song)
    }

    public stop() {
        this.player.stop()
    }

    public pause() {
        this.player.pause()
    }

    public skip() {
        this.player.stop()
        this.start()
    }

    public enqueue(...metadata: VideoMetadata[]) {
        this.queue.push(...metadata)
        // metadata.forEach(({ title }) =>
        //     sendChatMessage(this.interaction, `Added ${title} to the queue!`)
        // )
    }

    public dequeue(...metadata: VideoMetadata[]) {
        this.queue.dequeue(metadata, ({ id }) => id)

        // metadata.forEach(({ title }) =>
        //     sendChatMessage(this.interaction, `Remove ${title} from the queue!`)
        // )
    }

    public onBuffering(
        oldState: AudioPlayerState,
        newState: AudioPlayerBufferingState
    ) {
        Logger.event('Audio Player Buffering...')
        // sendEphemeralChatMessage(
        //     this.interaction,
        //     'Attempting to play your song, please wait...'
        // )
    }

    public onIdle(oldState: AudioPlayerState, newState: AudioPlayerIdleState) {
        this.currentSong = null
        Logger.event('Audio Player Idling...')

        this.destructor()

        this.start()
    }

    public onPause(
        oldState: AudioPlayerState,
        newState: AudioPlayerPausedState
    ) {
        Logger.event('Audio Player Paused...')
    }

    public onPlay(
        oldState: AudioPlayerState,
        newState: AudioPlayerPlayingState
    ) {
        if (!this.currentSong) return

        this.clearDestructor()

        Logger.event(
            `Audio Player Playing ${this.currentSong.title}, length ${newState.playbackDuration}`
        )

        this.joinVoiceChannel()

        if (this.connection) {
            this.subscription = this.connection.subscribe(this.player)
        }

        // sendChatMessage(
        //     this.interaction,
        //     `Playing ${this.currentSong.title} (${formatMillisecondsToMinutesAndSeconds(newState.playbackDuration)})`
        // )
    }

    private registerLifecycleMethods() {
        this.player.on(AudioPlayerStatus.Idle, this.onIdle.bind(this))
        this.player.on(AudioPlayerStatus.Buffering, this.onBuffering.bind(this))
        this.player.on(AudioPlayerStatus.Paused, this.onPause.bind(this))
        this.player.on(AudioPlayerStatus.Playing, this.onPlay.bind(this))
    }

    private async joinVoiceChannel() {
        const { guild } = this.interaction

        if (!guild) {
            Logger.warn('Attempted to join voice channel with no guild')
            return
        }

        const voiceChannelId = await this.getVoiceChannelFromInteraction()

        if (!voiceChannelId) {
            Logger.warn('Unable to extract voice channel ID from interaction')
            return
        }

        this.connection = joinVoiceChannel({
            channelId: voiceChannelId,
            guildId: guild.id,
            adapterCreator:
                guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator, // Annoying but needed after update to discord voice
        })

        this.connection.on('error', (error) => {
            Logger.error('Voice connection error: ', error.message)
            this.connection?.disconnect()
        })
    }

    private getVoiceChannelFromInteraction() {
        const { guild, user } = this.interaction
        return guild?.members
            .fetch(user.id)
            .then((member) => member.voice.channelId)
            .catch((err) => {
                Logger.error(`Error while fetching current channel ID: ${err}`)
            })
    }

    private destructor() {
        this.timeoutHandler.beginTimeout(() => {
            if (!this.connection || !this.subscription || this.currentSong)
                return

            this.connection.disconnect()
            this.subscription.unsubscribe()
        })
    }

    private clearDestructor() {
        this.timeoutHandler.clearTimeout()
    }

    private static getSongStreamFromVideoMetadata(metadata: VideoMetadata) {
        const url = `https://youtube.com/watch?v=${metadata.id}`
        const songStream = ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            /* 
                    Not too sure about this high watermark bitrate, but found this fix here: https://github.com/fent/node-ytdl-core/issues/902
                */
            highWaterMark: 1 << 25,
        })
        return createAudioResource(songStream)
    }
}
