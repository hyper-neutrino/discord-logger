import { Event } from "paimon.js";
import { code, embed, expand } from "../lib/format.js";
import { wsend } from "../lib/webhooks.js";

export default new Event({
    event: "presenceUpdate",

    async run(before, after) {
        if (before && before.equals(after)) return;

        if (
            before &&
            before.status == after.status &&
            before.activities.length == after.activities.length &&
            after.activities.every((x, i) => x.equals(before.activities[i]))
        ) {
            return;
        }

        await wsend(
            after.member,
            after.guild,
            "presence-update",
            embed({
                title: "Member Presence Updated",
                description: `${expand(after.member)} has updated their ${
                    before?.status != after.status
                        ? `status from \`${before?.status}\` to \`${after.status}\``
                        : "presence"
                }`,
                color: "BLUE",
                fields: after.activities.map((activity) => ({
                    name: `${activity.type}: ${activity.name}`,
                    value:
                        `${
                            activity.details
                                ? `Details: ${code(activity.details)}\n`
                                : ""
                        }${
                            activity.state
                                ? `State: ${code(activity.state)}\n`
                                : ""
                        }${
                            activity.emoji ? `Emoji: ${activity.emoji}\n` : ""
                        }` || "_ _",
                })),
            })
        );
    },
});
