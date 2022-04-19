import { is_string } from "paimon.js";
import db from "../db.js";

await db.init("channels");

export async function set_log_channel(type, channel) {
    await db.channels.findOneAndUpdate(
        { guild: channel.guild.id, type },
        { $set: { channel: channel.id } },
        { upsert: true }
    );
}

export async function delete_log_channel(guild, type) {
    await db.channels.findOneAndDelete({ guild: guild.id, type });
}

export async function get_log_channel(guild, type) {
    if (!guild) return undefined;

    const entry = await db.channels.findOne({ guild: guild.id, type });
    if (!entry) return undefined;

    try {
        return await guild.channels.fetch(entry.channel);
    } catch {
        return undefined;
    }
}

export async function csend(guild, type, options) {
    const channel = await get_log_channel(guild, type);
    if (!channel) return;

    if (is_string(options)) options = { content: options };

    await channel.send({ allowedMentions: { parse: [] }, ...options });
}
