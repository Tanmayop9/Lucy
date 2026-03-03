import { Command } from "../../structures/abstract/command.js";
import { parseDuration, formatDuration, relativeTimestamp } from "../../../lib/utils/giveawayUtil.js";

export default class GCreate extends Command {
  constructor() {
    super(...arguments);
    this.userPerms = ["ManageGuild"];
    this.aliases = ["gstart"];
    this.usage = "<#channel> <duration> <winners> <prize>";
    this.description = "Start a new giveaway";
    this.options = [
      { name: "channel", opType: "channel", required: true, description: "Channel to host the giveaway in" },
      { name: "duration", opType: "string", required: true, description: "Duration e.g. 10m 1h 2d" },
      { name: "winners", opType: "integer", required: true, description: "Number of winners (1–50)" },
      { name: "prize", opType: "string", required: true, description: "The prize" },
    ];

    this.execute = async (client, ctx, args) => {
      const channel =
        ctx.mentions?.channels?.first() ||
        client.channels.cache.get(args[0]?.replace(/[<#>]/g, ""));

      if (!channel?.isTextBased()) {
        return ctx.reply({
          embeds: [client.embed().desc("Provide a valid text channel.")],
        });
      }

      const durationStr = args[1];
      const winnerCount = parseInt(args[2]);
      const prize = args.slice(3).join(" ").trim();

      const duration = parseDuration(durationStr);
      if (!duration || duration < 5000) {
        return ctx.reply({
          embeds: [client.embed().desc("Invalid duration. Minimum is 5 seconds. Example: `10m`, `1h`, `2d`")],
        });
      }

      if (!Number.isInteger(winnerCount) || winnerCount < 1 || winnerCount > 50) {
        return ctx.reply({
          embeds: [client.embed().desc("Winner count must be between 1 and 50.")],
        });
      }

      if (!prize) {
        return ctx.reply({
          embeds: [client.embed().desc("Provide a prize name.")],
        });
      }

      const endAt = Date.now() + duration;

      await client.giveaways
        .start(channel, { duration, winnerCount, prize, hostedBy: ctx.author })
        .then(() =>
          ctx.reply({
            embeds: [
              client
                .embed()
                .title("Giveaway Created")
                .desc(
                  `**Prize:** ${prize}\n` +
                  `**Channel:** ${channel}\n` +
                  `**Winners:** ${winnerCount}\n` +
                  `**Duration:** ${formatDuration(duration)}\n` +
                  `**Ends:** ${relativeTimestamp(endAt)}\n` +
                  `**Hosted by:** ${ctx.author}`,
                ),
            ],
          }),
        )
        .catch((err) =>
          ctx.reply({
            embeds: [client.embed().desc(`Failed to start giveaway.\n\`${err}\``)],
          }),
        );
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
