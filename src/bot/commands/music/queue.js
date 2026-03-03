import _ from "lodash";
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
      const current = player.queue.current;
      const upcoming = [...player.queue];

      const chunkedUpcoming = _.chunk(upcoming, 10);
      const pages = (chunkedUpcoming.length > 0 ? chunkedUpcoming : [[]]).map(
        (upcomingChunk) =>
          client.embed().desc(
            raw({
              context: { textId: player.textId },
              voice: { guildId: player.guildId, voiceId: player.voiceId },
              loop: player.loop,
              volume: player.volume,
              current: current
                ? [current.title, current.author, current.length]
                : null,
              upcoming: upcomingChunk.map((t) => [t.title, t.author, t.length]),
            }),
          ),
      );

      await paginator(ctx, pages);
    };
  }
}
