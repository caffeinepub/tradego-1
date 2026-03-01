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
export interface CreditCode {
    redeemedAt?: Time;
    redeemedBy?: Principal;
    status: CreditCodeStatus;
    code: string;
    createdAt: Time;
    amount: number;
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
export interface AppSettings {
    privacyText: string;
    termsText: string;
    stockLossColor: string;
    stockGainColor: string;
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
export interface DepositRequest {
    id: string;
    status: DepositStatus;
    user: Principal;
    utrNumber?: string;
    amount: number;
    requestTime: Time;
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
export enum CreditCodeStatus {
    active = "active",
    redeemed = "redeemed"
}
export enum DepositStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
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
export interface backendInterface {
    addToWatchlist(symbol: string): Promise<void>;
    adjustUserBalance(targetEmail: string, amount: number, isDeduct: boolean): Promise<void>;
    adminClosePosition(targetPrincipal: Principal, symbol: string): Promise<void>;
    adminEditPosition(targetPrincipal: Principal, symbol: string, newQuantity: number, newAvgPrice: number): Promise<void>;
    adminResetPassword(targetEmail: string, newPassword: string): Promise<void>;
    approveDeposit(requestId: string): Promise<void>;
    approveWithdrawal(requestId: string): Promise<void>;
    authenticate(userPrincipal: Principal): Promise<boolean>;
    authenticateAdmin(userPrincipal: Principal): Promise<boolean>;
    closePosition(symbol: string, quantity: number): Promise<void>;
    createCreditCode(code: string, amount: number): Promise<void>;
    createInstrument(symbol: string, name: string, category: Category, currentPrice: number, previousClose: number): Promise<void>;
    deleteCreditCode(code: string): Promise<void>;
    deleteInstrument(symbol: string): Promise<void>;
    deposit(amount: number): Promise<void>;
    getAdminStats(): Promise<AdminStats>;
    getAllCreditCodes(): Promise<Array<CreditCode>>;
    getAllDepositRequests(): Promise<Array<DepositRequest>>;
    getAllInstruments(): Promise<Array<Instrument>>;
    getAllOrders(): Promise<Array<Order>>;
    getAllPositions(): Promise<Array<[Principal, Array<PositionSummary>]>>;
    getAllUsers(): Promise<Array<[Principal, User]>>;
    getAllWithdrawalRequests(): Promise<Array<WithdrawalRequest>>;
    getAppSettings(): Promise<AppSettings>;
    getAvailableBalance(): Promise<number>;
    getDepositRequests(): Promise<Array<DepositRequest>>;
    getInstrumentsByCategory(category: Category): Promise<Array<Instrument>>;
    getOpenPositions(): Promise<Array<PositionSummary>>;
    getOrders(): Promise<Array<Order>>;
    getPaymentSettings(): Promise<PaymentSettings | null>;
    getPortfolioSummary(): Promise<PortfolioSummary>;
    getProfileByToken(token: string): Promise<User>;
    getUserByToken(token: string): Promise<[Principal, User]>;
    getUserProfile(): Promise<User>;
    getWatchlist(): Promise<Array<string>>;
    getWithdrawalRequests(): Promise<Array<WithdrawalRequest>>;
    isAdminByToken(token: string): Promise<boolean>;
    isAdminUser(p: Principal): Promise<boolean>;
    loginWithPassword(email: string, password: string): Promise<string>;
    logoutByToken(token: string): Promise<void>;
    placeOrder(symbol: string, quantity: number, price: number, orderType: OrderType, tradeType: TradeType, side: Side): Promise<string>;
    redeemCreditCode(code: string): Promise<void>;
    registerUser(name: string, email: string, mobile: string): Promise<void>;
    registerUserWithPassword(name: string, email: string, mobile: string, password: string): Promise<void>;
    rejectDeposit(requestId: string): Promise<void>;
    rejectWithdrawal(requestId: string): Promise<void>;
    removeFromWatchlist(symbol: string): Promise<void>;
    requestDeposit(amount: number): Promise<string>;
    requestWithdrawal(amount: number, withdrawalMethod: WithdrawalMethod, upiId: string | null, bankName: string | null, accountNumber: string | null, ifscCode: string | null): Promise<string>;
    setPaymentSettings(upiId: string, qrCodeData: string): Promise<void>;
    submitDepositUtr(requestId: string, utrNumber: string): Promise<void>;
    updateAppSettings(termsText: string, privacyText: string, stockGainColor: string, stockLossColor: string): Promise<void>;
    updateInstrumentPrice(update: InstrumentUpdate): Promise<void>;
}
