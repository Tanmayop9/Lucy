import { Command } from "../../structures/abstract/command.js";
import { resolveMessageId, findGiveaway } from "../../../lib/utils/giveawayUtil.js";

export default class GEnd extends Command {
  constructor() {
    super(...arguments);
    this.userPerms = ["ManageGuild"];
    this.aliases = ["giveawayend"];
    this.usage = "[messageId]";
    this.description = "End a giveaway early and pick winners";
    this.options = [
      { name: "messageid", opType: "string", required: false, description: "Message ID of the giveaway (defaults to latest)" },
    ];

    this.execute = async (client, ctx, args) => {
      const messageId = resolveMessageId(client.giveaways, ctx.guild.id, args[0]);

      if (!messageId) {
        return ctx.reply({
          embeds: [client.embed().desc("No active giveaway found. Provide a valid message ID.")],
        });
      }

      const giveaway = findGiveaway(client.giveaways, ctx.guild.id, messageId);
      if (giveaway?.ended) {
        return ctx.reply({
          embeds: [client.embed().desc("That giveaway has already ended.")],
        });
      }

      await client.giveaways
        .end(messageId)
        .then((winners) => {
          const winnerList = winners.length
            ? winners.map((w) => `${w}`).join(", ")
            : "No valid participants.";
          ctx.reply({
            embeds: [
              client
                .embed("#5865F2")
                .title("Giveaway Ended")
                .desc(
                  `**Prize:** ${giveaway?.prize ?? "Unknown"}\n` +
                  `**Winners:** ${winnerList}\n` +
                  `**Message ID:** \`${messageId}\``,
                ),
            ],
          });
        })
        .catch((err) =>
          ctx.reply({
            embeds: [client.embed().desc(`Failed to end giveaway.\n\`${err}\``)],
          }),
        );
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
