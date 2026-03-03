import os from "os";
import { ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";
import { Command } from "../../structures/abstract/command.js";
import { filter } from "../../../lib/utils/filter.js";

const toMb = (bytes) => (bytes / 1048576).toFixed(1);

const formatUptime = (seconds) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(" ");
};

export default class BotInfo extends Command {
  constructor() {
    super(...arguments);
    this.description = "Displays bot information.";
  }

  async execute(client, ctx) {
    const totalUsers = client.guilds.cache.reduce((n, g) => n + g.memberCount, 0);

    const overviewEmbed = () =>
      client
        .embed("#5865F2")
        .title(`${client.user.username} — Overview`)
        .desc(
          `**Name:** ${client.user.username}\n` +
          `**ID:** \`${client.user.id}\`\n` +
          `**Guilds:** ${client.guilds.cache.size}\n` +
          `**Users:** ${totalUsers.toLocaleString()}\n` +
          `**Commands:** ${client.commands.size}\n` +
          `**Uptime:** ${formatUptime(process.uptime())}`,
        )
        .thumb(client.user.displayAvatarURL({ size: 256 }));

    const menu = new StringSelectMenuBuilder()
      .setCustomId("botinfo")
      .setPlaceholder("Select a section")
      .setMaxValues(1)
      .addOptions([
        { label: "Overview", value: "overview", description: "General info" },
        { label: "System", value: "system", description: "Hardware & runtime" },
        { label: "Developer", value: "developer", description: "Build info" },
        { label: "Stats", value: "stats", description: "Connection stats" },
      ]);

    const msg = await ctx.reply({
      embeds: [overviewEmbed()],
      components: [new ActionRowBuilder().addComponents(menu)],
    });

    const collector = msg.createMessageComponentCollector({
      idle: 30000,
      filter: (i) => filter(i, ctx),
    });

    collector.on("collect", async (interaction) => {
      await interaction.deferUpdate();
      const choice = interaction.values[0];
      let embed;

      if (choice === "overview") {
        embed = overviewEmbed();
      } else if (choice === "system") {
        const mem = process.memoryUsage();
        const cpu = os.cpus()[0];
        embed = client
          .embed("#5865F2")
          .title(`${client.user.username} — System`)
          .desc(
            `**Node.js:** ${process.version}\n` +
            `**Platform:** ${process.platform}\n` +
            `**Memory Used:** ${toMb(mem.heapUsed)} MB\n` +
            `**Memory Total:** ${toMb(mem.heapTotal)} MB\n` +
            `**RSS:** ${toMb(mem.rss)} MB\n` +
            `**CPU:** ${cpu?.model ?? "Unknown"}\n` +
            `**Uptime:** ${formatUptime(process.uptime())}`,
          );
      } else if (choice === "developer") {
        embed = client
          .embed("#5865F2")
          .title(`${client.user.username} — Developer`)
          .desc(
            `**Team:** NeroX Studios\n` +
            `**Version:** 1.0.0\n` +
            `**Framework:** Discord.js v14\n` +
            `**Database:** Josh (JSON)`,
          );
      } else if (choice === "stats") {
        embed = client
          .embed("#5865F2")
          .title(`${client.user.username} — Stats`)
          .desc(
            `**WebSocket Ping:** ${client.ws.ping}ms\n` +
            `**Guilds:** ${client.guilds.cache.size}\n` +
            `**Users:** ${totalUsers.toLocaleString()}\n` +
            `**Shards:** ${client.ws.shards.size}`,
          );
      }

      if (embed) await msg.edit({ embeds: [embed] });
    });

    collector.on("end", async () => msg.edit({ components: [] }).catch(() => null));
  }
}
