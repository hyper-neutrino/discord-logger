import { Event } from "paimon.js";
import audit from "../lib/audit.js";
import { cf, code, embed, expand, timestamp } from "../lib/format.js";
import { wsend } from "../lib/webhooks.js";

export default [
    new Event({
        event: "guildScheduledEventCreate",

        async run(event) {
            await wsend(
                event.creator,
                event.guild,
                "event",
                embed({
                    title: "Event Created",
                    description: `${expand(event.creator)} created an event`,
                    color: "GREEN",
                    fields: [
                        { name: "Name", value: event.name },
                        event.description
                            ? { name: "Description", value: event.description }
                            : [],
                        {
                            name: "Location",
                            value: location(event),
                        },
                        {
                            name: "Scheduled Start",
                            value: timestamp(event.scheduledStartAt),
                        },
                        event.scheduledEndAt
                            ? {
                                  name: "Scheduled End",
                                  value: timestamp(event.scheduledEndAt),
                              }
                            : [],
                        { name: "URL", value: event.url },
                    ].flat(),
                    url: event.url,
                })
            );
        },
    }),

    new Event({
        event: "guildScheduledEventDelete",

        async run(event) {
            const entry = await audit(
                event.guild,
                "GUILD_SCHEDULED_EVENT_DELETE",
                event
            );

            await wsend(
                entry?.executor,
                event.guild,
                "event",
                embed({
                    title: "Event Deleted",
                    description: `${expand(
                        entry?.executor
                    )} deleted an event named ${code(event.name)}`,
                    color: "RED",
                })
            );
        },
    }),

    new Event({
        event: "guildScheduledEventUpdate",

        async run(before, after) {
            const fields = [
                cf("Name", before.name, after.name, code),
                cf("Description", before.description, after.description, code),
                cf("Location", location(before), location(after)),
                before.scheduledStartTimestamp != after.scheduledStartTimestamp
                    ? {
                          name: "Scheduled Start",
                          value: `${timestamp(
                              before.scheduledStartAt
                          )} → ${timestamp(after.scheduledStartAt)}`,
                      }
                    : [],
                before.scheduledEndTimestamp != after.scheduledEndTimestamp
                    ? {
                          name: "Scheduled End",
                          value: `${
                              before.scheduledEndAt
                                  ? timestamp(before.scheduledEndAt)
                                  : "(none)"
                          } → ${
                              after.scheduledEndAt
                                  ? timestamp(after.scheduledEndAt)
                                  : "(none)"
                          }`,
                      }
                    : [],
            ].flat();

            if (fields.length == 0) return;

            const entry = await audit(
                after.guild,
                "GUILD_SCHEDULED_EVENT_UPDATE",
                after
            );

            await wsend(
                entry?.executor,
                after.guild,
                "event",
                embed({
                    title: "Event Updated",
                    description: `${expand(entry?.executor)} updated an event`,
                    color: "BLUE",
                    fields,
                })
            );
        },
    }),
];

function location(event) {
    return event.entityType == "NONE"
        ? "none"
        : event.entityType == "EXTERNAL"
        ? event.entityMetadata?.location
        : event.channel.toString();
}
