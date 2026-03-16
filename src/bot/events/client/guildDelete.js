import { ActionRowBuilder } from "discord.js";
const event = "guildDelete";
export default class GuildDelete {
  constructor() {
    this.name = event;
    this.execute = async (client, guild) => {
      if (!guild?.name) return;
      const owner = await client.users
        .fetch(guild.ownerId, { force: true })
        .catch(() => null);
      await owner
        ?.send({
          embeds: [
            client
              .embed()
              .desc(
                `${client.user.username} has been removed from **${guild.name}**.\n\n` +
                  `[Support Server](${client.config.links.support})`,
              ),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              client
                .button()
                .link("Support Server", `${client.config.links.support}`),
              client
                .button()
                .link("Add me back", `${client.botInvite.required()}`),
            ),
          ],
        })
        .catch(() => null);
      if (client.webhooks?.serverchuda) {
        await client.webhooks.serverchuda.send({
          username: `GuildLeave-logs`,
          avatarURL: `${client.user?.displayAvatarURL()}`,
          embeds: [
            client
              .embed()
              .desc(
                `Left **${guild.name}**\n\n` +
                  `Members: ${guild.memberCount}\n` +
                  `ID: ${guild.id}\n` +
                  `Owner: ${owner?.displayName}`,
              ),
          ],
        }).catch(() => null);
      }
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
