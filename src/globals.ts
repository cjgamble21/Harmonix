declare var DEBUG: boolean
declare var BOT_TOKEN: string

globalThis.DEBUG = process.env.NODE_ENV === 'development'
globalThis.BOT_TOKEN = process.env.DISCORD_BOT_TOKEN ?? ''

if (!globalThis.BOT_TOKEN)
    throw new Error('Cannot initialize Harmonix w/out a bot token')
