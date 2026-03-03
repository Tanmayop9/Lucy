import { Command } from "../../structures/abstract/command.js";
import { raw } from "../../../lib/utils/raw.js";

export default class Config extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["cnf"];
    this.description = "Displays server configuration visually";
  }

  execute = async (client, ctx) => {
    const twoFourSeven = await client.db.twoFourSeven.get(ctx.guild?.id);
    const lodalele = await client.db.serverstaff.get(ctx.guild?.id);

    const textChannel = twoFourSeven?.textId
      ? client.channels.cache.get(twoFourSeven.textId)?.name || "Unknown"
      : "Disabled";

    const voiceChannel = twoFourSeven?.voiceId
      ? client.channels.cache.get(twoFourSeven.voiceId)?.name || "Unknown"
      : "Disabled";

    await ctx.reply({
      embeds: [
        client.embed().desc(
          raw({
            prefix: client.config.prefix,
            premiumServer: lodalele ? true : false,
            twoFourSeven: twoFourSeven ? true : false,
            textChannel,
            voiceChannel,
          }),
        ),
      ],
    });
  };
}
