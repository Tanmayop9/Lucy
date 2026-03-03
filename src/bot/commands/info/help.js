import { ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";
import { filter } from "../../../lib/utils/filter.js";
import { Command } from "../../structures/abstract/command.js";

export default class Help extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["h"];
    this.description = "Displays the command list.";
  }

  async execute(client, ctx) {
    const HIDDEN = ["owner", "mod", "debug"];

    const allCommands = client.commands.reduce((acc, cmd) => {
      if (HIDDEN.includes(cmd.category)) return acc;
      acc[cmd.category] ||= [];
      acc[cmd.category].push(cmd);
      return acc;
    }, {});

    Object.keys(allCommands).forEach((cat) =>
      allCommands[cat].sort((a, b) => a.name.localeCompare(b.name)),
    );

    const categories = client.categories
      .sort((a, b) => a.length - b.length)
      .filter((c) => !HIDDEN.includes(c));

    const totalCommands = client.commands.filter((c) => !HIDDEN.includes(c.category)).size;
    const prefix = (await client.db.prefix.get(ctx.guild.id)) || client.prefix;

    const homeEmbed = () =>
      client
        .embed()
        .title(`${client.user.username} — Commands`)
        .desc(
          `**Prefix:** \`${prefix}\`\n` +
          `**Commands:** ${totalCommands}\n\n` +
          `Select a category from the menu below.`,
        );

    const menu = new StringSelectMenuBuilder()
      .setCustomId("menu")
      .setPlaceholder("Select a category")
      .setMaxValues(1)
      .addOptions([
        { label: "Home", value: "home", description: "Main menu" },
        ...categories.map((cat) => ({
          label: cat.charAt(0).toUpperCase() + cat.slice(1),
          value: cat,
          description: `${allCommands[cat]?.length ?? 0} commands`,
        })),
        { label: "All Commands", value: "all", description: "View every command" },
      ]);

    const reply = await ctx.reply({
      embeds: [homeEmbed()],
      components: [new ActionRowBuilder().addComponents(menu)],
    });

    const collector = reply.createMessageComponentCollector({
      idle: 60000,
      filter: (i) => filter(i, ctx),
    });

    collector.on("collect", async (interaction) => {
      await interaction.deferUpdate();
      const selected = interaction.values[0];
      let embed;

      if (selected === "home") {
        embed = homeEmbed();
      } else if (selected === "all") {
        const lines = Object.entries(allCommands).map(
          ([cat, cmds]) =>
            `**${cat.charAt(0).toUpperCase() + cat.slice(1)}**\n${cmds.map((c) => `\`${c.name}\``).join("  ")}`,
        );
        embed = client
          .embed()
          .title(`${client.user.username} — All Commands`)
          .desc(lines.join("\n\n"));
      } else {
        const cmds = allCommands[selected] ?? [];
        const lines = cmds.map((c) => `\`${c.name}\` — ${c.description || "No description"}`);
        embed = client
          .embed()
          .title(`${selected.charAt(0).toUpperCase() + selected.slice(1)} Commands`)
          .desc(lines.join("\n") || "No commands in this category.")
          .footer({ text: `${cmds.length} command${cmds.length !== 1 ? "s" : ""}` });
      }

      await reply.edit({ embeds: [embed] });
    });

    collector.on("end", async () => {
      menu.setDisabled(true);
      await reply
        .edit({ components: [new ActionRowBuilder().addComponents(menu)] })
        .catch(() => null);
    });
  }
}

