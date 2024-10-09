import {
    CacheType,
    Client,
    IntentsBitField,
    Interaction,
    REST,
    Routes,
} from 'discord.js'
import { commands } from './Commands'
import {
    AudioPlayerStatus,
    DiscordGatewayAdapterCreator,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
} from '@discordjs/voice'
import * as ytdl from '@distube/ytdl-core'
import { queryVideos } from '../Youtube'

const botToken = process.env.DISCORD_BOT_TOKEN ?? ''
const botId = process.env.DISCORD_BOT_ID ?? ''
const serverId = process.env.DISCORD_SERVER_ID ?? ''

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildVoiceStates,
    ],
})

client.on('ready', () => console.log('Teehee!'))

client.login(botToken)

const rest = new REST().setToken(botToken ?? '')

rest.put(Routes.applicationGuildCommands(botId, serverId), {
    body: commands,
})

const player = createAudioPlayer()

player.on(AudioPlayerStatus.Playing, () =>
    console.log('Playing tasty waves my boy!')
)

const streamMusic = async () => {
    const getVoiceChannelFromInteraction = (
        interaction: Interaction<CacheType>
    ) => {
        const { guild, user } = interaction
        return guild?.members
            .fetch(user.id)
            .then((member) => member.voice.channelId)
            .catch((err) => {
                console.log(`Error while fetching current channel ID: ${err}`)
            })
    }

    client.on('interactionCreate', async (interaction) => {
        if (interaction.isCommand()) {
            if (interaction.commandName === 'play') {
                const voiceChannelId =
                    await getVoiceChannelFromInteraction(interaction)

                if (!voiceChannelId) {
                    return interaction.reply({
                        content: 'Unable to retrieve the member information!',
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

                const songStream = ytdl.default(url, {
                    filter: 'audioonly',
                    quality: 'highestaudio',
                    /* 
                        Not too sure about this high watermark bitrate, but found this fix here: https://github.com/fent/node-ytdl-core/issues/902
                    */
                    highWaterMark: 1 << 25,
                })

                const resource = createAudioResource(songStream)

                player.play(resource)

                const subscription = connection.subscribe(player)

                player.on(AudioPlayerStatus.Idle, () =>
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

streamMusic()
