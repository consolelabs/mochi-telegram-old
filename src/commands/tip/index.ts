import { jsonFetch } from "utils/fetcher"
import { API_BASE_URL, SPACES_REGEX } from "utils/constants"
import { logger } from "logger"

const run = async (ctx: any) => {
  const args = `${ctx.message.text}`.split(SPACES_REGEX)
  if (args.length < 4) {
    ctx.replyWithMarkdown(
      "Insufficient arguments.\nSyntax: *$tip <discord_id> <amount> <symbol>*"
    )
    return
  }

  const [recipientDiscordId, amountArg, cryptocurrency] = args.slice(1)
  let amount = parseFloat(amountArg)
  if ((isNaN(amount) || amount <= 0) && amountArg !== "all") {
    ctx.reply("Invalid amount")
    return
  }

  const telegramUsername = ctx.from.username
  if (!telegramUsername) {
    ctx.replyWithMarkdown(
      "Please set your username in *Settings -> Edit Profile*.",
      {
        reply_to_message_id: ctx.message.message_id,
      }
    )
    return
  }
  const {
    data: dcData,
    ok: dcOk,
    error,
  } = await jsonFetch(`${API_BASE_URL}/configs/telegram`, {
    query: { telegramUsername },
  })
  if (!dcOk && error) {
    ctx.replyWithMarkdown(
      "You have not linked your telegram to any discord account.\nUse *$telegram config* in discord to execute action.",
      {
        reply_to_message_id: ctx.message.message_id,
      }
    )
    return
  }
  if (!dcOk) {
    ctx.reply("Action failed. Please try again later.", {
      reply_to_message_id: ctx.message.message_id,
    })
    return
  }

  const payload = {
    sender: dcData.discord_id,
    recipients: [recipientDiscordId],
    amount,
    token: cryptocurrency,
    all: amountArg === "all",
    transferType: "tip",
    duration: 0,
    fullCommand: args.join(" "),
    platform: "telegram",
  }

  const {
    ok,
    error: err,
    status,
  } = await jsonFetch(`${API_BASE_URL}/offchain-tip-bot/transfer`, {
    method: "POST",
    body: payload,
  })

  if (!ok) {
    if (status === 400) {
      ctx.reply(err)
    } else {
      logger.error(`Tip error: ${err}`)
      ctx.reply("Transaction failed. Please try again later.")
    }
    return
  }
  ctx.replyWithMarkdown(
    `You have successfully tip discord user ${recipientDiscordId} *${amount} ${cryptocurrency}*`
  )
}

export default run
