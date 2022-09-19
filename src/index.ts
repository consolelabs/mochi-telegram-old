import { BOT_TOKEN } from "env"
import { logger } from "logger"
import { Context, Telegraf } from "telegraf"
import { Update } from "typegram"
import watchlist from "./commands/watchlist/index"

export const bot: Telegraf<Context<Update>> = new Telegraf(BOT_TOKEN)

// commands
bot.command("watchlist", watchlist)
bot.command("wl", watchlist)

// help message
bot.help((ctx) => {
  const reply = "`/watchlist` or `/wl` - Show your favarite list of 12 tokens"
  ctx.replyWithMarkdown(reply)
})

// run bot
bot.launch().then(() => logger.info("Bot is ready"))

process.on("SIGTERM", () => {
  bot.stop()
  process.exit(0)
})
process.on("SIGINT", () => {
  bot.stop()
  process.exit(0)
})

export default bot
