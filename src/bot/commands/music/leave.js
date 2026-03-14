import { Command } from "../../structures/abstract/command.js";
export default class Leave extends Command {
  constructor() {
    super(...arguments);
    this.player = true;
    this.inSameVC = true;
    this.aliases = ["dc", "disconnect"];
    this.description = "Disconnect client from VC";
    this.execute = async (client, ctx) => {
      const player = client.getPlayer(ctx);
      await player.destroy();
      await ctx.reply({
        embeds: [
          client
            .embed()
            .desc(
              `${client.emoji.check} Destroyed and disconnected the player.\n` +
                ((await client.db?.twoFourSeven.has(ctx.guild.id))
                  ? `${client.emoji.info} Disable 247 to prevent the bot from joining back.`
                  : ``),
            ),
        ],
      });
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
