import { Coin } from "types/defi"
import { renderChartImage } from "utils/canvas"
import { defaultErrorResponse } from "utils/common"
import { API_BASE_URL } from "utils/constants"
import { jsonFetch } from "utils/fetcher"

async function renderCompareTokenChart({
  times,
  ratios,
  from,
  to,
}: {
  times: string[]
  ratios: number[]
  from: string
  to: string
}) {
  if (!times || !times.length) return null
  return await renderChartImage({
    chartLabel: `Price ratio | ${from} - ${to}`,
    labels: times,
    data: ratios,
  })
}

const run = async (ctx: any) => {
  const args = ctx.message.text.split(" ")
  const [query] = args.slice(1)
  const [baseQ, targetQ] = query.split("/")
  const res = await jsonFetch(
    `${API_BASE_URL}/defi/coins/compare?base=${baseQ}&target=${targetQ}&interval=7`
  )
  if (!res.ok) {
    defaultErrorResponse(ctx)
    return
  }
  const { base_coin_suggestions, target_coin_suggestions } = res.data
  if (base_coin_suggestions || target_coin_suggestions) {
    const baseId = base_coin_suggestions[0].id
    const targetId = target_coin_suggestions[0].id
    const { data, ok } = await jsonFetch(
      `${API_BASE_URL}/defi/coins/compare?base=${baseId}&target=${targetId}&interval=7`
    )
    if (!ok) {
      defaultErrorResponse(ctx)
      return
    }
    res.data = data
  }

  const compareInfo = (base: Coin, target: Coin) =>
    `*${base.name} vs ${target.name}*`
      .concat(
        `\n*Rank:* \`#${base.market_cap_rank}\` vs \`#${target.market_cap_rank}\``
      )
      .concat(
        `\n*Price:* \`$${base.market_data.current_price[
          "usd"
        ]?.toLocaleString()}\` vs \`$${target.market_data.current_price[
          "usd"
        ]?.toLocaleString()}\``
      )
      .concat(
        `\n*Market cap:* \`$${base.market_data.market_cap[
          "usd"
        ]?.toLocaleString()}\` vs \`$${target.market_data.market_cap[
          "usd"
        ]?.toLocaleString()}\``
      )
  const { times, ratios, from, to, base_coin, target_coin } = res.data
  const currentRatio = ratios?.[ratios?.length - 1] ?? 0
  const chart = await renderCompareTokenChart({ times, ratios, from, to })
  const infos = [
    `Ratio: \`${currentRatio}\``,
    `${compareInfo(base_coin, target_coin)}\n`,
    // `${coinInfo(target_coin)}`,
  ]
  ctx.sendPhoto(
    { source: chart },
    {
      reply_to_message_id: ctx.message.message_id,
      caption: infos.join("\n"),
      parse_mode: "MarkdownV2",
    }
  )
}

export default run
