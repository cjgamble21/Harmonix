import {
    AudioPlayer,
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
} from '@discordjs/voice'
import { Queue } from '../../Queue'
import { VideoMetadata } from '../../Youtube/types'
import ytdl from '@distube/ytdl-core'
import { Logger } from '../../Logger'

export type QueuedMusic = VideoMetadata & { user: string }

export class MusicPlayer {
    private queue: Queue<QueuedMusic>
    private player: AudioPlayer
    private currentSong: QueuedMusic | null = null
    private onPlay: (user: string, player: AudioPlayer, message: string) => void
    private onSkip: (message: string) => void
    private onFinish: () => void

    constructor(
        onPlay: (user: string, player: AudioPlayer, message: string) => void,
        onSkip: (message: string) => void,
        onFinish: () => void
    ) {
        this.onPlay = onPlay
        this.onSkip = onSkip
        this.onFinish = onFinish

        this.queue = new Queue()
        this.player = createAudioPlayer()

        this.registerLifecycleMethods()
    }

    public stop() {
        this.player.stop()
    }

    public pause() {
        this.player.pause()
    }

    public skip() {
        if (this.currentSong) this.onSkip(`Skipping ${this.currentSong}`)
        this.player.stop()
        this.playNextSong()
    }

    public enqueue(user: string, ...metadata: VideoMetadata[]) {
        this.queue.push(...metadata.map((song) => ({ user, ...song })))

        if (this.player.state.status === AudioPlayerStatus.Idle) {
            this.playNextSong()
        }
    }

    private playNextSong() {
        if (this.queue.isEmpty()) {
            this.onFinish()
            return
        }

        const nextSong = this.queue.pop()!

        this.currentSong = nextSong

        const songStream = MusicPlayer.getSongStreamFromVideoMetadata(nextSong)

        this.player.play(songStream)

        this.onPlay(
            nextSong.user,
            this.player,
            `Playing ${nextSong.title} (${nextSong.duration})`
        )

        Logger.event(
            `Audio Player Playing ${nextSong.title}, length ${nextSong.duration}`
        )
    }

    private registerLifecycleMethods() {
        this.player.on(AudioPlayerStatus.Idle, () =>
            Logger.event('Audio Player Idling...')
        )
        this.player.on(AudioPlayerStatus.Buffering, () =>
            Logger.event('Audio Player Buffering...')
        )
        this.player.on(AudioPlayerStatus.Paused, () =>
            Logger.event('Audio Player Paused...')
        )
        this.player.on(AudioPlayerStatus.Playing, () => {})
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
