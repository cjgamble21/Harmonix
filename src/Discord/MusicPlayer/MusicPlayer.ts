import {
    AudioPlayer,
    AudioPlayerBufferingState,
    AudioPlayerIdleState,
    AudioPlayerPausedState,
    AudioPlayerPlayingState,
    AudioPlayerState,
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
} from '@discordjs/voice'
import { Queue } from '../../Queue'
import { VideoMetadata } from '../../Youtube/types/SearchResult.type'
import ytdl from '@distube/ytdl-core'
import { Logger } from '../../Logger'

type QueuedMusic = VideoMetadata & { user: string }

export class MusicPlayer {
    queue: Queue<QueuedMusic>
    songProcessor: Generator
    player: AudioPlayer
    currentSong: QueuedMusic | null = null
    isPlaying: boolean = false
    onPlay: (user: string, player: AudioPlayer) => void
    onFinish: () => void

    constructor(
        onPlay: (user: string, player: AudioPlayer) => void,
        onFinish: () => void
    ) {
        this.onPlay = onPlay
        this.onFinish = onFinish

        this.queue = new Queue()
        this.player = createAudioPlayer()

        this.registerLifecycleMethods()

        this.songProcessor = this.startSongProcessor()
    }

    public stop() {
        this.player.stop()
    }

    public pause() {
        this.player.pause()
    }

    public skip() {
        this.player.stop()
        this.songProcessor.next()
    }

    public enqueue(user: string, ...metadata: VideoMetadata[]) {
        this.queue.push(...metadata.map((song) => ({ user, ...song })))

        if (!this.isPlaying) this.songProcessor.next()
    }

    public onBuffering(
        oldState: AudioPlayerState,
        newState: AudioPlayerBufferingState
    ) {
        Logger.event('Audio Player Buffering...')
    }

    public onIdling(
        oldState: AudioPlayerState,
        newState: AudioPlayerIdleState
    ) {
        this.currentSong = null
        Logger.event('Audio Player Idling...')
        this.songProcessor.next()
    }

    public onPaused(
        oldState: AudioPlayerState,
        newState: AudioPlayerPausedState
    ) {
        Logger.event('Audio Player Paused...')
    }

    public onPlaying(
        oldState: AudioPlayerState,
        newState: AudioPlayerPlayingState
    ) {
        if (!this.currentSong) return

        this.isPlaying = true

        this.onPlay(this.currentSong.user, this.player)

        Logger.event(
            `Audio Player Playing ${this.currentSong.title}, length ${newState.playbackDuration}`
        )
    }

    private registerLifecycleMethods() {
        this.player.on(AudioPlayerStatus.Idle, this.onIdling.bind(this))
        this.player.on(AudioPlayerStatus.Buffering, this.onBuffering.bind(this))
        this.player.on(AudioPlayerStatus.Paused, this.onPaused.bind(this))
        this.player.on(AudioPlayerStatus.Playing, this.onPlaying.bind(this))
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

    private *startSongProcessor() {
        while (true) {
            if (this.queue.isEmpty()) {
                yield
            } else {
                const song = this.queue.pop() as QueuedMusic
                this.currentSong = song

                const songStream =
                    MusicPlayer.getSongStreamFromVideoMetadata(song)

                this.player.play(songStream)

                yield
            }
        }
    }
}
