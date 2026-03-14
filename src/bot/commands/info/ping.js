/**
 * @nerox v1.0.0
 * @author Tanmay
 * @copyright 2024 NeroX - Services
 */

import { Command } from "../../structures/abstract/command.js";

export default class Ping extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["latency", "pong"];
    this.description = "Displays latency stats";
  }

  execute = async (client, ctx) => {
    const msg = await ctx.reply({
      embeds: [client.embed().desc("Checking latency...")],
    });

    const start = performance.now();
    await client.db.config.set("ping_test", true);
    await client.db.config.get("ping_test");
    await client.db.config.delete("ping_test");
    const dbLatency = (performance.now() - start).toFixed(2);

    const wsLatency = client.ws.ping.toFixed(2);
    const msgLatency = msg.createdTimestamp - ctx.createdTimestamp;

    await msg.edit({
      content: null,
      embeds: [
        client
          .embed()
          .title("Latency")
          .desc(
            `**WebSocket:** ${wsLatency}ms\n` +
            `**Database:** ${dbLatency}ms\n` +
            `**Message:** ${msgLatency}ms`,
          ),
      ],
    });
  };
}
