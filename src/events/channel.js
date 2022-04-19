import { Event } from "paimon.js";
import audit from "../lib/audit.js";
import { archive_duration, code, embed, expand } from "../lib/format.js";
import { wsend } from "../lib/webhooks.js";

export default [
    new Event({
        event: "channelCreate",

        async run(channel) {
            const entry = await audit(channel.guild, "CHANNEL_CREATE", channel);

            await wsend(
                entry?.executor,
                channel.guild,
                "channel",
                embed({
                    title: "Channel Created",
                    description: `${expand(entry?.executor)} created ${expand(
                        channel
                    )}`,
                    color: "GREEN",
                })
            );
        },
    }),

    new Event({
        event: "channelDelete",

        async run(channel) {
            const entry = await audit(channel.guild, "CHANNEL_DELETE", channel);

            await wsend(
                entry?.executor,
                channel.guild,
                "channel",
                embed({
                    title: "Channel Deleted",
                    description: `${expand(entry?.executor)} deleted #${
                        channel.name
                    } (\`${channel.id}\`)`,
                    color: "RED",
                })
            );
        },
    }),

    new Event({
        event: "channelUpdate",

        async run(before, after) {
            if (!after.guild) return;

            for (const section of [0, 1]) {
                const rows = [];

                if (section == 0) {
                    if (before.name != after.name) {
                        rows.push(
                            `- name changed from ${code(before.name)} to ${code(
                                after.name
                            )}`
                        );
                    }

                    if (before.type != after.type) {
                        rows.push(
                            `- channel type changed from \`${before.type}\` to \`${after.type}\``
                        );
                    }

                    if (before.parentId != after.parentId) {
                        rows.push(
                            `- channel category changed from ${
                                before.parentId
                                    ? `<#${before.parentId}>`
                                    : "(none)"
                            } to ${
                                after.parentId
                                    ? `<#${after.parentId}>`
                                    : "(none)"
                            }`
                        );
                    }

                    if (before.nsfw && !after.nsfw)
                        rows.push("- NSFW was turned off");
                    if (after.nsfw && !before.nsfw)
                        rows.push("- NSFW was turned on");

                    if (before.rateLimitPerUser != after.rateLimitPerUser) {
                        rows.push(
                            `- slowmode changed from \`${before.rateLimitPerUser}s\` to \`${after.rateLimitPerUser}s\``
                        );
                    }

                    if (before.topic != after.topic) {
                        rows.push(
                            `- topic changed from ${code(
                                before.topic
                            )} to ${code(after.topic)}`
                        );
                    }

                    if (
                        before.defaultAutoArchiveDuration !=
                        after.defaultAutoArchiveDuration
                    ) {
                        rows.push(
                            `- thread auto-archive duration changed from \`${
                                archive_duration[
                                    before.defaultAutoArchiveDuration
                                ]
                            }\` to \`${
                                archive_duration[
                                    after.defaultAutoArchiveDuration
                                ]
                            }\``
                        );
                    }

                    if (before.bitrate != after.bitrate) {
                        rows.push(
                            `- bitrate changed from \`${Math.floor(
                                before.bitrate / 1000
                            )}kbps\` to \`${Math.floor(
                                after.bitrate / 1000
                            )}kbps\``
                        );
                    }

                    if (before.rtcRegion != after.rtcRegion) {
                        rows.push(
                            `- RTC region changed from \`${before.rtcRegion}\` to \`${after.rtcRegion}\``
                        );
                    }

                    if (before.userLimit != after.userLimit) {
                        rows.push(
                            `- user limit changed from \`${before.userLimit}\` to \`${after.userLimit}\``
                        );
                    }
                } else {
                    const perms_before = new Map();
                    const perms_after = new Map();

                    for (const [channel, perms] of [
                        [before, perms_before],
                        [after, perms_after],
                    ]) {
                        for (const overwrites of channel.permissionOverwrites.cache.values()) {
                            const label = `<@${
                                { role: "&", member: "" }[overwrites.type]
                            }${overwrites.id}>`;

                            for (const [set, key] of [
                                [overwrites.allow, "✅"],
                                [overwrites.deny, "❌"],
                            ]) {
                                for (const permission of set.toArray()) {
                                    perms.set(
                                        `${label}: \`${permission}\``,
                                        key
                                    );
                                }
                            }
                        }
                    }

                    for (const key of [
                        ...new Set([
                            ...perms_before.keys(),
                            ...perms_after.keys(),
                        ]),
                    ]) {
                        if (perms_before.get(key) != perms_after.get(key)) {
                            rows.push(
                                `- ${key}: ${perms_before.get(key) ?? "🟨"} → ${
                                    perms_after.get(key) ?? "🟨"
                                }`
                            );
                        }
                    }
                }

                if (rows.length == 0) continue;

                let entry;

                if (section == 0) {
                    entry = await audit(after.guild, "CHANNEL_UPDATE", after);
                } else {
                    entry = (
                        await Promise.all(
                            ["CREATE", "UPDATE", "DELETE"].map((k) =>
                                audit(
                                    after.guild,
                                    `CHANNEL_OVERWRITE_${k}`,
                                    after
                                )
                            )
                        )
                    )
                        .filter((x) => x)
                        .sort((a, b) => b.createdAt - a.createdAt)[0];
                }

                const blocks = [
                    `${expand(entry?.executor)} updated ${expand(after)}\n`,
                ];

                for (const row of rows) {
                    const next = blocks[blocks.length - 1] + "\n" + row;
                    if (next.length > 4096) {
                        blocks.push(row);
                    } else {
                        blocks[blocks.length - 1] = next;
                    }
                }

                await wsend(
                    entry?.executor,
                    after.guild,
                    "channel",
                    embed({
                        title: "Channel Updated",
                        description: blocks.shift(),
                        color: "BLUE",
                    })
                );

                for (const block of blocks) {
                    await wsend(
                        entry?.executor,
                        after.guild,
                        "channel",
                        embed({
                            title: "continued...",
                            description: block,
                            color: "BLACK",
                        })
                    );
                }
            }
        },
    }),
];
