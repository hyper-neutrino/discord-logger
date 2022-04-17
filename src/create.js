import client from "./client.js";
import config from "./config.js";

process.on("uncaughtException", (error) => {
    console.error(error.stack || error);
});

client.on("ready", async () => {
    await client.deploy({
        guild_id: "805458032908959804",
        commands: process.argv.length > 2 ? process.argv.slice(2) : undefined,
        log: true,
    });

    console.log("Done; logging out.");
    client.destroy();
    process.exit(0);
});

client.run(config.discord_token);
