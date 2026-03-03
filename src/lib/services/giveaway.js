import { GiveawaysManager } from "discord-giveaways";

/**
 * Extends GiveawaysManager to store giveaway data in the existing
 * Josh database (client.db.giveaway) instead of a flat JSON file.
 * Every other data store in this bot uses Josh — giveaways should too.
 */
class JoshGiveawaysManager extends GiveawaysManager {
  /** Load all giveaways from Josh on startup. */
  async getAllGiveaways() {
    const keys = await this.client.db.giveaway.keys;
    if (!keys.length) return [];
    const entries = await Promise.all(
      keys.map((k) => this.client.db.giveaway.get(k)),
    );
    return entries.filter(Boolean);
  }

  /** Persist a new giveaway. */
  async saveGiveaway(messageId, giveawayData) {
    await this.client.db.giveaway.set(messageId, giveawayData);
  }

  /** Update an existing giveaway in place. */
  async editGiveaway(messageId, giveawayData) {
    await this.client.db.giveaway.set(messageId, giveawayData);
  }

  /** Remove a giveaway from the database. */
  async deleteGiveaway(messageId) {
    await this.client.db.giveaway.delete(messageId);
  }
}

export const createGiveawayManager = (client) =>
  new JoshGiveawaysManager(client, {
    // Poll every 5 s to update countdowns / auto-end
    forceUpdateEvery: 5000,
    // Purge ended giveaways from the DB after 24 h
    endedGiveawaysLifetime: 86_400_000,
    default: {
      botsCanWin: false,
      embedColor: "#5865F2",
      embedColorEnd: "#2F3136",
      reaction: "🎉",
    },
  });
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */

