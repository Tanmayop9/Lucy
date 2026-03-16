import { Client } from '../../../dokdo/index.js';
import { loadEvents } from '../../system/loaders/events.js';
import { loadCommands } from '../../system/loaders/msgCmds.js';
import { deploySlashCommands } from '../../system/loaders/slashCmds.js';
import { setupWebhooks } from './setupWebhooks.js';
import { initAutoBackup } from './autoBackup.js';
import { loadInviteCache } from '../../lib/utils/inviteTracker.js';

const SUPPORT_SERVER = 'https://discord.gg/p6nXDJMeyc';

const checkPremiumExpiries = async (client) => {
    const now = Date.now();
    let expiredUsers = 0;
    let expiredServers = 0;

    // User Premium Expiry
    const userKeys = await client.db.botstaff.keys;
    for (const id of userKeys) {
        const data = await client.db.botstaff.get(id);
        if (data?.permanent) continue;
        const expiryTime = data?.expiresAt || data?.expires;
        if (expiryTime && expiryTime < now) {
            await client.db.botstaff.delete(id).catch(() => {});
            expiredUsers++;

            const user = await client.users.fetch(id).catch(() => null);
            if (user) {
                user.send({
                    embeds: [
                        client.embed('#FF6B6B')
                            .title('Premium Expired')
                            .desc(`Your premium has expired.\n\nTo renew, join our [Support Server](${SUPPORT_SERVER}).`)
                            .footer({ text: 'Premium | Expired' })
                    ],
                    components: [
                        {
                            type: 1,
                            components: [
                                client.button().link('Renew Premium', SUPPORT_SERVER)
                            ]
                        }
                    ]
                }).catch(() => null);
            }

            client.log(`Expired user premium: ${id}`, 'warn');
        }
    }

    // Server Premium Expiry
    const serverKeys = await client.db.serverstaff.keys;
    for (const id of serverKeys) {
        const data = await client.db.serverstaff.get(id);
        if (data?.permanent) continue;
        const expiryTime = data?.expiresAt || data?.expires;
        if (expiryTime && expiryTime < now) {
            await client.db.serverstaff.delete(id).catch(() => {});
            expiredServers++;
            client.log(`Expired server premium: ${id}`, 'warn');
        }
    }

    if (expiredUsers) client.log(`Removed ${expiredUsers} expired user premiums.`, 'info');
    if (expiredServers) client.log(`Removed ${expiredServers} expired server premiums.`, 'info');
};

const checkNoPrefixExpiries = async (client) => {
    const now = Date.now();
    let expiredUsers = 0;

    const noPrefixKeys = await client.db.noPrefix.keys;
    for (const id of noPrefixKeys) {
        const data = await client.db.noPrefix.get(id);

        if (data === true) continue;
        if (data?.permanent) continue;

        const expiryTime = data?.expiresAt || data?.expires;
        if (expiryTime && expiryTime < now) {
            await client.db.noPrefix.delete(id).catch(() => {});
            expiredUsers++;

            const user = await client.users.fetch(id).catch(() => null);
            if (user) {
                user.send({
                    embeds: [
                        client.embed('#FF6B6B')
                            .title('No Prefix Expired')
                            .desc(`Your no-prefix access has expired. You will need to use the prefix \`${client.prefix}\` before commands.\n\nJoin our [Support Server](${SUPPORT_SERVER}) to renew.`)
                            .footer({ text: 'No Prefix | Expired' })
                    ],
                    components: [
                        {
                            type: 1,
                            components: [
                                client.button().link('Support Server', SUPPORT_SERVER)
                            ]
                        }
                    ]
                }).catch(() => null);
            }

            client.log(`Expired no-prefix: ${id}`, 'warn');
        }
    }

    if (expiredUsers) client.log(`Removed ${expiredUsers} expired no-prefix users.`, 'info');
};

export const readyEvent = async (client) => {
    client.user.setPresence({
        status: 'online',
        activities: [
            {
                type: 4,
                name: `${client.config.prefix}help`,
            },
        ],
    });

    client.log(`Logged in as ${client.user.tag} [${client.user.id}]`, 'success');

    // Setup webhooks from database or create them
    const webhookUrls = await setupWebhooks(client);
    if (webhookUrls) {
        const { WebhookClient } = await import('discord.js');
        client.webhooks = Object.fromEntries(
            Object.entries(webhookUrls).map(([hook, url]) => [
                hook,
                new WebhookClient({ url }),
            ])
        );
        client.log('Webhooks initialized successfully.', 'info');
    }

    // Announce winners when a giveaway ends
    client.giveaways.on("giveawayEnded", async (giveaway, winners) => {
        const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
        if (!channel?.isTextBased()) {
            client.log(`Giveaway ended but channel ${giveaway.channelId} is unreachable (guild: ${giveaway.guildId})`, 'warn');
            return;
        }
        const mentions = winners.map((w) => `${w}`);
        const winnerList = mentions.length ? mentions.join(", ") : "No valid participants.";
        await channel.send({
            content: mentions.length ? mentions.join(" ") : null,
            embeds: [
                client
                    .embed()
                    .title("Giveaway Ended")
                    .desc(
                        `**Prize:** ${giveaway.prize}\n` +
                        `**Winners:** ${winnerList}\n` +
                        `**Message:** https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}`,
                    ),
            ],
        }).catch(() => null);
    });

    await loadEvents(client);
    client.log('Events loaded.', 'info');

    await loadCommands(client);
    client.log('Message commands loaded.', 'info');

    await deploySlashCommands(client);
    client.log('Slash commands deployed.', 'info');

    // Expiry Checks
    await checkPremiumExpiries(client);
    await checkNoPrefixExpiries(client);

    // Dokdo Panel
    client.dokdo = new Client(client, {
        aliases: ['jsk'],
        prefix: client.prefix,
        owners: ['991517803700027443'],
    });

    // Stats
    const guildCount = client.guilds.cache.size;
    const userCount = {
        cached: client.users.cache.size,
        total: client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0),
    };

    client.log(`Ready in ${guildCount} guilds with ${userCount.total} users (${userCount.cached} cached).`, 'info');

    // Initialize automatic daily backup
    await initAutoBackup(client);

    // Load invite cache for all guilds
    await loadInviteCache(client);
    client.log('Invite cache loaded.', 'info');
};
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
