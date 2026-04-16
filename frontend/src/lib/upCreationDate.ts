/**
 * Resolve the block timestamp at which a Universal Profile contract was deployed.
 * Uses binary search over block history (~23 RPC calls) and caches forever via
 * React Query (creation date never changes).
 */
import { createPublicClient, http } from "viem";
import { LUKSO_MAINNET_RPC, LUKSO_TESTNET_RPC } from "@/constants/addresses";
import { luksoMainnet, luksoTestnet } from "@/lib/lukso";

export async function getUPCreationDate(
  upAddress: string,
  chainId: number
): Promise<Date> {
  const rpc   = chainId === 42 ? LUKSO_MAINNET_RPC : LUKSO_TESTNET_RPC;
  const chain = chainId === 42 ? luksoMainnet     : luksoTestnet;
  const client = createPublicClient({ chain, transport: http(rpc) });

  const current = await client.getBlockNumber();

  // Binary-search for the first block that contains bytecode at this address.
  let lo = 0n;
  let hi = current;

  while (lo < hi) {
    const mid  = (lo + hi) / 2n;
    const code = await client.getBytecode({
      address:     upAddress as `0x${string}`,
      blockNumber: mid,
    });
    if (code && code !== "0x") {
      hi = mid;
    } else {
      lo = mid + 1n;
    }
  }

  const block = await client.getBlock({ blockNumber: lo });
  return new Date(Number(block.timestamp) * 1000);
}

// ── Anniversary helpers ────────────────────────────────────────────────────────

export interface AnniversaryInfo {
  /** Years on LUKSO they will have completed at their next anniversary. */
  upcomingYears: number;
  /** Date of the next (or current) anniversary. */
  nextDate: Date;
  /** True if today IS the anniversary. */
  isToday: boolean;
}

export function computeAnniversary(creationDate: Date): AnniversaryInfo {
  const now = new Date();
  const thisYear = now.getFullYear();

  // Anniversary date in the current calendar year
  const thisYearAnniv = new Date(
    thisYear,
    creationDate.getMonth(),
    creationDate.getDate()
  );

  const isToday = thisYearAnniv.toDateString() === now.toDateString();

  if (thisYearAnniv >= now) {
    // Anniversary is today or still coming this year
    return {
      upcomingYears: thisYear - creationDate.getFullYear(),
      nextDate:      thisYearAnniv,
      isToday,
    };
  } else {
    // Already passed — next anniversary is next year
    const nextYear = thisYear + 1;
    return {
      upcomingYears: nextYear - creationDate.getFullYear(),
      nextDate:      new Date(nextYear, creationDate.getMonth(), creationDate.getDate()),
      isToday:       false,
    };
  }
}
