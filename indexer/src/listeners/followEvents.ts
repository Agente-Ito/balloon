/**
 * Follow event listener — watches for Follow/Unfollow events from the LSP26
 * FollowerSystem (or our FollowRegistry wrapper) and indexes the social graph.
 */
import { createPublicClient, http, parseAbiItem } from "viem";
import { getDb, getLastBlock, saveLastBlock } from "../storage/db";

const LISTENER_ID = "follow_events";

const FOLLOW_EVENT   = parseAbiItem("event Follow(address indexed follower, address indexed followed)");
const UNFOLLOW_EVENT = parseAbiItem("event Unfollow(address indexed follower, address indexed followed)");

interface FollowListenerConfig {
  rpcUrl: string;
  contractAddress: `0x${string}`;
  chainId: number;
  pollIntervalMs?: number;
}

export async function startFollowListener(config: FollowListenerConfig): Promise<void> {
  const client = createPublicClient({
    transport: http(config.rpcUrl),
    chain: { id: config.chainId } as Parameters<typeof createPublicClient>[0]["chain"],
  });

  console.log(`[follows] Starting listener on ${config.contractAddress}`);

  const poll = async () => {
    try {
      const fromBlock = await getLastBlock(LISTENER_ID);
      const toBlock   = await client.getBlockNumber();

      if (fromBlock >= toBlock) return;

      const [followLogs, unfollowLogs] = await Promise.all([
        client.getLogs({ address: config.contractAddress, event: FOLLOW_EVENT,   fromBlock, toBlock }),
        client.getLogs({ address: config.contractAddress, event: UNFOLLOW_EVENT, fromBlock, toBlock }),
      ]);

      const db = getDb();
      const insert = db.prepare(`
        INSERT INTO follow_events (follower, followed, action, block_number, tx_hash)
        VALUES (?, ?, ?, ?, ?)
      `);

      const insertMany = db.transaction(() => {
        for (const log of followLogs) {
          insert.run(
            log.args.follower?.toLowerCase(),
            log.args.followed?.toLowerCase(),
            "follow",
            Number(log.blockNumber),
            log.transactionHash
          );
        }
        for (const log of unfollowLogs) {
          insert.run(
            log.args.follower?.toLowerCase(),
            log.args.followed?.toLowerCase(),
            "unfollow",
            Number(log.blockNumber),
            log.transactionHash
          );
        }
      });

      insertMany();

      const total = followLogs.length + unfollowLogs.length;
      if (total > 0) {
        console.log(`[follows] Indexed ${total} follow event(s) up to block ${toBlock}`);
      }

      saveLastBlock(LISTENER_ID, toBlock);
    } catch (err) {
      console.error("[follows] Poll error:", err);
    }
  };

  await poll();
  setInterval(poll, config.pollIntervalMs ?? 30_000);
}
