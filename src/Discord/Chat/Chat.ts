import { Interaction } from 'discord.js'

export const sendChatMessage = async (
    interaction: Interaction,
    message: string
) => {
    if (!interaction.isRepliable()) return

    const repliableMessage = !interaction.replied && !interaction.deferred

    repliableMessage
        ? interaction.reply(message)
        : interaction.followUp(message)
}

export const sendEphemeralChatMessage = (
    interaction: Interaction,
    message: string
) => {
    if (!interaction.isRepliable()) return

    const content = (message: string) => ({ content: message, ephemeral: true })

    const repliableMessage = !interaction.replied && !interaction.deferred

    repliableMessage
        ? interaction.reply(content(message))
        : interaction.followUp(content(message))
}
