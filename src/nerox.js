/**
 * @nerox v1.0.0
 * @author Tanmay
 * @copyright 2024 Nerox - Services
 */

import { loadAntiCrash } from "./lib/utils/anticrash.js";
import { ExtendedClient } from "./bot/structures/client.js";
import { startNodelink } from "./lib/services/nodelinkProcess.js";

console.clear();

// Load anti-crash handler
loadAntiCrash();

// Initialize the client (manager is set up here but connects after NodeLink is ready)
const client = new ExtendedClient();

// Start the embedded NodeLink audio server first, then connect to Discord
await startNodelink(client).catch((err) => {
  client.log(`Failed to start NodeLink: ${err.message}`, "error");
  client.log("Continuing without NodeLink — music features will be unavailable.", "warn");
});

export default client.connectToGateway();
