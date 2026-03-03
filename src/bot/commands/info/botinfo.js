import os from "os";
import { ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";
import { Command } from "../../structures/abstract/command.js";
import { filter } from "../../../lib/utils/filter.js";
import { raw } from "../../../lib/utils/raw.js";

export default class BotInfo extends Command {
  constructor() {
    super(...arguments);
    this.description = "Peek behind the scenes of the bot's core.";
  }

  async execute(client, ctx) {
    const embed = client.embed().desc(raw(client.guilds.cache, 1));

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
        updatedEmbed = client.embed().desc(raw(client.guilds.cache, 1));
      } else if (choice === "system") {
        updatedEmbed = client.embed().desc(
          raw({ memory: process.memoryUsage(), cpu: os.cpus()[0], uptime: process.uptime() }),
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
        updatedEmbed = client.embed().desc(raw(client.ws, 1));
      }

      await msg.edit({ embeds: [updatedEmbed] });
    });

    collector.on("end", async () => {
      await msg.edit({ components: [] }).catch(() => null);
    });
  }
}
