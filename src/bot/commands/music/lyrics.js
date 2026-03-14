import { Command } from "../../structures/abstract/command.js";
import { paginator } from "../../../lib/utils/paginator.js";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read NodeLink connection details from lava.json
let nodelinkConfig;
try {
  nodelinkConfig = JSON.parse(
    readFileSync(resolve(__dirname, "../../../../lava.json"), "utf-8"),
  );
} catch (e) {
  process.stderr.write(`[NodeLink] Warning: Failed to read lava.json for lyrics, using defaults: ${e.message}\n`);
  nodelinkConfig = { nodes: [{ host: "localhost", port: 2333, password: "youshallnotpass", secure: false }] };
}

const node = nodelinkConfig.nodes[0];
const NODELINK_BASE = `http${node.secure ? "s" : ""}://${node.host}:${node.port}`;
const NODELINK_PASS = node.password;

export default class Lyrics extends Command {
  constructor() {
    super(...arguments);
    this.playing = true;
    this.aliases = ["ly"];
    this.description = "Fetch lyrics for the currently playing track via NodeLink";
    this.execute = async (client, ctx) => {
      const player = client.getPlayer(ctx);
      const track = player?.queue?.current;
      const encodedTrack = player?.shoukaku?.track;

      if (!track || !encodedTrack) {
        await ctx.reply({
          embeds: [
            client
              .embed()
              .desc(`${client.emoji.cross} No track is currently playing.`),
          ],
        });
        return;
      }

      const waitEmbed = await ctx.reply({
        embeds: [
          client
            .embed()
            .desc(
              `${client.emoji.timer} Fetching lyrics for **${track.title}**...`,
            ),
        ],
      });

      try {
        const url = new URL(`${NODELINK_BASE}/v4/loadLyrics`);
        url.searchParams.set("encodedTrack", encodedTrack);

        const res = await fetch(url.toString(), {
          headers: { Authorization: NODELINK_PASS },
          signal: AbortSignal.timeout(10_000),
        });

        if (!res.ok) {
          await waitEmbed.edit({
            embeds: [
              client
                .embed()
                .desc(`${client.emoji.cross} NodeLink returned an error fetching lyrics (HTTP ${res.status}).`),
            ],
          });
          return;
        }

        const data = await res.json();

        if (data.loadType === "error") {
          await waitEmbed.edit({
            embeds: [
              client
                .embed()
                .desc(
                  `${client.emoji.cross} ${data.data?.message || "Lyrics unavailable for this track."}`,
                ),
            ],
          });
          return;
        }

        if (data.loadType === "empty" || !data.data?.lyrics?.lines?.length) {
          await waitEmbed.edit({
            embeds: [
              client
                .embed()
                .desc(
                  `${client.emoji.cross} No lyrics found for **${track.title}**.`,
                ),
            ],
          });
          return;
        }

        const lines = data.data.lyrics.lines
          .map((l) => l.text)
          .filter(Boolean);

        // Split into pages of 20 lines each
        const chunkSize = 20;
        const chunks = [];
        for (let i = 0; i < lines.length; i += chunkSize) {
          chunks.push(lines.slice(i, i + chunkSize));
        }

        const pages = chunks.map((chunk, i, arr) =>
          client
            .embed()
            .title(`${track.title}`)
            .desc(chunk.join("\n"))
            .footer({ text: `Page ${i + 1}/${arr.length} · Lyrics via NodeLink` }),
        );

        await waitEmbed.delete().catch(() => {});
        await paginator(ctx, pages);
      } catch (err) {
        console.error("Lyrics fetch error:", err);
        await waitEmbed.edit({
          embeds: [
            client
              .embed()
              .desc(
                `${client.emoji.cross} Failed to fetch lyrics. NodeLink may not be reachable.`,
              ),
          ],
        }).catch(() => {});
      }
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
