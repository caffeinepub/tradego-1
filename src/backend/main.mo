import Array "mo:core/Array";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Float "mo:core/Float";



actor {
  // TYPES
  public type Category = { #stock; #crypto; #forex; #commodity };
  public type OrderType = { #market; #limit; #stopLoss };
  public type TradeType = { #intraday; #carryForward };
  public type Side = { #buy; #sell };
  public type OrderStatus = { #pending; #executed; #cancelled; #rejected };
  public type WithdrawalStatus = { #pending; #approved; #rejected };
  public type WithdrawalMethod = { #upi; #bank };

  public type DepositStatus = { #pending; #approved; #rejected };
  public type DepositRequest = {
    id : Text;
    user : Principal;
    amount : Float;
    utrNumber : ?Text;
    status : DepositStatus;
    requestTime : Time.Time;
  };

  public type Instrument = {
    symbol : Text;
    name : Text;
    category : Category;
    currentPrice : Float;
    previousClose : Float;
    priceChangePercent : Float;
  };

  public type User = {
    name : Text;
    email : Text;
    mobile : Text;
    balance : Float;
  };

  public type Order = {
    id : Text;
    user : Principal;
    symbol : Text;
    quantity : Float;
    price : Float;
    orderType : OrderType;
    tradeType : TradeType;
    side : Side;
    status : OrderStatus;
    marginUsed : Float;
    timestamp : Time.Time;
  };

  public type Position = {
    symbol : Text;
    quantity : Float;
    avgBuyPrice : Float;
    tradeType : TradeType;
    marginUsed : Float;
    unrealizedPnL : Float;
    timestamp : Time.Time;
  };

  public type PortfolioSummary = {
    totalInvested : Float;
    currentValue : Float;
    totalPnL : Float;
    availableBalance : Float;
    marginUsed : Float;
    marginAvailable : Float;
  };

  public type PositionSummary = {
    symbol : Text;
    quantity : Float;
    avgBuyPrice : Float;
    tradeType : TradeType;
    marginUsed : Float;
    unrealizedPnL : Float;
  };

  public type AppSettings = {
    termsText : Text;
    privacyText : Text;
    stockGainColor : Text;
    stockLossColor : Text;
  };

  public type AdminStats = {
    totalUsers : Nat;
    totalInstruments : Nat;
    totalOrders : Nat;
  };

  public type InstrumentUpdate = {
    symbol : Text;
    currentPrice : Float;
    previousClose : Float;
  };

  public type WithdrawalRequest = {
    id : Text;
    user : Principal;
    amount : Float;
    status : WithdrawalStatus;
    requestTime : Time.Time;
    withdrawalMethod : WithdrawalMethod;
    upiId : ?Text;
    bankName : ?Text;
    accountNumber : ?Text;
    ifscCode : ?Text;
  };

  public type PaymentSettings = {
    upiId : Text;
    qrCodeData : Text;
  };

  public type CreditCodeStatus = { #active; #redeemed };
  public type CreditCode = {
    code : Text;
    amount : Float;
    status : CreditCodeStatus;
    createdAt : Time.Time;
    redeemedBy : ?Principal;
    redeemedAt : ?Time.Time;
  };

  // NEW V2 TYPES (email-keyed, for multi-user support)
  public type PaymentSettingsV2 = {
    upiId : Text;
    qrCodeData : Text;
    bankAccountHolder : Text;
    bankName : Text;
    bankAccountNumber : Text;
    bankIfsc : Text;
  };

  public type DepositRequestV2 = {
    id : Text;
    userEmail : Text;
    amount : Float;
    utrNumber : ?Text;
    status : DepositStatus;
    requestTime : Time.Time;
  };

  public type WithdrawalRequestV2 = {
    id : Text;
    userEmail : Text;
    amount : Float;
    status : WithdrawalStatus;
    requestTime : Time.Time;
    withdrawalMethod : WithdrawalMethod;
    upiId : ?Text;
    bankName : ?Text;
    accountNumber : ?Text;
    ifscCode : ?Text;
  };

  public type CreditCodeV2 = {
    code : Text;
    amount : Float;
    status : CreditCodeStatus;
    createdAt : Time.Time;
    redeemedBy : ?Text;
    redeemedAt : ?Time.Time;
  };

  public type OrderV2 = {
    id : Text;
    userEmail : Text;
    symbol : Text;
    quantity : Float;
    price : Float;
    orderType : OrderType;
    tradeType : TradeType;
    side : Side;
    status : OrderStatus;
    marginUsed : Float;
    timestamp : Time.Time;
  };

  // SORTING MODULES
  module Instrument {
    public func compare(i1 : Instrument, i2 : Instrument) : Order.Order {
      Text.compare(i1.symbol, i2.symbol);
    };
  };

  module PositionSummary {
    public func compare(s1 : PositionSummary, s2 : PositionSummary) : Order.Order {
      Text.compare(s1.symbol, s2.symbol);
    };
  };

  // ADMIN EMAIL AUTH
  let adminEmail = "aman.mishra.04122000@gmail.com";
  let defaultAdminPrincipal = Principal.fromText("2vxsx-fae");

  // INSTRUMENT MAP (unchanged)
  let instrumentsMap = Map.empty<Text, Instrument>();

  // LEGACY MAPS (kept for upgrade compatibility, not used for new users)
  let usersMap = Map.empty<Principal, User>();
  let watchlistsMap = Map.empty<Principal, Set.Set<Text>>();
  let ordersMap = Map.empty<Text, Order>();
  let positionsMap = Map.empty<Principal, Map.Map<Text, Position>>();
  let withdrawalRequestsMap = Map.empty<Text, WithdrawalRequest>();
  let depositRequestsMap = Map.empty<Text, DepositRequest>();
  var paymentSettings : ?PaymentSettings = null;
  let passwordsMap = Map.empty<Text, Text>();
  let sessionsMap = Map.empty<Text, Principal>();
  let emailToPrincipalMap = Map.empty<Text, Principal>();
  var appSettings : ?AppSettings = null;
  let creditCodesMap = Map.empty<Text, CreditCode>();

  // NEW V2 MAPS (email-keyed for multi-user support)
  let usersByEmail = Map.empty<Text, User>();
  let watchlistsByEmail = Map.empty<Text, Set.Set<Text>>();
  let positionsByEmail = Map.empty<Text, Map.Map<Text, Position>>();
  let ordersV2Map = Map.empty<Text, OrderV2>();
  let depositRequestsV2Map = Map.empty<Text, DepositRequestV2>();
  let withdrawalRequestsV2Map = Map.empty<Text, WithdrawalRequestV2>();
  let emailPasswordsMap = Map.empty<Text, Text>();
  let emailSessionsMap = Map.empty<Text, Text>(); // token -> email
  let creditCodesV2Map = Map.empty<Text, CreditCodeV2>();
  var paymentSettingsV2 : ?PaymentSettingsV2 = null;

  // HELPERS
  func isAdminEmail(email : Text) : Bool { email == adminEmail };

  func requireEmailFromSession(token : Text) : Text {
    switch (emailSessionsMap.get(token)) {
      case (null) { Runtime.trap("Invalid or expired session") };
      case (?email) { email };
    };
  };

  func getCurrentPrice(symbol : Text) : Float {
    switch (instrumentsMap.get(symbol)) {
      case (null) { Runtime.trap("Instrument not found") };
      case (?i) { i.currentPrice };
    };
  };

  func calculateMargin(price : Float, quantity : Float, leverage : Float) : Float {
    (price * quantity) / leverage;
  };

  // ─── NEW V2 AUTH ──────────────────────────────────────────────────────────

  public shared func registerUserWithPassword(name : Text, email : Text, mobile : Text, password : Text) : async () {
    if (usersByEmail.containsKey(email)) { Runtime.trap("User already registered") };
    if (name.trim(#char ' ').size() == 0 or email.trim(#char ' ').size() == 0 or mobile.trim(#char ' ').size() == 0) {
      Runtime.trap("Name, email, and mobile cannot be empty");
    };
    if (password.size() == 0) { Runtime.trap("Password cannot be empty") };
    let user : User = { name; email; mobile; balance = 0.0 };
    usersByEmail.add(email, user);
    watchlistsByEmail.add(email, Set.empty<Text>());
    positionsByEmail.add(email, Map.empty<Text, Position>());
    emailPasswordsMap.add(email, password);
  };

  public shared func loginFull(email : Text, password : Text) : async (Text, User, Bool) {
    let user = switch (usersByEmail.get(email)) {
      case (null) { Runtime.trap("Invalid email or password") };
      case (?u) { u };
    };
    switch (emailPasswordsMap.get(email)) {
      case (null) { Runtime.trap("Invalid email or password") };
      case (?storedPw) {
        if (storedPw != password) { Runtime.trap("Invalid email or password") };
      };
    };
    let token = "sess-" # email # "-" # Time.now().toText();
    emailSessionsMap.add(token, email);
    (token, user, isAdminEmail(email));
  };

  public query func getSessionFull(token : Text) : async ?(User, Bool) {
    switch (emailSessionsMap.get(token)) {
      case (null) { null };
      case (?email) {
        switch (usersByEmail.get(email)) {
          case (null) { null };
          case (?user) { ?(user, isAdminEmail(email)) };
        };
      };
    };
  };

  public shared func logoutByToken(token : Text) : async () {
    emailSessionsMap.remove(token);
  };

  public query func isAdminByToken(token : Text) : async Bool {
    switch (emailSessionsMap.get(token)) {
      case (null) { false };
      case (?email) { isAdminEmail(email) };
    };
  };

  // ─── INSTRUMENTS ──────────────────────────────────────────────────────────

  public shared ({ caller }) func createInstrument(symbol : Text, name : Text, category : Category, currentPrice : Float, previousClose : Float) : async () {
    if (symbol.trim(#char ' ').size() == 0 or name.trim(#char ' ').size() == 0) {
      Runtime.trap("Symbol and name must not be empty");
    };
    let pct = if (previousClose == 0.0) { 0.0 } else { ((currentPrice - previousClose) / previousClose) * 100 };
    instrumentsMap.add(symbol, { symbol; name; category; currentPrice; previousClose; priceChangePercent = pct });
  };

  public query func getAllInstruments() : async [Instrument] {
    instrumentsMap.values().toArray().sort();
  };

  public query func getInstrumentsByCategory(category : Category) : async [Instrument] {
    instrumentsMap.values().filter(func(i) { i.category == category }).toArray();
  };

  public shared func updateInstrumentPrice(update : InstrumentUpdate) : async () {
    let instrument = switch (instrumentsMap.get(update.symbol)) {
      case (null) { Runtime.trap("Instrument not found") };
      case (?i) { i };
    };
    let pct = if (update.previousClose == 0.0) { 0.0 } else { ((update.currentPrice - update.previousClose) / update.previousClose) * 100 };
    instrumentsMap.add(update.symbol, { symbol = instrument.symbol; name = instrument.name; category = instrument.category; currentPrice = update.currentPrice; previousClose = update.previousClose; priceChangePercent = pct });
  };

  public shared func deleteInstrument(symbol : Text) : async () {
    if (not instrumentsMap.containsKey(symbol)) { Runtime.trap("Instrument does not exist") };
    instrumentsMap.remove(symbol);
  };

  // ─── USER PROFILE ─────────────────────────────────────────────────────────

  public query func getUserProfile() : async User {
    Runtime.trap("Please pass token: use getUserProfileByToken");
  };

  public query func getUserProfileByToken(token : Text) : async User {
    let email = switch (emailSessionsMap.get(token)) {
      case (null) { Runtime.trap("Invalid session") };
      case (?e) { e };
    };
    switch (usersByEmail.get(email)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) { user };
    };
  };

  public query func getAvailableBalance() : async Float {
    Runtime.trap("Please pass token: use getAvailableBalanceByToken");
  };

  public query func getAvailableBalanceByToken(token : Text) : async Float {
    let email = switch (emailSessionsMap.get(token)) {
      case (null) { Runtime.trap("Invalid session") };
      case (?e) { e };
    };
    switch (usersByEmail.get(email)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) { user.balance };
    };
  };

  // ─── WATCHLIST ────────────────────────────────────────────────────────────

  public shared func addToWatchlist(token : Text, symbol : Text) : async () {
    let email = requireEmailFromSession(token);
    switch (watchlistsByEmail.get(email)) {
      case (null) {
        let ws = Set.empty<Text>();
        ws.add(symbol);
        watchlistsByEmail.add(email, ws);
      };
      case (?watchlist) { watchlist.add(symbol) };
    };
  };

  public shared func removeFromWatchlist(token : Text, symbol : Text) : async () {
    let email = requireEmailFromSession(token);
    switch (watchlistsByEmail.get(email)) {
      case (null) {};
      case (?watchlist) { watchlist.remove(symbol) };
    };
  };

  public query func getWatchlist(token : Text) : async [Text] {
    let email = switch (emailSessionsMap.get(token)) {
      case (null) { Runtime.trap("Invalid session") };
      case (?e) { e };
    };
    switch (watchlistsByEmail.get(email)) {
      case (null) { [] };
      case (?watchlist) { watchlist.toArray() };
    };
  };

  // ─── TRADING ──────────────────────────────────────────────────────────────

  func executeBuyV2(email : Text, symbol : Text, quantity : Float, tradeType : TradeType) : Float {
    let currentPrice = getCurrentPrice(symbol);
    let margin = switch (tradeType) {
      case (#intraday) { calculateMargin(currentPrice, quantity, 500) };
      case (#carryForward) { calculateMargin(currentPrice, quantity, 100) };
    };
    let userPositions = switch (positionsByEmail.get(email)) {
      case (null) {
        let p = Map.empty<Text, Position>();
        positionsByEmail.add(email, p);
        p;
      };
      case (?p) { p };
    };
    let newPosition = switch (userPositions.get(symbol)) {
      case (null) { { symbol; quantity; avgBuyPrice = currentPrice; tradeType; marginUsed = margin; unrealizedPnL = 0.0; timestamp = Time.now() } };
      case (?pos) {
        let totalQty = pos.quantity + quantity;
        let newAvg = ((pos.quantity * pos.avgBuyPrice) + (quantity * currentPrice)) / totalQty;
        { symbol; quantity = totalQty; avgBuyPrice = newAvg; tradeType; marginUsed = pos.marginUsed + margin; unrealizedPnL = pos.unrealizedPnL; timestamp = Time.now() };
      };
    };
    userPositions.add(symbol, newPosition);
    margin;
  };

  func executeSellV2(email : Text, symbol : Text, quantity : Float, tradeType : TradeType) : (Float, Float, Float) {
    let currentPrice = getCurrentPrice(symbol);
    switch (positionsByEmail.get(email)) {
      case (null) { Runtime.trap("No positions found for user") };
      case (?userPositions) {
        switch (userPositions.get(symbol)) {
          case (null) { Runtime.trap("No position found for symbol: " # symbol) };
          case (?pos) {
            if (quantity > pos.quantity) { Runtime.trap("Insufficient quantity to sell") };
            let profit = (currentPrice - pos.avgBuyPrice) * quantity;
            let marginToRelease = pos.marginUsed * (quantity / pos.quantity);
            let margin = switch (tradeType) {
              case (#intraday) { calculateMargin(currentPrice, quantity, 500) };
              case (#carryForward) { calculateMargin(currentPrice, quantity, 100) };
            };
            let remainingQty = pos.quantity - quantity;
            if (remainingQty > 0) {
              userPositions.add(symbol, { symbol = pos.symbol; quantity = remainingQty; avgBuyPrice = pos.avgBuyPrice; tradeType = pos.tradeType; marginUsed = pos.marginUsed - marginToRelease; unrealizedPnL = pos.unrealizedPnL; timestamp = pos.timestamp });
            } else {
              userPositions.remove(symbol);
            };
            (profit, margin, marginToRelease);
          };
        };
      };
    };
  };

  public shared func placeOrder(token : Text, symbol : Text, quantity : Float, price : Float, orderType : OrderType, tradeType : TradeType, side : Side) : async Text {
    let email = requireEmailFromSession(token);
    if (not usersByEmail.containsKey(email)) { Runtime.trap("User does not exist") };

    if (orderType == #limit or orderType == #stopLoss) {
      let orderId = symbol # "-" # email # "-" # Time.now().toText();
      ordersV2Map.add(orderId, { id = orderId; userEmail = email; symbol; quantity; price; orderType; tradeType; side; status = #pending; marginUsed = 0.0; timestamp = Time.now() });
      return orderId;
    };

    var margin = 0.0;
    var profit = 0.0;
    var marginToRelease = 0.0;

    switch (side) {
      case (#buy) {
        margin := executeBuyV2(email, symbol, quantity, tradeType);
        switch (usersByEmail.get(email)) {
          case (null) { Runtime.trap("User not found") };
          case (?user) {
            usersByEmail.add(email, { name = user.name; email = user.email; mobile = user.mobile; balance = user.balance - margin });
          };
        };
      };
      case (#sell) {
        let (p, m, mtr) = executeSellV2(email, symbol, quantity, tradeType);
        profit := p; margin := m; marginToRelease := mtr;
        switch (usersByEmail.get(email)) {
          case (null) { Runtime.trap("User not found") };
          case (?user) {
            usersByEmail.add(email, { name = user.name; email = user.email; mobile = user.mobile; balance = user.balance + marginToRelease + profit });
          };
        };
      };
    };

    let orderId = symbol # "-" # email # "-" # Time.now().toText();
    ordersV2Map.add(orderId, { id = orderId; userEmail = email; symbol; quantity; price = getCurrentPrice(symbol); orderType; tradeType; side; status = #executed; marginUsed = margin; timestamp = Time.now() });
    orderId;
  };

  public shared func closePosition(token : Text, symbol : Text, quantity : Float) : async () {
    let email = requireEmailFromSession(token);
    switch (positionsByEmail.get(email)) {
      case (null) { Runtime.trap("No positions found for user") };
      case (?userPositions) {
        switch (userPositions.get(symbol)) {
          case (null) { Runtime.trap("No position found for symbol") };
          case (?pos) {
            let newQty = pos.quantity - quantity;
            if (newQty > 0) {
              userPositions.add(symbol, { symbol = pos.symbol; quantity = newQty; avgBuyPrice = pos.avgBuyPrice; tradeType = pos.tradeType; marginUsed = pos.marginUsed * (newQty / pos.quantity); unrealizedPnL = pos.unrealizedPnL; timestamp = pos.timestamp });
            } else {
              userPositions.remove(symbol);
            };
          };
        };
      };
    };
  };

  public query func getPortfolioSummary(token : Text) : async PortfolioSummary {
    let email = switch (emailSessionsMap.get(token)) {
      case (null) { Runtime.trap("Invalid session") };
      case (?e) { e };
    };
    switch (usersByEmail.get(email)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        var totalInvested = 0.0;
        var currentValue = 0.0;
        var marginUsed = 0.0;
        switch (positionsByEmail.get(email)) {
          case (null) {};
          case (?userPositions) {
            for ((sym, pos) in userPositions.entries()) {
              totalInvested += pos.quantity * pos.avgBuyPrice;
              currentValue += pos.quantity * getCurrentPrice(sym);
              marginUsed += pos.marginUsed;
            };
          };
        };
        { totalInvested; currentValue; totalPnL = currentValue - totalInvested; availableBalance = user.balance; marginUsed; marginAvailable = user.balance - marginUsed };
      };
    };
  };

  public query func getOpenPositions(token : Text) : async [PositionSummary] {
    let email = switch (emailSessionsMap.get(token)) {
      case (null) { Runtime.trap("Invalid session") };
      case (?e) { e };
    };
    switch (positionsByEmail.get(email)) {
      case (null) { [] };
      case (?userPositions) {
        userPositions.values().toArray().map(func(pos) {
          { symbol = pos.symbol; quantity = pos.quantity; avgBuyPrice = pos.avgBuyPrice; tradeType = pos.tradeType; marginUsed = pos.marginUsed; unrealizedPnL = (getCurrentPrice(pos.symbol) - pos.avgBuyPrice) * pos.quantity };
        }).sort();
      };
    };
  };

  public query func getOrders(token : Text) : async [OrderV2] {
    let email = switch (emailSessionsMap.get(token)) {
      case (null) { Runtime.trap("Invalid session") };
      case (?e) { e };
    };
    ordersV2Map.values().filter(func(o) { o.userEmail == email }).toArray();
  };

  // ─── DEPOSITS ─────────────────────────────────────────────────────────────

  public shared func requestDeposit(token : Text, amount : Float) : async Text {
    let email = requireEmailFromSession(token);
    if (not usersByEmail.containsKey(email)) { Runtime.trap("User does not exist") };
    if (amount < 500.0) { Runtime.trap("Minimum deposit is 500") };
    let requestId = "dr-" # email # "-" # Time.now().toText();
    depositRequestsV2Map.add(requestId, { id = requestId; userEmail = email; amount; utrNumber = null; status = #pending; requestTime = Time.now() });
    requestId;
  };

  public shared func submitDepositUtr(token : Text, requestId : Text, utrNumber : Text) : async () {
    let email = requireEmailFromSession(token);
    switch (depositRequestsV2Map.get(requestId)) {
      case (null) { Runtime.trap("Deposit request not found") };
      case (?request) {
        if (request.userEmail != email) { Runtime.trap("Not your deposit request") };
        if (request.status != #pending) { Runtime.trap("Can only submit UTR for pending requests") };
        depositRequestsV2Map.add(requestId, { id = request.id; userEmail = request.userEmail; amount = request.amount; utrNumber = ?utrNumber; status = #pending; requestTime = request.requestTime });
      };
    };
  };

  public query func getDepositRequests(token : Text) : async [DepositRequestV2] {
    let email = switch (emailSessionsMap.get(token)) {
      case (null) { Runtime.trap("Invalid session") };
      case (?e) { e };
    };
    depositRequestsV2Map.values().filter(func(r) { r.userEmail == email }).toArray();
  };

  // ─── WITHDRAWALS ──────────────────────────────────────────────────────────

  public shared func requestWithdrawal(token : Text, amount : Float, withdrawalMethod : WithdrawalMethod, upiId : ?Text, bankName : ?Text, accountNumber : ?Text, ifscCode : ?Text) : async Text {
    let email = requireEmailFromSession(token);
    switch (usersByEmail.get(email)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?user) {
        if (amount < 500.0) { Runtime.trap("Minimum withdrawal is 500") };
        if (user.balance < amount) { Runtime.trap("Insufficient balance") };
        let requestId = "wr-" # email # "-" # Time.now().toText();
        withdrawalRequestsV2Map.add(requestId, { id = requestId; userEmail = email; amount; status = #pending; requestTime = Time.now(); withdrawalMethod; upiId; bankName; accountNumber; ifscCode });
        usersByEmail.add(email, { name = user.name; email = user.email; mobile = user.mobile; balance = user.balance - amount });
        requestId;
      };
    };
  };

  public query func getWithdrawalRequests(token : Text) : async [WithdrawalRequestV2] {
    let email = switch (emailSessionsMap.get(token)) {
      case (null) { Runtime.trap("Invalid session") };
      case (?e) { e };
    };
    withdrawalRequestsV2Map.values().filter(func(r) { r.userEmail == email }).toArray();
  };

  // ─── CREDIT CODES ─────────────────────────────────────────────────────────

  public shared func redeemCreditCode(token : Text, code : Text) : async () {
    let email = requireEmailFromSession(token);
    switch (creditCodesV2Map.get(code)) {
      case (null) { Runtime.trap("Code not found") };
      case (?cc) {
        if (cc.status != #active) { Runtime.trap("Code has already been redeemed") };
        if (not usersByEmail.containsKey(email)) { Runtime.trap("User does not exist") };
        creditCodesV2Map.add(code, { code = cc.code; amount = cc.amount; status = #redeemed; createdAt = cc.createdAt; redeemedBy = ?email; redeemedAt = ?Time.now() });
        switch (usersByEmail.get(email)) {
          case (null) { Runtime.trap("User not found") };
          case (?user) {
            usersByEmail.add(email, { name = user.name; email = user.email; mobile = user.mobile; balance = user.balance + cc.amount });
          };
        };
      };
    };
  };

  // ─── PAYMENT SETTINGS ─────────────────────────────────────────────────────

  public shared func setPaymentSettings(token : Text, upiId : Text, qrCodeData : Text, bankAccountHolder : Text, bankName : Text, bankAccountNumber : Text, bankIfsc : Text) : async () {
    let email = requireEmailFromSession(token);
    if (not isAdminEmail(email)) { Runtime.trap("Only admin can update payment settings") };
    paymentSettingsV2 := ?{ upiId; qrCodeData; bankAccountHolder; bankName; bankAccountNumber; bankIfsc };
  };

  public query func getPaymentSettings() : async ?PaymentSettingsV2 {
    paymentSettingsV2;
  };

  // ─── APP SETTINGS ─────────────────────────────────────────────────────────

  public query func getAppSettings() : async AppSettings {
    switch (appSettings) {
      case (?s) { s };
      case (null) { { termsText = "Default terms"; privacyText = "Default privacy"; stockGainColor = "#00FF00"; stockLossColor = "#FF0000" } };
    };
  };

  public shared func updateAppSettings(token : Text, termsText : Text, privacyText : Text, stockGainColor : Text, stockLossColor : Text) : async () {
    let email = requireEmailFromSession(token);
    if (not isAdminEmail(email)) { Runtime.trap("Only admin can update app settings") };
    appSettings := ?{ termsText; privacyText; stockGainColor; stockLossColor };
  };

  // ─── ADMIN FUNCTIONS ──────────────────────────────────────────────────────

  public shared func getAdminStats(token : Text) : async AdminStats {
    let email = requireEmailFromSession(token);
    if (not isAdminEmail(email)) { Runtime.trap("Only admin can access this function") };
    { totalUsers = usersByEmail.size(); totalInstruments = instrumentsMap.size(); totalOrders = ordersV2Map.size() };
  };

  public shared func getAllUsers(token : Text) : async [(Text, User)] {
    let email = requireEmailFromSession(token);
    if (not isAdminEmail(email)) { Runtime.trap("Only admin can access this function") };
    usersByEmail.toArray();
  };

  public shared func getAllOrders(token : Text) : async [OrderV2] {
    let email = requireEmailFromSession(token);
    if (not isAdminEmail(email)) { Runtime.trap("Only admin can access this function") };
    ordersV2Map.values().toArray();
  };

  public shared func getAllWithdrawalRequests(token : Text) : async [WithdrawalRequestV2] {
    let email = requireEmailFromSession(token);
    if (not isAdminEmail(email)) { Runtime.trap("Only admin can access this function") };
    withdrawalRequestsV2Map.values().toArray();
  };

  public shared func approveWithdrawal(token : Text, requestId : Text) : async () {
    let email = requireEmailFromSession(token);
    if (not isAdminEmail(email)) { Runtime.trap("Only admin can access this function") };
    switch (withdrawalRequestsV2Map.get(requestId)) {
      case (null) { Runtime.trap("Withdrawal request not found") };
      case (?request) {
        if (request.status != #pending) { Runtime.trap("Only pending requests can be approved") };
        withdrawalRequestsV2Map.add(requestId, { id = request.id; userEmail = request.userEmail; amount = request.amount; status = #approved; requestTime = request.requestTime; withdrawalMethod = request.withdrawalMethod; upiId = request.upiId; bankName = request.bankName; accountNumber = request.accountNumber; ifscCode = request.ifscCode });
      };
    };
  };

  public shared func rejectWithdrawal(token : Text, requestId : Text) : async () {
    let email = requireEmailFromSession(token);
    if (not isAdminEmail(email)) { Runtime.trap("Only admin can access this function") };
    switch (withdrawalRequestsV2Map.get(requestId)) {
      case (null) { Runtime.trap("Withdrawal request not found") };
      case (?request) {
        if (request.status != #pending) { Runtime.trap("Only pending requests can be rejected") };
        withdrawalRequestsV2Map.add(requestId, { id = request.id; userEmail = request.userEmail; amount = request.amount; status = #rejected; requestTime = request.requestTime; withdrawalMethod = request.withdrawalMethod; upiId = request.upiId; bankName = request.bankName; accountNumber = request.accountNumber; ifscCode = request.ifscCode });
        switch (usersByEmail.get(request.userEmail)) {
          case (null) {};
          case (?user) {
            usersByEmail.add(request.userEmail, { name = user.name; email = user.email; mobile = user.mobile; balance = user.balance + request.amount });
          };
        };
      };
    };
  };

  public shared func getAllDepositRequests(token : Text) : async [DepositRequestV2] {
    let email = requireEmailFromSession(token);
    if (not isAdminEmail(email)) { Runtime.trap("Only admin can access this function") };
    depositRequestsV2Map.values().toArray();
  };

  public shared func approveDeposit(token : Text, requestId : Text) : async () {
    let email = requireEmailFromSession(token);
    if (not isAdminEmail(email)) { Runtime.trap("Only admin can access this function") };
    switch (depositRequestsV2Map.get(requestId)) {
      case (null) { Runtime.trap("Deposit request not found") };
      case (?request) {
        if (request.status != #pending) { Runtime.trap("Only pending requests can be approved") };
        depositRequestsV2Map.add(requestId, { id = request.id; userEmail = request.userEmail; amount = request.amount; utrNumber = request.utrNumber; status = #approved; requestTime = request.requestTime });
        switch (usersByEmail.get(request.userEmail)) {
          case (null) {};
          case (?user) {
            usersByEmail.add(request.userEmail, { name = user.name; email = user.email; mobile = user.mobile; balance = user.balance + request.amount });
          };
        };
      };
    };
  };

  public shared func rejectDeposit(token : Text, requestId : Text) : async () {
    let email = requireEmailFromSession(token);
    if (not isAdminEmail(email)) { Runtime.trap("Only admin can access this function") };
    switch (depositRequestsV2Map.get(requestId)) {
      case (null) { Runtime.trap("Deposit request not found") };
      case (?request) {
        if (request.status != #pending) { Runtime.trap("Only pending requests can be rejected") };
        depositRequestsV2Map.add(requestId, { id = request.id; userEmail = request.userEmail; amount = request.amount; utrNumber = request.utrNumber; status = #rejected; requestTime = request.requestTime });
      };
    };
  };

  public shared func adjustUserBalance(token : Text, targetEmail : Text, amount : Float, isDeduct : Bool) : async () {
    let email = requireEmailFromSession(token);
    if (not isAdminEmail(email)) { Runtime.trap("Only admin can adjust user balance") };
    switch (usersByEmail.get(targetEmail)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        let newBalance = if (isDeduct) {
          if (user.balance < amount) { Runtime.trap("Insufficient balance for deduction") };
          user.balance - amount;
        } else { user.balance + amount };
        usersByEmail.add(targetEmail, { name = user.name; email = user.email; mobile = user.mobile; balance = newBalance });
      };
    };
  };

  public shared func adminResetPassword(token : Text, targetEmail : Text, newPassword : Text) : async () {
    let email = requireEmailFromSession(token);
    if (not isAdminEmail(email)) { Runtime.trap("Only admin can reset passwords") };
    if (not usersByEmail.containsKey(targetEmail)) { Runtime.trap("User not found") };
    emailPasswordsMap.add(targetEmail, newPassword);
  };

  public shared func getAllPositions(token : Text) : async [(Text, [PositionSummary])] {
    let email = requireEmailFromSession(token);
    if (not isAdminEmail(email)) { Runtime.trap("Only admin can view all positions") };
    positionsByEmail.toArray().map(func((userEmail, userPositions)) {
      let summaries = userPositions.values().toArray().map(func(pos) {
        { symbol = pos.symbol; quantity = pos.quantity; avgBuyPrice = pos.avgBuyPrice; tradeType = pos.tradeType; marginUsed = pos.marginUsed; unrealizedPnL = (getCurrentPrice(pos.symbol) - pos.avgBuyPrice) * pos.quantity };
      });
      (userEmail, summaries.sort());
    });
  };

  public shared func adminClosePosition(token : Text, targetEmail : Text, symbol : Text) : async () {
    let email = requireEmailFromSession(token);
    if (not isAdminEmail(email)) { Runtime.trap("Only admin can close positions") };
    switch (positionsByEmail.get(targetEmail)) {
      case (null) { Runtime.trap("No positions found for user") };
      case (?userPositions) {
        switch (userPositions.get(symbol)) {
          case (null) { Runtime.trap("No position found for symbol") };
          case (?pos) {
            userPositions.remove(symbol);
            switch (usersByEmail.get(targetEmail)) {
              case (null) {};
              case (?user) {
                usersByEmail.add(targetEmail, { name = user.name; email = user.email; mobile = user.mobile; balance = user.balance + pos.marginUsed });
              };
            };
          };
        };
      };
    };
  };

  public shared func adminEditPosition(token : Text, targetEmail : Text, symbol : Text, newQuantity : Float, newAvgPrice : Float) : async () {
    let email = requireEmailFromSession(token);
    if (not isAdminEmail(email)) { Runtime.trap("Only admin can edit positions") };
    switch (positionsByEmail.get(targetEmail)) {
      case (null) { Runtime.trap("No positions found for user") };
      case (?userPositions) {
        switch (userPositions.get(symbol)) {
          case (null) { Runtime.trap("No position found for symbol") };
          case (?pos) {
            userPositions.add(symbol, { symbol = pos.symbol; quantity = newQuantity; avgBuyPrice = newAvgPrice; tradeType = pos.tradeType; marginUsed = if (pos.tradeType == #intraday) { calculateMargin(newAvgPrice, newQuantity, 500) } else { calculateMargin(newAvgPrice, newQuantity, 100) }; unrealizedPnL = pos.unrealizedPnL; timestamp = pos.timestamp });
          };
        };
      };
    };
  };

  // ─── CREDIT CODES ADMIN ───────────────────────────────────────────────────

  public shared func createCreditCode(token : Text, code : Text, amount : Float) : async () {
    let email = requireEmailFromSession(token);
    if (not isAdminEmail(email)) { Runtime.trap("Only admin can create credit codes") };
    if (code.trim(#char ' ').size() == 0) { Runtime.trap("Code cannot be empty") };
    if (amount <= 0) { Runtime.trap("Amount must be greater than 0") };
    if (creditCodesV2Map.containsKey(code)) { Runtime.trap("Code already exists") };
    creditCodesV2Map.add(code, { code; amount; status = #active; createdAt = Time.now(); redeemedBy = null; redeemedAt = null });
  };

  public shared func getAllCreditCodes(token : Text) : async [CreditCodeV2] {
    let email = requireEmailFromSession(token);
    if (not isAdminEmail(email)) { Runtime.trap("Only admin can access this function") };
    creditCodesV2Map.values().toArray();
  };

  public shared func deleteCreditCode(token : Text, code : Text) : async () {
    let email = requireEmailFromSession(token);
    if (not isAdminEmail(email)) { Runtime.trap("Only admin can delete credit codes") };
    switch (creditCodesV2Map.get(code)) {
      case (null) { Runtime.trap("Code not found") };
      case (?cc) {
        if (cc.status != #active) { Runtime.trap("Only active codes can be deleted") };
        creditCodesV2Map.remove(code);
      };
    };
  };

  // ─── LEGACY STUBS ─────────────────────────────────────────────────────────

  public shared ({ caller }) func registerUser(name : Text, email : Text, mobile : Text) : async () {
    Runtime.trap("Please use registerUserWithPassword");
  };

  public shared ({ caller }) func deposit(amount : Float) : async () {
    Runtime.trap("Please use requestDeposit with a session token");
  };

  public query ({ caller }) func isAdminUser(p : Principal) : async Bool {
    false;
  };

  public shared ({ caller }) func authenticate(userPrincipal : Principal) : async Bool {
    false;
  };

  public shared ({ caller }) func authenticateAdmin(userPrincipal : Principal) : async Bool {
    false;
  };

  public shared ({ caller }) func loginWithPassword(email : Text, password : Text) : async Text {
    let (token, _, _) = await loginFull(email, password);
    token;
  };

  public query func getProfileByToken(token : Text) : async User {
    switch (emailSessionsMap.get(token)) {
      case (null) { Runtime.trap("Invalid session") };
      case (?email) {
        switch (usersByEmail.get(email)) {
          case (null) { Runtime.trap("User not found") };
          case (?user) { user };
        };
      };
    };
  };

  public query func getUserByToken(token : Text) : async (Principal, User) {
    switch (emailSessionsMap.get(token)) {
      case (null) { Runtime.trap("Invalid session") };
      case (?email) {
        switch (usersByEmail.get(email)) {
          case (null) { Runtime.trap("User not found") };
          case (?user) { (defaultAdminPrincipal, user) };
        };
      };
    };
  };
};
