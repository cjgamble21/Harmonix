import {
    AutocompleteInteraction,
    CacheType,
    Client,
    Events,
    IntentsBitField,
    Interaction,
} from 'discord.js'
import { getVideoMetadata, queryVideos } from '../Youtube'
import { Logger } from '../Logger'
import { deployCommands } from './Commands/DeployCommands'
import { MusicPlayer } from './MusicPlayer'

export class DiscordClient {
    botId: string
    botToken: string
    client: Client

    constructor() {
        this.botId = process.env.DISCORD_BOT_ID ?? ''
        this.botToken = process.env.DISCORD_BOT_TOKEN ?? ''

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

        this.client.on('ready', () => {
            Logger.event('Discord Client Initialized')
            deployCommands()
        })
    }

    private async getOptionsFromQuery(interaction: AutocompleteInteraction) {
        const query = interaction.options.get('query')?.value

        const results = await queryVideos(String(query))

        return interaction.respond(
            results.map(({ title, id }) => ({
                name: title.slice(0, 100),
                value: id,
            }))
        )
    }

    addInteractionListener() {
        this.client.on(Events.InteractionCreate, async (interaction) => {
            const player = new MusicPlayer(interaction)

            if (interaction.isCommand()) {
                console.log(interaction.commandName)
                switch (interaction.commandName) {
                    case 'play':
                        const id = interaction.options.get('query')?.value

                        const metadata = await getVideoMetadata(String(id))

                        player.enqueue(metadata)

                        player.start()

                        break

                    case 'skip':
                        player.skip()
                        break

                    default:
                        interaction.reply('Unsupported command :(')
                        break
                }
            } else if (interaction.isAutocomplete()) {
                this.getOptionsFromQuery(interaction)
            }
        })
    }
}
