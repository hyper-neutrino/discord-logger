import { Event } from "paimon.js";
import { csend } from "../lib/channels.js";
import {
    copy_attachments,
    copy_files_only,
    embed,
    expand,
    timestamp,
} from "../lib/format.js";
import { wsend } from "../lib/webhooks.js";

export default [
    new Event({
        event: "messageDelete",

        async run(message) {
            if (skip_log(message)) return;

            const files = await copy_attachments(message, 1);

            await wsend(
                message.member ?? message.author,
                message.guild,
                "message",
                {
                    embeds: [
                        {
                            title: "Message Deleted",
                            description: message.content,
                            color: "RED",
                            fields: fields_for(message),
                        },
                    ],
                    files: files.slice(0, 10),
                }
            );

            if (files.length > 10) {
                await wsend(
                    message.member ?? message.author,
                    message.guild,
                    "message",
                    {
                        embeds: [
                            {
                                title: "Sticker",
                                description:
                                    "The sticker from the above deleted message could not be attached as a file within the same message.",
                                color: "RED",
                            },
                        ],
                        files: files.slice(10),
                    }
                );
            }
        },
    }),

    new Event({
        event: "messageDeleteBulk",

        async run(messages) {
            if (messages.size == 0) return;
            const { client, guild } = messages.first();

            const references = [];
            const rows = [];

            let index = 0;

            for (const message of messages.toJSON().reverse()) {
                if (skip_log(message)) continue;

                const files = await copy_attachments(message, 1);

                if (files.length > 0) {
                    references.push({
                        embeds: [
                            {
                                title: `Files for message ${++index}`,
                                color: "ORANGE",
                            },
                        ],
                        files: files.slice(0, 10),
                    });
                }

                if (files.length > 10) {
                    references.push({
                        embeds: [
                            {
                                title: `Sticker for message ${index}`,
                                description: `The sticker from message ${index} could not be attached as a file within the same message.`,
                                color: "ORANGE",
                            },
                        ],
                        files: files.slice(10),
                    });
                }

                const line = `${message.author} (${message.author.tag})${
                    files.length > 0 ? ` [${index}]` : ""
                }: ${message.content}`;

                rows.push(line.substring(0, 4096));

                if (line.length > 4096) rows.push(line.substring(4096));
            }

            const blocks = [rows.shift()];

            for (const row of rows) {
                const next = blocks[blocks.length - 1] + "\n" + row;

                if (next.length > 4096) {
                    blocks.push(row);
                } else {
                    blocks[blocks.length - 1] = next;
                }
            }

            for (const block of blocks) {
                await wsend(
                    client.user,
                    guild,
                    "message",
                    embed({
                        title: "Purged Messages",
                        description: block,
                        color: "PURPLE",
                    })
                );
            }

            for (const reference of references) {
                await wsend(client.user, guild, "message", reference);
            }
        },
    }),

    new Event({
        event: "messageUpdate",

        async run(before, after) {
            if (skip_log(after)) return;

            if (after.attachments.size < before.attachments.size) {
                const kept = new Set(
                    after.attachments.map((attachment) => attachment.id)
                );

                const removed = before.attachments.filter(
                    (attachment) => !kept.has(attachment.id)
                );

                await wsend(after.author, after.guild, "message", {
                    embeds: [
                        {
                            title: "Message Edited (Files Removed)",
                            description: `The above attachments were removed from [this message](${
                                after.url
                            }) sent by ${expand(after.author)} in ${expand(
                                after.channel
                            )}`,
                            color: "ORANGE",
                            url: after.url,
                        },
                    ],
                    files: copy_files_only(removed.values(), 1),
                });
            }

            if (before.content != after.content) {
                let embeds;

                if (
                    (before.content?.length ?? 0) > 1024 ||
                    (after.content?.length ?? 0) > 1024
                ) {
                    embeds = [
                        {
                            title: "Message Edited (Before)",
                            description: before.content,
                            color: "ORANGE",
                        },
                        {
                            title: "Message Edited (After)",
                            description: after.content,
                            color: "ORANGE",
                            fields: fields_for(after),
                            url: after.url,
                        },
                    ];
                } else {
                    embeds = [
                        {
                            title: "Message Edited",
                            color: "ORANGE",
                            fields: [
                                before.content
                                    ? {
                                          name: "Before",
                                          value: before.content,
                                      }
                                    : [],
                                after.content
                                    ? {
                                          name: "After",
                                          value: after.content,
                                      }
                                    : [],
                                fields_for(after),
                            ].flat(),
                            url: after.url,
                        },
                    ];
                }

                try {
                    await wsend(after.author, after.guild, "message", {
                        embeds,
                    });
                } catch {
                    for (const embed of embeds) {
                        await wsend(after.author, after.guild, "message", {
                            embeds: [embed],
                        });
                    }
                }
            }
        },
    }),
];

function skip_log(message) {
    if (message.content === null) return true;
    if (!message.guild) return true;
    if (message.system) return true;
    if (message.webhookId) return true;
    if (!message.author) return true;
    if (message.author.bot) return true;
    return false;
}

function fields_for(message) {
    return [
        message.reference
            ? {
                  name: "Reference",
                  value: `https://discord.com/channels/${message.reference.guildId}/${message.reference.channelId}/${message.reference.messageId}`,
              }
            : [],
        {
            name: "Details",
            value: `Posted on ${timestamp(message.createdAt)} by ${expand(
                message.author
            )} in ${expand(message.channel)}`,
        },
    ].flat();
}
