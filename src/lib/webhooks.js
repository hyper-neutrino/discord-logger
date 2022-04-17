import { is_string } from "paimon.js";
import db from "../db.js";

await db.init("webhooks");

export async function get_webhook(channel) {
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

export async function wsend(member_or_user, channel, options) {
    if (!channel) return;

    const hook = await get_webhook(channel);

    if (is_string(options)) options = { content: options };

    return await hook.send({
        username: (member_or_user.user ?? member_or_user).tag,
        avatarURL: member_or_user.displayAvatarURL({ dynamic: true }),
        ...options,
    });
}
