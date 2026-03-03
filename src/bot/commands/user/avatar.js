import { Command } from "../../structures/abstract/command.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default class Avatar extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["av", "avatar", "img"];
    this.description = "Displays a user's avatar.";
    this.usage = "[user]";
  }

  execute = async (client, ctx) => {
    const target = ctx.mentions?.users?.first() || ctx.author;
    const member = ctx.guild?.members.cache.get(target.id);

    const userUrl = target.displayAvatarURL({ forceStatic: false, size: 4096 });
    const serverUrl = member?.avatar
      ? member.displayAvatarURL({ forceStatic: false, size: 4096 })
      : null;

    const buildEmbed = (url, type) =>
      client
        .embed()
        .title(`${target.username} — ${type} Avatar`)
        .desc(`[Open in browser](${url})`)
        .img(url);

    if (serverUrl && serverUrl !== userUrl) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("user_avatar")
          .setLabel("User Avatar")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("server_avatar")
          .setLabel("Server Avatar")
          .setStyle(ButtonStyle.Secondary),
      );

      const msg = await ctx.reply({
        embeds: [buildEmbed(userUrl, "User")],
        components: [row],
      });

      const collector = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === ctx.author.id,
        time: 15000,
      });

      collector.on("collect", async (interaction) => {
        const isUser = interaction.customId === "user_avatar";
        await interaction.update({
          embeds: [buildEmbed(isUser ? userUrl : serverUrl, isUser ? "User" : "Server")],
        });
      });

      collector.on("end", () => msg.edit({ components: [] }).catch(() => {}));
    } else {
      await ctx.reply({ embeds: [buildEmbed(userUrl, "User")] });
    }
  };
}
