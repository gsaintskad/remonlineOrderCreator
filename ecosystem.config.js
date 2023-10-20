module.exports = {
    apps: [{
        name: "rembot",
        script: "app.mjs",
        watch: true,
        ignore_watch: ["node_modules", "./main.db", "\\.git"],
        node_args: '-r dotenv/config',
        env: {
            ENV: "prod",
        }
    }]
}