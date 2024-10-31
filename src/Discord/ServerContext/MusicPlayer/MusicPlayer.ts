import {
    AudioPlayer,
    AudioPlayerPlayingState,
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
} from '@discordjs/voice'
import { Queue } from '../../../Queue'
import { VideoMetadata } from '../../../Youtube/types'
import ytdl from '@distube/ytdl-core'
import { Logger } from '../../../Logger'
import { readFileSync } from 'fs'
import { formatSecondsToTimestamp } from '../../../Utilities'

export type QueuedMusic = VideoMetadata & { user: string }

export class MusicPlayer {
    private queue: Queue<QueuedMusic>
    private player: AudioPlayer
    private currentSong: QueuedMusic | null = null
    private onPlay: (user: string, message: string) => void
    private onSkip: (message: string) => void
    private onFinish: () => void
    private onError: (message: string) => void

    constructor(
        onPlay: (user: string, message: string) => void,
        onSkip: (message: string) => void,
        onFinish: () => void,
        onError: (message: string) => void
    ) {
        this.onPlay = onPlay
        this.onSkip = onSkip
        this.onFinish = onFinish
        this.onError = onError

        this.queue = new Queue()
        this.player = createAudioPlayer()

        this.registerLifecycleMethods()
    }

    public getPlayer() {
        return this.player
    }

    public stop() {
        this.queue.clear()
        this.player.stop()
    }

    public pause() {
        return this.player.pause(true)
    }

    public resume() {
        return this.player.unpause()
    }

    public skip() {
        if (this.currentSong) this.onSkip(`Skipping ${this.currentSong.title}`)
        this.player.stop()
    }

    public enqueue(user: string, ...metadata: VideoMetadata[]) {
        this.queue.push(...metadata.map((song) => ({ user, ...song })))

        if (this.player.state.status === AudioPlayerStatus.Idle) {
            this.playNextSong()
        }
    }

    public isPlaying() {
        return !!this.currentSong
    }

    private async playNextSong() {
        if (this.queue.isEmpty()) {
            this.onFinish()
            return
        }

        const nextSong = this.queue.pop()!

        try {
            const { stream, length } =
                await MusicPlayer.getSongStreamFromVideoMetadata(nextSong)

            this.currentSong = nextSong

            this.player.play(stream)

            this.onPlay(nextSong.user, `Playing ${nextSong.title} (${length})`)

            Logger.event(
                `Audio Player Playing ${nextSong.title}, length ${length}`
            )
        } catch (e) {
            Logger.error(`Error attempting to play ${nextSong.title}`)
            this.onError(`Error attempting to play ${nextSong.title}`)
        }
    }

    private registerLifecycleMethods() {
        this.player.on(AudioPlayerStatus.Idle, () => {
            Logger.event('Audio Player Idling...')
            this.currentSong = null
            this.playNextSong()
        })
        this.player.on(AudioPlayerStatus.Buffering, () =>
            Logger.event('Audio Player Buffering...')
        )
        this.player.on(AudioPlayerStatus.Paused, () =>
            Logger.event('Audio Player Paused...')
        )
        this.player.on(AudioPlayerStatus.Playing, () => {})

        this.player.on('error', () => {
            this.onError(`Error attempting to play ${this.currentSong?.title}`)
            this.currentSong = null
            this.playNextSong()
        })
    }

    private static async getSongStreamFromVideoMetadata(
        metadata: VideoMetadata
    ) {
        const url = `https://youtube.com/watch?v=${metadata.id}`
        const cookies = JSON.parse(readFileSync('cookies.json').toString())

        const agent = ytdl.createAgent(cookies)

        const info = await ytdl.getBasicInfo(url)

        const length = formatSecondsToTimestamp(
            Number(info.player_response.videoDetails.lengthSeconds)
        )

        const songStream = ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            ...(cookies && { agent }),
            /* 
                Not too sure about this high watermark bitrate, but found this fix here: https://github.com/fent/node-ytdl-core/issues/902
            */
            highWaterMark: 1 << 25,
            liveBuffer: 1 << 62,
            dlChunkSize: 0,
        })
        return {
            stream: createAudioResource(songStream, {
                silencePaddingFrames: 20,
            }),
            length,
        }
    }
}
