import {
    AutocompleteInteraction,
    Client,
    Events,
    IntentsBitField,
    Interaction,
} from 'discord.js'
import { getVideoMetadata, queryVideos } from '../Youtube'
import { Logger } from '../Logger'
import { deployCommands } from './Commands/DeployCommands'
import { decode } from 'html-entities'
import { ServerContext } from './ServerContext'

class DiscordClient {
    private botId: string
    private botToken: string
    private serverContexts: Map<string, ServerContext>
    private client: Client

    constructor() {
        this.botId = process.env.DISCORD_BOT_ID ?? ''
        this.botToken = process.env.DISCORD_BOT_TOKEN ?? ''
        this.serverContexts = new Map()

        this.client = new Client({
            intents: [
                IntentsBitField.Flags.Guilds,
                IntentsBitField.Flags.GuildMembers,
                IntentsBitField.Flags.GuildMessages,
                IntentsBitField.Flags.MessageContent,
                IntentsBitField.Flags.GuildVoiceStates,
            ],
        })

        this.client.login(this.botToken)

        this.registerLifecycleMethods()
    }

    private registerLifecycleMethods() {
        this.client.on(Events.ClientReady, this.onClientReady.bind(this))
        this.client.on(
            Events.InteractionCreate,
            this.onInteractionCreate.bind(this)
        )
    }

    private async onClientReady() {
        Logger.event('Discord Client Initialized')
        deployCommands()
    }

    private onInteractionCreate(interaction: Interaction) {
        const serverContext = this.getServerContext(interaction)

        if (interaction.isCommand()) {
            switch (interaction.commandName) {
                case 'play':
                    const id = interaction.options.get('query')?.value
                    getVideoMetadata(String(id)).then((metadata) =>
                        serverContext.queueSong(metadata, interaction.user.id)
                    )

                    break

                case 'skip':
                    serverContext.skipSong()
                    break

                default:
                    interaction.reply('Unsupported command :(')
                    break
            }
        } else if (interaction.isAutocomplete()) {
            this.getOptionsFromQuery(interaction)
        }
    }

    private getServerContext(interaction: Interaction): ServerContext {
        const { guildId, guild } = interaction

        if (!guildId || !guild) {
            Logger.error('Interaction with no guild!')
            throw new Error("Can't create server context without a guild")
        }

        let serverContext = this.serverContexts.get(guildId)

        if (!serverContext) {
            serverContext = new ServerContext(guild, () => {})
            this.serverContexts.set(guildId, serverContext)
        }

        serverContext.updateMostRecentTextChannel(interaction.channelId ?? '')

        return serverContext
    }

    private async getOptionsFromQuery(interaction: AutocompleteInteraction) {
        const query = interaction.options.get('query')?.value

        const results = await queryVideos(String(query))

        return interaction.respond(
            results.map(({ title, id }) => ({
                name: decode(title.slice(0, 100)),
                value: id,
            }))
        )
    }
}

export default new DiscordClient()
