import { BOT_TOKEN } from "env"
import { logger } from "logger"
import { Context, MiddlewareFn, Telegraf } from "telegraf"
import { Message, Update } from "typegram"
import watchlist from "./commands/watchlist/index"
import ticker from "./commands/ticker/index"

export const bot: Telegraf<Context<Update>> = new Telegraf(BOT_TOKEN)

const commands: Record<string, (ctx: any) => Promise<void>> = {
  watchlist,
  wl: watchlist,
  ticker,
  tick: ticker,
}

//////// middleware
// const commandArgs = () => async (ctx: any, next: any) => {
//   if (ctx.updateType === "message") {
//     const text = ctx.message.text.toLowerCase()
//     if (text.startsWith("/")) {
//       logger.info(
//         `[${ctx.from.username ?? ctx.from.id}] executing command: ${text}`
//       )
//       const args = text.split(" ")
//       const commandKey = args[0].slice(1)
//       console.log({ commandKey })
//       const cmd = commands[commandKey]
//       if (!cmd) return
//       await cmd(ctx)
//       // ctx.state.command = {
//       //   args: text.split(" "),
//       // }
//     }
//   }
//   return next()
// }

// bot.use(commandArgs())

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
// bot.command("wl", watchlist)
// bot.command("ticker", () => {return})

// help message
bot.help(async (ctx) => {
  const reply = "`/wl` - Show your favarite list of 12 tokens"
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
