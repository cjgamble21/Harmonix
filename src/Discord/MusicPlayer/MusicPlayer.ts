import {
    AudioPlayer,
    AudioPlayerBufferingState,
    AudioPlayerIdleState,
    AudioPlayerPausedState,
    AudioPlayerPlayingState,
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
import { Interaction } from 'discord.js'

export class MusicPlayer {
    queue: Queue<VideoMetadata>
    player: AudioPlayer
    interaction: Interaction

    constructor(interaction: Interaction) {
        this.queue = new Queue()
        this.player = createAudioPlayer()
        this.interaction = interaction

        this.registerLifecycleMethods()
    }

    public start() {
        const metadata = this.queue.pop()

        if (!metadata) {
            Logger.warn('Attempted to start music player with empty queue')
            return
        }

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

    public onIdle(oldState: AudioPlayerState, newState: AudioPlayerIdleState) {
        Logger.event('Audio Player Idling...')
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
        Logger.event('Audio Player Playing...')
    }

    private registerLifecycleMethods() {
        this.player.on(AudioPlayerStatus.Idle, this.onIdle.bind(this))
        this.player.on(AudioPlayerStatus.Buffering, this.onBuffering.bind(this))
        this.player.on(AudioPlayerStatus.Paused, this.onPause.bind(this))
        this.player.on(AudioPlayerStatus.Playing, this.onPlay.bind(this))
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
