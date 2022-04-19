export function expand(item) {
    if (!item) return `${item}`;

    if (item.tag) {
        return `${item} (${item.tag} \`${item.id}\`)`;
    } else if (item.user) {
        return `${item} (${item.user.tag} \`${item.id}\`)`;
    } else if (item.permissionOverwrites || item.send) {
        return `${item} (#${item.name} \`${item.id}\`)`;
    } else if (item.members) {
        return `${item} (@${item.name} \`${item.id}\`)`;
    } else {
        return item.toString();
    }
}

export function list(array, join = "and") {
    if (array.length == 0) {
        return "";
    } else if (array.length == 1) {
        return `${array[0]}`;
    } else if (array.length == 2) {
        return `${array[0]} ${join} ${array[1]}`;
    } else {
        return `${array.slice(0, array.length - 1).join(", ")}, ${join} ${
            array[array.length - 1]
        }`;
    }
}

export function timestamp(time, flag) {
    if (!time) return "(none)";

    return `<t:${Math.floor(time.getTime() / 1000)}${flag ? `:${flag}` : ""}>`;
}

export function code(x) {
    if (!x) return x;

    if (x.indexOf("`") == -1) {
        return `\`${x}\``;
    } else if (x.indexOf("``") == -1) {
        return `\`\` ${x} \`\``;
    } else {
        return `\`\`${x.replaceAll("`", "\u200b`")} \`\``;
    }
}

export function embed(data) {
    return { embeds: [data] };
}

export function show_reason(reason) {
    return reason ? `with reason: ${reason}` : "without reason";
}

export function cf(name, before, after, fn = (x) => x) {
    return before != after
        ? {
              name,
              value: `${fn(before) ?? "(none)"} → ${fn(after) ?? "(none)"}`,
          }
        : [];
}

export function cf2(name, before, after, before_display, after_display) {
    return before != after
        ? {
              name,
              value: `${before_display ?? "(none)"} → ${
                  after_display ?? "(none)"
              }`,
          }
        : [];
}

function d(a, b, k) {
    return a
        .filter((x) => !b.has(x))
        .map((x) => `${k} ${x.replaceAll("`", "\u200b`")}`)
        .join("\n");
}

export function array_diff(before, after) {
    const before_set = new Set(before);
    const after_set = new Set(after);

    return `\`\`\`diff\n${d(after, before_set, "+")}\n${d(
        before,
        after_set,
        "-"
    )}\n\`\`\``;
}

export async function copy_attachments(message, spoiler_level) {
    const attachments = copy_files_only(
        message.attachments.values(),
        spoiler_level
    );

    for (const sticker of message.stickers.values()) {
        try {
            const path = await message.client.stickerCache.fetch(sticker);

            if (path) {
                attachments.push({
                    attachment: path,
                    name: `${spoiler_level > 0 ? "SPOILER_" : ""}${
                        sticker.name
                    }.${message.client.stickerCache.ext(sticker)}`,
                });
            }
        } catch {}
    }

    return attachments;
}

export function copy_files_only(files, spoiler_level) {
    const attachments = [];

    for (const attachment of files) {
        let name = attachment.name;
        const spoiler = name.startsWith("SPOILER_");
        while (name.startsWith("SPOILER_")) name = name.substring(8);
        if ((spoiler_level == 0 && spoiler) || spoiler_level > 0) {
            name = "SPOILER_" + name;
        }
        attachments.push({ attachment: attachment.url, name });
    }

    return attachments;
}

export const archive_duration = {
    60: "1 hour",
    1440: "1 day",
    4320: "3 days",
    10080: "7 days",
};
