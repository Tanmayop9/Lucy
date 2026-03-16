import { paginator } from "../../../lib/utils/paginator.js";
import { Command } from "../../structures/abstract/command.js";
import { getInviteStats } from "../../../lib/utils/inviteTracker.js";
import { getMessageCount } from "../../../lib/utils/messageCount.js";

export default class Profile extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["pr"];
    this.description = "Shows your user profile.";
    this.execute = async (client, ctx) => {
      const target = ctx.mentions?.users?.first() ?? ctx.author;
      const member = ctx.guild?.members.cache.get(target.id);

      const [commandsUsed, afkData, premiumData, inviteStats, msgStats] =
        await Promise.all([
          client.db.stats.commandsUsed.get(target.id),
          client.db.afk.get(target.id),
          client.db.botstaff.get(target.id),
          getInviteStats(client, ctx.guild.id, target.id),
          getMessageCount(client, ctx.guild.id, target.id),
        ]);

      const isPremium = premiumData
        ? premiumData.permanent
          ? "Active (Permanent)"
          : premiumData.expiresAt
          ? `Active — expires <t:${Math.floor(premiumData.expiresAt / 1000)}:R>`
          : "Active"
        : "Inactive";

      const isAfk = afkData
        ? `Active since <t:${Math.floor(afkData.timestamp / 1000)}:R>`
        : "Not AFK";

      const createdAt = Math.floor(target.createdTimestamp / 1000);
      const joinedAt = member?.joinedTimestamp
        ? Math.floor(member.joinedTimestamp / 1000)
        : null;

      const statsPage = client
        .embed()
        .title(`${target.username} — Stats`)
        .desc(
          `**Commands Used:** ${commandsUsed ?? 0}\n` +
            `**Messages (All-Time):** ${msgStats.allTime.toLocaleString()}\n` +
            `**Messages (Today):** ${msgStats.today.toLocaleString()}\n` +
            `**Invites:** ${inviteStats.real} (${inviteStats.total} total, ${inviteStats.left} left)\n` +
            `**Premium:** ${isPremium}\n` +
            `**AFK:** ${isAfk}`,
        )
        .thumb(target.displayAvatarURL({ size: 256 }));

      const accountPage = client
        .embed()
        .title(`${target.username} — Account`)
        .desc(
          `**Username:** ${target.username}\n` +
            `**ID:** \`${target.id}\`\n` +
            `**Created:** <t:${createdAt}:R>\n` +
            `**Bot:** ${target.bot ? "Yes" : "No"}`,
        )
        .thumb(target.displayAvatarURL({ size: 256 }));

      const memberPage = client
        .embed()
        .title(`${target.username} — Member`)
        .desc(
          `**Nickname:** ${member?.nickname ?? "None"}\n` +
            `**Joined Server:** ${joinedAt ? `<t:${joinedAt}:R>` : "Unknown"}\n` +
            `**Roles:** ${(member?.roles.cache.size ?? 1) - 1}\n` +
            `**Highest Role:** ${member?.roles.highest ?? "None"}`,
        );

      await paginator(ctx, [statsPage, accountPage, memberPage]);
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
