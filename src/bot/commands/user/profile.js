import { paginator } from "../../../lib/utils/paginator.js";
import { Command } from "../../structures/abstract/command.js";

export default class Profile extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["pr"];
    this.description = "Shows your user profile.";
    this.execute = async (client, ctx) => {
      const [commandsUsed, songsPlayed, afkData, premiumData] =
        await Promise.all([
          client.db.stats.commandsUsed.get(ctx.author.id),
          client.db.stats.songsPlayed.get(ctx.author.id),
          client.db.afk.get(ctx.author.id),
          client.db.botstaff.get(ctx.author.id),
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

      const createdAt = Math.floor(ctx.author.createdTimestamp / 1000);
      const joinedAt = ctx.member?.joinedTimestamp
        ? Math.floor(ctx.member.joinedTimestamp / 1000)
        : null;

      const statsPage = client
        .embed()
        .title(`${ctx.author.username} — Stats`)
        .desc(
          `**Commands Used:** ${commandsUsed ?? 0}\n` +
          `**Songs Played:** ${songsPlayed ?? 0}\n` +
          `**Premium:** ${isPremium}\n` +
          `**AFK:** ${isAfk}`,
        )
        .thumb(ctx.author.displayAvatarURL({ size: 256 }));

      const musicPage = client
        .embed()
        .title(`${ctx.author.username} — Music`)
        .desc(
          `**Songs Played:** ${songsPlayed ?? 0}\n` +
          `**Search Engine:** Set via \`${client.prefix}searchengine\`\n` +
          `**Note:** Spotify is no longer supported. Use YouTube, SoundCloud, Deezer, or Apple Music.`,
        );

      const accountPage = client
        .embed()
        .title(`${ctx.author.username} — Account`)
        .desc(
          `**Username:** ${ctx.author.username}\n` +
          `**ID:** \`${ctx.author.id}\`\n` +
          `**Created:** <t:${createdAt}:R>\n` +
          `**Bot:** ${ctx.author.bot ? "Yes" : "No"}`,
        )
        .thumb(ctx.author.displayAvatarURL({ size: 256 }));

      const memberPage = client
        .embed()
        .title(`${ctx.author.username} — Member`)
        .desc(
          `**Nickname:** ${ctx.member?.nickname ?? "None"}\n` +
          `**Joined Server:** ${joinedAt ? `<t:${joinedAt}:R>` : "Unknown"}\n` +
          `**Roles:** ${(ctx.member?.roles.cache.size ?? 1) - 1}\n` +
          `**Highest Role:** ${ctx.member?.roles.highest ?? "None"}`,
        );

      await paginator(ctx, [statsPage, musicPage, accountPage, memberPage]);
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
