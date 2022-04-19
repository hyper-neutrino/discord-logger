import { Event } from "paimon.js";
import audit from "../lib/audit.js";
import { embed, expand } from "../lib/format.js";
import { wsend } from "../lib/webhooks.js";

export default [
    new Event({
        event: "emojiCreate",

        async run(emoji) {
            const entry = await audit(emoji.guild, "EMOJI_CREATE", emoji);

            await wsend(
                entry?.executor,
                emoji.guild,
                "emoji",
                embed({
                    title: "Emoji Created",
                    description: `${expand(
                        entry?.executor
                    )} created ${emoji} named \`${emoji.name}\``,
                    color: "GREEN",
                })
            );
        },
    }),

    new Event({
        event: "emojiDelete",

        async run(emoji) {
            const entry = await audit(emoji.guild, "EMOJI_DELETE", emoji);

            await wsend(
                entry?.executor,
                emoji.guild,
                "emoji",
                embed({
                    title: "Emoji Deleted",
                    description: `${expand(entry?.executor)} an emoji named \`${
                        emoji.name
                    }\``,
                    color: "RED",
                })
            );
        },
    }),

    new Event({
        event: "emojiUpdate",

        async run(before, after) {
            const entry = await audit(after.guild, "EMOJI_UPDATE", after);

            await wsend(
                entry?.executor,
                after.guild,
                "emoji",
                embed({
                    title: "Emoji Updated",
                    description: `${expand(
                        entry?.executor
                    )} edited ${after}'s name from ${before.name} to ${
                        after.name
                    }`,
                    color: "BLUE",
                })
            );
        },
    }),
];
