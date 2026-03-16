import {
  incrementLeaveCount,
  refreshGuildInvites,
} from "../../../lib/utils/inviteTracker.js";

const event = "guildMemberRemove";

export default class GuildMemberRemove {
  constructor() {
    this.name = event;
  }

  execute = async (client, member) => {
    const guild = member.guild;

    // ── Invite tracking ───────────────────────────────────────────────────
    const inviterKey = `joined_${guild.id}_${member.id}`;
    const inviterId = await client.db.invites.get(inviterKey).catch(() => null);

    if (inviterId) {
      await incrementLeaveCount(client, guild.id, inviterId);
      await client.db.invites.delete(inviterKey).catch(() => null);
    }

    // Refresh invite cache so join counts stay accurate
    await refreshGuildInvites(client, guild.id);

    // ── Leave message ─────────────────────────────────────────────────────
    const cfg = await client.db.welcomeConfig.get(guild.id).catch(() => null);
    if (!cfg?.leave?.channelId) return;

    const channel = guild.channels.cache.get(cfg.leave.channelId);
    if (!channel?.isTextBased()) return;

    const text = cfg.leave.message
      ? cfg.leave.message
          .replace("{user}", member.user.username)
          .replace("{server}", guild.name)
          .replace("{count}", guild.memberCount)
      : `**${member.user.username}** has left **${guild.name}**.`;

    await channel
      .send({
        embeds: [
          client
            .embed()
            .title("Member Left")
            .desc(text)
            .thumb(member.user.displayAvatarURL({ size: 256 }))
            .footer({ text: `ID: ${member.id}` }),
        ],
      })
      .catch(() => null);
  };
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
