export default async function (guild, type, target, key = "id") {
    if (!target) {
        const entry = (await guild.fetchAuditLogs({ type })).entries.first();
        if (!entry) return;

        if (new Date() - entry.createdAt <= 10000) return entry;
        return;
    }

    target = target[key] ?? target;

    for (const entry of (
        await guild.fetchAuditLogs({ type })
    ).entries.values()) {
        if (entry.target[key] == target) return entry;

        if (new Date() - entry.createdAt > 10000) return;
    }
}
