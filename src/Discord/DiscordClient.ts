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
    musicPlayerMap: Map<string, MusicPlayer>

    constructor() {
        this.botId = process.env.DISCORD_BOT_ID ?? ''
        this.botToken = process.env.DISCORD_BOT_TOKEN ?? ''
        this.musicPlayerMap = new Map()

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

    private getOrCreateMusicPlayer(interaction: Interaction) {
        const guildId = interaction.guildId

        if (!guildId) {
            throw new Error('Interaction is not in a guild.')
        }

        // Check if a MusicPlayer already exists for the guild
        let player = this.musicPlayerMap.get(guildId)

        if (!player) {
            // If no player exists, create one and store it in the map
            player = MusicPlayer.getInstance(interaction)
            this.musicPlayerMap.set(guildId, player)
        }

        return player
    }

    addInteractionListener() {
        this.client.on(Events.InteractionCreate, async (interaction) => {
            if (interaction.isCommand()) {
                const player = this.getOrCreateMusicPlayer(interaction)
                switch (interaction.commandName) {
                    case 'play':
                        const id = interaction.options.get('query')?.value

                        const metadata = await getVideoMetadata(String(id))

                        player.enqueue(metadata)

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
