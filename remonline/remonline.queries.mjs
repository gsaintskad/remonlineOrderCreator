import sqlite3 from 'sqlite3';
import { open } from 'sqlite'

const db = await open({
    filename: process.env.DEV_DB,
    driver: sqlite3.Database
})

export async function saveRemonlineToken({ token, validTo }) {//
    const sql = `INSERT INTO remonline_tokens(token, valid_to) VALUES(?,?)`
    await db.run(
        sql,
        token,
        validTo
    )
}

export async function getRemonlineToken({ now }) {
    const sql = `SELECT token FROM remonline_tokens WHERE valid_to > ? ORDER BY created_at DESC LIMIT 1 `
    return await db.get(sql, now)
}