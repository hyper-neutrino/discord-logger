import db from "../db.js";

await db.init("channels");

export async function set_log_channel(type, channel) {
    await db.channels.findOneAndUpdate(
        { guild: channel.guild.id, type },
        { $set: { channel: channel.id } },
        { upsert: true }
    );
}

export async function get_log_channel(guild, type) {
    const entry = await db.channels.findOne({ guild: guild.id, type });
    if (!entry) return undefined;

    try {
        return await guild.channels.fetch(entry.channel);
    } catch {
        return undefined;
    }
}
