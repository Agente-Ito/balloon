/**
 * Sets LSP4Metadata on all three Balloon token contracts.
 *
 * What this does:
 *   1. Reads the icon image from assets/balloon-icon.*
 *   2. Uploads it to IPFS via the proxy → gets ipfs://CID
 *   3. Builds the LSP4Metadata JSON (name, description, links, icon)
 *   4. Uploads that JSON to IPFS → gets ipfs://CID
 *   5. Encodes as JSONURL (0x6f357c6a + keccak256(json) + url)
 *   6. Calls setData(LSP4_METADATA_KEY, encodedValue) on all 3 contracts
 *
 * Usage:
 *   npx hardhat run scripts/setLSP4Metadata.ts --network luksoTestnet
 *   npx hardhat run scripts/setLSP4Metadata.ts --network lukso
 *
 * Required env vars (same as deploy):
 *   PRIVATE_KEY                — deployer / contract owner key
 *   CELEBRATIONS_BADGE_ADDRESS — deployed CelebrationsBadge address
 *   GREETING_CARD_ADDRESS      — deployed GreetingCard address
 *   DROP_BADGE_ADDRESS         — deployed DropBadge address
 *
 * Optional:
 *   IPFS_PROXY_URL             — defaults to the Cloudflare worker
 *   APP_URL                    — link shown in LUKSO ecosystem (defaults to placeholder)
 */
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// ── Config ────────────────────────────────────────────────────────────────────

const IPFS_PROXY =
  process.env.IPFS_PROXY_URL ??
  "https://celebrations-ipfs-proxy.celebrations.workers.dev";

const APP_URL = process.env.APP_URL ?? "https://grid.lukso.network";

// LSP4Metadata ERC725Y key: keccak256("LSP4Metadata")
const LSP4_METADATA_KEY =
  "0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Keccak256 of arbitrary bytes using Node's crypto (no ethers needed for files) */
function keccak256Bytes(data: Buffer): string {
  // ethers.keccak256 expects hex — convert manually via crypto
  const hash = crypto.createHash("sha3-256"); // note: sha3-256 ≠ keccak256
  // Use ethers for actual keccak256 (sha3-keccak variant)
  return ethers.keccak256(new Uint8Array(data));
}

/** Upload a file Buffer to IPFS via the proxy, return ipfs://CID */
async function uploadFileToIPFS(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ url: string; hash: string }> {
  const hash = keccak256Bytes(fileBuffer);

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
  formData.append("file", blob, filename);

  const res = await fetch(`${IPFS_PROXY}/upload/file`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`IPFS file upload failed (${res.status}): ${body}`);
  }

  const { cid } = await res.json() as { cid: string };
  return { url: `ipfs://${cid}`, hash };
}

/** Upload a JSON object to IPFS via the proxy, return { url, hash } */
async function uploadJSONToIPFS(
  data: object,
  name: string
): Promise<{ url: string; hash: string }> {
  const jsonStr = JSON.stringify(data);
  const hash = ethers.keccak256(ethers.toUtf8Bytes(jsonStr));

  const res = await fetch(`${IPFS_PROXY}/upload/json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, name }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`IPFS JSON upload failed (${res.status}): ${body}`);
  }

  const { cid } = await res.json() as { cid: string };
  return { url: `ipfs://${cid}`, hash };
}

/**
 * Encode a JSONURL value for ERC725Y storage.
 * Format: 0x6f357c6a (4 bytes) + keccak256(content) (32 bytes) + url (utf8 bytes)
 */
function encodeJsonUrl(url: string, contentHash: string): string {
  const HASH_FUNCTION_PREFIX = "6f357c6a";
  const hashHex = contentHash.slice(2); // remove 0x
  const urlHex = Buffer.from(url, "utf8").toString("hex");
  return `0x${HASH_FUNCTION_PREFIX}${hashHex}${urlHex}`;
}

/** Find the balloon icon in the assets folder */
function findIcon(): { buffer: Buffer; filename: string; mime: string } {
  const extensions = [
    { ext: "png",  mime: "image/png"  },
    { ext: "jpg",  mime: "image/jpeg" },
    { ext: "jpeg", mime: "image/jpeg" },
    { ext: "webp", mime: "image/webp" },
    { ext: "svg",  mime: "image/svg+xml" },
  ];

  for (const { ext, mime } of extensions) {
    const p = path.join(process.cwd(), "assets", `balloon-icon.${ext}`);
    if (fs.existsSync(p)) {
      return { buffer: fs.readFileSync(p), filename: `balloon-icon.${ext}`, mime };
    }
  }

  throw new Error(
    "Icon not found. Save your icon as assets/balloon-icon.png (or .jpg/.webp/.svg)"
  );
}

// ── ERC725Y setData ABI ───────────────────────────────────────────────────────

const SET_DATA_ABI = [
  {
    name: "setData",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "dataKey",   type: "bytes32" },
      { name: "dataValue", type: "bytes"   },
    ],
    outputs: [],
  },
] as const;

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, `(chainId ${network.chainId})`);
  console.log("Deployer:", deployer.address);
  console.log("IPFS proxy:", IPFS_PROXY);
  console.log("");

  const badgeAddress   = process.env.CELEBRATIONS_BADGE_ADDRESS;
  const cardAddress    = process.env.GREETING_CARD_ADDRESS;
  const dropBadgeAddress = process.env.DROP_BADGE_ADDRESS;

  if (!badgeAddress || !cardAddress || !dropBadgeAddress) {
    throw new Error(
      "Set CELEBRATIONS_BADGE_ADDRESS, GREETING_CARD_ADDRESS, DROP_BADGE_ADDRESS in .env"
    );
  }

  // 1. Upload icon image
  console.log("1/3 Uploading icon to IPFS…");
  const { buffer, filename, mime } = findIcon();
  const { url: iconUrl, hash: iconHash } = await uploadFileToIPFS(buffer, filename, mime);
  console.log("    Icon:", iconUrl);

  // 2. Build LSP4Metadata JSON — standard LSP4 structure
  //    https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-4-DigitalAsset-Metadata.md
  const metadata = {
    LSP4Metadata: {
      name: "Balloon",
      description:
        "Celebrate birthdays, anniversaries, and special moments on LUKSO. " +
        "Send badges, greeting cards, and badge drops to people you follow.",
      links: [
        { title: "App", url: APP_URL },
        { title: "LUKSO", url: "https://lukso.network" },
      ],
      icons: [
        {
          width: 512,
          height: 512,
          url: iconUrl,
          verification: {
            method: "keccak256(bytes)",
            data: iconHash,
          },
        },
      ],
      images: [
        [
          {
            width: 512,
            height: 512,
            url: iconUrl,
            verification: {
              method: "keccak256(bytes)",
              data: iconHash,
            },
          },
        ],
      ],
      assets:     [],
      attributes: [],
    },
  };

  // 3. Upload metadata JSON to IPFS
  console.log("2/3 Uploading LSP4Metadata JSON to IPFS…");
  const { url: metaUrl, hash: metaHash } = await uploadJSONToIPFS(
    metadata,
    "balloon-lsp4-metadata"
  );
  console.log("    Metadata:", metaUrl);

  // 4. Encode JSONURL value
  const encodedValue = encodeJsonUrl(metaUrl, metaHash);
  console.log("    Encoded JSONURL:", encodedValue.slice(0, 40) + "…");

  // 5. Set on all 3 contracts
  console.log("\n3/3 Setting LSP4Metadata on contracts…");

  const contracts: Array<{ label: string; address: string }> = [
    { label: "Balloon Badge  ", address: badgeAddress   },
    { label: "Balloon Card   ", address: cardAddress    },
    { label: "Balloon Drop   ", address: dropBadgeAddress },
  ];

  for (const { label, address } of contracts) {
    const contract = new ethers.Contract(address, SET_DATA_ABI, deployer);
    const tx = await contract.setData(LSP4_METADATA_KEY, encodedValue);
    await tx.wait();
    console.log(`  ✓ ${label} (${address})`);
  }

  console.log("\n✅ LSP4Metadata set on all contracts.");
  console.log("   The Balloon icon and description are now visible in the LUKSO ecosystem.");
  console.log("   Check: https://universalprofile.cloud/asset/<CONTRACT_ADDRESS>");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
