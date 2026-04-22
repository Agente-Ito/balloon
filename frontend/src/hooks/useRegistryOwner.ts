import { useQuery } from "@tanstack/react-query";
import { getPublicClient } from "@/lib/lukso";
import { getAddresses } from "@/constants/addresses";

const OWNER_ABI = [
  {
    name: "owner",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

export function useRegistryOwner(chainId: number) {
  return useQuery<string>({
    queryKey: ["registryOwner", chainId],
    queryFn: async () => {
      const publicClient = getPublicClient(chainId);
      const { celebrationRegistry } = getAddresses(chainId);
      const owner = await publicClient.readContract({
        address: celebrationRegistry,
        abi: OWNER_ABI,
        functionName: "owner",
      });
      return (owner as string).toLowerCase();
    },
    staleTime: 600_000,
    retry: 1,
  });
}
