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
export interface CreditCodeV2 {
    redeemedAt?: Time;
    redeemedBy?: string;
    status: CreditCodeStatus;
    code: string;
    createdAt: Time;
    amount: number;
}
/** @deprecated Use CreditCodeV2 */
export type CreditCode = CreditCodeV2;
export interface OrderV2 {
    id: string;
    status: OrderStatus;
    tradeType: TradeType;
    side: Side;
    userEmail: string;
    orderType: OrderType;
    marginUsed: number;
    timestamp: Time;
    quantity: number;
    price: number;
    symbol: string;
}
/** @deprecated Use OrderV2 */
export type Order = OrderV2;
export interface AppSettings {
    privacyText: string;
    termsText: string;
    stockLossColor: string;
    stockGainColor: string;
}
export interface PaymentSettingsV2 {
    qrCodeData: string;
    upiId: string;
    bankAccountHolder: string;
    bankName: string;
    bankAccountNumber: string;
    bankIfsc: string;
}
/** @deprecated Use PaymentSettingsV2 */
export type PaymentSettings = PaymentSettingsV2;
export interface AdminStats {
    totalOrders: bigint;
    totalInstruments: bigint;
    totalUsers: bigint;
}
export interface DepositRequestV2 {
    id: string;
    status: DepositStatus;
    userEmail: string;
    utrNumber?: string;
    amount: number;
    requestTime: Time;
}
/** @deprecated Use DepositRequestV2 */
export type DepositRequest = DepositRequestV2;
export interface WithdrawalRequestV2 {
    id: string;
    status: WithdrawalStatus;
    ifscCode?: string;
    userEmail: string;
    bankName?: string;
    upiId?: string;
    withdrawalMethod: WithdrawalMethod;
    accountNumber?: string;
    amount: number;
    requestTime: Time;
}
/** @deprecated Use WithdrawalRequestV2 */
export type WithdrawalRequest = WithdrawalRequestV2;
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
    addToWatchlist(token: string, symbol: string): Promise<void>;
    adjustUserBalance(token: string, targetEmail: string, amount: number, isDeduct: boolean): Promise<void>;
    adminClosePosition(token: string, targetEmail: string, symbol: string): Promise<void>;
    adminEditPosition(token: string, targetEmail: string, symbol: string, newQuantity: number, newAvgPrice: number): Promise<void>;
    adminResetPassword(token: string, targetEmail: string, newPassword: string): Promise<void>;
    approveDeposit(token: string, requestId: string): Promise<void>;
    approveWithdrawal(token: string, requestId: string): Promise<void>;
    authenticate(userPrincipal: Principal): Promise<boolean>;
    authenticateAdmin(userPrincipal: Principal): Promise<boolean>;
    closePosition(token: string, symbol: string, quantity: number): Promise<void>;
    createCreditCode(token: string, code: string, amount: number): Promise<void>;
    createInstrument(symbol: string, name: string, category: Category, currentPrice: number, previousClose: number): Promise<void>;
    deleteCreditCode(token: string, code: string): Promise<void>;
    deleteInstrument(symbol: string): Promise<void>;
    deposit(amount: number): Promise<void>;
    getAdminStats(token: string): Promise<AdminStats>;
    getAllCreditCodes(token: string): Promise<Array<CreditCodeV2>>;
    getAllDepositRequests(token: string): Promise<Array<DepositRequestV2>>;
    getAllInstruments(): Promise<Array<Instrument>>;
    getAllOrders(token: string): Promise<Array<OrderV2>>;
    getAllPositions(token: string): Promise<Array<[string, Array<PositionSummary>]>>;
    getAllUsers(token: string): Promise<Array<[string, User]>>;
    getAllWithdrawalRequests(token: string): Promise<Array<WithdrawalRequestV2>>;
    getAppSettings(): Promise<AppSettings>;
    getAvailableBalance(): Promise<number>;
    getAvailableBalanceByToken(token: string): Promise<number>;
    getDepositRequests(token: string): Promise<Array<DepositRequestV2>>;
    getInstrumentsByCategory(category: Category): Promise<Array<Instrument>>;
    getOpenPositions(token: string): Promise<Array<PositionSummary>>;
    getOrders(token: string): Promise<Array<OrderV2>>;
    getPaymentSettings(): Promise<PaymentSettingsV2 | null>;
    getPortfolioSummary(token: string): Promise<PortfolioSummary>;
    getProfileByToken(token: string): Promise<User>;
    getSessionFull(token: string): Promise<[User, boolean] | null>;
    getUserByToken(token: string): Promise<[Principal, User]>;
    getUserProfile(): Promise<User>;
    getUserProfileByToken(token: string): Promise<User>;
    getWatchlist(token: string): Promise<Array<string>>;
    getWithdrawalRequests(token: string): Promise<Array<WithdrawalRequestV2>>;
    isAdminByToken(token: string): Promise<boolean>;
    isAdminUser(p: Principal): Promise<boolean>;
    loginFull(email: string, password: string): Promise<[string, User, boolean]>;
    loginWithPassword(email: string, password: string): Promise<string>;
    logoutByToken(token: string): Promise<void>;
    placeOrder(token: string, symbol: string, quantity: number, price: number, orderType: OrderType, tradeType: TradeType, side: Side): Promise<string>;
    redeemCreditCode(token: string, code: string): Promise<void>;
    registerUser(name: string, email: string, mobile: string): Promise<void>;
    registerUserWithPassword(name: string, email: string, mobile: string, password: string): Promise<void>;
    rejectDeposit(token: string, requestId: string): Promise<void>;
    rejectWithdrawal(token: string, requestId: string): Promise<void>;
    removeFromWatchlist(token: string, symbol: string): Promise<void>;
    requestDeposit(token: string, amount: number): Promise<string>;
    requestWithdrawal(token: string, amount: number, withdrawalMethod: WithdrawalMethod, upiId: string | null, bankName: string | null, accountNumber: string | null, ifscCode: string | null): Promise<string>;
    setPaymentSettings(token: string, upiId: string, qrCodeData: string, bankAccountHolder: string, bankName: string, bankAccountNumber: string, bankIfsc: string): Promise<void>;
    submitDepositUtr(token: string, requestId: string, utrNumber: string): Promise<void>;
    updateAppSettings(token: string, termsText: string, privacyText: string, stockGainColor: string, stockLossColor: string): Promise<void>;
    updateInstrumentPrice(update: InstrumentUpdate): Promise<void>;
}
