import {
    AudioPlayer,
    AudioPlayerBufferingState,
    AudioPlayerState,
    AudioPlayerStatus,
    AudioResource,
    createAudioPlayer,
    createAudioResource,
} from '@discordjs/voice'
import { Queue } from '../../Queue'
import { VideoMetadata } from '../../Youtube/types/SearchResult.type'
import ytdl from '@distube/ytdl-core'
import { Logger } from '../../Logger'

export class MusicPlayer {
    queue: Queue<VideoMetadata>
    player: AudioPlayer

    constructor() {
        this.queue = new Queue()
        this.player = createAudioPlayer()

        this.registerLifecycleMethods()
    }

    public start() {
        if (this.queue.isEmpty()) return

        Logger.warn('Attempted to start music player with empty queue')

        const metadata = this.queue.pop() as VideoMetadata // Can't be empty

        const song = MusicPlayer.getSongStreamFromVideoMetadata(metadata)

        this.player.play(song)

        Logger.event(`Started playing ${metadata.title}`)
    }

    public stop() {
        this.player.stop()
    }

    public pause() {
        this.player.pause()
    }

    public skip() {
        this.player.stop()
    }

    public enqueue() {}

    public dequeue(idx?: number) {}

    public onBuffering(
        oldState: AudioPlayerState,
        newState: AudioPlayerBufferingState
    ) {
        Logger.event('Audio Player Buffering...')
    }

    public onIdle() {
        Logger.event('Audio Player Idling...')
    }

    private registerLifecycleMethods() {
        this.player.on(AudioPlayerStatus.Idle, this.onIdle.bind(this))
        this.player.on(AudioPlayerStatus.Buffering, this.onBuffering.bind(this))
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
