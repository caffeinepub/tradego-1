import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Category,
  OrderType,
  Side,
  TradeType,
  WithdrawalMethod,
} from "../backend.d";
import { useSession } from "../contexts/SessionContext";
import { useActor } from "./useActor";

export function useGetAllInstruments() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["instruments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllInstruments();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useGetInstrumentsByCategory(category: Category) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["instruments", category],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInstrumentsByCategory(category);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useGetPortfolioSummary() {
  const { actor, isFetching } = useActor();
  const { token } = useSession();
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      if (!actor || !token) return null;
      return actor.getPortfolioSummary(token);
    },
    enabled: !!actor && !isFetching && !!token,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useGetUserProfile() {
  const { actor, isFetching } = useActor();
  const { token } = useSession();
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor || !token) return null;
      try {
        // Use token-based profile fetch
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const a = actor as any;
        if (a.getUserProfileByToken)
          return await a.getUserProfileByToken(token);
        if (a.getProfileByToken) return await a.getProfileByToken(token);
        return null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!token,
    staleTime: 60_000,
  });
}

export function useGetWatchlist() {
  const { actor, isFetching } = useActor();
  const { token } = useSession();
  return useQuery({
    queryKey: ["watchlist"],
    queryFn: async () => {
      if (!actor || !token) return [];
      try {
        return await actor.getWatchlist(token);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!token,
    staleTime: 30_000,
  });
}

export function useGetOpenPositions() {
  const { actor, isFetching } = useActor();
  const { token } = useSession();
  return useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      if (!actor || !token) return [];
      try {
        return await actor.getOpenPositions(token);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!token,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useGetOrders() {
  const { actor, isFetching } = useActor();
  const { token } = useSession();
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      if (!actor || !token) return [];
      try {
        return await actor.getOrders(token);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!token,
    staleTime: 10_000,
  });
}

export function useRequestWithdrawal() {
  const { actor } = useActor();
  const { token } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      withdrawalMethod,
      upiId,
      bankName,
      accountNumber,
      ifscCode,
    }: {
      amount: number;
      withdrawalMethod: WithdrawalMethod;
      upiId?: string;
      bankName?: string;
      accountNumber?: string;
      ifscCode?: string;
    }) => {
      if (!actor) throw new Error("No actor");
      if (!token) throw new Error("Not authenticated");
      return actor.requestWithdrawal(
        token,
        amount,
        withdrawalMethod,
        upiId ?? null,
        bankName ?? null,
        accountNumber ?? null,
        ifscCode ?? null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
    },
  });
}

export function useGetPaymentSettings() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["paymentSettings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPaymentSettings();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useSetPaymentSettings() {
  const { actor } = useActor();
  const { token } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      upiId,
      qrCodeData,
      bankAccountHolder,
      bankName,
      bankAccountNumber,
      bankIfsc,
    }: {
      upiId: string;
      qrCodeData: string;
      bankAccountHolder?: string;
      bankName?: string;
      bankAccountNumber?: string;
      bankIfsc?: string;
    }) => {
      if (!actor) throw new Error("No actor");
      if (!token) throw new Error("Not authenticated");
      return actor.setPaymentSettings(
        token,
        upiId,
        qrCodeData,
        bankAccountHolder ?? "",
        bankName ?? "",
        bankAccountNumber ?? "",
        bankIfsc ?? "",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentSettings"] });
    },
  });
}

export function useGetAllWithdrawalRequests() {
  const { actor, isFetching } = useActor();
  const { token } = useSession();
  return useQuery({
    queryKey: ["adminWithdrawals"],
    queryFn: async () => {
      if (!actor || !token) return [];
      return actor.getAllWithdrawalRequests(token);
    },
    enabled: !!actor && !isFetching && !!token,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useApproveWithdrawal() {
  const { actor } = useActor();
  const { token } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!actor) throw new Error("No actor");
      if (!token) throw new Error("Not authenticated");
      return actor.approveWithdrawal(token, requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
    },
  });
}

export function useRejectWithdrawal() {
  const { actor } = useActor();
  const { token } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!actor) throw new Error("No actor");
      if (!token) throw new Error("Not authenticated");
      return actor.rejectWithdrawal(token, requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
    },
  });
}

export function useGetWithdrawalRequests() {
  const { actor, isFetching } = useActor();
  const { token } = useSession();
  return useQuery({
    queryKey: ["withdrawals"],
    queryFn: async () => {
      if (!actor || !token) return [];
      try {
        return await actor.getWithdrawalRequests(token);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!token,
    staleTime: 10_000,
  });
}

export function usePlaceOrder() {
  const { actor } = useActor();
  const { token } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      symbol,
      quantity,
      price,
      orderType,
      tradeType,
      side,
    }: {
      symbol: string;
      quantity: number;
      price: number;
      orderType: OrderType;
      tradeType: TradeType;
      side: Side;
    }) => {
      if (!actor) throw new Error("No actor");
      if (!token) throw new Error("Not authenticated");
      return actor.placeOrder(
        token,
        symbol,
        quantity,
        price,
        orderType,
        tradeType,
        side,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useClosePosition() {
  const { actor } = useActor();
  const { token } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      symbol,
      quantity,
    }: { symbol: string; quantity: number }) => {
      if (!actor) throw new Error("No actor");
      if (!token) throw new Error("Not authenticated");
      return actor.closePosition(token, symbol, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useAddToWatchlist() {
  const { actor } = useActor();
  const { token } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string) => {
      if (!actor) throw new Error("No actor");
      if (!token) throw new Error("Not authenticated");
      return actor.addToWatchlist(token, symbol);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}

export function useRemoveFromWatchlist() {
  const { actor } = useActor();
  const { token } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string) => {
      if (!actor) throw new Error("No actor");
      if (!token) throw new Error("Not authenticated");
      return actor.removeFromWatchlist(token, symbol);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}

export function useCreateInstrument() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      symbol,
      name,
      category,
      currentPrice,
      previousClose,
    }: {
      symbol: string;
      name: string;
      category: Category;
      currentPrice: number;
      previousClose: number;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createInstrument(
        symbol,
        name,
        category,
        currentPrice,
        previousClose,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instruments"] });
    },
  });
}

export function useRequestDeposit() {
  const { actor } = useActor();
  const { token } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      if (!actor) throw new Error("No actor");
      if (!token) throw new Error("Not authenticated");
      return actor.requestDeposit(token, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deposits"] });
    },
  });
}

export function useSubmitDepositUtr() {
  const { actor } = useActor();
  const { token } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      utrNumber,
    }: { requestId: string; utrNumber: string }) => {
      if (!actor) throw new Error("No actor");
      if (!token) throw new Error("Not authenticated");
      return actor.submitDepositUtr(token, requestId, utrNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deposits"] });
    },
  });
}

export function useGetDepositRequests() {
  const { actor, isFetching } = useActor();
  const { token } = useSession();
  return useQuery({
    queryKey: ["deposits"],
    queryFn: async () => {
      if (!actor || !token) return [];
      try {
        return await actor.getDepositRequests(token);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!token,
    staleTime: 10_000,
  });
}

export function useGetAllDepositRequests() {
  const { actor, isFetching } = useActor();
  const { token } = useSession();
  return useQuery({
    queryKey: ["adminDeposits"],
    queryFn: async () => {
      if (!actor || !token) return [];
      return actor.getAllDepositRequests(token);
    },
    enabled: !!actor && !isFetching && !!token,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useApproveDeposit() {
  const { actor } = useActor();
  const { token } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!actor) throw new Error("No actor");
      if (!token) throw new Error("Not authenticated");
      return actor.approveDeposit(token, requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDeposits"] });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });
}

export function useRejectDeposit() {
  const { actor } = useActor();
  const { token } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!actor) throw new Error("No actor");
      if (!token) throw new Error("Not authenticated");
      return actor.rejectDeposit(token, requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDeposits"] });
    },
  });
}

export function useGetAllCreditCodes() {
  const { actor, isFetching } = useActor();
  const { token } = useSession();
  return useQuery({
    queryKey: ["creditCodes"],
    queryFn: async () => {
      if (!actor || !token) return [];
      return actor.getAllCreditCodes(token);
    },
    enabled: !!actor && !isFetching && !!token,
    staleTime: 15_000,
  });
}

export function useCreateCreditCode() {
  const { actor } = useActor();
  const { token } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, amount }: { code: string; amount: number }) => {
      if (!actor) throw new Error("No actor");
      if (!token) throw new Error("Not authenticated");
      return actor.createCreditCode(token, code, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creditCodes"] });
    },
  });
}

export function useDeleteCreditCode() {
  const { actor } = useActor();
  const { token } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error("No actor");
      if (!token) throw new Error("Not authenticated");
      return actor.deleteCreditCode(token, code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creditCodes"] });
    },
  });
}

export function useRedeemCreditCode() {
  const { actor } = useActor();
  const { token } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error("No actor");
      if (!token) throw new Error("Not authenticated");
      return actor.redeemCreditCode(token, code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}
