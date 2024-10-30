import {
    DiscordGatewayAdapterCreator,
    VoiceConnection,
    VoiceConnectionState,
    joinVoiceChannel,
} from '@discordjs/voice'
import { AutoTimeout } from '../../../Utilities'
import { Guild } from 'discord.js'

const VOICE_CHANNEL_TIMEOUT = 20000
const TIMEOUT_INTERVAL_CHECK = 5000

export class VoiceChannelConnection extends AutoTimeout {
    constructor(
        guild: Guild,
        isIdle: () => boolean,
        onJoin: (connection: VoiceConnection) => void,
        onJoinFailure: () => void,
        onLeave: (connection: VoiceConnection) => void
    ) {
        super(
            () => this.leave(),
            () => isIdle(),
            VOICE_CHANNEL_TIMEOUT,
            TIMEOUT_INTERVAL_CHECK
        )

        this.guild = guild

        this.onJoin = onJoin
        this.onJoinFailure = onJoinFailure
        this.onLeave = onLeave
    }

    public join(channelId: string) {
        this.connection = joinVoiceChannel({
            channelId,
            guildId: this.guild.id,
            adapterCreator: this.guild
                .voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator, // Annoying but needed after update to discord voice
        })

        this.connection.on('error', (err) => {
            this.leave()
            this.onJoinFailure()
        })

        this.onJoin(this.connection)
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

    public getCurrentVoiceChannel() {
        return this.connection?.joinConfig.channelId
    }

    public isActive: boolean = false
    private connection: VoiceConnection | null = null
    private leaveTimeout: NodeJS.Timeout | null = null
    private guild: Guild
    private onJoin: (connection: VoiceConnection) => void
    private onJoinFailure: () => void
    private onLeave: (connection: VoiceConnection) => void
}
