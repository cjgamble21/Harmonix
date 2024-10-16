import { SlashCommandBuilder } from 'discord.js'

export const playCommand = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Search Youtube for your song you mutt')
    .addStringOption((option) =>
        option
            .setName('query')
            .setDescription('Youtube search query')
            .setRequired(true)
            .setAutocomplete(true)
    )
