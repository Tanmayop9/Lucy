import os from "os";
import _ from "lodash";
import { Command } from "../../structures/abstract/command.js";
import { paginator } from "../../../lib/utils/paginator.js";

const toMb = (bytes) => (bytes / 1048576).toFixed(1);

const STATUS_MAP = { 0: "Ready", 1: "Connecting", 2: "Reconnecting", 3: "Idle", 4: "Nearly", 5: "Disconnected" };

export default class Stats extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["status"];
    this.description = "Displays bot statistics.";
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

    const nodes = [...client.manager.shoukaku.nodes.values()].map((n) => ({
      name: n.name,
      state: n.state === 2 ? "Ready" : "Disconnected",
      ping: n.stats?.ping ?? null,
    }));

    const mem = process.memoryUsage();
    const cpu = os.cpus();
    const load = os.loadavg();

    const memPage = client
      .embed()
      .title("Memory")
      .desc(
        `**Heap Used:** ${toMb(mem.heapUsed)} MB\n` +
        `**Heap Total:** ${toMb(mem.heapTotal)} MB\n` +
        `**RSS:** ${toMb(mem.rss)} MB\n` +
        `**External:** ${toMb(mem.external)} MB`,
      );

    const shardLines = shardInfo.map(
      (s) => `**Shard ${s.id}** — Guilds: ${s.guilds} | Ping: ${s.ping}ms | Status: ${STATUS_MAP[s.status] ?? s.status}`,
    );
    const shardPage = client
      .embed()
      .title("Shards")
      .desc(shardLines.join("\n") || "No shard data.");

    const cpuPage = client
      .embed()
      .title("CPU")
      .desc(
        `**Model:** ${cpu[0]?.model ?? "Unknown"}\n` +
        `**Speed:** ${cpu[0]?.speed ?? 0} MHz\n` +
        `**Cores:** ${cpu.length}\n` +
        `**Load (1m / 5m / 15m):** ${load.map((v) => v.toFixed(2)).join(" / ")}`,
      );

    const nodeLines = nodes.length
      ? nodes.map((n) => `**${n.name}** — ${n.state}${n.ping !== null ? ` | Ping: ${n.ping}ms` : ""}`)
      : ["No Lavalink nodes configured."];
    const nodePage = client
      .embed()
      .title("Lavalink Nodes")
      .desc(nodeLines.join("\n"));

    return [memPage, shardPage, cpuPage, nodePage];
  }
}
