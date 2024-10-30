import { REST, Routes } from 'discord.js'
import * as Commands from './index'

const botId = process.env.DISCORD_BOT_ID
const botToken = process.env.DISCORD_BOT_TOKEN

if (!botId || !botToken) throw new Error('Missing bot token or bot ID')

const rest = new REST().setToken(botToken)

export const deployCommands = () => {
    rest.put(Routes.applicationCommands(botId), {
        body: [
            Commands.playCommand,
            Commands.skipCommand,
            Commands.pauseCommand,
            Commands.resumeCommand,
        ],
    })
}

deployCommands()
