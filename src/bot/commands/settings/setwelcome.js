import { Command } from "../../structures/abstract/command.js";

export default class SetWelcome extends Command {
  constructor() {
    super(...arguments);
    this.userPerms = ["ManageGuild"];
    this.aliases = ["welcomeset", "wlc"];
    this.description =
      "Configure the welcome message sent when a member joins.";
    this.usage = "<#channel> [message]";
    this.options = [
      {
        name: "channel",
        opType: "channel",
        required: true,
        description: "Channel to send welcome messages in",
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
      if (!existing?.welcome) {
        return ctx.reply({
          embeds: [client.embed().desc("Welcome messages are not enabled.")],
        });
      }
      const updated = { ...existing };
      delete updated.welcome;
      await client.db.welcomeConfig.set(ctx.guild.id, updated);
      return ctx.reply({
        embeds: [client.embed().desc("Welcome messages have been disabled.")],
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
              "Provide a valid text channel.\n\nUsage: `setwelcome <#channel> [message]`\n" +
                "To disable: `setwelcome disable`",
            ),
        ],
      });
    }

    const customMsg = args.slice(1).join(" ").trim() || null;

    const existing = (await client.db.welcomeConfig.get(ctx.guild.id)) || {};
    existing.welcome = {
      channelId: channel.id,
      message: customMsg,
    };
    await client.db.welcomeConfig.set(ctx.guild.id, existing);

    const preview = customMsg
      ? customMsg
          .replace("{user}", ctx.author.toString())
          .replace("{server}", ctx.guild.name)
          .replace("{count}", ctx.guild.memberCount)
      : `Welcome to **${ctx.guild.name}**, ${ctx.author}! You are member **#${ctx.guild.memberCount}**.`;

    await ctx.reply({
      embeds: [
        client
          .embed()
          .title("Welcome Messages Configured")
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
