import { keyboardText } from '../../translate.mjs';
import { Markup } from 'telegraf';


export const mainKeyboard = (
    () => {
        const buttons = [[keyboardText.newAppointment]]
        return Markup.keyboard(buttons).oneTime(true).resize(true)
    }
)()
