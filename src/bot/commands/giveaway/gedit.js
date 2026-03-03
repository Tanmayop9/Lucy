import { Command } from "../../structures/abstract/command.js";
import { resolveMessageId, findGiveaway, parseDuration, formatDuration } from "../../../lib/utils/giveawayUtil.js";

export default class GEdit extends Command {
  constructor() {
    super(...arguments);
    this.userPerms = ["ManageGuild"];
    this.usage = "[messageId] <addTime|winnerCount|prize> <value>";
    this.description = "Edit a running giveaway";
    this.options = [
      { name: "messageid", opType: "string", required: false, description: "Message ID (defaults to latest)" },
      {
        name: "field",
        opType: "string",
        required: true,
        description: "What to edit: addTime / winnerCount / prize",
        choices: [
          { name: "addTime", value: "addtime" },
          { name: "winnerCount", value: "winnercount" },
          { name: "prize", value: "prize" },
        ],
      },
      { name: "value", opType: "string", required: true, description: "New value" },
    ];

    this.execute = async (client, ctx, args) => {
      // Detect whether first arg is a message ID or a field name
      const isSnowflake = (s) => /^\d{17,19}$/.test(s);
      const rawId = isSnowflake(args[0]) ? args[0] : undefined;
      const fieldRaw = rawId ? args[1] : args[0];
      const valueRaw = rawId ? args.slice(2).join(" ") : args.slice(1).join(" ");

      const field = fieldRaw?.toLowerCase();
      const VALID = ["addtime", "winnercount", "prize"];

      if (!VALID.includes(field)) {
        return ctx.reply({
          embeds: [
            client
              .embed()
              .desc(`Valid fields: \`addTime\`, \`winnerCount\`, \`prize\`\n\nUsage: \`gedit [messageId] <field> <value>\``),
          ],
        });
      }

      if (!valueRaw) {
        return ctx.reply({
          embeds: [client.embed().desc("Provide a value for the field.")],
        });
      }

      const messageId = resolveMessageId(client.giveaways, ctx.guild.id, rawId);
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

      const editOptions = {};
      let confirmLine = "";

      if (field === "addtime") {
        const ms = parseDuration(valueRaw);
        if (!ms) {
          return ctx.reply({
            embeds: [client.embed().desc("Invalid duration. Example: `10m`, `1h`, `2d`")],
          });
        }
        editOptions.addTime = ms;
        confirmLine = `**Added time:** ${formatDuration(ms)}`;
      } else if (field === "winnercount") {
        const count = parseInt(valueRaw);
        if (!Number.isInteger(count) || count < 1 || count > 50) {
          return ctx.reply({
            embeds: [client.embed().desc("Winner count must be between 1 and 50.")],
          });
        }
        editOptions.newWinnerCount = count;
        confirmLine = `**New winner count:** ${count}`;
      } else if (field === "prize") {
        if (valueRaw.length > 256) {
          return ctx.reply({
            embeds: [client.embed().desc("Prize name cannot exceed 256 characters.")],
          });
        }
        editOptions.newPrize = valueRaw;
        confirmLine = `**New prize:** ${valueRaw}`;
      }

      await client.giveaways
        .edit(messageId, editOptions)
        .then(() =>
          ctx.reply({
            embeds: [
              client
                .embed()
                .title("Giveaway Updated")
                .desc(
                  `**Prize:** ${editOptions.newPrize ?? giveaway?.prize ?? "Unknown"}\n` +
                  `${confirmLine}\n` +
                  `**Message ID:** \`${messageId}\``,
                ),
            ],
          }),
        )
        .catch((err) =>
          ctx.reply({
            embeds: [client.embed().desc(`Failed to edit giveaway.\n\`${err}\``)],
          }),
        );
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
