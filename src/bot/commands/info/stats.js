/**
 * @nerox v1.0.0
 * @author Tanmay
 * @copyright 2024 NeroX - Services
 */
import { Command } from "../../structures/abstract/command.js";
import { paginator } from "../../../lib/utils/paginator.js";
import { raw } from "../../../lib/utils/raw.js";

export default class Stats extends Command {
  constructor() {
    super(...arguments);
    this.aliases = ["status"];
    this.description = "Displays bot statistics with navigation.";
    this.execute = async (client, ctx) => {
      const pages = await this.getStatsPages(client, ctx);
      await paginator(ctx, pages);
    };
  }

  async getStatsPages(client, ctx) {
    const totalUsers = client.guilds.cache.reduce(
      (total, guild) => total + guild.memberCount,
      0,
    );
    const cpuUsage = (await import("os-utils")).default.cpuUsage;
    const _cpuUsage = await new Promise((resolve) => cpuUsage(resolve));
    const activePlayers = client.manager?.players?.size || 0;
    const shardCount = client.options.shardCount || 1;

    const generalStatsEmbed = client
      .embed()
      .desc(
        raw({
          servers: client.guilds.cache.size,
          users: totalUsers,
          uptime: client.formatDuration(client.uptime),
          latency: `${client.ws.ping}ms`,
          heapUsed: client.formatBytes(process.memoryUsage().heapUsed),
          heapTotal: client.formatBytes(process.memoryUsage().heapTotal),
          activePlayers,
        }),
      );

    const shardInfo = await client.cluster.broadcastEval((c) => ({
      id: c.ws.shards.first()?.id ?? 0,
      ping: c.ws.ping,
      guilds: c.guilds.cache.size,
      status: c.ws.status,
    }));

    const shardInfoEmbed = client
      .embed()
      .desc(
        raw(
          shardInfo.map((s) => [
            s.status === 0 ? "ready" : "connecting",
            `shard-${s.id}`,
            s.ping,
          ]),
        ),
      );

    const systemInfoEmbed = client
      .embed()
      .desc(
        raw({
          cpuUsage: `${(_cpuUsage * 100).toFixed(2)}%`,
          rss: client.formatBytes(process.memoryUsage().rss),
          platform: `${process.platform} (${process.arch})`,
          node: process.version,
          discordjs: "v14.15.2",
          commands: client.commands.size,
          eventListeners: client.eventNames().length,
          pid: process.pid,
        }),
      );

    return [generalStatsEmbed, shardInfoEmbed, systemInfoEmbed];
  }
}
