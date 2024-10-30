import {
    AutocompleteInteraction,
    Client,
    Events,
    IntentsBitField,
    Interaction,
} from 'discord.js'
import { queryVideos } from '../Youtube'
import { Logger } from '../Logger'
import { deployCommands } from './Commands/DeployCommands'
import { ServerContextManager } from './ServerContext'
import { CoreErrorBoundary } from '../Utilities'

@CoreErrorBoundary
class DiscordClient {
    constructor() {
        this.serverContextManager = new ServerContextManager()

        this.client = new Client({
            intents: [
                IntentsBitField.Flags.Guilds,
                IntentsBitField.Flags.GuildMembers,
                IntentsBitField.Flags.GuildMessages,
                IntentsBitField.Flags.MessageContent,
                IntentsBitField.Flags.GuildVoiceStates,
            ],
        })

        this.client.login(BOT_TOKEN)

        this.registerLifecycleMethods()
    }

    private registerLifecycleMethods() {
        this.client.on(Events.ClientReady, this.onClientReady.bind(this))
        this.client.on(
            Events.InteractionCreate,
            this.onInteractionCreate.bind(this)
        )
        this.client.on(Events.Error, (err) => {
            throw err
        })
    }

    private async onClientReady() {
        Logger.event('Discord Client Initialized')
        deployCommands()
    }

    private onInteractionCreate(interaction: Interaction) {
        const serverContext =
            this.serverContextManager.getServerContext(interaction)

        const userId = interaction.user.id

        if (interaction.isCommand()) {
            switch (interaction.commandName) {
                case 'play':
                    const id = String(interaction.options.get('query')?.value)
                    serverContext.queueSong(id, userId)
                    break

                case 'skip':
                    serverContext.skipSong()
                    break

                case 'pause':
                    serverContext.pauseMusic()
                    break

                case 'resume':
                    serverContext.resumeMusic()
                    break

                default:
                    interaction.reply('Unsupported command :(')
                    break
            }
        } else if (interaction.isAutocomplete()) {
            this.getOptionsFromQuery(interaction).then((results) => {
                serverContext.updateUserContext(userId, results)

                interaction.respond(
                    results.map(({ id, title }) => ({
                        name: title,
                        value: id,
                    }))
                )
            })
        }
    }

    private async getOptionsFromQuery(interaction: AutocompleteInteraction) {
        const query = interaction.options.get('query')?.value

        const results = await queryVideos(String(query))

        return results
    }

    private serverContextManager: ServerContextManager
    private client: Client
}

export default new DiscordClient()
