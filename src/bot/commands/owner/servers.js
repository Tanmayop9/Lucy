/**
 * @nerox v1.0.0
 * @author Tanmay
 */
import { Command } from "../../structures/abstract/command.js";
import { paginator } from "../../../lib/utils/paginator.js";
import { raw } from "../../../lib/utils/raw.js";

export default class Servers extends Command {
  constructor() {
    super(...arguments);
    this.owner = true;
    this.aliases = ["guilds", "serverlist"];
    this.description = "List all servers the bot is in";
    this.execute = async (client, ctx) => {
      const guilds = Array.from(client.guilds.cache.values()).sort(
        (a, b) => b.memberCount - a.memberCount,
      );

      const pages = [];
      const guildsPerPage = 10;

      for (let i = 0; i < guilds.length; i += guildsPerPage) {
        const guildChunk = guilds.slice(i, i + guildsPerPage);
        const embed = client
          .embed()
          .desc(raw(guildChunk.map((g) => [g.name, g.id, g.memberCount])));
        pages.push(embed);
      }

      if (pages.length === 0) {
        await ctx.reply({
          embeds: [
            client.embed().desc(`${client.emoji.warn} No servers found.`),
          ],
        });
        return;
      }

      await paginator(ctx, pages);
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
