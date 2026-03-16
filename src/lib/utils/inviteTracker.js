/**
 * Invite tracking utilities.
 * Caches invite use-counts per guild so we can diff on member join.
 */

/**
 * Load all guild invites into client.inviteCache.
 * @param {import("discord.js").Client} client
 */
export async function loadInviteCache(client) {
  for (const guild of client.guilds.cache.values()) {
    try {
      const invites = await guild.invites.fetch();
      client.inviteCache.set(
        guild.id,
        new Map(invites.map((inv) => [inv.code, inv.uses ?? 0])),
      );
    } catch {
      // Missing MANAGE_GUILD permission — skip silently
    }
  }
}

/**
 * Refresh the invite cache for a single guild.
 * @param {import("discord.js").Client} client
 * @param {string} guildId
 */
export async function refreshGuildInvites(client, guildId) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;
  try {
    const invites = await guild.invites.fetch();
    client.inviteCache.set(
      guild.id,
      new Map(invites.map((inv) => [inv.code, inv.uses ?? 0])),
    );
  } catch {
    // ignore
  }
}

/**
 * Determine which invite was used when a member joined.
 * Compares the current invite list against the cached counts.
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").Guild} guild
 * @returns {Promise<import("discord.js").Invite|null>}
 */
export async function findUsedInvite(client, guild) {
  const cached = client.inviteCache.get(guild.id) ?? new Map();
  let current;
  try {
    current = await guild.invites.fetch();
  } catch {
    return null;
  }

  const used = current.find(
    (inv) => (inv.uses ?? 0) > (cached.get(inv.code) ?? 0),
  );

  // Refresh cache
  client.inviteCache.set(
    guild.id,
    new Map(current.map((inv) => [inv.code, inv.uses ?? 0])),
  );

  return used ?? null;
}

/**
 * Increment the stored invite count for the inviter.
 * @param {import("discord.js").Client} client
 * @param {string} guildId
 * @param {string} inviterId
 */
export async function incrementInviteCount(client, guildId, inviterId) {
  const key = `${guildId}_${inviterId}`;
  const data = (await client.db.invites.get(key)) || { total: 0, left: 0 };
  data.total += 1;
  await client.db.invites.set(key, data);
}

/**
 * Increment the "left" counter when an invited member leaves.
 * @param {import("discord.js").Client} client
 * @param {string} guildId
 * @param {string} inviterId
 */
export async function incrementLeaveCount(client, guildId, inviterId) {
  const key = `${guildId}_${inviterId}`;
  const data = (await client.db.invites.get(key)) || { total: 0, left: 0 };
  data.left = (data.left ?? 0) + 1;
  await client.db.invites.set(key, data);
}

/**
 * Get invite stats for a user in a guild.
 * @param {import("discord.js").Client} client
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<{total: number, left: number, real: number}>}
 */
export async function getInviteStats(client, guildId, userId) {
  const key = `${guildId}_${userId}`;
  const data = (await client.db.invites.get(key)) || { total: 0, left: 0 };
  return {
    total: data.total ?? 0,
    left: data.left ?? 0,
    real: (data.total ?? 0) - (data.left ?? 0),
  };
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
