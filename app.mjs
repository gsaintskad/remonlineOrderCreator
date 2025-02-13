import {
    Telegraf,
    session,
    Scenes
} from 'telegraf';
import express from "express";

import { createOrderScene } from './telegram/scenes/scene.new-order.mjs';
import { createRemonlineId } from './telegram/scenes/scene.new-remonline-id.mjs';
import { editUserScene } from './telegram/scenes/scene.user-edit-scene.mjs';
import { dbLogger } from './telegram/middleware/db-logger.mjs';
import {
    onStart,
    onReset,
    onEdit
} from './telegram/middleware/start-handler.mjs';

import { keyboardText } from './translate.mjs';

import { remonlineTokenToEnv } from './remonline/remonline.api.mjs'
import * as ctx from "telegraf";

await remonlineTokenToEnv();
const bot = new Telegraf(process.env.TELEGRAM_API_KEY);
const stage = new Scenes.Stage([createRemonlineId, createOrderScene, editUserScene]);
const app = express();

bot.use(session());
bot.use(stage.middleware());

(async () => {

    bot.use(dbLogger);
    bot.start(onStart);
    bot.command('edit', onEdit);

    bot.hears(keyboardText.newAppointment, (ctx) => {
        if (!ctx.session.remonline_id) {
            return
        }

        return ctx.scene.enter(process.env.CREATE_ORDER_SCENE);
    })


    if (process.env.ENV == 'dev') {
        bot.command('reset', onReset);
        bot.launch();
        // Enable graceful stop
        process.once('SIGINT', () => bot.stop('SIGINT'))
        process.once('SIGTERM', () => bot.stop('SIGTERM'))
        console.log('bot works...');
    }


    if (process.env.ENV == 'prod') {
        app.use(await bot.createWebhook({ domain: process.env.HOST, path: process.env.HOST_PATH }));
        app.listen(process.env.PORT, () => {
            console.log(`Repairstationbot listen at ${process.env.PORT}`);
        });
    }
    console.log("ctx.session:", ctx.session);
    console.log("ctx.session.remonline_id:", ctx.session?.remonline_id);

})()