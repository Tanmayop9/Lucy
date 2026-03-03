/**
 * @nerox v1.0.0
 * @author Tanmay
 * @copyright 2024 NeroX - Services
 */
import os from "os";
import { Command } from "../../structures/abstract/command.js";
import { paginator } from "../../../lib/utils/paginator.js";
import { raw } from "../../../lib/utils/raw.js";

export default class Stats extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["status"];
    this.description = "Displays bot statistics with navigation.";
    this.execute = async (client, ctx) => {
      const pages = await this.getStatsPages(client);
      await paginator(ctx, pages);
    };
  }

  async getStatsPages(client) {
    const shardInfo = await client.cluster.broadcastEval((c) => ({
      id: c.ws.shards.first()?.id ?? 0,
      ping: c.ws.ping,
      guilds: c.guilds.cache.size,
      status: c.ws.status,
    }));

    const nodes = [...client.manager.shoukaku.nodes.values()].map((n) => [
      n.state === 2 ? "ready" : "disconnected",
      n.name,
      n.stats?.ping ?? null,
    ]);

    return [
      client.embed().desc(raw(process.memoryUsage())),
      client.embed().desc(raw(shardInfo)),
      client.embed().desc(raw(os.cpus(), 1)),
      client.embed().desc(raw(nodes)),
    ];
  }
}
