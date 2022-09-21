import {
  drawRectangle,
  heightOf,
  renderChartImage,
  widthOf,
} from "utils/canvas"
import { createCanvas, loadImage, registerFont } from "canvas"
import { RectangleStats } from "types/canvas"
import { jsonFetch } from "utils/fetcher"
import { API_BASE_URL } from "utils/constants"

let fontRegistered = false

export async function renderWatchlist(data: any[]) {
  if (!fontRegistered) {
    registerFont("src/assets/fonts/inter/Inter-Regular.ttf", {
      family: "Inter",
    })
    registerFont("src/assets/fonts/inter/Inter-Bold.ttf", {
      family: "Inter",
      weight: "bold",
    })
    fontRegistered = true
  }
  const container: RectangleStats = {
    x: {
      from: 0,
      to: 900,
    },
    y: {
      from: 0,
      to: 770,
    },
    w: 0,
    h: 0,
    pt: 50,
    pl: 10,
    radius: 0,
    bgColor: "#292828",
  }
  container.w = container.x.to - container.x.from
  container.h = container.y.to - container.y.from
  const canvas = createCanvas(container.w, container.h)
  const ctx = canvas.getContext("2d")
  drawRectangle(ctx, container, container.bgColor)

  const ascColor = "#56c9ac"
  const descColor = "#ed5565"
  const itemContainer: RectangleStats = {
    x: {
      from: 0,
      to: 0,
    },
    y: {
      from: 0,
      to: 120,
    },
    mt: 10,
    w: 0,
    h: 120,
    pt: 20,
    pl: 15,
    radius: 7,
    bgColor: "#202020",
  }
  for (const [idx, item] of Object.entries(data)) {
    const leftCol = +idx % 2 === 0
    itemContainer.x = {
      from: leftCol ? 0 : 455,
      to: leftCol ? 445 : 900,
    }
    drawRectangle(ctx, itemContainer, itemContainer.bgColor)
    const {
      symbol,
      current_price,
      sparkline_in_7d,
      price_change_percentage_24h,
      price_change_percentage_7d_in_currency,
    } = item
    // image
    const image = await loadImage(item.image)
    const radius = 20
    const imageX = itemContainer.x.from + (itemContainer.pl ?? 0)
    const imageY = itemContainer.y.from + (itemContainer.pt ?? 0)
    ctx.drawImage(image, imageX, imageY, radius * 2, radius * 2)

    // symbol
    ctx.font = "bold 29px Inter"
    ctx.fillStyle = "white"
    const symbolText = symbol.toUpperCase()
    const symbolH = heightOf(ctx, symbolText)
    const symbolX = imageX + radius * 2 + 10
    const symbolY = imageY + radius + symbolH / 2
    ctx.fillText(symbolText, symbolX, symbolY)

    // price
    ctx.font = "bold 30px Inter"
    ctx.fillStyle = "white"
    const currentPrice = `$${current_price.toLocaleString()}`
    const priceW = widthOf(ctx, currentPrice)
    const priceH = heightOf(ctx, currentPrice)
    const priceX = imageX
    const priceY = imageY + priceH + radius * 2 + 10
    ctx.fillText(currentPrice, priceX, priceY)

    // 24h change
    ctx.font = "25px Inter"
    ctx.fillStyle = price_change_percentage_24h >= 0 ? ascColor : descColor
    const change = `${
      price_change_percentage_24h >= 0 ? "+" : ""
    }${price_change_percentage_24h.toFixed(2)}%`
    const changeX = priceX + priceW + 10
    const changeY = priceY
    ctx.fillText(change, changeX, changeY)

    // 7d chart
    const { price } = sparkline_in_7d
    const labels = price.map((p: number) => `${p}`)
    const buffer = await renderChartImage({
      labels,
      data: price,
      lineOnly: true,
      colorConfig: {
        borderColor:
          price_change_percentage_7d_in_currency >= 0 ? ascColor : descColor,
        backgroundColor: "#fff",
      },
    })
    const chart = await loadImage(buffer)
    const chartW = 150
    const chartH = 50
    const chartX = itemContainer.x.to - chartW - 15
    const chartY = itemContainer.y.from + (itemContainer.pt ?? 0) + chartH / 2
    ctx.drawImage(chart, chartX, chartY, chartW, chartH)

    // next row
    if (!leftCol) {
      itemContainer.y.from += itemContainer.h + (itemContainer.mt ?? 0)
      itemContainer.y.to = itemContainer.y.from + itemContainer.h
    }
  }
  return canvas.toBuffer()
}

const run = async (ctx: any) => {
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
  const { data: wlData, ok: wlOk } = await jsonFetch(
    `${API_BASE_URL}/defi/watchlist`,
    { query: { user_id: dcData.discord_id, size: 12 } }
  )
  if (!wlOk) {
    ctx.reply("Action failed. Please try again later.")
    return
  }
  const buffer = await renderWatchlist(<any[]>wlData)
  ctx.sendPhoto(
    { source: buffer },
    {
      reply_to_message_id: ctx.message.message_id,
    }
  )
}

export default run
