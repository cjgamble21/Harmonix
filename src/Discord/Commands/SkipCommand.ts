import { SlashCommandBuilder } from 'discord.js'

export const skipCommand = new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the song next up in the queue')
