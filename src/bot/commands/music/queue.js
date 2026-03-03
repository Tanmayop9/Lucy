import _ from "lodash";
import { paginator } from "../../../lib/utils/paginator.js";
import { Command } from "../../structures/abstract/command.js";

export default class Queue extends Command {
  constructor() {
    super(...arguments);
    this.playing = true;
    this.inSameVC = true;
    this.aliases = ["q"];
    this.description = "Shows the player queue.";
    this.execute = async (client, ctx) => {
      const player = client.getPlayer(ctx);
      const current = player.queue.current;
      const upcoming = [...player.queue];

      if (!current)
        return ctx.reply({ embeds: [client.embed().desc("Nothing is currently playing.")] });

      const currentLine =
        `**Now Playing**\n` +
        `${current.title} — ${current.author} ` +
        `[${current.isStream ? "Live" : client.formatDuration(current.length ?? 0)}]\n`;

      if (!upcoming.length) {
        return ctx.reply({
          embeds: [
            client
              .embed()
              .title("Queue")
              .desc(`${currentLine}\nNo tracks queued.`)
              .footer({ text: `Volume: ${player.volume}%` }),
          ],
        });
      }

      const pages = _.chunk(upcoming, 10).map((chunk, i, arr) => {
        const offset = i * 10;
        const lines = chunk.map(
          (t, j) =>
            `\`${offset + j + 1}.\` ${t.title} — ${t.author} [${t.isStream ? "Live" : client.formatDuration(t.length ?? 0)}]`,
        );
        return client
          .embed()
          .title("Queue")
          .desc(`${currentLine}\n${lines.join("\n")}`)
          .footer({ text: `Page ${i + 1}/${arr.length} · ${upcoming.length} tracks · Volume: ${player.volume}%` });
      });

      await paginator(ctx, pages);
    };
  }
}
