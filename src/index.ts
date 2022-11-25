import { BOT_TOKEN } from "env"
import { logger } from "logger"
import { Context, Telegraf } from "telegraf"
import { Update } from "typegram"
import watchlist from "./commands/watchlist/index"
import ticker from "./commands/ticker/index"
import tip from "./commands/tip/index"

export const bot: Telegraf<Context<Update>> = new Telegraf(BOT_TOKEN)

const commands: Record<string, (ctx: any) => Promise<void>> = {
  watchlist,
  wl: watchlist,
  ticker,
  tick: ticker,
  tip,
}

// commands
Object.entries(commands).forEach(([cmdKey, handler]) =>
  bot.command(cmdKey, async (ctx) => {
    try {
      await handler(ctx)
    } catch (e) {
      logger.error(`Error while executing command: ${cmdKey}`)
    }
  })
)

// help message
bot.help(async (ctx) => {
  const reply =
    "`/wl` - Show your favarite list of 12 tokens\n/ticker - Display/Compare coin prices and market cap. Data is fetched from CoinGecko\n/tip - Send coins offchain to a user"
  ctx.replyWithMarkdown(reply, {
    reply_to_message_id: ctx.message.message_id,
  })
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
