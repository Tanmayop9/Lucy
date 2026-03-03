import { Command } from "../../structures/abstract/command.js";
import { resolveMessageId, findGiveaway } from "../../../lib/utils/giveawayUtil.js";

export default class GPause extends Command {
  constructor() {
    super(...arguments);
    this.userPerms = ["ManageGuild"];
    this.usage = "[messageId]";
    this.description = "Pause a running giveaway";
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
      if (giveaway?.pauseOptions?.isPaused) {
        return ctx.reply({
          embeds: [client.embed().desc("That giveaway is already paused. Use `gunpause` to resume it.")],
        });
      }

      await client.giveaways
        .pause(messageId)
        .then(() =>
          ctx.reply({
            embeds: [
              client
                .embed()
                .title("Giveaway Paused")
                .desc(
                  `**Prize:** ${giveaway?.prize ?? "Unknown"}\n` +
                  `**Message ID:** \`${messageId}\`\n` +
                  `Use \`gunpause\` to resume.`,
                ),
            ],
          }),
        )
        .catch((err) =>
          ctx.reply({
            embeds: [client.embed().desc(`Failed to pause giveaway.\n\`${err}\``)],
          }),
        );
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
