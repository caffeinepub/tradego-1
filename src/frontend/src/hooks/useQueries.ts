import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Category,
  OrderType,
  Side,
  TradeType,
  WithdrawalMethod,
} from "../backend.d";
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
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPortfolioSummary();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useGetUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getUserProfile();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useGetWatchlist() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["watchlist"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getWatchlist();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useGetOpenPositions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getOpenPositions();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useGetOrders() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getOrders();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useRegisterUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      email,
      mobile,
    }: { name: string; email: string; mobile: string }) => {
      if (!actor) throw new Error("No actor");
      await actor.registerUser(name, email, mobile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export function useDeposit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      if (!actor) throw new Error("No actor");
      await actor.deposit(amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useRequestWithdrawal() {
  const { actor } = useActor();
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
      return actor.requestWithdrawal(
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      upiId,
      qrCodeData,
    }: { upiId: string; qrCodeData: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.setPaymentSettings(upiId, qrCodeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentSettings"] });
    },
  });
}

export function useGetAllWithdrawalRequests() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["adminWithdrawals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllWithdrawalRequests();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useApproveWithdrawal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.approveWithdrawal(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
    },
  });
}

export function useRejectWithdrawal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.rejectWithdrawal(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
    },
  });
}

export function useGetWithdrawalRequests() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["withdrawals"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getWithdrawalRequests();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function usePlaceOrder() {
  const { actor } = useActor();
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
      return actor.placeOrder(
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      symbol,
      quantity,
    }: { symbol: string; quantity: number }) => {
      if (!actor) throw new Error("No actor");
      return actor.closePosition(symbol, quantity);
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string) => {
      if (!actor) throw new Error("No actor");
      return actor.addToWatchlist(symbol);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}

export function useRemoveFromWatchlist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string) => {
      if (!actor) throw new Error("No actor");
      return actor.removeFromWatchlist(symbol);
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      if (!actor) throw new Error("No actor");
      return actor.requestDeposit(amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deposits"] });
    },
  });
}

export function useSubmitDepositUtr() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      utrNumber,
    }: { requestId: string; utrNumber: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.submitDepositUtr(requestId, utrNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deposits"] });
    },
  });
}

export function useGetDepositRequests() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["deposits"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getDepositRequests();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

export function useGetAllDepositRequests() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["adminDeposits"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDepositRequests();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useApproveDeposit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.approveDeposit(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDeposits"] });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });
}

export function useRejectDeposit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.rejectDeposit(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDeposits"] });
    },
  });
}

export function useGetAllCreditCodes() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["creditCodes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCreditCodes();
    },
    enabled: !!actor && !isFetching,
    staleTime: 15_000,
  });
}

export function useCreateCreditCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, amount }: { code: string; amount: number }) => {
      if (!actor) throw new Error("No actor");
      return actor.createCreditCode(code, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creditCodes"] });
    },
  });
}

export function useDeleteCreditCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteCreditCode(code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creditCodes"] });
    },
  });
}

export function useRedeemCreditCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error("No actor");
      return actor.redeemCreditCode(code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}
