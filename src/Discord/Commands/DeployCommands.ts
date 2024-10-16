import { REST, Routes } from 'discord.js'
import { playCommand } from './PlayCommand'
import { skipCommand } from './SkipCommand'

const botToken = process.env.DISCORD_BOT_TOKEN
const botId = process.env.DISCORD_BOT_ID

if (!botToken || !botId) throw new Error('Missing bot token or bot ID')

const rest = new REST().setToken(botToken)

const commands = [playCommand, skipCommand]

export const deployCommands = () => {
    rest.put(Routes.applicationCommands(botId), {
        body: commands,
    })
}

deployCommands()
