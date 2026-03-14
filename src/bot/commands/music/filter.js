import { ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";
import { filter } from "../../../lib/utils/filter.js";
import { Command } from "../../structures/abstract/command.js";

const FILTERS = {
  bassboost: {
    label: "Bass Boost",
    description: "Heavy bass enhancement",
    equalizer: [
      { band: 0, gain: 0.6 },
      { band: 1, gain: 0.5 },
      { band: 2, gain: 0.4 },
      { band: 3, gain: 0.3 },
      { band: 4, gain: 0.2 },
      { band: 5, gain: 0.1 },
      { band: 6, gain: 0.0 },
      { band: 7, gain: -0.1 },
      { band: 8, gain: -0.1 },
      { band: 9, gain: -0.1 },
      { band: 10, gain: -0.1 },
      { band: 11, gain: -0.1 },
      { band: 12, gain: -0.1 },
      { band: 13, gain: -0.1 },
      { band: 14, gain: -0.1 },
    ],
  },
  nightcore: {
    label: "Nightcore",
    description: "Faster tempo + higher pitch",
    timescale: { speed: 1.3, pitch: 1.3, rate: 1.0 },
  },
  vaporwave: {
    label: "Vaporwave",
    description: "Slower tempo + lower pitch",
    timescale: { speed: 0.8, pitch: 0.8, rate: 1.0 },
  },
  "8d": {
    label: "8D Audio",
    description: "Rotating stereo panning effect",
    rotation: { rotationHz: 0.2 },
  },
  karaoke: {
    label: "Karaoke",
    description: "Remove vocals from the track",
    karaoke: { level: 1.0, monoLevel: 1.0, filterBand: 220.0, filterWidth: 100.0 },
  },
  treble: {
    label: "Treble Boost",
    description: "Enhanced treble frequencies",
    equalizer: [
      { band: 0, gain: -0.1 },
      { band: 1, gain: -0.1 },
      { band: 2, gain: -0.05 },
      { band: 3, gain: 0.0 },
      { band: 4, gain: 0.05 },
      { band: 5, gain: 0.1 },
      { band: 6, gain: 0.2 },
      { band: 7, gain: 0.3 },
      { band: 8, gain: 0.4 },
      { band: 9, gain: 0.5 },
      { band: 10, gain: 0.5 },
      { band: 11, gain: 0.4 },
      { band: 12, gain: 0.3 },
      { band: 13, gain: 0.2 },
      { band: 14, gain: 0.1 },
    ],
  },
  soft: {
    label: "Soft",
    description: "Smooth and lowpass-filtered sound",
    lowPass: { smoothing: 20.0 },
  },
  pop: {
    label: "Pop",
    description: "Boosted mids for pop/vocals",
    equalizer: [
      { band: 0, gain: -0.05 },
      { band: 1, gain: 0.05 },
      { band: 2, gain: 0.1 },
      { band: 3, gain: 0.15 },
      { band: 4, gain: 0.13 },
      { band: 5, gain: 0.1 },
      { band: 6, gain: 0.08 },
      { band: 7, gain: 0.05 },
      { band: 8, gain: 0.03 },
      { band: 9, gain: 0.02 },
      { band: 10, gain: 0.0 },
      { band: 11, gain: -0.01 },
      { band: 12, gain: -0.02 },
      { band: 13, gain: -0.04 },
      { band: 14, gain: -0.05 },
    ],
  },
  tremolo: {
    label: "Tremolo",
    description: "Rapid volume oscillation",
    tremolo: { frequency: 4.0, depth: 0.75 },
  },
  vibrato: {
    label: "Vibrato",
    description: "Rapid pitch oscillation",
    vibrato: { frequency: 4.0, depth: 0.75 },
  },
  none: {
    label: "Remove All Filters",
    description: "Reset to default (no filters)",
  },
};

export default class Filter extends Command {
  constructor() {
    super(...arguments);
    this.playing = true;
    this.inSameVC = true;
    this.aliases = ["f", "eq", "effects"];
    this.description = "Apply audio filters (bassboost, nightcore, 8D, etc.)";
    this.execute = async (client, ctx) => {
      const options = Object.entries(FILTERS).map(([key, f]) => ({
        label: f.label,
        value: key,
        description: f.description,
        emoji: client.emoji.info,
      }));

      const menu = new StringSelectMenuBuilder()
        .setCustomId("filter_menu")
        .setPlaceholder("Choose an audio filter")
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(options);

      const reply = await ctx.reply({
        embeds: [
          client
            .embed()
            .title("Audio Filters")
            .desc(
              `${client.emoji.info} Select a filter to apply to the current player.\n\n` +
                Object.entries(FILTERS)
                  .map(([, f]) => `**${f.label}** — ${f.description}`)
                  .join("\n"),
            ),
        ],
        components: [new ActionRowBuilder().addComponents(menu)],
      });

      const collector = reply.createMessageComponentCollector({
        idle: 30_000,
        filter: async (interaction) => await filter(interaction, ctx),
      });

      collector.on("collect", async (interaction) => {
        collector.stop();
        await interaction.deferUpdate();

        const selected = interaction.values[0];
        const filterDef = FILTERS[selected];
        const player = client.getPlayer(ctx);

        if (!player) {
          await reply.edit({
            embeds: [
              client
                .embed()
                .desc(`${client.emoji.cross} Player no longer exists.`),
            ],
            components: [],
          });
          return;
        }

        try {
          if (selected === "none") {
            await player.shoukaku.clearFilters();
          } else {
            const filterPayload = {};
            if (filterDef.equalizer) filterPayload.equalizer = filterDef.equalizer;
            if (filterDef.timescale) filterPayload.timescale = filterDef.timescale;
            if (filterDef.rotation) filterPayload.rotation = filterDef.rotation;
            if (filterDef.karaoke) filterPayload.karaoke = filterDef.karaoke;
            if (filterDef.lowPass) filterPayload.lowPass = filterDef.lowPass;
            if (filterDef.tremolo) filterPayload.tremolo = filterDef.tremolo;
            if (filterDef.vibrato) filterPayload.vibrato = filterDef.vibrato;
            await player.shoukaku.setFilters(filterPayload);
          }

          await reply.edit({
            embeds: [
              client
                .embed()
                .desc(
                  `${client.emoji.check} Filter **${filterDef.label}** applied successfully.\n` +
                    `${client.emoji.info} ${filterDef.description}`,
                ),
            ],
            components: [],
          });
        } catch (err) {
          console.error("Failed to apply filter:", err);
          await reply.edit({
            embeds: [
              client
                .embed()
                .desc(
                  `${client.emoji.cross} Failed to apply filter. Please try again.`,
                ),
            ],
            components: [],
          });
        }
      });

      collector.on("end", async (collected) => {
        if (collected.size) return;
        await reply
          .edit({
            embeds: [
              client
                .embed()
                .desc(`${client.emoji.warn} Filter selection timed out.`),
            ],
            components: [],
          })
          .catch(() => {});
      });
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
