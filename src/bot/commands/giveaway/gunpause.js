import { Command } from "../../structures/abstract/command.js";
import { resolveMessageId, findGiveaway } from "../../../lib/utils/giveawayUtil.js";

export default class GUnpause extends Command {
  constructor() {
    super(...arguments);
    this.userPerms = ["ManageGuild"];
    this.usage = "[messageId]";
    this.description = "Resume a paused giveaway";
    this.options = [
      { name: "messageid", opType: "string", required: false, description: "Message ID of the paused giveaway (defaults to latest)" },
    ];

    this.execute = async (client, ctx, args) => {
      const messageId = resolveMessageId(client.giveaways, ctx.guild.id, args[0]);

      if (!messageId) {
        return ctx.reply({
          embeds: [client.embed().desc("No giveaway found. Provide a valid message ID.")],
        });
      }

      const giveaway = findGiveaway(client.giveaways, ctx.guild.id, messageId);

      if (giveaway?.ended) {
        return ctx.reply({
          embeds: [client.embed().desc("That giveaway has already ended.")],
        });
      }
      if (!giveaway?.pauseOptions?.isPaused) {
        return ctx.reply({
          embeds: [client.embed().desc("That giveaway is not paused.")],
        });
      }

      await client.giveaways
        .unpause(messageId)
        .then(() =>
          ctx.reply({
            embeds: [
              client
                .embed("#5865F2")
                .title("Giveaway Resumed")
                .desc(
                  `**Prize:** ${giveaway?.prize ?? "Unknown"}\n` +
                  `**Message ID:** \`${messageId}\``,
                ),
            ],
          }),
        )
        .catch((err) =>
          ctx.reply({
            embeds: [client.embed().desc(`Failed to unpause giveaway.\n\`${err}\``)],
          }),
        );
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
