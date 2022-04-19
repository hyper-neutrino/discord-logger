import { Event } from "paimon.js";
import audit from "../lib/audit.js";
import { code, embed, expand, timestamp } from "../lib/format.js";
import { wsend } from "../lib/webhooks.js";

export default [
    new Event({
        event: "guildMemberUpdate",

        async run(before, after) {
            const entry = await audit(after.guild, "MEMBER_UPDATE", after);

            if (before.nickname != after.nickname) {
                await wsend(
                    after,
                    after.guild,
                    "member-update",
                    embed({
                        title: "Nickname Changed",
                        description: `${
                            entry?.executor.id == after.id
                                ? `${expand(after)} changed their own nickname`
                                : `${expand(entry?.executor)} changed ${expand(
                                      after
                                  )}'s nickname`
                        } from ${code(before.nickname) ?? "(none) "} to ${
                            code(after.nickname) ?? "(none)"
                        }`,
                        color: "BLUE",
                    })
                );
            }

            if (
                before.communicationDisabledUntil !=
                after.communicationDisabledUntil
            ) {
                let title, message, color;

                if (after.communicationDisabledUntil) {
                    title = "Member Timed Out";
                    message = `timed out ${expand(after)} until ${timestamp(
                        after.communicationDisabledUntil
                    )}`;
                    color = "RED";
                } else {
                    title = "Member Timeout Removed";
                    message = `removed ${expand(after)}'s timeout`;
                    color = "GREEN";
                }

                await wsend(
                    after,
                    after.guild,
                    "member-update",
                    embed({
                        title,
                        description: `${expand(entry?.executor)} ${message}`,
                        color,
                    })
                );
            }

            const ba = before.avatarURL({ dynamic: true });
            const aa = after.avatarURL({ dynamic: true });

            if (ba != aa) {
                const k = ba ? (aa ? 0 : 1) : 2;

                const bl = before.displayAvatarURL({ dynamic: true });
                const al = after.displayAvatarURL({ dynamic: true });

                await wsend(after, after.guild, "member-update", {
                    embeds: [
                        {
                            title: `Guild Avatar ${
                                ["Changed", "Removed", "Added"][k]
                            }`,
                            description: `${expand(after)} ${
                                ["changed their", "removed their", "added a"][k]
                            } guild profile picture ${
                                [
                                    "from",
                                    "of",
                                    "replacing their current user avatar,",
                                ][k]
                            } ${bl} ...`,
                            color: "AQUA",
                            thumbnail: { url: bl },
                        },
                        {
                            title: "New Avatar",
                            description: `${
                                [
                                    "... to",
                                    "and are now using their user avatar,",
                                    "with",
                                ][k]
                            } ${al}`,
                            color: "AQUA",
                            thumbnail: { url: al },
                        },
                    ],
                });
            }

            if (before.pending && !after.pending) {
                await wsend(
                    after,
                    after.guild,
                    "member-update",
                    embed({
                        title: "Member Passed Gate",
                        description: `${expand(
                            after
                        )} has passed this server's membership gate`,
                        color: "GREEN",
                    })
                );
            }
        },
    }),

    new Event({
        event: "userUpdate",

        async run(before, after) {
            const members = [];

            for (const guild of after.client.guilds.cache.values()) {
                try {
                    members.push(await guild.members.fetch(after.id));
                } catch {}
            }

            if (before.username != after.username) {
                for (const member of members) {
                    try {
                        await wsend(
                            member,
                            guild,
                            "member-update",
                            embed({
                                title: "Username Changed",
                                description: `${expand(
                                    after
                                )} changed their username from ${code(
                                    before.username
                                )} to ${code(after.username)}`,
                                color: "BLUE",
                            })
                        );
                    } catch {}
                }
            }

            const ba = before.displayAvatarURL({ dynamic: true });
            const aa = after.displayAvatarURL({ dynamic: true });

            if (ba != aa) {
                for (const member of members) {
                    try {
                        await wsend(member, member.guild, "member-update", {
                            embeds: [
                                {
                                    title: "User Avatar Changed",
                                    description: `${expand(
                                        member
                                    )} changed their profile picture from ${ba} ...`,
                                    color: "AQUA",
                                    thumbnail: { url: ba },
                                },
                                {
                                    title: "New Avatar",
                                    description: `... to ${aa}`,
                                    color: "AQUA",
                                    thumbnail: { url: aa },
                                },
                            ],
                        });
                    } catch (error) {
                        console.error(error);
                    }
                }
            }
        },
    }),
];
