import { ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";
import { filter } from "../../../lib/utils/filter.js";
import { Command } from "../../structures/abstract/command.js";
import { raw } from "../../../lib/utils/raw.js";

export default class Help extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["h"];
    this.description = "Displays the command list.";
  }

  async execute(client, ctx) {
    const allCommands = client.commands.reduce((acc, cmd) => {
      if (["owner", "mod", "debug"].includes(cmd.category)) return acc;
      acc[cmd.category] ||= [];
      acc[cmd.category].push({
        name: cmd.name,
        description:
          cmd.description?.length > 30
            ? cmd.description.substring(0, 27) + "..."
            : cmd.description || "No description",
      });
      return acc;
    }, {});

    // Sort commands alphabetically within each category
    Object.keys(allCommands).forEach((category) => {
      allCommands[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    const categories = client.categories
      .sort((b, a) => b.length - a.length)
      .filter((category) => !["owner", "mod", "debug"].includes(category));

    const totalCommands = client.commands.filter(
      (cmd) => !["owner", "mod", "debug"].includes(cmd.category),
    ).size;

    const embed = client
      .embed()
      .desc(raw({ prefix: client.prefix, commands: totalCommands }));

    const menu = new StringSelectMenuBuilder()
      .setCustomId("menu")
      .setPlaceholder("Select a category")
      .setMaxValues(1)
      .addOptions([
        {
          label: "Home",
          value: "home",
          description: "Main menu",
        },
        ...categories.map((category) => ({
          label: category.charAt(0).toUpperCase() + category.slice(1),
          value: category,
          description: `${allCommands[category]?.length || 0} commands`,
        })),
        {
          label: "All Commands",
          value: "all",
          description: "View all commands",
        },
      ]);

    const reply = await ctx.reply({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(menu)],
    });

    const collector = reply.createMessageComponentCollector({
      idle: 60000,
      filter: (i) => filter(i, ctx),
    });

    collector.on("collect", async (interaction) => {
      await interaction.deferUpdate();
      const selected = interaction.values[0];

      switch (selected) {
        case "home":
          await reply.edit({ embeds: [embed] });
          break;

        case "all": {
          const allEmbed = client
            .embed()
            .desc(
              raw(
                Object.fromEntries(
                  Object.entries(allCommands).map(([cat, cmds]) => [
                    cat,
                    cmds.map((c) => c.name),
                  ]),
                ),
              ),
            );
          await reply.edit({ embeds: [allEmbed] });
          break;
        }

        default: {
          const selectedCommands = allCommands[selected] || [];
          const categoryEmbed = client
            .embed()
            .desc(
              selectedCommands.length
                ? raw(selectedCommands.map((c) => [c.name, c.description]))
                : "No commands",
            );

          await reply.edit({ embeds: [categoryEmbed] });
          break;
        }
      }
    });

    collector.on("end", async () => {
      menu.setDisabled(true);
      await reply
        .edit({
          components: [new ActionRowBuilder().addComponents(menu)],
        })
        .catch(() => null);
    });
  }
}

