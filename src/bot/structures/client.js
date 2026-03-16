import { readdirSync } from "fs";
import { fileURLToPath } from "node:url";
import { emoji } from "../../assets/emoji.js";
import { josh } from "../../lib/services/josh.js";
import { log } from "../../logger.js";
import { dirname, resolve } from "node:path";
import { ExtendedEmbedBuilder } from "./embed.js";
import { ExtendedButtonBuilder } from "./button.js";
import { OAuth2Scopes } from "discord-api-types/v10";
import { readyEvent } from "../../lib/services/readyEvent.js";
import { createGiveawayManager } from "../../lib/services/giveaway.js";
import {
  Client,
  Partials,
  Collection,
  GatewayIntentBits,
} from "discord.js";
import { ClusterClient, getInfo } from "discord-hybrid-sharding";
import { config } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export class ExtendedClient extends Client {
  constructor() {
    super({
      partials: [
        Partials.User,
        Partials.Channel,
        Partials.Message,
        Partials.Reaction,
        Partials.GuildMember,
        Partials.ThreadMember,
        Partials.GuildScheduledEvent,
      ],
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions,
      ],
      failIfNotExists: false,
      shards: getInfo().SHARD_LIST,
      shardCount: getInfo().TOTAL_SHARDS,
      allowedMentions: {
        repliedUser: false,
        parse: ["users", "roles"],
      },
    });

    this.emoji = emoji;
    this.config = config;
    this.webhooks = {};
    this.log = (message, type) => void log(message, type);
    this.underMaintenance = false;
    this.prefix = config.prefix || "&";
    this.owners = config.owners;
    this.admins = config.admins;

    // Invite cache: Map<guildId, Map<inviteCode, uses>>
    this.inviteCache = new Map();

    this.db = {
      noPrefix: josh("noPrefix"),
      ticket: josh("ticket"),
      botmods: josh("botmods"),
      giveaway: josh("giveaway"),
      msgCount: josh("msgCount"),
      botstaff: josh("botstaff"),
      redeemCode: josh("redeemCode"),
      serverstaff: josh("serverstaff"),
      ignore: josh("ignore"),
      bypass: josh("bypass"),
      blacklist: josh("blacklist"),
      config: josh("config"),
      prefix: josh("prefix"),
      afk: josh("afk"),
      invites: josh("invites"),
      welcomeConfig: josh("welcomeConfig"),
      userPreferences: josh("userPreferences"),

      stats: {
        commandsUsed: josh("stats/commandsUsed"),
      },
    };

    this.giveaways = createGiveawayManager(this);

    this.dokdo = null;

    this.botInvite = {
      admin: () =>
        this.generateInvite({
          scopes: [OAuth2Scopes.Bot],
          permissions: ["Administrator"],
        }),
      required: () =>
        this.generateInvite({
          scopes: [OAuth2Scopes.Bot],
          permissions: [
            "ViewChannel",
            "SendMessages",
            "EmbedLinks",
            "AttachFiles",
            "ReadMessageHistory",
            "AddReactions",
          ],
        }),
    };

    this.cluster = new ClusterClient(this);
    this.commands = new Collection();
    this.categories = readdirSync(resolve(__dirname, "../commands"));
    this.cooldowns = new Collection();

    this.connectToGateway = () => (this.login(config.token), this);

    this.sleep = async (s) =>
      void (await new Promise((resolve) => setTimeout(resolve, s * 1000)));

    this.button = () => new ExtendedButtonBuilder();
    this.embed = (color) => new ExtendedEmbedBuilder(color || config.embedColor);

    this.formatBytes = (bytes) => {
      const power = Math.floor(Math.log(bytes) / Math.log(1024));
      return `${parseFloat((bytes / Math.pow(1024, power)).toFixed(2))} ${
        ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][power]
      }`;
    };

    this.on("debug", (data) => this.log(data));
    this.on("ready", async () => await readyEvent(this));
    this.on("messageUpdate", (_, m) =>
      m.partial ? null : this.emit("messageCreate", m),
    );
  }
}
