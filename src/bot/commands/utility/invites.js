import { Command } from "../../structures/abstract/command.js";
import { getInviteStats } from "../../../lib/utils/inviteTracker.js";

export default class Invites extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["inv", "invitecount"];
    this.description = "Shows invite count for yourself or another member.";
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

    const stats = await getInviteStats(client, ctx.guild.id, target.id);

    await ctx.reply({
      embeds: [
        client
          .embed()
          .title(`${target.username} — Invites`)
          .desc(
            `**Total:** ${stats.total}\n` +
              `**Left:** ${stats.left}\n` +
              `**Real:** ${stats.real}`,
          )
          .thumb(target.displayAvatarURL({ size: 256 }))
          .footer({ text: `User ID: ${target.id}` }),
      ],
    });
  };
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
