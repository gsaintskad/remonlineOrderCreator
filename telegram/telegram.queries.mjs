import sqlite3 from 'sqlite3';
import { open } from 'sqlite'

const db = await open({
    filename: process.env.DEV_DB,
    driver: sqlite3.Database
})

export async function isUserSaved({ id }) {
    return await db.get(`SELECT telegram_id,remonline_id,first_name FROM telegram_users WHERE telegram_id = ? LIMIT 1`, id)
}

export async function saveNewUser({ id, first_name, last_name, username }) {
    const sql = `INSERT INTO telegram_users(telegram_id,first_name, last_name, username) VALUES(?,?,?,?)`
    await db.run(sql, id, first_name, last_name, username);
}

export async function saveRemonlineId({ telegramId, remonlineId }) {//
    const sql = `UPDATE telegram_users SET remonline_id = ? WHERE telegram_id= ?`
    await db.run(
        sql,
        remonlineId,
        telegramId
    )
}

export async function resetRemonlineId({ telegramId }) {
    const sql = `UPDATE telegram_users SET remonline_id = ? WHERE telegram_id= ?`
    await db.run(
        sql,
        null,
        telegramId
    )
}