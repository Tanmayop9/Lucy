import {
  findUsedInvite,
  incrementInviteCount,
} from "../../../lib/utils/inviteTracker.js";

const event = "guildMemberAdd";

export default class GuildMemberAdd {
  constructor() {
    this.name = event;
  }

  execute = async (client, member) => {
    const guild = member.guild;

    // ── Invite tracking ──────────────────────────────────────────────────
    const usedInvite = await findUsedInvite(client, guild);
    if (usedInvite?.inviter?.id) {
      await incrementInviteCount(client, guild.id, usedInvite.inviter.id);

      // Store who invited this member (for leave tracking)
      await client.db.invites
        .set(`joined_${guild.id}_${member.id}`, usedInvite.inviter.id)
        .catch(() => null);
    }

    // ── Welcome message ───────────────────────────────────────────────────
    const cfg = await client.db.welcomeConfig.get(guild.id).catch(() => null);
    if (!cfg?.welcome?.channelId) return;

    const channel = guild.channels.cache.get(cfg.welcome.channelId);
    if (!channel?.isTextBased()) return;

    const text = cfg.welcome.message
      ? cfg.welcome.message
          .replace("{user}", member.toString())
          .replace("{server}", guild.name)
          .replace("{count}", guild.memberCount)
      : `Welcome to **${guild.name}**, ${member}! You are member **#${guild.memberCount}**.`;

    await channel
      .send({
        embeds: [
          client
            .embed()
            .title("Member Joined")
            .desc(text)
            .thumb(member.user.displayAvatarURL({ size: 256 }))
            .footer({ text: `ID: ${member.id}` }),
        ],
      })
      .catch(() => null);
  };
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
