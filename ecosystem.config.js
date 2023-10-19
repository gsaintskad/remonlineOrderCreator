module.exports = {
    apps: [{
        name: "rembot",
        script: "app.mjs",
        watch: true,
        node_args: '--trace-deprecation -r dotenv/config',
        env: {
            ENV: "dev",
        }
    }]
}