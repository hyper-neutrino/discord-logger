import { Event } from "paimon.js";
import audit from "../lib/audit.js";
import { archive_duration, code, embed, expand } from "../lib/format.js";
import { wsend } from "../lib/webhooks.js";

export default [
    new Event({
        event: "threadCreate",

        async run(thread) {
            const entry = await audit(thread.guild, "THREAD_CREATE", thread);

            await wsend(
                entry?.executor,
                thread.guild,
                "thread",
                embed({
                    title: "Thread Created",
                    description: `${expand(entry?.executor)} created ${expand(
                        thread
                    )} in ${expand(thread.parent)}`,
                    color: "GREEN",
                })
            );
        },
    }),

    new Event({
        event: "threadDelete",

        async run(thread) {
            const entry = await audit(thread.guild, "THREAD_DELETE", thread);

            await wsend(
                entry?.executor,
                thread.guild,
                "thread",
                embed({
                    title: "Thread Deleted",
                    description: `${expand(entry?.executor)} deleted #${
                        thread.name
                    } (\`${thread.id}\`) in ${expand(thread.parent)}`,
                    color: "RED",
                })
            );
        },
    }),

    new Event({
        event: "threadUpdate",

        async run(before, after) {
            const entry = await audit(after.guild, "THREAD_UPDATE", after);

            const rows = [];

            if (before.name != after.name) {
                rows.push(
                    `- name changed from ${code(before.name)} to ${code(
                        after.name
                    )}`
                );
            }

            if (before.type != after.type) {
                rows.push(
                    `- thread type changed from \`${before.type}\` to \`${after.type}\``
                );
            }

            if (before.archived && !after.archived) {
                rows.push("- thread was unarchived");
            } else if (!before.archived && after.archived) {
                rows.push("- thread was archived");
            }

            if (before.locked && !after.locked) {
                rows.push("- thread was unlocked");
            } else if (!before.locked && after.locked) {
                rows.push("- thread was locked");
            }

            if (before.invitable && !after.invitable) {
                rows.push("- non-moderators can no longer invite other users");
            } else if (!before.invitable && after.invitable) {
                rows.push("- non-moderators can now invite other users");
            }

            if (before.autoArchiveDuration != after.autoArchiveDuration) {
                rows.push(
                    `- auto-archive duration changed from ${
                        code(archive_duration[before.autoArchiveDuration]) ??
                        "(?)"
                    } to ${
                        code(archive_duration[after.autoArchiveDuration]) ??
                        "(?)"
                    }`
                );
            }

            if (before.rateLimitPerUser != after.rateLimitPerUser) {
                rows.push(
                    `- slowmode changed from \`${before.rateLimitPerUser}s\` to \`${after.rateLimitPerUser}s\``
                );
            }

            if (rows.length == 0) return;

            await wsend(
                entry?.executor,
                after.guild,
                "thread",
                embed({
                    title: "Thread Updated",
                    description: `${expand(entry?.executor)} updated ${expand(
                        after
                    )}\n\n${rows.join("\n")}`,
                    color: "BLUE",
                })
            );
        },
    }),
];
