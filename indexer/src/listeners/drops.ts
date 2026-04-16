/**
 * Drop event listener — watches for DropCreated and DropClaimed events on the
 * CelebrationsDrop contract and persists them to SQLite.
 */
import { createPublicClient, http, parseAbiItem } from "viem";
import { getDb, getLastBlock, saveLastBlock } from "../storage/db";

const LISTENER_ID = "drops";

const DROP_CREATED_EVENT = parseAbiItem(
  "event DropCreated(bytes32 indexed dropId, address indexed host, uint8 celebrationType, uint64 startAt, uint64 endAt, uint32 maxSupply)"
);

const DROP_CLAIMED_EVENT = parseAbiItem(
  "event DropClaimed(bytes32 indexed dropId, address indexed claimer, bytes32 tokenId)"
);

interface DropListenerConfig {
  rpcUrl: string;
  contractAddress: `0x${string}`;
  chainId: number;
  pollIntervalMs?: number;
}

export async function startDropListener(config: DropListenerConfig): Promise<void> {
  const client = createPublicClient({
    transport: http(config.rpcUrl),
    chain: { id: config.chainId } as Parameters<typeof createPublicClient>[0]["chain"],
  });

  console.log(`[drops] Starting listener on ${config.contractAddress}`);

  const poll = async () => {
    try {
      const fromBlock = await getLastBlock(LISTENER_ID);
      const toBlock   = await client.getBlockNumber();

      if (fromBlock >= toBlock) return;

      const [createdLogs, claimedLogs] = await Promise.all([
        client.getLogs({ address: config.contractAddress, event: DROP_CREATED_EVENT, fromBlock, toBlock }),
        client.getLogs({ address: config.contractAddress, event: DROP_CLAIMED_EVENT,  fromBlock, toBlock }),
      ]);

      const db = getDb();

      // Persist DropCreated events — fetch full config via eth_call for the extended fields
      // (requiredLSP7/LSP8 arrays and name/imageIPFS are not in the event, they're in contract storage)
      if (createdLogs.length > 0) {
        const GET_DROP_ABI = parseAbiItem(
          "function getDrop(bytes32 dropId) view returns ((address host, uint8 celebrationType, uint16 year, uint8 month, uint8 day, uint64 startAt, uint64 endAt, uint32 maxSupply, bool requireFollowsHost, uint32 minFollowers, address[] requiredLSP7, address[] requiredLSP8, string name, string imageIPFS, bytes metadataBytes))"
        );

        const insertDrop = db.prepare(`
          INSERT OR IGNORE INTO drops
            (drop_id, host, celebration_type, year, month, day, start_at, end_at, max_supply,
             name, image_ipfs, require_follow, min_followers, required_lsp7, required_lsp8,
             block_number, tx_hash)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const log of createdLogs) {
          try {
            const cfgRaw = await client.readContract({
              address: config.contractAddress,
              abi: [GET_DROP_ABI],
              functionName: "getDrop",
              args: [log.args.dropId!],
            });
            const cfg = cfgRaw as unknown as {
              host: string; celebrationType: number; year: number; month: number; day: number;
              startAt: bigint; endAt: bigint; maxSupply: number;
              requireFollowsHost: boolean; minFollowers: number;
              requiredLSP7: string[]; requiredLSP8: string[];
              name: string; imageIPFS: string;
            };

            insertDrop.run(
              log.args.dropId,
              cfg.host.toLowerCase(),
              cfg.celebrationType,
              cfg.year,
              cfg.month,
              cfg.day,
              Number(cfg.startAt),
              cfg.endAt > 0n ? Number(cfg.endAt) : null,
              cfg.maxSupply > 0 ? cfg.maxSupply : null,
              cfg.name,
              cfg.imageIPFS || null,
              cfg.requireFollowsHost ? 1 : 0,
              cfg.minFollowers,
              JSON.stringify(cfg.requiredLSP7.map((a: string) => a.toLowerCase())),
              JSON.stringify(cfg.requiredLSP8.map((a: string) => a.toLowerCase())),
              Number(log.blockNumber),
              log.transactionHash
            );
          } catch (err) {
            console.error(`[drops] Failed to index DropCreated ${log.args.dropId}:`, err);
          }
        }
        console.log(`[drops] Indexed ${createdLogs.length} DropCreated event(s) up to block ${toBlock}`);
      }

      // Persist DropClaimed events + increment claimed counter
      if (claimedLogs.length > 0) {
        const insertClaim = db.prepare(`
          INSERT OR IGNORE INTO drop_claims (drop_id, claimer, token_id, block_number, tx_hash)
          VALUES (?, ?, ?, ?, ?)
        `);
        const incrementClaimed = db.prepare(`
          UPDATE drops SET claimed = claimed + 1 WHERE drop_id = ?
        `);

        const insertManyClaims = db.transaction((logs: typeof claimedLogs) => {
          for (const log of logs) {
            insertClaim.run(
              log.args.dropId,
              log.args.claimer?.toLowerCase(),
              log.args.tokenId,
              Number(log.blockNumber),
              log.transactionHash
            );
            incrementClaimed.run(log.args.dropId);
          }
        });

        insertManyClaims(claimedLogs);
        console.log(`[drops] Indexed ${claimedLogs.length} DropClaimed event(s) up to block ${toBlock}`);
      }

      saveLastBlock(LISTENER_ID, toBlock);
    } catch (err) {
      console.error("[drops] Poll error:", err);
    }
  };

  await poll();
  setInterval(poll, config.pollIntervalMs ?? 15_000);
}
