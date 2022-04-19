import { is_string } from "paimon.js";
import db from "../db.js";
import { get_log_channel } from "./channels.js";

await db.init("webhooks");

export async function get_webhook(channel) {
    if (!channel) return undefined;

    const entry = await db.webhooks.findOne({ channel: channel.id });
    let hook;

    if (entry) {
        hook = (await channel.fetchWebhooks()).get(entry.id);
        if (hook) return hook;
    }

    hook = await channel.createWebhook("log webhook", {
        reason: `logging webhook for #${channel.name} (${channel.id})`,
    });

    await db.webhooks.findOneAndUpdate(
        { channel: channel.id },
        { $set: { id: hook.id } },
        { upsert: true }
    );

    return hook;
}

export async function wsend(member_or_user, guild, type, options) {
    if (!guild) return;

    const channel = await get_log_channel(guild, type);
    if (!channel) return;

    const hook = await get_webhook(channel);
    if (!hook) return;

    if (is_string(options)) options = { content: options };

    return await hook.send({
        username:
            (member_or_user?.user ?? member_or_user)?.tag ?? "Unknown User",
        avatarURL: member_or_user
            ? member_or_user.displayAvatarURL({ dynamic: true })
            : undefined,
        allowedMentions: { parse: [] },
        ...options,
    });
}
