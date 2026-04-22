import { useQuery } from "@tanstack/react-query";
import { getPublicClient } from "@/lib/lukso";
import { getAddresses } from "@/constants/addresses";

const REGISTRY_ABI = [
  {
    name: "getFestivities",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "month", type: "uint8" },
          { name: "day", type: "uint8" },
          { name: "name", type: "string" },
          { name: "celebrationType", type: "uint8" },
        ],
      },
    ],
  },
] as const;

export interface Festivity {
  month: number;
  day: number;
  name: string;
  celebrationType: number;
}

export function useFestivities(chainId: number) {
  return useQuery<Festivity[]>({
    queryKey: ["festivities", chainId],
    queryFn: async () => {
      const publicClient = getPublicClient(chainId);
      const { celebrationRegistry } = getAddresses(chainId);
      const result = await publicClient.readContract({
        address: celebrationRegistry,
        abi: REGISTRY_ABI,
        functionName: "getFestivities",
      });
      return (
        result as readonly { month: number; day: number; name: string; celebrationType: number }[]
      ).map((f) => ({
        month: Number(f.month),
        day: Number(f.day),
        name: String(f.name),
        celebrationType: Number(f.celebrationType),
      }));
    },
    staleTime: 600_000,
    retry: 1,
  });
}
