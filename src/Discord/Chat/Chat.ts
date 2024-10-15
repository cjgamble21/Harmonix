import { Interaction } from 'discord.js'

export const sendChatMessage = (
    interaction: Interaction,
    ...messages: string[]
) => {
    if (!interaction.isRepliable()) return

    messages.forEach(interaction.reply)
}

export const sendEphemeralChatMessage = (
    interaction: Interaction,
    ...messages: string[]
) => {
    if (!interaction.isRepliable()) return

    messages.forEach((message) => interaction.reply({ ephemeral: true }))
}
