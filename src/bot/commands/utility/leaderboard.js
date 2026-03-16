import { Command } from "../../structures/abstract/command.js";
import { getLeaderboard } from "../../../lib/utils/messageCount.js";

export default class Leaderboard extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["lb", "msgtop", "topchat"];
    this.description = "Shows the message count leaderboard for this server.";
    this.usage = "[daily|all]";
    this.options = [
      {
        name: "type",
        opType: "string",
        description: "daily or all (defaults to all)",
        required: false,
      },
    ];
  }

  execute = async (client, ctx, args) => {
    const type = args[0]?.toLowerCase() === "daily" ? "daily" : "all";
    const label = type === "daily" ? "Today" : "All-Time";

    const entries = await getLeaderboard(client, ctx.guild.id, type, 10);

    if (!entries.length) {
      return ctx.reply({
        embeds: [
          client
            .embed()
            .title(`${ctx.guild.name} — Message Leaderboard`)
            .desc("No messages recorded yet."),
        ],
      });
    }

    const lines = entries.map(
      (e, i) =>
        `**${i + 1}.** <@${e.userId}> — ${e.count.toLocaleString()} message${e.count !== 1 ? "s" : ""}`,
    );

    await ctx.reply({
      embeds: [
        client
          .embed()
          .title(`${ctx.guild.name} — Message Leaderboard (${label})`)
          .desc(lines.join("\n"))
          .footer({ text: `Showing top ${entries.length}` }),
      ],
    });
  };
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
