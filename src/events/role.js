import { Event } from "paimon.js";
import audit from "../lib/audit.js";
import { code, embed, expand } from "../lib/format.js";
import { wsend } from "../lib/webhooks.js";

export default [
    new Event({
        event: "roleCreate",

        async run(role) {
            const entry = await audit(role.guild, "ROLE_CREATE", role);

            await wsend(
                entry?.executor,
                role.guild,
                "role",
                embed({
                    title: "Role Created",
                    description: `${expand(entry?.executor)} created ${expand(
                        role
                    )}`,
                    color: "GREEN",
                })
            );
        },
    }),

    new Event({
        event: "roleDelete",

        async run(role) {
            const entry = await audit(role.guild, "ROLE_DELETE", role);

            await wsend(
                entry?.executor,
                role.guild,
                "role",
                embed({
                    title: "Role Deleted",
                    description: `${expand(entry?.executor)} deleted @${
                        role.name
                    } (\`${role.id}\`)`,
                    color: "RED",
                })
            );
        },
    }),

    new Event({
        event: "roleUpdate",
        async run(before, after) {
            const entry = await audit(after.guild, "ROLE_UPDATE", after);

            const rows = [];
            let thumbnail;

            if (before.name != after.name) {
                rows.push(
                    `- name changed from ${code(before.name)} to ${code(
                        after.name
                    )}`
                );
            }

            if (before.color != after.color) {
                rows.push(
                    `- color changed from ${before.hexColor} to ${after.hexColor}`
                );
            }

            if (before.hoist && !after.hoist) {
                rows.push(
                    "- role no longer appears separately on the member list"
                );
            } else if (!before.hoist && after.hoist) {
                rows.push("- role now appears separately on the member list");
            }

            if (before.mentionable && !after.mentionable) {
                rows.push("- role is no longer able to be pinged by everyone");
            } else if (!before.mentionable && after.mentionable) {
                rows.push("- role is now able to be pinged by everyone");
            }

            if (before.position != after.position) {
                rows.push(
                    `- role position has changed from ${before.position} to ${after.position}`
                );
            }

            const aa = after.iconURL();

            if (before.iconURL() != aa) {
                rows.push(`- role icon has been changed to ${aa}`);
                thumbnail = { url: aa };
            }

            if (!before.permissions.equals(after.permissions)) {
                const bp = before.permissions.toArray();
                const ap = after.permissions.toArray();

                const added = ap.filter((x) => bp.indexOf(x) == -1);
                const removed = bp.filter((x) => ap.indexOf(x) == -1);

                rows.push(
                    `- permissions have been changed:\n\`\`\`diff\n${
                        added.length > 0 ? `+ ${added.join(", ")}\n` : ""
                    }${
                        removed.length > 0 ? `- ${removed.join(", ")}\n` : ""
                    }\`\`\``
                );
            }

            if (rows.length == 0) return;

            await wsend(
                entry?.executor,
                after.guild,
                "role",
                embed({
                    title: "Role Updated",
                    description: `${expand(entry?.executor)} updated ${expand(
                        after
                    )}\n\n${rows.join("\n")}`,
                    color: "BLUE",
                    thumbnail,
                })
            );
        },
    }),
];
