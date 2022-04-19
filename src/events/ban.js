import { Event } from "paimon.js";
import audit from "../lib/audit.js";
import { embed, expand, show_reason } from "../lib/format.js";
import { wsend } from "../lib/webhooks.js";

export default [
    new Event({
        event: "guildBanAdd",

        async run(ban) {
            if (ban.partial) ban = await ban.fetch();

            const entry = await audit(ban.guild, "MEMBER_BAN_ADD", ban.user);

            await wsend(
                ban.user,
                ban.guild,
                "ban",
                embed({
                    title: "Member Banned",
                    description: `${expand(ban.user)} was banned by ${expand(
                        entry?.executor
                    )} ${show_reason(ban.reason)}`,
                    color: "RED",
                })
            );
        },
    }),

    new Event({
        event: "guildBanRemove",

        async run(ban) {
            const entry = await audit(ban.guild, "MEMBER_BAN_REMOVE", ban.user);

            await wsend(
                ban.user,
                ban.guild,
                "ban",
                embed({
                    title: "User Unbanned",
                    description: `${expand(ban.user)} was unbanned by ${expand(
                        entry?.executor
                    )} ${show_reason(entry?.reason)}`,
                    color: "GREEN",
                })
            );
        },
    }),
];
