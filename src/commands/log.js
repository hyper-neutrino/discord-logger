import { Command } from "paimon.js";
import { get_log_channel, set_log_channel } from "../lib/channels.js";

export default [
    new Command({
        name: "log set",
        description: "set up logging",
        options: [
            [
                "s:type the type of event to log",
                ["bans (add, remove)", "ban"],
                ["channels (create, delete, update pins, update)", "channel"],
                ["emojis + stickers (create, delete, update)", "emoji"],
                ["event users (subscribe, unsubscribe)", "event-user"],
                ["events (create, delete, update)", "event"],
                ["guild (update)", "guild"],
                ["invites (create, delete)", "invite"],
                ["member presence (update)", "presence-update"],
                ["members (add, remove)", "member"],
                ["members (update)", "member-update"],
                ["messages (delete, bulk delete, edit)", "message"],
                ["reactions (add, remove)", "reaction"],
                ["roles (create, delete, update)", "role"],
                ["threads (create, delete, member update, update)", "thread"],
                ["typing", "typing"],
                ["voice state (join, leave, move, mute/unmute)", "voice"],
                ["webhooks (update)", "webhook"],
            ],
            "c:channel:text,privatethread,publicthread the channel to log to",
        ],
        async execute(cmd, type, channel) {
            if (type != "reaction") {
                return "That event type is still in development.";
            }

            const previous = await get_log_channel(cmd.guild, type);

            await set_log_channel(type, channel);

            return `The log channel for \`${type}\` events has been set to ${channel}${
                previous ? ` (previously ${previous})` : ""
            }.`;
        },
    }),
];
