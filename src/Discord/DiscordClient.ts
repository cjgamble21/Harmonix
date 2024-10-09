import {
    AudioPlayer,
    AudioPlayerStatus,
    DiscordGatewayAdapterCreator,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
} from '@discordjs/voice'
import ytdl from '@distube/ytdl-core'
import { CacheType, Client, IntentsBitField, Interaction } from 'discord.js'
import { queryVideos } from '../Youtube'

export class DiscordClient {
    botId: string
    botToken: string
    client: Client
    player: AudioPlayer

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

        this.player = createAudioPlayer()
    }

    addInteractionListener() {
        const getVoiceChannelFromInteraction = (
            interaction: Interaction<CacheType>
        ) => {
            const { guild, user } = interaction
            return guild?.members
                .fetch(user.id)
                .then((member) => member.voice.channelId)
                .catch((err) => {
                    console.log(
                        `Error while fetching current channel ID: ${err}`
                    )
                })
        }

        this.client.on('interactionCreate', async (interaction) => {
            if (interaction.isCommand()) {
                if (interaction.commandName === 'play') {
                    interaction.guildId
                    const voiceChannelId =
                        await getVoiceChannelFromInteraction(interaction)

                    if (!voiceChannelId) {
                        return interaction.reply({
                            content:
                                'Unable to retrieve the member information!',
                            ephemeral: true,
                        })
                    }

                    const { guild } = interaction

                    const connection = joinVoiceChannel({
                        channelId: voiceChannelId ?? '',
                        guildId: guild?.id ?? '',
                        adapterCreator:
                            guild?.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator,
                    })

                    const videoId = interaction.options.get('query')?.value

                    const url = `https://www.youtube.com/watch?v=${videoId}`

                    console.log(url)

                    const songStream = ytdl(url, {
                        filter: 'audioonly',
                        quality: 'highestaudio',
                        /* 
                            Not too sure about this high watermark bitrate, but found this fix here: https://github.com/fent/node-ytdl-core/issues/902
                        */
                        highWaterMark: 1 << 25,
                    })

                    const resource = createAudioResource(songStream)

                    this.player.play(resource)

                    const subscription = connection.subscribe(this.player)

                    this.player.on(AudioPlayerStatus.Idle, () =>
                        setTimeout(() => {
                            subscription?.unsubscribe()
                            connection.disconnect()
                        }, 10_000)
                    )
                }
            } else if (interaction.isAutocomplete()) {
                const query = interaction.options.get('query')?.value

                const results = await queryVideos(String(query))

                return interaction.respond(
                    results.map(({ title, id }) => ({
                        name: title.slice(0, 100),
                        value: id,
                    }))
                )
            }
        })
    }
}
