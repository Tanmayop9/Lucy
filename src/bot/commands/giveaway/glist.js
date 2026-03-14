import { Command } from "../../structures/abstract/command.js";
import { getGuildGiveaways, giveawayStatus } from "../../../lib/utils/giveawayUtil.js";
import { paginator } from "../../../lib/utils/paginator.js";
import _ from "lodash";

export default class GList extends Command {
  constructor() {
    super(...arguments);
    this.userPerms = ["ManageGuild"];
    this.description = "List all giveaways in this server";

    this.execute = async (client, ctx) => {
      const all = getGuildGiveaways(client.giveaways, ctx.guild.id)
        .sort((a, b) => b.startAt - a.startAt);

      if (!all.length) {
        return ctx.reply({
          embeds: [client.embed().desc("No giveaways found in this server.")],
        });
      }

      // 5 giveaways per page
      const pages = _.chunk(all, 5).map((chunk, i, arr) =>
        client
          .embed()
          .title(`Giveaways — ${ctx.guild.name}`)
          .desc(
            chunk
              .map(
                (g) =>
                  `**${g.prize}**\n` +
                  `Channel: <#${g.channelId}>\n` +
                  `Winners: ${g.winnerCount}\n` +
                  `Status: ${giveawayStatus(g)}\n` +
                  `Message ID: \`${g.messageId}\``,
              )
              .join("\n\n"),
          )
          .footer({ text: `Page ${i + 1}/${arr.length} — ${all.length} total` }),
      );

      await paginator(ctx, pages);
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
