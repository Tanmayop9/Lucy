const event = "channelDelete";
export default class ChannelDelete {
  constructor() {
    this.name = event;
    this.execute = async (client, channel) => {
      if (channel.isDMBased()) return;
      // Clean up welcome/leave config if the deleted channel was configured
      const cfg = await client.db.welcomeConfig.get(channel.guild?.id).catch(() => null);
      if (!cfg) return;
      let changed = false;
      if (cfg.welcome?.channelId === channel.id) {
        delete cfg.welcome;
        changed = true;
      }
      if (cfg.leave?.channelId === channel.id) {
        delete cfg.leave;
        changed = true;
      }
      if (changed) {
        await client.db.welcomeConfig.set(channel.guild.id, cfg).catch(() => null);
      }
    };
  }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
