import { Command } from "../../structures/abstract/command.js";
import { getMessageCount } from "../../../lib/utils/messageCount.js";

export default class Messages extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["msgcount", "msgs"];
    this.description = "Shows the message count for yourself or another member.";
    this.usage = "[@user]";
    this.options = [
      {
        name: "user",
        opType: "user",
        description: "The member to check (defaults to yourself)",
        required: false,
      },
    ];
  }

  execute = async (client, ctx, args) => {
    const target =
      ctx.mentions?.users?.first() ||
      (args[0]
        ? await client.users.fetch(args[0]).catch(() => null)
        : ctx.author);

    if (!target) {
      return ctx.reply({
        embeds: [client.embed().desc("Could not find that user.")],
      });
    }

    const stats = await getMessageCount(client, ctx.guild.id, target.id);

    await ctx.reply({
      embeds: [
        client
          .embed()
          .title(`${target.username} — Messages`)
          .desc(
            `**All-Time:** ${stats.allTime.toLocaleString()}\n` +
              `**Today:** ${stats.today.toLocaleString()}`,
          )
          .thumb(target.displayAvatarURL({ size: 256 }))
          .footer({ text: `User ID: ${target.id}` }),
      ],
    });
  };
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
