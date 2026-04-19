/**
 * Decodes an LSP2 JSONURL or VerifiableURI bytes value and returns the URL string.
 *
 * Two formats are supported:
 *   JSONURL (v1):      [6f357c6a (4B)][32B hash][url]                          — header = 72 hex chars
 *   VerifiableURI (v2):[0000 (2B)][6f357c6a (4B)][0020 (2B length)][32B hash][url] — header = 80 hex chars
 *
 * The 2-byte length field (0020 = 32) in v2 was confirmed by inspecting a live testnet profile.
 */
export function decodeJsonUrl(hex: string): string | undefined {
  if (!hex || hex === "0x") return undefined;
  const body = hex.slice(2); // strip leading 0x

  let urlHex: string;
  if (body.startsWith("6f357c6a") && body.length > 72) {
    // JSONURL (v1): 4B method + 32B hash + url
    urlHex = body.slice(72);
  } else if (body.startsWith("00006f357c6a") && body.length > 80) {
    // VerifiableURI (v2): 2B version + 4B method + 2B verif-data-length + 32B hash + url
    urlHex = body.slice(80);
  } else {
    return undefined;
  }

  const bytes = urlHex.match(/../g)?.map((b) => parseInt(b, 16));
  if (!bytes?.length) return undefined;
  return new TextDecoder().decode(new Uint8Array(bytes));
}
