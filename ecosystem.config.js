module.exports = {
    apps: [{
        name: "rembot",
        script: "app.mjs",
        watch: true,
        ignore_watch: ["node_modules", "./main.db", "\\.git","./main.db-journal"],
        node_args: '-r dotenv/config',
        env: {
            ENV: "prod",
        }
    }]
}