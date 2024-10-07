import { SlashCommandBuilder } from 'discord.js'

const playCommand = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Search Youtube for your song you mutt')
    .addStringOption((option) =>
        option
            .setName('query')
            .setDescription('Youtube search query')
            .setRequired(true)
            .addChoices({
                name: 'NMDUB and WolfySharpFang',
                value: 'LzPgFh5F2tM',
            })
    )

export const commands = [playCommand]
