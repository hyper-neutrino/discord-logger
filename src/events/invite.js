import { Event } from "paimon.js";
import audit from "../lib/audit.js";
import { embed, expand, timestamp } from "../lib/format.js";
import { wsend } from "../lib/webhooks.js";

export default [
    new Event({
        event: "inviteCreate",

        async run(invite) {
            invite = await invite.guild.invites.fetch(invite.code);

            await wsend(
                invite.inviter,
                invite.guild,
                "invite",
                embed({
                    title: "Invite Created",
                    description: `${expand(
                        invite.inviter
                    )} created an invite to ${expand(invite.channel)}`,
                    color: "GREEN",
                    fields: [
                        {
                            name: "URL",
                            value: invite.url,
                        },
                        {
                            name: "Expiration",
                            value: timestamp(invite.expiresAt),
                        },
                        {
                            name: "Maximum Uses",
                            value: (invite.maxUses || "infinite").toString(),
                        },
                        {
                            name: "Temporary Membership",
                            value: invite.temporary ? "yes" : "no",
                        },
                    ],
                })
            );
        },
    }),

    new Event({
        event: "inviteDelete",

        async run(invite) {
            const entry = await audit(
                invite.guild,
                "INVITE_DELETE",
                invite,
                "code"
            );

            await wsend(
                entry?.executor,
                invite.guild,
                "invite",
                embed({
                    title: "Invite Deleted",
                    description: `${expand(
                        entry?.executor
                    )} deleted the invite \`${
                        invite.code
                    }\` pointing to ${expand(invite.channel)}`,
                    color: "RED",
                })
            );
        },
    }),
];
