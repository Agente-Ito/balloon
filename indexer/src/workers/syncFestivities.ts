/**
 * syncFestivities worker — reads the CelebrationRegistry on-chain and syncs
 * the global festivities list to a local JSON file for fast frontend consumption.
 *
 * Run periodically (e.g., daily cron) or on contract upgrade.
 */
import { createPublicClient, http, parseAbiItem } from "viem";
import fs from "fs";
import path from "path";

const OUTPUT_PATH = path.join(process.cwd(), "data", "festivities.json");

const GET_FESTIVITIES_ABI = parseAbiItem(
  "function getFestivities() view returns ((uint8 month, uint8 day, string name, uint8 celebrationType)[])"
);

interface OnChainFestivity {
  month: number;
  day: number;
  name: string;
  celebrationType: number;
}

interface SyncConfig {
  rpcUrl: string;
  contractAddress: `0x${string}`;
  chainId: number;
}

async function syncFestivities(config: SyncConfig): Promise<void> {
  const client = createPublicClient({
    transport: http(config.rpcUrl),
    chain: { id: config.chainId } as Parameters<typeof createPublicClient>[0]["chain"],
  });

  console.log("[syncFestivities] Fetching from contract...");

  const raw = await client.readContract({
    address: config.contractAddress,
    abi: [GET_FESTIVITIES_ABI],
    functionName: "getFestivities",
  }) as OnChainFestivity[];

  const festivities = raw.map((f) => ({
    month: f.month,
    day: f.day,
    mmdd: `${String(f.month).padStart(2, "0")}-${String(f.day).padStart(2, "0")}`,
    name: f.name,
    celebrationType: f.celebrationType,
  }));

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(festivities, null, 2));

  console.log(`[syncFestivities] Wrote ${festivities.length} festivities to ${OUTPUT_PATH}`);
}

// Run directly
const config: SyncConfig = {
  rpcUrl: process.env.RPC_URL ?? "https://rpc.testnet.lukso.network",
  contractAddress: (process.env.CELEBRATION_REGISTRY_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
  chainId: Number(process.env.CHAIN_ID ?? 4201),
};

syncFestivities(config).catch(console.error);
