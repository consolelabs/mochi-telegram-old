import dotenv from "dotenv"
dotenv.config()

export const PROD = process.env.NODE_ENV === "production"
export const BOT_TOKEN = process.env.BOT_TOKEN || ""
export const API_SERVER_HOST =
  process.env.API_SERVER_HOST || "http://localhost:8200"
