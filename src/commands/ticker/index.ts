import { API_BASE_URL } from "utils/constants"
import { getChartColorConfig, renderChartImage } from "utils/canvas"
import { jsonFetch } from "utils/fetcher"
import { defaultErrorResponse, roundFloatNumber } from "utils/common"
import compare from "./compare"

export async function renderHistoricalMarketChart({
  coinId,
  days = 7,
}: {
  coinId: string
  days?: number
}) {
  const currency = "usd"
  const { ok, data } = await jsonFetch<{
    times: string[]
    prices: number[]
    from: string
    to: string
  }>(`${API_BASE_URL}/defi/market-chart`, {
    query: { coinId, days, currency },
  })
  if (!ok) return null
  const { times, prices, from, to } = data

  // draw chart
  return await renderChartImage({
    chartLabel: `Price (${currency.toUpperCase()}) | ${from} - ${to}`,
    labels: times,
    data: prices,
    colorConfig: getChartColorConfig(coinId),
  })
}

const getChangePercentage = (change: number) =>
  `${change > 0 ? "+" : ""}${roundFloatNumber(change, 2)}%`

const run = async (ctx: any) => {
  const args = ctx.message.text.split(" ")
  // const coinQ = args[1]
  const [query] = args.slice(1)
  const [coinQ, targetQ] = query.split("/")
  if (targetQ) return compare(ctx)
  const {
    data: coins,
    ok: searchCoinsOk,
    error,
  } = await jsonFetch(`${API_BASE_URL}/defi/coins?query=${coinQ}`)
  if (!searchCoinsOk || !coins.length) {
    ctx.replyWithMarkdown(`Cannot find any cryptocurrency with \`${coinQ}\`.`)
    return
  }

  const { ok, data: coin } = await jsonFetch(
    `${API_BASE_URL}/defi/coins/${coins[0].id}`
  )
  if (!ok) {
    defaultErrorResponse(ctx)
    return
  }

  // if (coins.length === 1) {
  // return await composeTickerResponse({ msg, coinId: coins[0].id })
  // }
  const currency = "usd"
  const {
    market_cap,
    current_price,
    price_change_percentage_1h_in_currency,
    price_change_percentage_24h_in_currency,
    price_change_percentage_7d_in_currency,
  } = coin.market_data
  const currentPrice = +current_price[currency]
  const marketCap = +market_cap[currency]

  const infos = [
    `Market cap (USD): <b>$${marketCap.toLocaleString()} (#${
      coin.market_cap_rank
    })</b>`,
    `Price (USD): <b>$${currentPrice.toLocaleString(undefined, {
      maximumFractionDigits: 4,
    })}</b>`,
    `Change (1h): <b>${getChangePercentage(
      price_change_percentage_1h_in_currency.usd
    )}</b>`,
    `Change (24h): <b>${getChangePercentage(
      price_change_percentage_24h_in_currency.usd
    )}</b>`,
    `Change (7d): <b>${getChangePercentage(
      price_change_percentage_7d_in_currency.usd
    )}</b>`,
  ]
  const chart = await renderHistoricalMarketChart({ coinId: coin.id })
  ctx.sendPhoto(
    { source: chart },
    {
      reply_to_message_id: ctx.message.message_id,
      caption: infos.join("\n"),
      parse_mode: "HTML",
    }
  )
}

export default run
