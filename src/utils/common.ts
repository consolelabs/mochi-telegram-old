export function roundFloatNumber(n: number, fractionDigits = 1) {
  return parseFloat(parseFloat(`${n}`).toFixed(fractionDigits))
}

export function defaultErrorResponse(ctx: any) {
  ctx.reply("There was something wrong, please contact the admins", {
    reply_to_message_id: ctx.message.message_id,
  })
}
