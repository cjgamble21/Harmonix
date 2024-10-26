import {
    AudioPlayer,
    DiscordGatewayAdapterCreator,
    VoiceConnection,
    joinVoiceChannel,
} from '@discordjs/voice'
import { AutoTimeout } from '../../../Utilities'
import { Guild } from 'discord.js'

const VOICE_CHANNEL_TIMEOUT = 20000

export class VoiceChannelConnection extends AutoTimeout {
    constructor(
        guild: Guild,
        isIdle: () => boolean,
        onJoin: (connection: VoiceConnection) => void,
        onJoinFailure: () => void,
        onLeave: (connection: VoiceConnection) => void
    ) {
        super(() => this.leave(), isIdle, VOICE_CHANNEL_TIMEOUT)

        this.guild = guild

        this.onJoin = onJoin
        this.onJoinFailure = onJoinFailure
        this.onLeave = onLeave
    }

    public join(channelId: string) {
        this.connection?.removeAllListeners()

        this.connection = joinVoiceChannel({
            channelId,
            guildId: this.guild.id,
            adapterCreator: this.guild
                .voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator, // Annoying but needed after update to discord voice
        })

        this.connection?.on('error', () => {
            this.leave()
            this.onJoinFailure()
        })

        this.connection.on('stateChange', (oldState, newState) => {
            if (!this.connection) {
                this.onJoinFailure()
                return
            }

            const { status } = newState

            switch (status) {
                case 'ready':
                    this.onJoin(this.connection)

                case 'disconnected':
                case 'destroyed':
                    this.onLeave(this.connection)
            }
        })
    }

    public leave(timeout = 0) {
        this.leaveTimeout = setTimeout(
            () => this.connection?.disconnect(),
            timeout
        )
    }

    public cancelLeave() {
        if (this.leaveTimeout) {
            clearTimeout(this.leaveTimeout)
            this.leaveTimeout = null
        }
    }

    public subscribeAudioPlayer(player: AudioPlayer) {
        this.connection?.subscribe(player)
    }

    public isActive: boolean = false
    private connection: VoiceConnection | null = null
    private leaveTimeout: NodeJS.Timeout | null = null
    private guild: Guild
    private onJoin: (connection: VoiceConnection) => void
    private onJoinFailure: () => void
    private onLeave: (connection: VoiceConnection) => void
}
