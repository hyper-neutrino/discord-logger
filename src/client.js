import { res } from "file-ez";
import { Client, is_string, load_all } from "paimon.js";
import StickerCache from "./lib/sticker_cache.js";

const client = new Client({
    intents: 131071,
    partials: [
        "USER",
        "CHANNEL",
        "GUILD_MEMBER",
        "MESSAGE",
        "REACTION",
        "GUILD_SCHEDULED_EVENT",
    ],
    commands: await load_all(res("./commands")),
    events: await load_all(res("./events")),

    async before(cmd) {
        if (!cmd.member.permissions.has("MANAGE_GUILD")) {
            return "You must have the MANAGE_GUILD permission to operate this bot.";
        }
    },

    async before_autocomplete(cmd) {
        if (!cmd.member.permissions.has("MANAGE_GUILD")) return [];
    },

    async error(cmd, error) {
        if (is_string(error)) {
            try {
                await cmd.reply({
                    content: error,
                    ephemeral: true,
                });
                return;
            } catch {}
        }

        console.error(`Error in command /${cmd.commandName}`);
        console.error(error.stack || error);
    },
});

export default client;

client.stickerCache = new StickerCache(client, "cache");
