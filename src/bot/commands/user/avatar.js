/** @format
 * Neptune by Tanmay
 * Version: 2.0.1 (Beta)
 * © 2024 Neptune Headquarters
 */

import { Command } from "../../structures/abstract/command.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { raw } from "../../../lib/utils/raw.js";

export default class Avatar extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["av", "avatar", "img"];
    this.description = "Displays the user/server avatar with buttons";
    this.usage = "[user]";
  }

  execute = async (client, ctx) => {
    const target = ctx.mentions.users.first() || ctx.author;
    const member = ctx.guild?.members.cache.get(target.id);

    const userAvatar = target.displayAvatarURL({ forceStatic: false, size: 4096 });
    const serverAvatar = member?.avatar
      ? member.displayAvatarURL({ forceStatic: false, size: 4096 })
      : null;

    const embed = client
      .embed()
      .desc(raw({ user: userAvatar, server: serverAvatar || null }));

    if (serverAvatar && userAvatar !== serverAvatar) {
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

      const msg = await ctx.reply({ embeds: [embed], components: [row] });

      const collector = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === ctx.author.id,
        time: 15000,
      });

      collector.on("collect", async (interaction) => {
        const type = interaction.customId;
        if (type === "user_avatar") {
          await interaction.update({
            embeds: [
              client
                .embed()
                .desc(raw({ user: userAvatar, server: serverAvatar || null })),
            ],
          });
        } else if (type === "server_avatar") {
          await interaction.update({
            embeds: [
              client
                .embed()
                .desc(raw({ user: userAvatar, server: serverAvatar })),
            ],
          });
        }
      });

      collector.on("end", () => {
        msg.edit({ components: [] }).catch(() => {});
      });
    } else {
      await ctx.reply({ embeds: [embed] });
    }
  };
}
