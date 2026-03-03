import { GiveawaysManager } from "discord-giveaways";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const STORAGE_DIR = resolve("./database-storage/giveaways");
const STORAGE_FILE = resolve("./database-storage/giveaways/giveaways.json");

// Ensure storage directory exists before the manager writes to it
await mkdir(STORAGE_DIR, { recursive: true });

export const createGiveawayManager = (client) =>
  new GiveawaysManager(client, {
    storage: STORAGE_FILE,
    // Check every 5 seconds
    forceUpdateEvery: 5000,
    // Keep ended giveaways for 24 hours before purging
    endedGiveawaysLifetime: 86_400_000,
    default: {
      botsCanWin: false,
      embedColor: "#5865F2",
      embedColorEnd: "#2F3136",
      reaction: "🎉",
    },
  });
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
