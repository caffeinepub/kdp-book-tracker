import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Book } from "../backend.d";
import { useActor } from "./useActor";

export type { Book };

// ── Queries ──────────────────────────────────────────────────────────────────

export function useGetBooks() {
  const { actor, isFetching } = useActor();
  return useQuery<Book[]>({
    queryKey: ["books"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBooks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetStats() {
  const { actor, isFetching } = useActor();
  return useQuery<{
    totalSales: bigint;
    totalRoyalties: number;
    totalBooks: bigint;
  }>({
    queryKey: ["stats"],
    queryFn: async () => {
      if (!actor)
        return {
          totalSales: BigInt(0),
          totalRoyalties: 0,
          totalBooks: BigInt(0),
        };
      return actor.getStats();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useAddBook() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      title,
      author,
      price,
      sales,
      royaltyPerSale,
    }: {
      title: string;
      author: string;
      price: number;
      sales: bigint;
      royaltyPerSale: number;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addBook(title, author, price, sales, royaltyPerSale);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useUpdateBook() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      title,
      author,
      price,
      sales,
      royaltyPerSale,
    }: {
      id: bigint;
      title: string;
      author: string;
      price: number;
      sales: bigint;
      royaltyPerSale: number;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateBook(id, title, author, price, sales, royaltyPerSale);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useDeleteBook() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteBook(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
