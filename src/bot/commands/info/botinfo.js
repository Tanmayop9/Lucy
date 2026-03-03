import { ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";
import os from "os";
import moment from "moment";
import { Command } from "../../structures/abstract/command.js";
import { filter } from "../../../lib/utils/filter.js";
import { raw } from "../../../lib/utils/raw.js";

export default class BotInfo extends Command {
  constructor() {
    super(...arguments);
    this.description = "Peek behind the scenes of the bot's core.";
  }

  async execute(client, ctx) {
    const totalUsers = client.guilds.cache.reduce(
      (acc, g) => acc + g.memberCount,
      0,
    );
    const uptime = moment.duration(client.uptime).humanize();
    const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
      2,
    );
    const cpuModel = os.cpus()[0].model;
    const nodeVersion = process.version;
    const platform = os.platform();
    const architecture = os.arch();
    const ping = client.ws.ping;
    const totalGuilds = client.guilds.cache.size;
    const totalChannels = client.channels.cache.size;
    const commandsCount = client.commands.size;
    const activePlayers = client.manager?.players?.size || 0;
    const shardCount = client.options.shardCount || 1;

    const embed = client
      .embed()
      .desc(
        raw({
          servers: totalGuilds,
          users: totalUsers,
          shards: shardCount,
          players: activePlayers,
          uptime,
          ping,
        }),
      );

    const menu = new StringSelectMenuBuilder()
      .setCustomId("botinfo")
      .setPlaceholder("Select section")
      .setMaxValues(1)
      .addOptions([
        {
          label: "Overview",
          value: "overview",
          description: "Main info",
        },
        {
          label: "System",
          value: "system",
          description: "Technical info",
        },
        {
          label: "Developer",
          value: "developer",
          description: "Creator info",
        },
        {
          label: "Stats",
          value: "stats",
          description: "Statistics",
        },
      ]);

    const msg = await ctx.reply({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(menu)],
    });

    const collector = msg.createMessageComponentCollector({
      idle: 30000,
      filter: (i) => filter(i, ctx),
    });

    collector.on("collect", async (interaction) => {
      await interaction.deferUpdate();
      const choice = interaction.values[0];

      let updatedEmbed;

      if (choice === "overview") {
        updatedEmbed = client
          .embed()
          .desc(
            raw({
              servers: totalGuilds,
              users: totalUsers,
              shards: shardCount,
              players: activePlayers,
              uptime,
              ping,
              prefix: client.prefix,
              channels: totalChannels,
            }),
          );
      } else if (choice === "system") {
        updatedEmbed = client
          .embed()
          .desc(
            raw({
              cpu: cpuModel.substring(0, 40),
              memory: `${memoryUsage} MB`,
              platform,
              architecture,
              nodeVersion,
            }),
          );
      } else if (choice === "developer") {
        updatedEmbed = client
          .embed()
          .desc(
            raw({
              team: "NeroX Studios",
              version: "1.0.0",
              framework: "Discord.js v14",
              database: "MongoDB",
            }),
          );
      } else if (choice === "stats") {
        updatedEmbed = client
          .embed()
          .desc(
            raw({
              commands: commandsCount,
              shard: `0/${shardCount}`,
              latency: `${ping}ms`,
              cache: client.users.cache.size,
              active: activePlayers,
            }),
          );
      }

      await msg.edit({ embeds: [updatedEmbed] });
    });

    collector.on("end", async () => {
      await msg.edit({ components: [] }).catch(() => null);
    });
  }
}
