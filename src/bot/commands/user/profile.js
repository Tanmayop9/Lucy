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
      const [
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

      await paginator(ctx, [
        client.embed().desc(raw({ commandsUsed, songsPlayed, likedSongs, premiumData, afkData })),
        client.embed().desc(raw(spotifyData)),
        client.embed().desc(raw(ctx.author, 1)),
        client.embed().desc(raw(ctx.member, 1)),
      ]);
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
