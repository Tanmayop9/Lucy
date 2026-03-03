import { paginator } from "../../../lib/utils/paginator.js";
import { Command } from "../../structures/abstract/command.js";
import { raw } from "../../../lib/utils/raw.js";

export default class Queue extends Command {
  constructor() {
    super(...arguments);
    this.playing = true;
    this.inSameVC = true;
    this.aliases = ["q"];
    this.description = "Get player queue";
    this.execute = async (client, ctx) => {
      const player = client.getPlayer(ctx);
      await paginator(ctx, [client.embed().desc(raw(player, 1))]);
    };
  }
}
