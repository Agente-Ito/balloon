/**
 * Greeting card event listener — watches for `GreetingCardSent` events on the
 * GreetingCard contract and persists them to the SQLite database.
 */
import { createPublicClient, http, parseAbiItem } from "viem";
import { getDb, getLastBlock, saveLastBlock } from "../storage/db";

const LISTENER_ID = "greetings";

const GREETING_SENT_EVENT = parseAbiItem(
  "event GreetingCardSent(address indexed from, address indexed to, bytes32 indexed tokenId, uint8 celebrationType)"
);

interface GreetingListenerConfig {
  rpcUrl: string;
  contractAddress: `0x${string}`;
  chainId: number;
  pollIntervalMs?: number;
}

export async function startGreetingListener(config: GreetingListenerConfig): Promise<void> {
  const client = createPublicClient({
    transport: http(config.rpcUrl),
    chain: { id: config.chainId } as Parameters<typeof createPublicClient>[0]["chain"],
  });

  console.log(`[greetings] Starting listener on ${config.contractAddress}`);

  const poll = async () => {
    try {
      const fromBlock = await getLastBlock(LISTENER_ID);
      const toBlock   = await client.getBlockNumber();

      if (fromBlock >= toBlock) return;

      const logs = await client.getLogs({
        address: config.contractAddress,
        event: GREETING_SENT_EVENT,
        fromBlock,
        toBlock,
      });

      const db = getDb();
      const insert = db.prepare(`
        INSERT OR IGNORE INTO greeting_cards
          (token_id, sender, recipient, celebration_type, block_number, tx_hash)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const insertMany = db.transaction((entries: typeof logs) => {
        for (const log of entries) {
          insert.run(
            log.args.tokenId,
            log.args.from?.toLowerCase(),
            log.args.to?.toLowerCase(),
            log.args.celebrationType,
            Number(log.blockNumber),
            log.transactionHash
          );
        }
      });

      insertMany(logs);
      if (logs.length > 0) {
        console.log(`[greetings] Indexed ${logs.length} card(s) up to block ${toBlock}`);
      }

      saveLastBlock(LISTENER_ID, toBlock);
    } catch (err) {
      console.error("[greetings] Poll error:", err);
    }
  };

  await poll();
  setInterval(poll, config.pollIntervalMs ?? 15_000);
}
