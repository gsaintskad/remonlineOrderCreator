import { ua } from "../../translate.mjs"
import { mainKeyboard } from './keyboards.mjs';
import { resetRemonlineId } from "../telegram.queries.mjs";

export async function onStart(ctx) {
    if (ctx.session.remonline_id) {
        ctx.reply(`${ctx.session.telegram_name} ${ua.sayHi}`, mainKeyboard)
        return
    }
    ctx.scene.enter(process.env.CREATE_REMONLINE_ID);
}

export async function onReset(ctx, next) {
    await resetRemonlineId({ telegramId: ctx.message.from.id })
    ctx.session.remonline_id = null
    await next()
}