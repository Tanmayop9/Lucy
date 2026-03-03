import { Command } from "../../structures/abstract/command.js";

export default class NowPlaying extends Command {
  constructor() {
    super(...arguments);
    this.playing = true;
    this.inSameVC = true;
    this.aliases = ["now", "np"];
    this.description = "Shows the currently playing track.";
    this.execute = async (client, ctx) => {
      const player = client.getPlayer(ctx);
      const track = player.queue.current;
      if (!track)
        return ctx.reply({ embeds: [client.embed().desc("Nothing is currently playing.")] });

      const duration = track.isStream ? "Live" : client.formatDuration(track.length ?? 0);
      const embed = client
        .embed()
        .title(track.title.length > 256 ? track.title.slice(0, 253) + "..." : track.title)
        .desc(
          `**Artist:** ${track.author}\n` +
          `**Duration:** ${duration}\n` +
          `**Requested by:** ${track.requester ?? "Unknown"}\n` +
          `**Source:** [Link](${track.uri})`,
        );

      if (track.thumbnail) embed.setThumbnail(track.thumbnail);
      await ctx.reply({ embeds: [embed] });
    };
  }
}
