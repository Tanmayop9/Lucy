/**
 * @nerox v1.0.0
 * @author Tanmay
 * @copyright 2024 NeroX - Services
 */

import { Command } from "../../structures/abstract/command.js";
import { raw } from "../../../lib/utils/raw.js";

export default class Ping extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["latency", "pong"];
    this.description = "Displays latency stats";
  }

  execute = async (client, ctx) => {
    const msg = await ctx.reply({
      embeds: [client.embed().desc(`Checking latency...`)],
    });

    const start = performance.now();
    await client.db.blacklist.set("test", true);
    await client.db.blacklist.get("test");
    await client.db.blacklist.delete("test");
    const dbLatency = (performance.now() - start).toFixed(2);

    const wsLatency = client.ws.ping.toFixed(2);
    const msgLatency = msg.createdTimestamp - ctx.createdTimestamp;

    const embed = client
      .embed()
      .desc(
        raw({
          ws: `${wsLatency}ms`,
          db: `${dbLatency}ms`,
          msg: `${msgLatency}ms`,
        }),
      );

    await msg.edit({ content: null, embeds: [embed] });
  };
}
