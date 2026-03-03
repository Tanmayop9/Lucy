import { toMs } from "../services/ms/toMs.js";
import { fromMs } from "../services/ms/fromMs.js";

/**
 * Parse a human-readable duration string (e.g. "10m", "2h", "1d")
 * into milliseconds using the existing toMs utility.
 * Returns null for invalid or zero-length input.
 * @param {string} str
 * @returns {number|null}
 */
export const parseDuration = (str) => {
  if (!str || typeof str !== "string") return null;
  const ms = toMs(str.trim());
  return ms > 0 ? ms : null;
};

/**
 * Format milliseconds into a human-readable duration string.
 * @param {number} ms
 * @returns {string}
 */
export const formatDuration = (ms) => fromMs(ms, { long: true });

/**
 * Return a Discord relative timestamp string (<t:unix:R>) for a
 * given Unix millisecond timestamp.
 * @param {number} timestampMs
 * @returns {string}
 */
export const relativeTimestamp = (timestampMs) =>
  `<t:${Math.floor(timestampMs / 1000)}:R>`;

/**
 * Find a single giveaway in the in-memory list by guild + message ID.
 * @param {import("discord-giveaways").GiveawaysManager} manager
 * @param {string} guildId
 * @param {string} messageId
 * @returns {import("discord-giveaways").Giveaway|null}
 */
export const findGiveaway = (manager, guildId, messageId) =>
  manager.giveaways.find(
    (g) => g.guildId === guildId && g.messageId === messageId,
  ) ?? null;

/**
 * Get every giveaway (active and ended) belonging to a guild.
 * @param {import("discord-giveaways").GiveawaysManager} manager
 * @param {string} guildId
 * @returns {import("discord-giveaways").Giveaway[]}
 */
export const getGuildGiveaways = (manager, guildId) =>
  manager.giveaways.filter((g) => g.guildId === guildId);

/**
 * Resolve a message ID from a raw command argument.
 * If the arg is a valid Discord snowflake and matches an in-memory
 * giveaway, that ID is returned.  If nothing is provided or matched,
 * falls back to the most-recently-started *active* giveaway in the guild.
 * Returns null when nothing can be resolved.
 * @param {import("discord-giveaways").GiveawaysManager} manager
 * @param {string} guildId
 * @param {string|undefined} arg  - raw first arg from the command
 * @returns {string|null}
 */
export const resolveMessageId = (manager, guildId, arg) => {
  if (arg && /^\d{17,19}$/.test(arg)) {
    const found = findGiveaway(manager, guildId, arg);
    return found ? found.messageId : null;
  }
  // Fall back to the most recent active giveaway in this guild
  const active = manager.giveaways
    .filter((g) => g.guildId === guildId && !g.ended)
    .sort((a, b) => b.startAt - a.startAt);
  return active[0]?.messageId ?? null;
};

/**
 * Build a clean, single-line status string for a giveaway.
 * Used by glist and command confirmations.
 * @param {import("discord-giveaways").Giveaway} g
 * @returns {string}
 */
export const giveawayStatus = (g) => {
  if (g.ended) return "Ended";
  if (g.pauseOptions?.isPaused) return "Paused";
  return `Active — ends ${relativeTimestamp(g.endAt)}`;
};
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
