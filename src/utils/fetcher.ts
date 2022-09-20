import deepmerge from "deepmerge"
import { logger } from "logger"
import type { RequestInit as NativeRequestInit } from "node-fetch"
import fetch from "node-fetch"
import querystring from "query-string"
import { snakeCase } from "change-case"

type SerializableValue = string | number | boolean | undefined | null

type RequestInit = NativeRequestInit & {
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
}

type Payload = {
  log: string
}

type OkPayload = {
  ok: true
  data: Record<string, any>
  error: null
} & Payload

type ErrPayload = {
  ok: false
  data: null
  error: string
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

export async function jsonFetch<T>(
  url: string,
  init: RequestInit = {}
): Promise<(OkPayload & T) | ErrPayload> {
  let log = ""
  try {
    const mergedInit = deepmerge(defaultInit, init)
    const { autoWrap500Error, query: _query, ...validInit } = mergedInit
    const query: typeof _query = {}
    for (const [key, value] of Object.entries(_query)) {
      query[snakeCase(key)] = value
    }
    const res = await fetch(
      querystring.stringifyUrl(
        { url, query },
        { arrayFormat: "separator", arrayFormatSeparator: "|" }
      ),
      validInit
    )

    if (!res.ok) {
      log = `[API failed - ${init.method ?? "GET"}/${
        res.status
      }]: ${url} with params ${validInit.body}, query ${querystring.stringify(
        query
      )}`
      logger.error(log)

      const json = await (res as ErrResponse).json()
      if (autoWrap500Error && res.status === 500) {
        json.error =
          "Something went wrong, our team is notified and is working on the fix, stay tuned."
      }
      json.ok = false
      json.log = log
      return json
    } else {
      log = `[API ok - ${init.method ?? "GET"}/${
        res.status
      }]: ${url} with params ${
        validInit.body ?? "{}"
      }, query ${querystring.stringify(query)}`
      logger.info(log)
      const json = await (res as OkResponse<T>).json()
      json.ok = true
      json.log = log
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