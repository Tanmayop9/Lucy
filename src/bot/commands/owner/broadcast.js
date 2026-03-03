/**
 * @nerox v1.0.0
 * @author Tanmay
 */
import { Command } from "../../structures/abstract/command.js";
import { raw } from "../../../lib/utils/raw.js";

export default class Broadcast extends Command {
  constructor() {
    super(...arguments);
    this.owner = true;
    this.aliases = ["announce"];
    this.usage = "<message>";
    this.description = "Broadcast a message to all servers";
    this.execute = async (client, ctx, args) => {
      if (!args.length) {
        await ctx.reply({
          embeds: [
            client
              .embed()
              .desc(
                `${client.emoji.cross} Please provide a message to broadcast.`,
              ),
          ],
        });
        return;
      }

      const message = args.join(" ");
      const guilds = client.guilds.cache;

      const confirmEmbed = client
        .embed()
        .desc(raw({ preview: message, targets: guilds.size }));

      await ctx.reply({ embeds: [confirmEmbed] });

      const filter = (m) =>
        m.author.id === ctx.author.id &&
        ["confirm", "cancel"].includes(m.content.toLowerCase());
      const collected = await ctx.channel.awaitMessages({
        filter,
        max: 1,
        time: 30000,
      });

      if (
        !collected.size ||
        collected.first().content.toLowerCase() === "cancel"
      ) {
        await ctx.reply({
          embeds: [
            client.embed().desc(`${client.emoji.cross} Broadcast cancelled.`),
          ],
        });
        return;
      }

      const broadcastEmbed = client
        .embed()
        .setAuthor({
          name: `${client.user.username} - Announcement`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setDescription(message)
        .footer({
          text: `Broadcast from ${client.user.username}`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();

      let success = 0;
      let failed = 0;

      const statusMsg = await ctx.reply({
        embeds: [
          client
            .embed()
            .desc(
              `${client.emoji.timer} Broadcasting to ${guilds.size} servers...`,
            ),
        ],
      });

      for (const [_guildId, guild] of guilds) {
        try {
          const channel = guild.channels.cache.find(
            (ch) =>
              ch.isTextBased() &&
              ch
                .permissionsFor(guild.members.me)
                .has(["SendMessages", "EmbedLinks"]),
          );

          if (channel) {
            await channel.send({ embeds: [broadcastEmbed] });
            success++;
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
          console.error(`Failed to broadcast to guild ${guild.name}:`, error);
        }
      }

      await statusMsg.edit({
        embeds: [
          client
            .embed()
            .desc(raw({ success, failed, total: guilds.size })),
        ],
      });
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
