/**
 * Badge event listener — watches for `BadgeMinted` events on the CelebrationsBadge contract
 * and persists them to the SQLite database.
 */
import { createPublicClient, http, parseAbiItem } from "viem";
import { getDb, getLastBlock, saveLastBlock } from "../storage/db";

const LISTENER_ID = "badges";

const BADGE_MINTED_EVENT = parseAbiItem(
  "event BadgeMinted(address indexed recipient, bytes32 indexed tokenId, uint8 celebrationType, uint16 year)"
);

interface BadgeListenerConfig {
  rpcUrl: string;
  contractAddress: `0x${string}`;
  chainId: number;
  pollIntervalMs?: number;
}

export async function startBadgeListener(config: BadgeListenerConfig): Promise<void> {
  const client = createPublicClient({
    transport: http(config.rpcUrl),
    chain: { id: config.chainId } as Parameters<typeof createPublicClient>[0]["chain"],
  });

  console.log(`[badges] Starting listener on ${config.contractAddress}`);

  const poll = async () => {
    try {
      const fromBlock = await getLastBlock(LISTENER_ID);
      const toBlock   = await client.getBlockNumber();

      if (fromBlock >= toBlock) return;

      const logs = await client.getLogs({
        address: config.contractAddress,
        event: BADGE_MINTED_EVENT,
        fromBlock,
        toBlock,
      });

      const db = getDb();
      const insert = db.prepare(`
        INSERT OR IGNORE INTO badges
          (token_id, owner, celebration_type, year, soulbound, block_number, tx_hash)
        VALUES (?, ?, ?, ?, 0, ?, ?)
      `);

      const insertMany = db.transaction((entries: typeof logs) => {
        for (const log of entries) {
          insert.run(
            log.args.tokenId,
            log.args.recipient?.toLowerCase(),
            log.args.celebrationType,
            log.args.year,
            Number(log.blockNumber),
            log.transactionHash
          );
        }
      });

      insertMany(logs);
      if (logs.length > 0) {
        console.log(`[badges] Indexed ${logs.length} badge(s) up to block ${toBlock}`);
      }

      saveLastBlock(LISTENER_ID, toBlock);
    } catch (err) {
      console.error("[badges] Poll error:", err);
    }
  };

  // Run immediately, then on interval
  await poll();
  setInterval(poll, config.pollIntervalMs ?? 15_000);
}
