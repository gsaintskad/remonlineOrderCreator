import {Markup, Scenes} from "telegraf";
import {ua} from "../../translate.mjs";
import {getOrders} from "../../remonline/remonline.utils.mjs";

const webAppUrl='https://f5fe-83-25-239-178.ngrok-free.app/';
export const getOrdersScene = new Scenes.WizardScene(
    process.env.GET_ORDERS_SCENE,
    async (ctx) => {
        ctx.reply(
            ua.getOrders.initText,
            Markup.inlineKeyboard([
                [Markup.button.webApp(ua.getOrders.openOrderListBtn, webAppUrl)],
            ])
        );
        return ctx.wizard.next();
    },
    async (ctx) => {
        const response=await getOrders();
        console.log(response);
        return ctx.wizard.next();
    },
    async (ctx) => {
        const { data, from } = ctx.update?.callback_query || {}
        if(data==='open_web_app'){
            console.log("open web_app...");
            return ctx.wizard.next();
        }
    }
)