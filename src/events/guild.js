import { Event } from "paimon.js";
import audit from "../lib/audit.js";
import { array_diff, cf, cf2, code, embed, expand } from "../lib/format.js";
import { wsend } from "../lib/webhooks.js";

export default new Event({
    event: "guildUpdate",

    async run(before, after) {
        const entry = await audit(after, "GUILD_UPDATE", after);

        if (before.ownerId != after.ownerId) {
            let user;
            try {
                user = await before.client.users.fetch(before.ownerId);
            } catch {}

            await wsend(
                user,
                after,
                "guild",
                embed({
                    title: "Ownership Transferred",
                    description: `${expand(
                        user
                    )} transferred ownership of this server to ${expand(
                        await after.members.fetch(after.ownerId)
                    )}`,
                    color: "GOLD",
                })
            );
        }

        if (before.partnered != after.partnered) {
            await wsend(
                after.client.user,
                after,
                "guild",
                embed({
                    title: after.partnered
                        ? "Guild Became Partner"
                        : "Guild Lost Partnership",
                    description: after.partnered
                        ? "This server is now a Discord partner"
                        : "This server is no longer a Discord partner",
                    color: "GOLD",
                })
            );
        }

        if (before.verified != after.verified) {
            await wsend(
                after.client.user,
                after,
                "guild",
                embed({
                    title: after.verified
                        ? "Guild is now verified"
                        : "Guild is no longer verified",
                    description: after.verified
                        ? "This server is now verified"
                        : "This server is no longer verified",
                    color: "GOLD",
                })
            );
        }

        const f = (n, k) =>
            cf2(n, before[`${k}Id`], after[`${k}Id`], before[k], after[k]);

        const fields = [
            cf("Name", before.name, after.name, code),
            cf("Description", before.description, after.description, code),
            f("AFK Channel", "afkChannel"),
            cf("AFK Timeout (seconds)", before.afkTimeout, after.afkTimeout),
            f("Public Updates Channel", "publicUpdatesChannel"),
            f("Rules Channel", "rulesChannel"),
            f("System Channel", "systemChannel"),
            f("Widget Channel", "widgetChannel"),
            cf(
                "Default Message Notifications",
                before.defaultMessageNotifications,
                after.defaultMessageNotifications
            ),
            cf(
                "Explicit Content Filter",
                before.explicitContentFilter,
                after.explicitContentFilter,
                code
            ),
            cf(
                "2FA Moderation Requirement",
                before.mfaLevel,
                after.mfaLevel,
                code
            ),
            cf("NSFW Level", before.nsfwLevel, after.nsfwLevel, code),
            cf(
                "Preferred Locale",
                before.preferredLocale,
                after.preferredLocale,
                code
            ),
            before.premiumProgressBarEnabled != after.premiumProgressBarEnabled
                ? {
                      name: "Boost Progress Bar",
                      value: after.premiumProgressBarEnabled
                          ? "turned **on**"
                          : "turned **off**",
                  }
                : [],
            before.systemChannelFlags.bitfield !=
            after.systemChannelFlags.bitfield
                ? {
                      name: "System Channel Types",
                      value: array_diff(
                          before.systemChannelFlags.toArray(),
                          after.systemChannelFlags.toArray()
                      ),
                  }
                : [],
            cf("Vanity Code", before.vanityURLCode, after.vanityURLCode, code),
            cf(
                "Verification Level",
                before.verificationLevel,
                after.verificationLevel,
                code
            ),
        ].flat();

        if (fields.length == 0) return;

        await wsend(
            entry?.executor,
            after,
            "guild",
            embed({
                title: "Guild Updated",
                description: `${expand(entry?.executor)} updated this server`,
                color: "BLUE",
                fields,
            })
        );
    },
});
