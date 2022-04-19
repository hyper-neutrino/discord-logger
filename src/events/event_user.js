import { Event } from "paimon.js";
import { code, embed, expand } from "../lib/format.js";
import { wsend } from "../lib/webhooks.js";

export default [
    new Event({
        event: "guildScheduledEventUserAdd",

        async run(event, user) {
            await wsend(
                user,
                event.guild,
                "event-user",
                embed({
                    title: "Event Subscription Added",
                    description: `${expand(
                        user
                    )} subscribed to an event: ${code(event.name)}`,
                    color: "GREEN",
                })
            );
        },
    }),

    new Event({
        event: "guildScheduledEventUserRemove",

        async run(event, user) {
            await wsend(
                user,
                event.guild,
                "event-user",
                embed({
                    title: "Event Subscription Removed",
                    description: `${expand(
                        user
                    )} unsubscribed from an event: ${code(event.name)}`,
                    color: "RED",
                })
            );
        },
    }),
];
