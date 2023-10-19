module.exports = {
    apps: [{
        name: "rembot",
        script: "app.mjs",
        watch: true,
        node_args: '-r dotenv/config',
        env: {
            ENV: "prod",
        }
    }]
}