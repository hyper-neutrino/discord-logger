import { Event } from "paimon.js";
import audit from "../lib/audit.js";
import { embed, expand, timestamp } from "../lib/format.js";
import { wsend } from "../lib/webhooks.js";

export default [
    new Event({
        event: "guildMemberAdd",

        async run(member) {
            await wsend(
                member,
                member.guild,
                "member",
                embed({
                    title: "Member Joined",
                    description: `${expand(
                        member
                    )} joined the server; account created on ${timestamp(
                        member.user.createdAt
                    )}`,
                    color: "GREEN",
                })
            );
        },
    }),

    new Event({
        event: "guildMemberRemove",

        async run(member) {
            const prune = await audit(member.guild, "MEMBER_PRUNE");

            if (prune) {
                await wsend(
                    prune?.executor,
                    member.guild,
                    "member",
                    embed({
                        title: "Members Pruned",
                        description: `${prune?.executor} pruned ${
                            prune.extra.removed
                        } member${
                            prune.extra.removed == 1 ? "" : "s"
                        } who have not been seen on Discord for ${
                            prune.extra.days
                        } days`,
                        color: "PURPLE",
                    })
                );
            }

            let kicker = prune?.executor;

            if (!kicker) {
                const entry = await audit(member.guild, "MEMBER_KICK", member);
                kicker = entry?.executor;
            }

            const roles = member.roles.cache
                .toJSON()
                .sort((a, b) => a.comparePositionTo(b))
                .slice(1)
                .reverse()
                .join(" ");

            await wsend(
                member,
                member.guild,
                "member",
                embed({
                    title: kicker ? "Member Kicked" : "Member Left",
                    description: `${expand(member)} ${
                        kicker
                            ? `was kicked by ${expand(kicker)}`
                            : "left the server"
                    }; last joined ${timestamp(member.joinedAt)}`,
                    color: "RED",
                    fields:
                        roles.length > 0
                            ? [{ name: "Roles", value: roles }]
                            : [],
                })
            );
        },
    }),
];
