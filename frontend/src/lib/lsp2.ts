/**
 * Decodes an LSP2 JSONURL or VerifiableURI bytes value and returns the URL string.
 *
 * Two formats are supported:
 *   JSONURL (v1):      [6f357c6a (4B method id)][32B hash][url]           — header = 72 hex chars
 *   VerifiableURI (v2):[0000 (2B version)][6f357c6a (4B method id)][32B hash][url] — header = 76 hex chars
 */
export function decodeJsonUrl(hex: string): string | undefined {
  if (!hex || hex === "0x") return undefined;
  const body = hex.slice(2); // strip leading 0x

  let urlHex: string;
  if (body.startsWith("6f357c6a") && body.length > 72) {
    urlHex = body.slice(72);
  } else if (body.startsWith("00006f357c6a") && body.length > 76) {
    urlHex = body.slice(76);
  } else {
    return undefined;
  }

  const bytes = urlHex.match(/../g)?.map((b) => parseInt(b, 16));
  if (!bytes?.length) return undefined;
  return new TextDecoder().decode(new Uint8Array(bytes));
}
