import { Command } from "../../structures/abstract/command.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default class ShowLiked extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["likedlist", "ll"];
    this.description = "Show your liked songs.";
  }

  execute = async (client, ctx) => {
    const likedSongs = (await client.db.likedSongs.get(ctx.author.id)) || [];

    if (!likedSongs.length) {
      return ctx.reply({
        embeds: [
          client
            .embed()
            .desc("You have no liked songs. Use `like` while a song is playing to add one."),
        ],
      });
    }

    const PER_PAGE = 10;
    const totalPages = Math.ceil(likedSongs.length / PER_PAGE);
    let currentPage = 0;

    const buildEmbed = (page) => {
      const start = page * PER_PAGE;
      const songs = likedSongs.slice(start, start + PER_PAGE);
      const lines = songs.map(
        (s, i) => `\`${start + i + 1}.\` **${s.title}** — ${s.author}`,
      );
      return client
        .embed()
        .title(`${ctx.author.username} — Liked Songs`)
        .desc(lines.join("\n"))
        .footer({ text: `Page ${page + 1}/${totalPages} · ${likedSongs.length} songs` });
    };

    const buildRow = (page) =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("first")
          .setLabel("First")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === totalPages - 1),
        new ButtonBuilder()
          .setCustomId("last")
          .setLabel("Last")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === totalPages - 1),
      );

    const message = await ctx.reply({
      embeds: [buildEmbed(currentPage)],
      components: totalPages > 1 ? [buildRow(currentPage)] : [],
    });

    if (totalPages <= 1) return;

    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === ctx.author.id,
      time: 120000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === "first") currentPage = 0;
      else if (interaction.customId === "prev") currentPage = Math.max(0, currentPage - 1);
      else if (interaction.customId === "next") currentPage = Math.min(totalPages - 1, currentPage + 1);
      else if (interaction.customId === "last") currentPage = totalPages - 1;

      await interaction.update({
        embeds: [buildEmbed(currentPage)],
        components: [buildRow(currentPage)],
      });
    });

    collector.on("end", async () => {
      await message.edit({ components: [] }).catch(() => {});
    });
  };
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
