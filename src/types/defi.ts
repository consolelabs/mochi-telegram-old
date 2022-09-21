export type TickerData = {
  base: string
  target: string
  last: number
  coinID: string
  target_coin_id: string
}

type MarketData = {
  current_price: { [key: string]: number }
  market_cap: { [key: string]: number }
  price_change_percentage_1h_in_currency: { [key: string]: number }
  price_change_percentage_24h_in_currency: { [key: string]: number }
  price_change_percentage_7d_in_currency: { [key: string]: number }
}

type CoinImage = {
  thumb: string
  small: string
  large: string
}

export type Coin = {
  id: string
  name: string
  symbol: string
  market_cap_rank: number
  image: CoinImage
  market_data: MarketData
  tickers: TickerData[]
}
