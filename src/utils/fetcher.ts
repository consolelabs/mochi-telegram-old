import deepmerge from "deepmerge"
import { logger } from "logger"
import type { RequestInit as NativeRequestInit } from "node-fetch"
import fetch from "node-fetch"
import querystring from "query-string"
import { snakeCase } from "change-case"

type SerializableValue = string | number | boolean | undefined | null

type RequestInit = Omit<NativeRequestInit, "body"> & {
  /**
   * Whether to hide the 500 error with some generic message e.g "Something went wrong"
   * */
  autoWrap500Error?: boolean
  /**
   * Query string values, support array format
   *   Default to empty object
   * */
  query?: Record<string, SerializableValue | Array<SerializableValue>>
  /**
   * Toggle auto convert camelCase to snake_case when sending request e.g `guildId` will turn into `guild_id`
   * Default to true
   * */
  queryCamelToSnake?: boolean
  /**
   * For body payload (POST requests)
   * Toggle auto convert camelCase to snake_case when sending request e.g `guildId` will turn into `guild_id`
   * Default to true
   * */
  bodyCamelToSnake?: boolean
  /**
   * The body payload
   * */
  body?: string | Record<string, any>
}

type Payload = {
  log: string
}

type OkPayload = {
  ok: true
  data: Record<string, any>
  error: null
  status?: number
} & Payload

type ErrPayload = {
  ok: false
  data: null
  error: string
  status?: number
} & Payload

type OkResponse<T> = {
  json: () => Promise<OkPayload & T>
}

type ErrResponse = {
  json: () => Promise<ErrPayload>
}

const defaultInit: RequestInit = {
  autoWrap500Error: true,
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
  query: {},
  queryCamelToSnake: true,
}

function isObject(v: any): v is object {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function convertToSnakeCase<T extends Record<string | number, any>>(obj: T): T {
  const converted: Record<string | number, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (isObject(value)) {
      converted[snakeCase(key)] = convertToSnakeCase(value)
    } else if (Array.isArray(value)) {
      converted[snakeCase(key)] = value.map((v) => {
        if (isObject(v)) {
          return convertToSnakeCase(v)
        }
        return v
      })
    } else {
      converted[snakeCase(key)] = value
    }
  }

  return converted as T
}

export async function jsonFetch<T>(
  url: string,
  init: RequestInit = {}
): Promise<(OkPayload & T) | ErrPayload> {
  let log = ""
  try {
    const mergedInit = deepmerge(defaultInit, init)
    const {
      autoWrap500Error,
      query: _query,
      queryCamelToSnake,
      bodyCamelToSnake,
      body: _body,
      ...validInit
    } = mergedInit
    let query: typeof _query = {}

    if (queryCamelToSnake) {
      query = convertToSnakeCase(_query)
    } else {
      query = _query
    }

    let body
    if (bodyCamelToSnake) {
      if (typeof _body === "string") {
        // for backward compability
        const data = JSON.parse(_body)
        body = JSON.stringify(convertToSnakeCase(data), null, 4)
      } else if (typeof _body === "object" && _body !== null) {
        body = JSON.stringify(convertToSnakeCase(_body), null, 4)
      }
    } else {
      if (typeof _body === "object" && _body !== null) {
        body = JSON.stringify(_body, null, 4)
      }
    }

    const requestURL = querystring.stringifyUrl(
      { url, query },
      { arrayFormat: "separator", arrayFormatSeparator: "|" }
    )
    const options = {
      ...validInit,
      body,
    }
    const res = await fetch(requestURL, options)

    if (!res.ok) {
      logger.error(log)

      const json = await (res as ErrResponse).json()
      if (autoWrap500Error && res.status === 500) {
        json.error =
          "Something went wrong, our team is notified and is working on the fix, stay tuned."
      }
      json.ok = false
      json.log = log
      json.status = res.status
      return json
    } else {
      logger.info(log)
      const json = await (res as OkResponse<T>).json()
      json.ok = true
      json.log = log
      json.status = res.status
      return json
    }
  } catch (e: any) {
    log = `[API failed ${init.method ?? "GET"}/request_not_sent]: ${e.message}`
    logger.error(log)
    return {
      ok: false,
      data: null,
      error:
        "Something went wrong, our team is notified and is working on the fix, stay tuned.",
      log,
    }
  }
}
