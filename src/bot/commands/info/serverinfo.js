import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType,
} from "discord.js";
import { Command } from "../../structures/abstract/command.js";
import { filter } from "../../../lib/utils/filter.js";
import { raw } from "../../../lib/utils/raw.js";

export default class ServerInfo extends Command {
  constructor() {
    super(...arguments);
    this.description = "Unveils an ultra-detailed snapshot of the server.";
  }

  async execute(client, ctx) {
    const guild = ctx.guild;
    if (!guild)
      return ctx.reply({
        content: "This command must be used in a server.",
        ephemeral: true,
      });

    const roles = guild.roles.cache
      .filter((r) => r.id !== guild.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => r.toString());

    const channels = guild.channels.cache;
    const stats = {
      text: channels.filter((c) => c.type === ChannelType.GuildText).size,
      voice: channels.filter((c) => c.type === ChannelType.GuildVoice).size,
      categories: channels.filter((c) => c.type === ChannelType.GuildCategory)
        .size,
      threads: channels.filter((c) =>
        [
          ChannelType.PublicThread,
          ChannelType.PrivateThread,
          ChannelType.AnnouncementThread,
        ].includes(c.type),
      ).size,
    };

    const members = await guild.members.fetch({ withPresences: true });
    const humans = members.filter((m) => !m.user.bot).size;
    const bots = members.filter((m) => m.user.bot).size;

    const baseEmbed = client
      .embed()
      .desc(`Select a category below to explore in detail.`)
      .footer({ text: `Server ID: ${guild.id}` });

    const menu = new StringSelectMenuBuilder()
      .setCustomId("serverinfo_menu")
      .setPlaceholder("Choose a section to view")
      .addOptions([
        { label: "Overview", value: "overview", emoji: client.emoji.info },
        { label: "Channels", value: "channels", emoji: client.emoji.info },
        { label: "Members", value: "members", emoji: client.emoji.info },
        { label: "Roles", value: "roles", emoji: client.emoji.info },
        {
          label: "Security & Boosts",
          value: "security",
          emoji: client.emoji.info,
        },
      ]);

    const msg = await ctx.reply({
      embeds: [baseEmbed],
      components: [new ActionRowBuilder().addComponents(menu)],
    });

    const collector = msg.createMessageComponentCollector({
      idle: 30000,
      filter: (i) => filter(i, ctx),
    });

    collector.on("collect", async (interaction) => {
      await interaction.deferUpdate();
      const val = interaction.values[0];

      if (val === "overview") {
        const embed = client.embed().desc(raw(guild, 1));
        await msg.edit({ embeds: [embed] });
      } else if (val === "channels") {
        const embed = client.embed().desc(raw(guild.channels.cache, 1));
        await msg.edit({ embeds: [embed] });
      } else if (val === "members") {
        const embed = client.embed().desc(raw(members, 1));
        await msg.edit({ embeds: [embed] });
      } else if (val === "roles") {
        const embed = client.embed().desc(raw(guild.roles.cache, 1));
        await msg.edit({ embeds: [embed] });
      } else if (val === "security") {
        const embed = client.embed().desc(
          raw({
            verificationLevel: guild.verificationLevel,
            premiumTier: guild.premiumTier,
            premiumSubscriptionCount: guild.premiumSubscriptionCount,
            afkTimeout: guild.afkTimeout,
            afkChannelId: guild.afkChannelId,
          }),
        );
        await msg.edit({ embeds: [embed] });
      }
    });

    collector.on("end", () => {
      msg.edit({ components: [] }).catch(() => null);
    });
  }
}
