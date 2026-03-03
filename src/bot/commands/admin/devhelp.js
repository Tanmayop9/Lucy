import { Command } from "../../structures/abstract/command.js";
export default class Commands extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["dh"];
    this.description = "Lists all restricted commands by category.";
    this.execute = async (client, ctx) => {
      const HIDDEN = ["information", "music", "premium"];
      const grouped = client.commands.reduce((acc, cmd) => {
        if (HIDDEN.includes(cmd.category)) return acc;
        acc[cmd.category] ||= [];
        acc[cmd.category].push(cmd.name);
        return acc;
      }, {});

      const lines = Object.entries(grouped).map(
        ([cat, cmds]) =>
          `**${cat.charAt(0).toUpperCase() + cat.slice(1)}**\n${cmds.map((n) => `\`${n}\``).join("  ")}`,
      );

      await ctx.reply({
        embeds: [
          client
            .embed()
            .title("Restricted Commands")
            .desc(lines.join("\n\n") || "No commands found."),
        ],
      });
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
