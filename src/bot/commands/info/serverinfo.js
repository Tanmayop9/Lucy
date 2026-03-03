import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType,
} from "discord.js";
import { Command } from "../../structures/abstract/command.js";
import { filter } from "../../../lib/utils/filter.js";

const VERIFICATION = ["None", "Low", "Medium", "High", "Very High"];
const BOOST_TIER = ["None", "Tier 1", "Tier 2", "Tier 3"];

export default class ServerInfo extends Command {
  constructor() {
    super(...arguments);
    this.description = "Displays a detailed overview of the server.";
  }

  async execute(client, ctx) {
    const guild = ctx.guild;
    if (!guild)
      return ctx.reply({ content: "This command must be used in a server." });

    const channels = guild.channels.cache;
    const textCount = channels.filter((c) => c.type === ChannelType.GuildText).size;
    const voiceCount = channels.filter((c) => c.type === ChannelType.GuildVoice).size;
    const categoryCount = channels.filter((c) => c.type === ChannelType.GuildCategory).size;
    const threadCount = channels.filter((c) =>
      [ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.AnnouncementThread].includes(c.type),
    ).size;

    const members = await guild.members.fetch();
    const humans = members.filter((m) => !m.user.bot).size;
    const bots = members.filter((m) => m.user.bot).size;

    const baseEmbed = client
      .embed("#5865F2")
      .title(guild.name)
      .desc("Select a section from the menu below.")
      .footer({ text: `ID: ${guild.id}` });

    const menu = new StringSelectMenuBuilder()
      .setCustomId("serverinfo_menu")
      .setPlaceholder("Choose a section")
      .addOptions([
        { label: "Overview", value: "overview" },
        { label: "Channels", value: "channels" },
        { label: "Members", value: "members" },
        { label: "Roles", value: "roles" },
        { label: "Security & Boosts", value: "security" },
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
      let embed;

      if (val === "overview") {
        const createdAt = Math.floor(guild.createdTimestamp / 1000);
        embed = client
          .embed("#5865F2")
          .title(`${guild.name} — Overview`)
          .desc(
            `**Name:** ${guild.name}\n` +
            `**ID:** \`${guild.id}\`\n` +
            `**Owner:** <@${guild.ownerId}>\n` +
            `**Created:** <t:${createdAt}:R>\n` +
            `**Locale:** ${guild.preferredLocale}\n` +
            `**Description:** ${guild.description || "None"}`,
          )
          .thumb(guild.iconURL({ size: 256 }) ?? null)
          .footer({ text: `ID: ${guild.id}` });

      } else if (val === "channels") {
        embed = client
          .embed("#5865F2")
          .title(`${guild.name} — Channels`)
          .desc(
            `**Text:** ${textCount}\n` +
            `**Voice:** ${voiceCount}\n` +
            `**Categories:** ${categoryCount}\n` +
            `**Threads:** ${threadCount}\n` +
            `**Total:** ${channels.size}`,
          )
          .footer({ text: `ID: ${guild.id}` });

      } else if (val === "members") {
        embed = client
          .embed("#5865F2")
          .title(`${guild.name} — Members`)
          .desc(
            `**Total:** ${guild.memberCount}\n` +
            `**Humans:** ${humans}\n` +
            `**Bots:** ${bots}`,
          )
          .footer({ text: `ID: ${guild.id}` });

      } else if (val === "roles") {
        const roles = guild.roles.cache
          .filter((r) => r.id !== guild.id)
          .sort((a, b) => b.position - a.position);
        const roleList = roles.first(20).map((r) => r.toString()).join(" ");
        embed = client
          .embed("#5865F2")
          .title(`${guild.name} — Roles`)
          .desc(
            `**Total:** ${roles.size}\n\n` +
            (roleList || "No roles found"),
          )
          .footer({ text: `Showing up to 20 · ID: ${guild.id}` });

      } else if (val === "security") {
        const afkChannel = guild.afkChannelId ? `<#${guild.afkChannelId}>` : "None";
        embed = client
          .embed("#5865F2")
          .title(`${guild.name} — Security & Boosts`)
          .desc(
            `**Verification Level:** ${VERIFICATION[guild.verificationLevel] ?? guild.verificationLevel}\n` +
            `**Boost Tier:** ${BOOST_TIER[guild.premiumTier] ?? guild.premiumTier}\n` +
            `**Boosts:** ${guild.premiumSubscriptionCount ?? 0}\n` +
            `**AFK Timeout:** ${guild.afkTimeout ? `${guild.afkTimeout}s` : "Disabled"}\n` +
            `**AFK Channel:** ${afkChannel}`,
          )
          .footer({ text: `ID: ${guild.id}` });
      }

      if (embed) await msg.edit({ embeds: [embed] });
    });

    collector.on("end", () => msg.edit({ components: [] }).catch(() => null));
  }
}
