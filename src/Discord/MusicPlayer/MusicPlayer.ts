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
    timeoutHandler: TimeoutHandler
    currentSong: VideoMetadata | null = null
    connection: VoiceConnection | null = null
    subscription: PlayerSubscription | null = null
    isPlaying: boolean = false
    onPlay: (user: string, player: AudioPlayer) => void
    onFinish: () => void

    constructor(
        onPlay: (user: string, player: AudioPlayer) => void,
        onFinish: () => void,
        timeout = 20_000
    ) {
        this.onPlay = onPlay
        this.onFinish = onFinish

        this.queue = new Queue()
        this.player = createAudioPlayer()
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
        this.isPlaying = false
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

        if (!this.isPlaying) {
            this.start()
        }
    }

    public dequeue(...metadata: VideoMetadata[]) {
        this.queue.dequeue(metadata, ({ id }) => id)
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

    public onIdling(
        oldState: AudioPlayerState,
        newState: AudioPlayerIdleState
    ) {
        this.currentSong = null
        this.isPlaying = false
        Logger.event('Audio Player Idling...')

        this.destructor()

        this.start()
    }

    public onPaused(
        oldState: AudioPlayerState,
        newState: AudioPlayerPausedState
    ) {
        this.isPlaying = false
        Logger.event('Audio Player Paused...')
    }

    public onPlaying(
        oldState: AudioPlayerState,
        newState: AudioPlayerPlayingState
    ) {
        if (!this.currentSong) return

        this.isPlaying = true

        this.onPlay()

        // this.clearDestructor()

        // Logger.event(
        //     `Audio Player Playing ${this.currentSong.title}, length ${newState.playbackDuration}`
        // )

        // this.joinVoiceChannel().then(() =>
        //     this.connection?.subscribe(this.player)
        // )
    }

    private registerLifecycleMethods() {
        this.player.on(AudioPlayerStatus.Idle, this.onIdle.bind(this))
        this.player.on(AudioPlayerStatus.Buffering, this.onBuffering.bind(this))
        this.player.on(AudioPlayerStatus.Paused, this.onPause.bind(this))
        this.player.on(AudioPlayerStatus.Playing, this.onPlay.bind(this))
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
