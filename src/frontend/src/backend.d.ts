import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface InstrumentUpdate {
    currentPrice: number;
    previousClose: number;
    symbol: string;
}
export type Time = bigint;
export interface Instrument {
    currentPrice: number;
    name: string;
    previousClose: number;
    priceChangePercent: number;
    category: Category;
    symbol: string;
}
export interface User {
    balance: number;
    name: string;
    email: string;
    mobile: string;
}
export interface PositionSummary {
    tradeType: TradeType;
    marginUsed: number;
    quantity: number;
    unrealizedPnL: number;
    avgBuyPrice: number;
    symbol: string;
}
export interface PortfolioSummary {
    totalInvested: number;
    availableBalance: number;
    marginAvailable: number;
    totalPnL: number;
    currentValue: number;
    marginUsed: number;
}
export interface Order {
    id: string;
    status: OrderStatus;
    tradeType: TradeType;
    side: Side;
    user: Principal;
    orderType: OrderType;
    marginUsed: number;
    timestamp: Time;
    quantity: number;
    price: number;
    symbol: string;
}
export interface PaymentSettings {
    qrCodeData: string;
    upiId: string;
}
export interface AdminStats {
    totalOrders: bigint;
    totalInstruments: bigint;
    totalUsers: bigint;
}
export interface WithdrawalRequest {
    id: string;
    status: WithdrawalStatus;
    ifscCode?: string;
    user: Principal;
    bankName?: string;
    upiId?: string;
    withdrawalMethod: WithdrawalMethod;
    accountNumber?: string;
    amount: number;
    requestTime: Time;
}
export enum Category {
    forex = "forex",
    stock = "stock",
    crypto = "crypto",
    commodity = "commodity"
}
export enum OrderStatus {
    cancelled = "cancelled",
    pending = "pending",
    rejected = "rejected",
    executed = "executed"
}
export enum OrderType {
    limit = "limit",
    stopLoss = "stopLoss",
    market = "market"
}
export enum Side {
    buy = "buy",
    sell = "sell"
}
export enum TradeType {
    carryForward = "carryForward",
    intraday = "intraday"
}
export enum WithdrawalMethod {
    upi = "upi",
    bank = "bank"
}
export enum WithdrawalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export interface backendInterface {
    addToWatchlist(symbol: string): Promise<void>;
    approveWithdrawal(requestId: string): Promise<void>;
    authenticate(userPrincipal: Principal): Promise<boolean>;
    authenticateAdmin(userPrincipal: Principal): Promise<boolean>;
    closePosition(symbol: string, quantity: number): Promise<void>;
    createInstrument(symbol: string, name: string, category: Category, currentPrice: number, previousClose: number): Promise<void>;
    deleteInstrument(symbol: string): Promise<void>;
    deposit(amount: number): Promise<void>;
    getAdminStats(): Promise<AdminStats>;
    getAllInstruments(): Promise<Array<Instrument>>;
    getAllOrders(): Promise<Array<Order>>;
    getAllUsers(): Promise<Array<[Principal, User]>>;
    getAllWithdrawalRequests(): Promise<Array<WithdrawalRequest>>;
    getAvailableBalance(): Promise<number>;
    getInstrumentsByCategory(category: Category): Promise<Array<Instrument>>;
    getOpenPositions(): Promise<Array<PositionSummary>>;
    getOrders(): Promise<Array<Order>>;
    getPaymentSettings(): Promise<PaymentSettings | null>;
    getPortfolioSummary(): Promise<PortfolioSummary>;
    getUserProfile(): Promise<User>;
    getWatchlist(): Promise<Array<string>>;
    getWithdrawalRequests(): Promise<Array<WithdrawalRequest>>;
    isAdminUser(p: Principal): Promise<boolean>;
    placeOrder(symbol: string, quantity: number, price: number, orderType: OrderType, tradeType: TradeType, side: Side): Promise<string>;
    registerUser(name: string, email: string, mobile: string): Promise<void>;
    rejectWithdrawal(requestId: string): Promise<void>;
    removeFromWatchlist(symbol: string): Promise<void>;
    requestWithdrawal(amount: number, withdrawalMethod: WithdrawalMethod, upiId: string | null, bankName: string | null, accountNumber: string | null, ifscCode: string | null): Promise<string>;
    setPaymentSettings(upiId: string, qrCodeData: string): Promise<void>;
    updateInstrumentPrice(update: InstrumentUpdate): Promise<void>;
}
