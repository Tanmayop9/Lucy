import { ActionRowBuilder } from "discord.js";
const event = "guildCreate";
export default class GuildCreate {
  constructor() {
    this.name = event;
    this.execute = async (client, guild) => {
      if (!guild?.name) return;
      const owner = await guild.fetchOwner({ force: true }).catch(() => null);
      const logs = await guild.fetchAuditLogs({ type: 28 }).catch(() => null);
      const adder =
        logs?.entries
          .filter((entry) => entry.target?.id === client.user.id)
          .first()?.executor || null;
      const obj = {
        embeds: [
          client
            .embed()
            .desc(
              `${client.user.username} has been added to **${guild.name}**.\n\n` +
                `[Support Server](${client.config.links.support})`,
            ),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            client
              .button()
              .link("Support Server", `${client.config.links.support}`),
          ),
        ],
      };
      await owner?.send(obj).catch(() => null);
      if (adder?.id !== owner?.id) await adder?.send(obj).catch(() => null);
      if (client.webhooks?.serveradd) {
        await client.webhooks.serveradd.send({
          username: `GuildCreate-logs`,
          avatarURL: `${client.user?.displayAvatarURL()}`,
          embeds: [
            client
              .embed()
              .desc(
                `Joined **${guild.name}**\n\n` +
                  `Members: ${guild.memberCount}\n` +
                  `ID: ${guild.id}\n` +
                  `Owner: ${owner?.user.displayName}\n` +
                  `Adder: ${adder?.username}`,
              ),
          ],
        }).catch(() => null);
      }
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
