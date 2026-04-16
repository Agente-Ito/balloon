import type { CelebrationType } from "@/types";
import { CELEBRATION_LABELS, CELEBRATION_EMOJIS } from "./celebrationTypes";

export interface LSP4Attribute {
  key: string;
  value: string | number | boolean;
  type: "string" | "number" | "boolean";
}

export interface LSP4ImageObject {
  width: number;
  height: number;
  url: string;
  verification: { method: string; data: string };
}

export interface LSP4MetadataJSON {
  LSP4Metadata: {
    name: string;
    description: string;
    links: { title: string; url: string }[];
    icon: LSP4ImageObject[];
    images: LSP4ImageObject[][];
    assets: { url: string; fileType: string; verification: { method: string; data: string } }[];
    attributes: LSP4Attribute[];
  };
}

export function buildBadgeLSP4(params: {
  ownerAddress: string;
  celebrationType: CelebrationType;
  year: number;
  imageUrl: string;
  imageHash: string;
}): LSP4MetadataJSON {
  const emoji = CELEBRATION_EMOJIS[params.celebrationType];
  const label = CELEBRATION_LABELS[params.celebrationType];

  return {
    LSP4Metadata: {
      name: `${label} ${params.year} ${emoji}`,
      description: `Commemorative badge for ${label} ${params.year}`,
      links: [],
      icon: [
        {
          width: 512,
          height: 512,
          url: params.imageUrl,
          verification: { method: "keccak256(bytes)", data: params.imageHash },
        },
      ],
      images: [],
      assets: [],
      attributes: [
        { key: "celebrationType", value: label, type: "string" },
        { key: "celebrationTypeId", value: params.celebrationType, type: "number" },
        { key: "year", value: params.year, type: "number" },
        { key: "ownerProfile", value: params.ownerAddress, type: "string" },
        { key: "soulbound", value: true, type: "boolean" },
      ],
    },
  };
}

export function buildGreetingCardLSP4(params: {
  fromAddress: string;
  toAddress: string;
  celebrationType: CelebrationType;
  message: string;
  year: number;
  imageUrl: string;
  imageHash: string;
}): LSP4MetadataJSON {
  const emoji = CELEBRATION_EMOJIS[params.celebrationType];
  const label = CELEBRATION_LABELS[params.celebrationType];

  return {
    LSP4Metadata: {
      name: `Happy ${label} ${emoji}`,
      description: params.message,
      links: [],
      icon: [
        {
          width: 512,
          height: 512,
          url: params.imageUrl,
          verification: { method: "keccak256(bytes)", data: params.imageHash },
        },
      ],
      images: [],
      assets: [],
      attributes: [
        { key: "celebrationType", value: label, type: "string" },
        { key: "celebrationTypeId", value: params.celebrationType, type: "number" },
        { key: "from", value: params.fromAddress, type: "string" },
        { key: "to", value: params.toAddress, type: "string" },
        { key: "message", value: params.message, type: "string" },
        { key: "year", value: params.year, type: "number" },
      ],
    },
  };
}
