import { Command } from "../../structures/abstract/command.js";
import { resolveMessageId, findGiveaway } from "../../../lib/utils/giveawayUtil.js";

export default class GDelete extends Command {
  constructor() {
    super(...arguments);
    this.userPerms = ["ManageGuild"];
    this.usage = "<messageId>";
    this.description = "Delete a giveaway without picking winners";
    this.options = [
      { name: "messageid", opType: "string", required: true, description: "Message ID of the giveaway to delete" },
    ];

    this.execute = async (client, ctx, args) => {
      const messageId = resolveMessageId(client.giveaways, ctx.guild.id, args[0]);

      if (!messageId) {
        return ctx.reply({
          embeds: [client.embed().desc("No giveaway found. Provide a valid message ID.")],
        });
      }

      const giveaway = findGiveaway(client.giveaways, ctx.guild.id, messageId);
      const prize = giveaway?.prize ?? "Unknown";

      await client.giveaways
        .delete(messageId)
        .then(() =>
          ctx.reply({
            embeds: [
              client
                .embed()
                .title("Giveaway Deleted")
                .desc(
                  `**Prize:** ${prize}\n` +
                  `**Message ID:** \`${messageId}\``,
                ),
            ],
          }),
        )
        .catch((err) =>
          ctx.reply({
            embeds: [client.embed().desc(`Failed to delete giveaway.\n\`${err}\``)],
          }),
        );
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
