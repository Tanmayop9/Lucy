import { Command } from "../../structures/abstract/command.js";
import { resolveMessageId, findGiveaway } from "../../../lib/utils/giveawayUtil.js";

export default class GReroll extends Command {
  constructor() {
    super(...arguments);
    this.userPerms = ["ManageGuild"];
    this.aliases = ["giveawayreroll"];
    this.usage = "[messageId] [winnerCount]";
    this.description = "Reroll winner(s) for an ended giveaway";
    this.options = [
      { name: "messageid", opType: "string", required: false, description: "Message ID of the ended giveaway" },
      { name: "winnercount", opType: "integer", required: false, description: "How many new winners to pick (default: original count)" },
    ];

    this.execute = async (client, ctx, args) => {
      // Accept either: greroll <messageId> [count]  or  greroll [count] (no ID)
      const isSnowflake = (s) => /^\d{17,19}$/.test(s);
      const rawId = isSnowflake(args[0]) ? args[0] : undefined;
      const rawCount = rawId ? args[1] : args[0];
      const winnerCount = parseInt(rawCount) || undefined;

      const messageId = resolveMessageId(client.giveaways, ctx.guild.id, rawId);
      if (!messageId) {
        return ctx.reply({
          embeds: [client.embed().desc("No ended giveaway found. Provide a valid message ID.")],
        });
      }

      const giveaway = findGiveaway(client.giveaways, ctx.guild.id, messageId);
      if (!giveaway?.ended) {
        return ctx.reply({
          embeds: [client.embed().desc("That giveaway has not ended yet. End it first with `gend`.")],
        });
      }

      await client.giveaways
        .reroll(messageId, {
          winnerCount,
          messages: { congrat: { replyToMessage: false } },
        })
        .then((newWinners) => {
          const winnerList = newWinners.length
            ? newWinners.map((w) => `${w}`).join(", ")
            : "No valid participants.";
          ctx.reply({
            embeds: [
              client
                .embed()
                .title("Giveaway Rerolled")
                .desc(
                  `**Prize:** ${giveaway.prize}\n` +
                  `**New Winner(s):** ${winnerList}\n` +
                  `**Message ID:** \`${messageId}\``,
                ),
            ],
          });
        })
        .catch((err) =>
          ctx.reply({
            embeds: [client.embed().desc(`Failed to reroll giveaway.\n\`${err}\``)],
          }),
        );
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
