import {
  CanvasGradient,
  CanvasRenderingContext2D,
  createCanvas,
  Image,
  loadImage,
} from "canvas"
import { ChartJSNodeCanvas } from "chartjs-node-canvas"
import { CircleleStats, RectangleStats } from "types/canvas"

export function widthOf(ctx: CanvasRenderingContext2D, text: string): number {
  return ctx.measureText(text).width
}

export function heightOf(ctx: CanvasRenderingContext2D, text: string): number {
  return (
    ctx.measureText(text).actualBoundingBoxAscent +
    ctx.measureText(text).actualBoundingBoxDescent
  )
}

export function drawRectangle(
  ctx: CanvasRenderingContext2D,
  stats: RectangleStats,
  hexColor?: string,
  borderColor?: string
) {
  const { radius, x, y } = stats
  ctx.save()
  // --------------
  ctx.beginPath()
  ctx.lineWidth = 6
  if (hexColor) {
    ctx.fillStyle = hexColor
  }
  ctx.moveTo(x.from + radius, y.from)
  ctx.lineTo(x.to - radius, y.from) // top edge
  ctx.arc(x.to - radius, y.from + radius, radius, 1.5 * Math.PI, 0) // top-right corner
  ctx.lineTo(x.to, y.to - radius) // right edge
  ctx.arc(x.to - radius, y.to - radius, radius, 0, 0.5 * Math.PI) // bottom-right corner
  ctx.lineTo(x.from + radius, y.to) // bottom edge
  ctx.arc(x.from + radius, y.to - radius, radius, 0.5 * Math.PI, Math.PI) // bottom-left corner
  ctx.lineTo(x.from, y.from + radius) // left edge
  ctx.arc(x.from + radius, y.from + radius, radius, Math.PI, 1.5 * Math.PI) // top-left corner
  ctx.fill()
  if (borderColor) {
    ctx.strokeStyle = borderColor
    ctx.stroke()
  }
  ctx.closePath()
  // --------------
  ctx.restore()
}

export async function drawCircleImage({
  ctx,
  stats,
  imageURL,
  image,
}: {
  ctx: CanvasRenderingContext2D
  stats: CircleleStats
  imageURL?: string
  image?: Image
}) {
  if (!image && !imageURL) return
  ctx.save()
  // --------------
  ctx.beginPath()
  ctx.lineWidth = 10
  ctx.arc(stats.x, stats.y, stats.radius, 0, Math.PI * 2)
  if (stats.outlineColor) {
    ctx.strokeStyle = stats.outlineColor
    ctx.stroke()
  }
  ctx.closePath()
  ctx.clip()

  if (!image && imageURL) {
    image = await loadImage(imageURL)
  }
  ctx.drawImage(
    image,
    stats.x - stats.radius,
    stats.y - stats.radius,
    stats.radius * 2,
    stats.radius * 2
  )
  // --------------
  ctx.restore()
}

export function loadImages(urls: string[]) {
  return urls.reduce(async (acc: { [key: string]: any }, cur) => {
    return {
      ...acc,
      ...(!acc[cur] ? { [cur]: await loadImage(cur) } : {}),
    }
  }, {})
}

export async function drawRectangleAvatar(
  ctx: CanvasRenderingContext2D,
  avatar: RectangleStats,
  avatarURL: string
) {
  ctx.save()
  // --------------
  ctx.beginPath()
  ctx.lineWidth = 10
  ctx.moveTo(avatar.x.from + avatar.radius, avatar.y.from)
  ctx.arcTo(
    avatar.x.to,
    avatar.y.from,
    avatar.x.to,
    avatar.y.from + avatar.radius,
    avatar.radius
  )

  ctx.arcTo(
    avatar.x.to,
    avatar.y.to,
    avatar.x.to - avatar.radius,
    avatar.y.to,
    avatar.radius
  )

  ctx.arcTo(
    avatar.x.from,
    avatar.y.to,
    avatar.x.from,
    avatar.y.to - avatar.radius,
    avatar.radius
  )

  ctx.arcTo(
    avatar.x.from,
    avatar.y.from,
    avatar.x.from + avatar.radius,
    avatar.y.from,
    avatar.radius
  )
  ctx.closePath()
  ctx.clip()

  if (avatarURL) {
    const userAvatar = await loadImage(avatarURL)
    ctx.drawImage(userAvatar, avatar.x.from, avatar.y.from, avatar.w, avatar.h)
  }
  // --------------
  ctx.restore()
}

export function drawDivider(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  toX: number,
  y: number,
  color?: string
) {
  ctx.save()
  ctx.beginPath()
  ctx.strokeStyle = color ?? "#918d8d"
  ctx.moveTo(fromX, y)
  ctx.lineTo(toX, y)
  ctx.stroke()
  ctx.closePath()
  ctx.restore()
}

export function getGradientColor(
  fromColor: string,
  toColor: string
): CanvasGradient {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const backgroundColor = ctx.createLinearGradient(0, 0, 0, 400)
  backgroundColor.addColorStop(0, fromColor)
  backgroundColor.addColorStop(1, toColor)
  return backgroundColor
}

export async function renderChartImage({
  chartLabel,
  labels,
  data,
  colorConfig,
  lineOnly,
}: {
  chartLabel?: string
  labels: string[]
  data: number[]
  colorConfig?: {
    borderColor: string
    backgroundColor: string | CanvasGradient
  }
  lineOnly?: boolean
}) {
  if (!colorConfig) {
    colorConfig = {
      borderColor: "#009cdb",
      backgroundColor: getGradientColor(
        "rgba(53,83,192,0.9)",
        "rgba(58,69,110,0.5)"
      ),
    }
  }
  if (lineOnly) {
    colorConfig.backgroundColor = "rgba(0, 0, 0, 0)"
  }
  const chartCanvas = new ChartJSNodeCanvas({
    width: 700,
    height: 450,
    backgroundColour: "#202020",
  })
  const axisConfig = {
    ticks: {
      font: {
        size: 16,
      },
      color: colorConfig.borderColor,
    },
    grid: {
      borderColor: colorConfig.borderColor,
    },
  }
  return chartCanvas.renderToBuffer({
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: chartLabel,
          data,
          borderWidth: lineOnly ? 10 : 2,
          pointRadius: 0,
          fill: true,
          ...colorConfig,
          tension: 0.5,
        },
      ],
    },
    options: {
      scales: {
        y: axisConfig,
        x: axisConfig,
      },
      plugins: {
        legend: {
          labels: {
            // This more specific font property overrides the global property
            font: {
              size: 18,
            },
          },
        },
      },
      ...(lineOnly && {
        scales: {
          x: {
            grid: {
              display: false,
            },
            display: false,
          },
          y: {
            grid: {
              display: false,
            },
            display: false,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      }),
    },
  })
}

export function getChartColorConfig(id: string) {
  let gradientFrom, gradientTo, borderColor
  switch (id) {
    case "bitcoin":
      borderColor = "#ffa301"
      gradientFrom = "rgba(159,110,43,0.9)"
      gradientTo = "rgba(76,66,52,0.5)"
      break
    case "ethereum":
      borderColor = "#ff0421"
      gradientFrom = "rgba(173,36,43,0.9)"
      gradientTo = "rgba(77,48,53,0.5)"
      break

    case "tether":
      borderColor = "#22a07a"
      gradientFrom = "rgba(46,78,71,0.9)"
      gradientTo = "rgba(48,63,63,0.5)"
      break
    case "binancecoin" || "terra":
      borderColor = "#f5bc00"
      gradientFrom = "rgba(172,136,41,0.9)"
      gradientTo = "rgba(73,67,55,0.5)"
      break
    case "solana":
      borderColor = "#9945ff"
      gradientFrom = "rgba(116,62,184,0.9)"
      gradientTo = "rgba(61,53,83,0.5)"
      break
    default:
      borderColor = "#009cdb"
      gradientFrom = "rgba(53,83,192,0.9)"
      gradientTo = "rgba(58,69,110,0.5)"
  }

  return {
    borderColor,
    backgroundColor: getGradientColor(gradientFrom, gradientTo),
  }
}
