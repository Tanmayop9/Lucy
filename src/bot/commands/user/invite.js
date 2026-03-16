import { ActionRowBuilder } from "discord.js";
import { Command } from "../../structures/abstract/command.js";

export default class BotInvite extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["addbot", "botinvite"];
    this.description = "Get the bot invite link.";
    this.execute = async (client, ctx) => {
      await ctx.reply({
        embeds: [
          client
            .embed()
            .setAuthor({
              name: `Invite ${client.user.username}`,
              iconURL: client.user.displayAvatarURL(),
            })
            .setThumbnail(client.user.displayAvatarURL())
            .desc(
              `Add **${client.user.username}** to your server.\n\n` +
                `**Basic** — Required permissions\n` +
                `**Admin** — All features`,
            ),
        ],
        components: [
          new ActionRowBuilder().addComponents([
            client.button().link("Basic", client.botInvite.required()),
            client.button().link("Admin", client.botInvite.admin()),
          ]),
        ],
      });
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
