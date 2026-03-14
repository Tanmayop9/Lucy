import { Command } from "../../structures/abstract/command.js";

const LOOP_MODES = {
  none: { label: "Off", next: "track" },
  track: { label: "Track", next: "queue" },
  queue: { label: "Queue", next: "none" },
};

export default class Loop extends Command {
  constructor() {
    super(...arguments);
    this.playing = true;
    this.inSameVC = true;
    this.aliases = ["repeat", "l"];
    this.description = "Loop the current track or entire queue";
    this.options = [
      {
        name: "mode",
        required: false,
        opType: "string",
        choices: [
          { name: "off", value: "none" },
          { name: "track", value: "track" },
          { name: "queue", value: "queue" },
        ],
        description: "Loop mode: off | track | queue (cycles if omitted)",
      },
    ];
    this.execute = async (client, ctx, args) => {
      const player = client.getPlayer(ctx);
      const current = player.loop ?? "none";

      let target;
      const arg = args[0]?.toLowerCase();
      if (arg === "off" || arg === "none") target = "none";
      else if (arg === "track") target = "track";
      else if (arg === "queue") target = "queue";
      else target = LOOP_MODES[current]?.next ?? "none";

      player.setLoop(target);

      const labels = { none: "disabled", track: "track", queue: "queue" };
      await ctx.reply({
        embeds: [
          client
            .embed()
            .desc(
              `${client.emoji.check} Loop mode set to **${labels[target]}**.`,
            ),
        ],
      });
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
