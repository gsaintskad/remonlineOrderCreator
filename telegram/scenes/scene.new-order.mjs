import { Scenes, Markup } from 'telegraf';
import { ua } from '../../translate.mjs';
import { mainKeyboard } from '../middleware/keyboards.mjs';
import { createOrder } from '../../remonline/remonline.utils.mjs';

const isDataCorrentBtm = (
    () => {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('Так', 'order_is_ok'),
                Markup.button.callback('Ні', 'wrong_order')
            ]
        ])
    }
)()

export const createOrderScene = new Scenes.WizardScene(
    process.env.CREATE_ORDER_SCENE,
    (ctx) => {
        ctx.reply(ua.createOrder.askPlateNumber, Markup.removeKeyboard());
        ctx.wizard.state.contactData = {};
        return ctx.wizard.next();
    },
    async (ctx) => {
        if (ctx.message?.text?.length != 8) {
            ctx.reply(ua.createOrder.wrongPlateNumber);
            return;
        }
        ctx.wizard.state.contactData.plateNumber = ctx.message.text;
        ctx.reply(ua.createOrder.askMalfunction);
        return ctx.wizard.next();
    },
    // async (ctx) => {
    //     // if (ctx.message?.text?.length <= 9) {
    //     //     ctx.reply(ua.createOrder.shortMalfunction);
    //     //     return;
    //     // }
    //     // ctx.wizard.state.contactData.malfunction = ctx.message.text;
    //     ctx.reply(ua.createOrder.askApointmenDateInRightFormat);
    //     return ctx.wizard.next();
    // },
    async (ctx) => {
        // const apointmenDate = new Date(ctx.message?.text)
        // if (apointmenDate == 'Invalid Date') {
        //     ctx.reply(ua.createOrder.wrongApointmenDateFormat);
        //     return;
        // }

        // ctx.wizard.state.contactData.apointmenDate = apointmenDate;
        // ctx.wizard.state.contactData.apointmenDateString = ctx.message?.text;

        if (ctx.message?.text?.length <= 9) {
            ctx.reply(ua.createOrder.shortMalfunction);
            return;
        }
        ctx.wizard.state.contactData.malfunction = ctx.message.text;


        ctx.wizard.state.contactData.apointmenDate = new Date();
        ctx.wizard.state.contactData.apointmenDateString = new Date().toISOString().split('T')[0];

        await ctx.reply(ua.createOrder.askToVefirApointment);

        let text = '';
        text += `Авто: ${ctx.wizard.state.contactData.plateNumber}`;
        text += `\n`;
        text += `Причина: ${ctx.wizard.state.contactData.malfunction}`;
        text += `\n`;
        text += `Дата: ${ctx.wizard.state.contactData.apointmenDateString}`;

        ctx.reply(text, isDataCorrentBtm);
        return ctx.wizard.next();
    },
    async (ctx) => {
        if (!ctx.update.callback_query) {
            return
        }
        const { data } = ctx.update.callback_query;
        if (data == 'wrong_order') {
            await ctx.answerCbQuery();
            await ctx.reply(ua.createOrder.tryAgainToCompletApointment);
            ctx.wizard.selectStep(1);
            return
        }

        if (data == 'order_is_ok') {
            const { malfunction, plateNumber, apointmenDate, apointmenDateString } = ctx.wizard.state.contactData
            const scheduledFor = new Date(apointmenDate).getTime();
            const { idLabel } = await createOrder(
                {
                    malfunction,
                    scheduledFor,
                    plateNumber,
                    // telegramId: ctx.update.callback_query?.from?.id,
                    remonlineId: ctx.session.remonline_id
                });

            let text = ua.createOrder.apointmentDone;
            text += `\n`;
            text += `\n`;
            text += `Документ: ${idLabel}`;
            text += `\n`;
            text += `\n`;
            text += `Авто: ${plateNumber}`;
            text += `\n`;
            text += `Причина: ${malfunction}`;
            text += `\n`;
            text += `Дата: ${apointmenDateString}`;
            text += `\n`;
            text += ua.createOrder.apointmentWaitingApproval;
            await ctx.scene.leave();
            await ctx.answerCbQuery('👌');
            await ctx.reply(text, mainKeyboard);
            return
        }
    }
);