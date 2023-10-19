import {
    Telegraf,
    session,
    Scenes
} from 'telegraf';
import express from "express";
import ngrok from 'ngrok';

import fs from 'fs'
import https from 'https'

import { createOrderScene } from './telegram/scenes/scene.new-order.mjs';
import { createRemonlineId } from './telegram/scenes/scene.new-remonline-id.mjs';
import { dbLogger } from './telegram/middleware/db-logger.mjs';
import {
    onStart,
    onReset
} from './telegram/middleware/start-handler.mjs';
import { keyboardText } from './translate.mjs';

import { remonlineTokenToEnv } from './remonline/remonline.api.mjs'

await remonlineTokenToEnv();

const bot = new Telegraf(process.env.TELEGRAM_API_KEY);
const stage = new Scenes.Stage([createRemonlineId, createOrderScene]);
const app = express();

bot.use(session());
bot.use(stage.middleware());

(async () => {

    if (process.env.ENV == 'prod') {
        app.use(await bot.createWebhook({ domain: process.env.HOST }));
    }

    bot.use(dbLogger);
    bot.command('start', onStart);

    if (process.env.ENV == 'dev') {
        bot.command('reset', onReset);
    }
    bot.start()

    bot.hears(keyboardText.newAppointment, (ctx) => {
        if (!ctx.session.remonline_id) {
            return
        }

        return ctx.scene.enter(process.env.CREATE_ORDER_SCENE);
    })


    if (process.env.ENV == 'dev') {
        bot.launch();
        // Enable graceful stop
        process.once('SIGINT', () => bot.stop('SIGINT'))
        process.once('SIGTERM', () => bot.stop('SIGTERM'))
    }

    if (process.env.ENV == 'prod') {

        const options = {
            key: fs.readFileSync('./private.key.pem'),
            cert: fs.readFileSync('./domain.cert.pem'),
        };

        const server = https.createServer(options, app).listen(process.env.PORT, function () {
            console.log("Express server listening on port " + process.env.PORT);
        });

        console.log({server})

        app.get('/', function (req, res) {
            res.end("Hi from remonlinebot");
        });

        // app.listen(process.env.PORT, () => console.log("Listening on port", process.env.PORT));
    }


    if (process.env.ENV == 'ngrok') {
        const url = await ngrok.connect({
            proto: 'http', // http|tcp|tls, defaults to http
            addr: process.env.PORT, // port or network address, defaults to 80
            authtoken: process.env.NGROK_API_KEY, // your authtoken from ngrok.com
        });
        console.log(`ngrok runs at: ${url}`)

        bot.launch({
            webhook: {
                domain: url,
                port: process.env.PORT,
            },
        });
    }

})()