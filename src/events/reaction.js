import { Event } from "paimon.js";
import { get_log_channel } from "../lib/channels.js";
import { wsend } from "../lib/webhooks.js";

export default [
    new Event({
        event: "messageReactionAdd",

        async run(reaction, user) {
            const guild = reaction.message.guild;
            if (!guild) return;

            await wsend(
                user,
                await get_log_channel(guild, "reaction"),
                `\`[${user.id}]\` Reacted ${reaction.emoji} to ${reaction.message.url}`
            );
        },
    }),
];
