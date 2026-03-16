import { Command } from "../../structures/abstract/command.js";

export default class SetLeave extends Command {
  constructor() {
    super(...arguments);
    this.userPerms = ["ManageGuild"];
    this.aliases = ["leaveset"];
    this.description =
      "Configure the message sent when a member leaves the server.";
    this.usage = "<#channel> [message]";
    this.options = [
      {
        name: "channel",
        opType: "channel",
        required: true,
        description: "Channel to send leave messages in",
      },
      {
        name: "message",
        opType: "string",
        required: false,
        description:
          "Custom message — use {user}, {server}, {count} as placeholders",
      },
    ];
  }

  execute = async (client, ctx, args) => {
    // Sub-command: disable
    if (args[0]?.toLowerCase() === "disable") {
      const existing = await client.db.welcomeConfig.get(ctx.guild.id);
      if (!existing?.leave) {
        return ctx.reply({
          embeds: [client.embed().desc("Leave messages are not enabled.")],
        });
      }
      const updated = { ...existing };
      delete updated.leave;
      await client.db.welcomeConfig.set(ctx.guild.id, updated);
      return ctx.reply({
        embeds: [client.embed().desc("Leave messages have been disabled.")],
      });
    }

    const channel =
      ctx.mentions?.channels?.first() ||
      client.channels.cache.get(args[0]?.replace(/[<#>]/g, ""));

    if (!channel?.isTextBased()) {
      return ctx.reply({
        embeds: [
          client
            .embed()
            .desc(
              "Provide a valid text channel.\n\nUsage: `setleave <#channel> [message]`\n" +
                "To disable: `setleave disable`",
            ),
        ],
      });
    }

    const customMsg = args.slice(1).join(" ").trim() || null;

    const existing = (await client.db.welcomeConfig.get(ctx.guild.id)) || {};
    existing.leave = {
      channelId: channel.id,
      message: customMsg,
    };
    await client.db.welcomeConfig.set(ctx.guild.id, existing);

    const preview = customMsg
      ? customMsg
          .replace("{user}", ctx.author.username)
          .replace("{server}", ctx.guild.name)
          .replace("{count}", ctx.guild.memberCount)
      : `**${ctx.author.username}** has left **${ctx.guild.name}**.`;

    await ctx.reply({
      embeds: [
        client
          .embed()
          .title("Leave Messages Configured")
          .desc(
            `**Channel:** ${channel}\n` +
              `**Message Preview:**\n${preview}`,
          )
          .footer({
            text: "Placeholders: {user} {server} {count}",
          }),
      ],
    });
  };
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
