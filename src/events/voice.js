import { Event } from "paimon.js";
import audit from "../lib/audit.js";
import { embed, expand, list } from "../lib/format.js";
import { wsend } from "../lib/webhooks.js";

export default new Event({
    event: "voiceStateUpdate",

    async run(before, after) {
        const entry = await audit(after.guild, "MEMBER_UPDATE", after.member);

        const changes = [];

        if (before.channel != after.channel) {
            if (!before.channel) {
                changes.push(`joined ${expand(after.channel)}`);
            } else if (!after.channel) {
                const kick_entry = await audit(
                    before.guild,
                    "MEMBER_DISCONNECT"
                );

                changes.push(
                    kick_entry
                        ? `was disconnected from ${expand(
                              before.channel
                          )} by ${expand(kick_entry?.executor)}`
                        : `left ${expand(before.channel)}`
                );
            } else {
                const move_entry = await audit(after.guild, "MEMBER_MOVE");

                changes.push(
                    move_entry
                        ? `was moved from ${expand(before.channel)} to ${expand(
                              after.channel
                          )} by ${expand(move_entry?.executor)}`
                        : `moved from ${expand(before.channel)} to ${expand(
                              after.channel
                          )}`
                );
            }
        } else {
            if (before.selfVideo != after.selfVideo) {
                changes.push(
                    `turned ${after.selfVideo ? "on" : "off"} their camera`
                );
            }

            if (before.streaming != after.streaming) {
                changes.push(
                    `${after.streaming ? "started" : "stopped"} screensharing`
                );
            }

            if (before.selfMute != after.selfMute) {
                changes.push(
                    `${after.selfMute ? "" : "un"}muted their microphone`
                );
            }

            if (before.selfDeaf != after.selfDeaf) {
                changes.push(
                    `${after.selfDeaf ? "" : "un"}deafened themselves`
                );
            }

            if (before.serverMute != after.serverMute) {
                changes.push(
                    `was ${
                        after.serverMute ? "suppressed" : "permitted to speak"
                    } by ${expand(entry?.executor)}`
                );
            }

            if (before.serverDeaf != after.serverDeaf) {
                changes.push(
                    `was ${after.serverDeaf ? "" : "un"}deafened by ${expand(
                        entry?.executor
                    )}`
                );
            }

            if (before.suppress != after.suppress) {
                changes.push(
                    `became a${
                        after.suppress ? "n audience member" : " speaker"
                    }`
                );
            }
        }

        if (changes.length == 0) return;

        await wsend(
            after.member,
            after.guild,
            "voice",
            embed({
                title: "Voice State Updated",
                description: `${expand(after.member)} ${list(changes)}`,
                color: "BLURPLE",
            })
        );
    },
});
