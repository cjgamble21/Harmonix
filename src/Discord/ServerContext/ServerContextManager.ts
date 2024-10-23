import { Interaction } from 'discord.js'
import { Logger } from '../../Logger'
import { ServerContext } from './ServerContext'

type ServerContextEntry = {
    lastUsed: number
    context: ServerContext
}

export class ServerContextManager {
    constructor() {
        this.serverContexts = new Map()
    }

    public getServerContext(interaction: Interaction): ServerContext {
        const { guildId, guild } = interaction

        if (!guildId || !guild) {
            Logger.error('Interaction with no guild!')
            throw new Error("Can't create server context without a guild")
        }

        let serverContext = this.serverContexts.get(guildId)

        if (!serverContext) {
            serverContext = {
                context: new ServerContext(guild, this.onServerContextIdle),
                lastUsed: Date.now(),
            }
            this.serverContexts.set(guildId, serverContext)
        }

        serverContext.context.setReply((message: string, ephemeral = false) => {
            if (!interaction.isRepliable()) return

            const payload = ephemeral
                ? { content: message, ephemeral }
                : message

            interaction.reply(payload)
        })
        serverContext.context.setAnnounce((message: string) => {
            const { channelId } = interaction
            if (!channelId) return

            const channel = guild.channels.cache.get(channelId)

            if (!channel || !channel.isTextBased() || !channel.isSendable())
                return

            channel.send(message)
        })

        return serverContext.context
    }

    // Event handler for server contexts to clear themselves from memory after idling
    private onServerContextIdle(id: string) {
        this.serverContexts.delete(id)
    }

    private serverContexts: Map<string, ServerContextEntry>
}
