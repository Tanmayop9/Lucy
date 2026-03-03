/**
 * @fuego v1.0.0
 * @author painfuego (www.codes-for.fun)
 * @copyright 2024 1sT - Services | CC BY-NC-SA 4.0
 */
import { Command } from "../../structures/abstract/command.js";
import { raw } from "../../../lib/utils/raw.js";
export default class Commands extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["dh"];
    this.description = "List of all owner only commands";
    this.execute = async (client, ctx) => {
      const allCommands = client.commands.reduce((accumulator, cmd) => {
        if (
          cmd.category === "information" ||
          cmd.category === "music" ||
          cmd.category === "premium"
        )
          return accumulator;
        accumulator[cmd.category] ||= [];
        accumulator[cmd.category].push({
          name: cmd.name,
        });
        return accumulator;
      }, {});
      await ctx.reply({
        embeds: [
          client.embed().desc(
            raw(
              Object.fromEntries(
                Object.entries(allCommands).map(([cat, cmds]) => [
                  cat,
                  cmds.map((c) => c.name),
                ]),
              ),
            ),
          ),
        ],
      });
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
