import { Event } from "paimon.js";
import { embed, expand } from "../lib/format.js";
import { wsend } from "../lib/webhooks.js";

export default [
    new Event({
        event: "messageReactionAdd",

        async run(reaction, user) {
            await wsend(
                user,
                reaction.message.guild,
                "reaction",
                embed({
                    title: "Reaction Added",
                    description: `${expand(user)} reacted ${
                        reaction.emoji
                    } to ${reaction.message.url}`,
                    color: "GREEN",
                    url: reaction.message.url,
                })
            );
        },
    }),

    new Event({
        event: "messageReactionRemove",

        async run(reaction, user) {
            await wsend(
                user,
                reaction.message.guild,
                "reaction",
                embed({
                    title: "Reaction Removed",
                    description: `${expand(user)}'s reaction of ${
                        reaction.emoji
                    } on ${reaction.message.url} was removed`,
                    color: "RED",
                    url: reaction.message.url,
                })
            );
        },
    }),

    new Event({
        event: "messageReactionRemoveAll",

        async run(message, reactions) {
            await wsend(
                message.client.user,
                message.guild,
                "reaction",
                embed({
                    title: "All Reactions Purged",
                    description: `all reactions on ${
                        message.url
                    } were purged: ${reactions
                        .map((reaction) => reaction.emoji)
                        .join(" ")}`,
                    color: "PURPLE",
                    url: message.url,
                })
            );
        },
    }),

    new Event({
        event: "messageReactionRemoveEmoji",

        async run(reaction) {
            await wsend(
                reaction.client.user,
                reaction.message.guild,
                "reaction",
                embed({
                    title: "Reaction Emoji Purged",
                    description: `a bot purged the reaction ${reaction.emoji} from ${reaction.message.url}`,
                    color: "PURPLE",
                    url: reaction.message.url,
                })
            );
        },
    }),
];
