import { Event } from "paimon.js";
import audit from "../lib/audit.js";
import { embed, expand } from "../lib/format.js";
import { wsend } from "../lib/webhooks.js";

export default new Event({
    event: "guildMemberUpdate",

    async run(before, after) {
        const before_roles = new Set();
        const after_roles = new Set();

        for (const [member, set] of [
            [before, before_roles],
            [after, after_roles],
        ]) {
            for (const role_id of member.roles.cache.keys()) {
                set.add(role_id);
            }
        }

        const added = [...after_roles].filter((x) => !before_roles.has(x));
        const removed = [...before_roles].filter((x) => !after_roles.has(x));

        if (added.length > 0 || removed.length > 0) {
            const role_entry = await audit(
                after.guild,
                "MEMBER_ROLE_UPDATE",
                after
            );

            await wsend(
                after,
                after.guild,
                "member-update",
                embed({
                    title: "Roles Updated",
                    description: `${expand(
                        after
                    )}'s roles were updated by ${expand(
                        role_entry?.executor
                    )}:\n\n${[added, removed]
                        .map(
                            (x, i) =>
                                `\`${["+", "-"][i]}\` ${x
                                    .map((id) => `<@&${id}>`)
                                    .join(" ")}`
                        )
                        .filter((x) => x.length > 4)
                        .join("\n")}`,
                    color: "BLUE",
                })
            );
        }
    },
});
