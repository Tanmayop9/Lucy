import { Command } from "../../structures/abstract/command.js";
import { raw } from "../../../lib/utils/raw.js";

export default class Config extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["cnf"];
    this.description = "Displays server configuration";
  }

  execute = async (client, ctx) => {
    const twoFourSeven = await client.db.twoFourSeven.get(ctx.guild?.id);
    const premiumServer = await client.db.serverstaff.get(ctx.guild?.id);
    const prefix = await client.db.prefix.get(ctx.guild?.id);

    await ctx.reply({
      embeds: [
        client.embed().desc(raw({ prefix: prefix || client.config.prefix, twoFourSeven, premiumServer })),
      ],
    });
  };
}
