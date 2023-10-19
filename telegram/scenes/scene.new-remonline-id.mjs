import { Scenes, Markup } from 'telegraf';
import { ua } from '../../translate.mjs';
import parsePhoneNumber from 'libphonenumber-js';
import * as EmailValidator from 'email-validator';
import {
    getClientsByPhone,
    createClient
} from '../../remonline/remonline.utils.mjs';
import { saveRemonlineId } from '../telegram.queries.mjs';
import {
    onStart,
    leaveSceneOnCommand
} from '../middleware/start-handler.mjs';

const noEmailInlineBtm = (() => {
    return Markup.inlineKeyboard([
        [
            Markup.button.callback('Не вказувати пошту', 'without_mail')
        ]
    ])
})()

const isDataCorrentBtm = (
    () => {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🟢 Так', 'my_data_is_ok'),
                Markup.button.callback('🔴 Ні', 'i_put_wrong_data')
            ]
        ])
    }
)()

const userInfoAppruvalText = (userData) => {
    const { number, fullName, email } = userData
    let text = ''
    text += `👤 Ім\`я: ${fullName}`
    text += `\n`;
    text += `☎️ Телефон: ${number}`

    if (email) {
        text += `\n`;
        text += `🌍 Пошта: ${email}`
    }
    return text
}

export const createRemonlineId = new Scenes.WizardScene(
    process.env.CREATE_REMONLINE_ID,
    (ctx) => {
        ctx.reply(ua.createRemonlineId.askFullName, Markup.removeKeyboard());
        ctx.wizard.state.userData = {};
        return ctx.wizard.next();
    },
    (ctx) => {
        if (ctx.message?.text?.length < 3) {
            ctx.reply(ua.createRemonlineId.fullNameToShort);
            return;
        }
        ctx.wizard.state.userData.fullName = ctx.message?.text;
        ctx.reply(ua.createRemonlineId.askContactPhone);
        return ctx.wizard.next();
    },
    async (ctx) => {

        if (!ctx.message?.text || isNaN(ctx.message?.text)) {
            ctx.reply(ua.createRemonlineId.askCorrectPhone);
            return
        }

        const phoneNumber = parsePhoneNumber(ctx.message?.text, 'UA')

        if (phoneNumber.isValid() === false) {
            ctx.reply(ua.createRemonlineId.askCorrectPhone);
            return
        }
        const { nationalNumber, number } = phoneNumber
        ctx.wizard.state.userData.nationalNumber = nationalNumber
        ctx.wizard.state.userData.number = number

        const { clientsList, count } = await getClientsByPhone({ nationalNumber });

        if (count != 0) {
            const [client] = clientsList;
            const { name, email, id } = client;

            ctx.wizard.state.userData.note = ctx.wizard.state.userData.fullName
            ctx.wizard.state.userData.fullName = name
            ctx.wizard.state.userData.email = email
            ctx.wizard.state.userData.remonline_id = id

            await ctx.reply(ua.createRemonlineId.areYouExistingClient);
            await ctx.reply(userInfoAppruvalText(ctx.wizard.state.userData), isDataCorrentBtm);
            return ctx.wizard.selectStep(4);
        }

        ctx.reply(ua.createRemonlineId.askMail, noEmailInlineBtm);
        return ctx.wizard.next();
    },
    async (ctx) => {
        if (ctx.update?.callback_query?.data === 'without_mail') {
            await ctx.answerCbQuery();
            await ctx.reply(ua.createRemonlineId.askToCheckContactInfo);
            await ctx.reply(userInfoAppruvalText(ctx.wizard.state.userData), isDataCorrentBtm);
            return ctx.wizard.next();
        }

        if (EmailValidator.validate(ctx.message.text) == false) {
            ctx.reply(ua.createRemonlineId.askCorrectMail, noEmailInlineBtm);
            return
        }

        ctx.wizard.state.userData.email = ctx.message?.text


        await ctx.reply(ua.createRemonlineId.askToCheckContactInfo);
        await ctx.reply(userInfoAppruvalText(ctx.wizard.state.userData), isDataCorrentBtm);
        return ctx.wizard.next();
    },
    async (ctx) => {
        const { data, from } = ctx.update?.callback_query || {}
        if (!data) {
            return
        }

        if (data === 'my_data_is_ok') {

            const {
                email,
                fullName,
                remonline_id,
                number } = ctx.wizard.state.userData;

            if (remonline_id) {
                ctx.session.remonline_id = remonline_id;
            }

            if (!remonline_id) {

                const { clientId } = await createClient({
                    email,
                    fullName,
                    number,
                    telegramId: from.id,
                });

                ctx.session.remonline_id = clientId;
            }

            await saveRemonlineId({
                telegramId: from.id,
                remonlineId: ctx.session.remonline_id
            })

            ctx.scene.leave();
            await ctx.answerCbQuery();
            return onStart(ctx);
        }

        if (data === 'i_put_wrong_data') {
            await ctx.answerCbQuery();
            ctx.wizard.state.userData = {};
            ctx.reply(ua.createRemonlineId.askFullNameAgain);
            return ctx.wizard.selectStep(1);
        }

    }
);

createRemonlineId.command('start', leaveSceneOnCommand);