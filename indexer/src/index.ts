/**
 * Celebrations Indexer — entry point.
 *
 * Starts all on-chain event listeners and the Express HTTP API in a single process.
 * Configure via environment variables (see .env.example in the root).
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import { router } from "./api/routes";
import { startBadgeListener } from "./listeners/badges";
import { startGreetingListener } from "./listeners/greetings";
import { startFollowListener } from "./listeners/followEvents";
import { startDropListener } from "./listeners/drops";

// ── Config ────────────────────────────────────────────────────────────────────

const PORT                  = Number(process.env.PORT ?? 3001);
const RPC_URL               = process.env.RPC_URL ?? "https://rpc.testnet.lukso.network";
const CHAIN_ID              = Number(process.env.CHAIN_ID ?? 4201);
const BADGE_ADDRESS         = (process.env.CELEBRATIONS_BADGE_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
const GREETING_ADDRESS      = (process.env.GREETING_CARD_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
const FOLLOW_REGISTRY_ADDR  = (process.env.LSP26_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
const DROP_ADDRESS          = (process.env.CELEBRATIONS_DROP_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;

// Origins allowed to call this API.
// In production set ALLOWED_ORIGINS="https://your-frontend.vercel.app,https://grid.lukso.network"
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// ── Express ───────────────────────────────────────────────────────────────────

const app = express();

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no Origin header (server-to-server, curl, etc.)
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
      return cb(null, true);
    }
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ["GET", "OPTIONS"],
}));
app.use(express.json());
app.use("/api", router);

app.listen(PORT, () => {
  console.log(`[indexer] API listening on http://localhost:${PORT}/api`);
});

// ── Start listeners ───────────────────────────────────────────────────────────

(async () => {
  if (BADGE_ADDRESS !== "0x0000000000000000000000000000000000000000") {
    await startBadgeListener({ rpcUrl: RPC_URL, contractAddress: BADGE_ADDRESS, chainId: CHAIN_ID });
  } else {
    console.warn("[indexer] BADGE_ADDRESS not set — badge listener skipped");
  }

  if (GREETING_ADDRESS !== "0x0000000000000000000000000000000000000000") {
    await startGreetingListener({ rpcUrl: RPC_URL, contractAddress: GREETING_ADDRESS, chainId: CHAIN_ID });
  } else {
    console.warn("[indexer] GREETING_ADDRESS not set — greeting listener skipped");
  }

  if (FOLLOW_REGISTRY_ADDR !== "0x0000000000000000000000000000000000000000") {
    await startFollowListener({ rpcUrl: RPC_URL, contractAddress: FOLLOW_REGISTRY_ADDR, chainId: CHAIN_ID });
  } else {
    console.warn("[indexer] LSP26_ADDRESS not set — follow listener skipped");
  }

  if (DROP_ADDRESS !== "0x0000000000000000000000000000000000000000") {
    await startDropListener({ rpcUrl: RPC_URL, contractAddress: DROP_ADDRESS, chainId: CHAIN_ID });
  } else {
    console.warn("[indexer] CELEBRATIONS_DROP_ADDRESS not set — drop listener skipped");
  }
})();
