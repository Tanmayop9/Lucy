/**
 * @fuego v1.0.0
 * @author painfuego (www.codes-for.fun)
 * @copyright 2024 1sT - Services | CC BY-NC-SA 4.0
 */
import { paginator } from "../../../lib/utils/paginator.js";
import { Command } from "../../structures/abstract/command.js";
import { raw } from "../../../lib/utils/raw.js";
export default class Profile extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["pr"];
    this.description = "Shows user profile";
    this.execute = async (client, ctx) => {
      let [
        commandsUsed,
        songsPlayed,
        likedSongs,
        spotifyData,
        afkData,
        premiumData,
      ] = await Promise.all([
        client.db.stats.commandsUsed.get(ctx.author.id),
        client.db.stats.songsPlayed.get(ctx.author.id),
        client.db.likedSongs.get(ctx.author.id),
        client.db.spotify.get(ctx.author.id),
        client.db.afk.get(ctx.author.id),
        client.db.botstaff.get(ctx.author.id),
      ]);
      songsPlayed ||= 0;
      commandsUsed ||= 0;
      likedSongs ||= [];

      const totalActivity = commandsUsed + songsPlayed;
      const level = Math.floor(totalActivity / 50) + 1;
      const nextLevelProgress = totalActivity % 50;

      const accountAge = Math.floor(
        (Date.now() - ctx.author.createdTimestamp) / (1000 * 60 * 60 * 24),
      );
      const achievements = {
        commands: [],
        songs: [],
      };
      const challenges = {
        commands: {
          "basic user": { count: 10, emoji: client.emoji.check },
          "junior user": { count: 50, emoji: client.emoji.check },
          "senior user": { count: 100, emoji: client.emoji.check },
          "master user": { count: 500, emoji: client.emoji.check },
          "unhinged user": { count: 1000, emoji: client.emoji.check },
        },
        songsPlayed: {
          "basic listener": { count: 10, emoji: client.emoji.check },
          "junior listener": { count: 50, emoji: client.emoji.check },
          "senior listener": { count: 100, emoji: client.emoji.check },
          "master listener": { count: 500, emoji: client.emoji.check },
          "unhinged listener": { count: 1000, emoji: client.emoji.check },
        },
      };
      Object.entries(challenges.commands).forEach(([key, { count }]) => {
        achievements.commands.push(
          commandsUsed >= count
            ? { name: key, status: "complete", progress: count, goal: count }
            : { name: key, status: "in progress", progress: commandsUsed, goal: count },
        );
      });
      Object.entries(challenges.songsPlayed).forEach(([key, { count }]) => {
        achievements.songs.push(
          songsPlayed >= count
            ? { name: key, status: "complete", progress: count, goal: count }
            : { name: key, status: "in progress", progress: songsPlayed, goal: count },
        );
      });
      const badges = [];
      if (
        client.owners.includes(ctx.author.id) ||
        client.admins.includes(ctx.author.id) ||
        (await client.db.noPrefix.has(ctx.author.id))
      )
        badges.push("No Prefix");
      if (ctx.author.id === "1056087251068649522")
        badges.push("Developer");
      if (client.admins.includes(ctx.author.id))
        badges.push("Admin");
      if (client.owners.includes(ctx.author.id))
        badges.push("Owner");
      for (const [key, value] of Object.entries(challenges.commands))
        if (commandsUsed >= value.count)
          badges.push(key[0].toUpperCase() + key.slice(1));
      for (const [key, value] of Object.entries(challenges.songsPlayed))
        if (songsPlayed >= value.count)
          badges.push(key[0].toUpperCase() + key.slice(1));

      const overviewEmbed = client
        .embed()
        .desc(
          raw({
            level,
            progress: `${nextLevelProgress}/50`,
            stats: {
              commandsUsed,
              songsPlayed,
              likedSongs: likedSongs.length,
            },
            status: {
              premium: !!premiumData,
              afk: afkData?.reason || null,
              spotify: !!spotifyData,
            },
            account: {
              id: ctx.author.id,
              age: `${accountAge} days`,
            },
          }),
        );

      const badgesEmbed = client
        .embed()
        .desc(raw({ badges }));

      const achievementsEmbed = client
        .embed()
        .desc(raw({ achievements }));

      const musicEmbed = client
        .embed()
        .desc(
          raw({
            spotify: spotifyData
              ? {
                  username: spotifyData.username,
                  profileUrl: spotifyData.profileUrl,
                  linkedAt: spotifyData.linkedAt,
                }
              : null,
            likedSongs: likedSongs.length,
            recentLikes: likedSongs.slice(-5).reverse().map((s) => s.title),
          }),
        );

      await paginator(ctx, [
        overviewEmbed,
        badgesEmbed,
        achievementsEmbed,
        musicEmbed,
      ]);
    };
  }

  generateProgressBar(current, max) {
    const percentage = (current / max) * 100;
    const filled = Math.floor(percentage / 10);
    const empty = 10 - filled;
    return "█".repeat(filled) + "░".repeat(empty);
  }

  getLevelEmoji(level) {
    if (level >= 50) return "👑";
    if (level >= 30) return "⭐";
    if (level >= 20) return "💎";
    if (level >= 10) return "🔥";
    if (level >= 5) return "✨";
    return "🌱";
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
