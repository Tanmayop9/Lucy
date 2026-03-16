import { Command } from "../../structures/abstract/command.js";

export default class Config extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["cnf"];
    this.description = "Displays server configuration";
  }

  execute = async (client, ctx) => {
    const premiumServer = await client.db.serverstaff.get(ctx.guild?.id);
    const prefix = await client.db.prefix.get(ctx.guild?.id);
    const welcomeCfg = await client.db.welcomeConfig.get(ctx.guild?.id);

    const welcomeChannel = welcomeCfg?.welcome?.channelId
      ? `<#${welcomeCfg.welcome.channelId}>`
      : "Not set";
    const leaveChannel = welcomeCfg?.leave?.channelId
      ? `<#${welcomeCfg.leave.channelId}>`
      : "Not set";

    await ctx.reply({
      embeds: [
        client
          .embed()
          .title(`${ctx.guild.name} — Configuration`)
          .desc(
            `**Prefix:** \`${prefix || client.config.prefix}\`\n` +
              `**Premium:** ${premiumServer ? "Active" : "Inactive"}\n` +
              `**Welcome Channel:** ${welcomeChannel}\n` +
              `**Leave Channel:** ${leaveChannel}`,
          )
          .footer({ text: `Guild ID: ${ctx.guild.id}` }),
      ],
    });
  };
}
