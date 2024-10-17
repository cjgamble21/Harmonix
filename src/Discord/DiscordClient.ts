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
import { decode } from 'html-entities'

export class DiscordClient {
    private botId: string
    private botToken: string
    private musicPlayerMap: Map<string, MusicPlayer>
    private client: Client

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
        if (interaction.isCommand()) {
            const player = this.getOrCreateMusicPlayer(interaction)
            switch (interaction.commandName) {
                case 'play':
                    const id = interaction.options.get('query')?.value

                    getVideoMetadata(String(id)).then(player.enqueue)
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

    private getOrCreateMusicPlayer(interaction: Interaction) {
        const guildId = interaction.guildId

        if (!guildId) {
            throw new Error('Interaction is not in a guild.')
        }

        let player = this.musicPlayerMap.get(guildId)

        if (!player) {
            player = MusicPlayer.getInstance(interaction)
            this.musicPlayerMap.set(guildId, player)
        }

        player.interaction = interaction

        return player
    }
}
