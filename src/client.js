import { res } from "file-ez";
import { Client, is_string, load_all } from "paimon.js";

export default new Client({
    intents: 131071,
    partials: ["CHANNEL", "MESSAGE", "REACTION"],
    commands: await load_all(res("./commands")),
    events: await load_all(res("./events")),

    async before(cmd) {
        if (!cmd.member.permissions.has("MANAGE_SERVER")) {
            return "You must have the MANAGE_SERVER permission to operate this bot.";
        }
    },

    async before_autocomplete(cmd) {
        if (!cmd.member.permissions.has("MANAGE_SERVER")) return [];
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
