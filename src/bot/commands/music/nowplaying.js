import { Command } from "../../structures/abstract/command.js";
import { raw } from "../../../lib/utils/raw.js";

export default class NowPlaying extends Command {
  constructor() {
    super(...arguments);
    this.playing = true;
    this.inSameVC = true;
    this.aliases = ["now", "np"];
    this.description = "Get current song info";
    this.execute = async (client, ctx) => {
      const player = client.getPlayer(ctx);
      const track = player.queue.current;
      await ctx.reply({
        embeds: [client.embed().desc(raw(track, 2))],
      });
    };
  }
}
