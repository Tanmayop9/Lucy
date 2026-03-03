/**
 * @nerox v1.0.0
 * @author Tanmay
 */
import _ from "lodash";
import { Command } from "../../structures/abstract/command.js";
import { paginator } from "../../../lib/utils/paginator.js";
import { getCodeStats } from "../../../lib/utils/codestats.js";
import { raw } from "../../../lib/utils/raw.js";

export default class CodeStats extends Command {
  constructor() {
    super(...arguments);
    this.dev = true;
    this.aliases = ["codestats", "cs", "codeinfo"];
    this.description = "View full details about the bot's codebase.";
    this.execute = async (client, ctx) => {
      const msg = await ctx.reply({
        embeds: [
          client.embed().desc(`${client.emoji.loading} Analyzing codebase...`),
        ],
      });

      const stats = await getCodeStats();

      const embeds = [
        client.embed().desc(
          raw({
            files: stats.files,
            directories: stats.directories,
            lines: stats.lines,
            characters: stats.characters,
            avgLinesPerFile: Math.floor(stats.lines / stats.files),
          }),
        ),
      ];

      const treeChunks = _.chunk(stats.tree, 20);
      for (const chunk of treeChunks) {
        embeds.push(
          client.embed().desc(`\`\`\`bash\n${chunk.join("\n")}\n\`\`\``),
        );
      }

      await paginator(ctx, embeds);
      await msg.delete().catch(() => {});
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
