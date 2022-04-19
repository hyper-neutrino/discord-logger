import { Command } from "paimon.js";
import db from "../db.js";
import {
    delete_log_channel,
    get_log_channel,
    set_log_channel,
} from "../lib/channels.js";
import { embed } from "../lib/format.js";

const types = [
    "s:type the type of event to log",
    ["bans (add, remove)", "ban"],
    ["channels (create, delete, update)", "channel"],
    ["emojis + stickers (create, delete, update)", "emoji"],
    ["event users (subscribe, unsubscribe)", "event-user"],
    ["events (create, delete, update)", "event"],
    ["guild (update)", "guild"],
    ["invites (create, delete)", "invite"],
    ["members (add, remove)", "member"],
    ["members (update)", "member-update"],
    ["members (roles)", "member-role"],
    ["messages (delete, bulk delete, edit)", "message"],
    ["reactions (add, remove)", "reaction"],
    ["roles (create, delete, update)", "role"],
    ["threads (create, delete, update)", "thread"],
    ["voice state (join, leave, move, mute/unmute)", "voice"],
];

export default [
    new Command({
        name: "log set",
        description: "set up logging",
        options: [
            types,
            "c:channel:text,privatethread,publicthread the channel to log to",
        ],
        async execute(cmd, type, channel) {
            const previous = await get_log_channel(cmd.guild, type);

            await set_log_channel(type, channel);

            return `The log channel for \`${type}\` events has been set to ${channel}${
                previous ? ` (previously ${previous})` : ""
            }.`;
        },
    }),

    new Command({
        name: "log unset",
        description: "remove a log channel",
        options: [types],
        async execute(cmd, type) {
            const previous = await get_log_channel(cmd.guild, type);

            if (!previous) {
                return "That event type is not currently being logged.";
            }

            await delete_log_channel(cmd.guild, type);

            return `The log channel for \`${type}\` events has been removed${
                previous ? ` (previously ${previous})` : ""
            }.`;
        },
    }),

    new Command({
        name: "log all",
        description: "set the log channel for all logging types at once",
        options: [
            "c:channel:text,privatethread,publicthread the channel to log to",
        ],
        async execute(_, channel) {
            for (const [_key, type] of types.slice(1)) {
                await set_log_channel(type, channel);
            }

            return `All event types will now be logged to ${channel}.`;
        },
    }),

    new Command({
        name: "log reset",
        description: "reset the logger and remove all log channels",
        options: [],
        async execute(cmd) {
            await db.channels.deleteMany({ guild: cmd.guild.id });

            return "All log channels have been cleared.";
        },
    }),

    new Command({
        name: "log list",
        description: "list currently configured log channels",
        options: [],
        async execute(cmd) {
            await cmd.reply(
                embed({
                    title: "Logging Channels",
                    description:
                        (
                            await db.channels
                                .find({ guild: cmd.guild.id })
                                .toArray()
                        )
                            .map(
                                (entry) =>
                                    `\`${entry.type}\`: <#${entry.channel}>`
                            )
                            .join("\n") ||
                        "No logging channels are configured yet! Use `/log set` to set up a logging channel.",
                    color: 0xff0099,
                })
            );
        },
    }),
];
