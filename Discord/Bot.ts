import { Client, IntentsBitField, REST, Routes } from 'discord.js'
import { commands } from './Commands'

const botToken = process.env.DISCORD_BOT_TOKEN ?? ''
const botId = process.env.DISCORD_BOT_ID ?? ''
const serverId = process.env.DISCORD_SERVER_ID ?? ''

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
})

client.on('ready', () => console.log('Teehee!'))

client.login(botToken)

const rest = new REST().setToken(botToken ?? '')

rest.put(Routes.applicationGuildCommands(botId, serverId), {
    body: commands,
})

client.on('interactionCreate', (interaction) => {
    if (interaction.isCommand()) {
        if (interaction.commandName === 'play') {
            const query = interaction.options.get('query')
            console.log(query)
            interaction.reply({
                content: `This was your query: ${query?.value ?? ''}`,
            })
        }
    }
})
