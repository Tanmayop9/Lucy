import _ from "lodash";
import { Command } from "../../structures/abstract/command.js";
import { paginator } from "../../../lib/utils/paginator.js";
import { getCodeStats } from "../../../lib/utils/codestats.js";

export default class CodeStats extends Command {
  constructor() {
    super(...arguments);
    this.dev = true;
    this.aliases = ["codestats", "cs", "codeinfo"];
    this.description = "View full details about the bot's codebase.";
    this.execute = async (client, ctx) => {
      const msg = await ctx.reply({
        embeds: [client.embed().desc("Analyzing codebase...")],
      });

      const stats = await getCodeStats();

      const summaryPage = client
        .embed()
        .title("Codebase Stats")
        .desc(
          `**Files:** ${stats.files}\n` +
          `**Directories:** ${stats.directories}\n` +
          `**Lines:** ${stats.lines.toLocaleString()}\n` +
          `**Characters:** ${stats.characters.toLocaleString()}\n` +
          `**Avg Lines per File:** ${Math.floor(stats.lines / stats.files)}`,
        );

      const treePages = _.chunk(stats.tree, 20).map((chunk) =>
        client.embed().desc(`\`\`\`bash\n${chunk.join("\n")}\n\`\`\``),
      );

      await paginator(ctx, [summaryPage, ...treePages]);
      await msg.delete().catch(() => {});
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
