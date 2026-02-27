import Map "mo:core/Map";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Float "mo:core/Float";

module {
  // Types from previous version
  type OldCategory = { #stock; #crypto; #forex; #commodity };
  type OldOrderType = { #market; #limit; #stopLoss };
  type OldTradeType = { #intraday; #carryForward };
  type OldSide = { #buy; #sell };
  type OldOrderStatus = { #pending; #executed; #cancelled; #rejected };
  type OldWithdrawalStatus = { #pending; #approved; #rejected };

  type OldInstrument = {
    symbol : Text;
    name : Text;
    category : OldCategory;
    currentPrice : Float;
    previousClose : Float;
    priceChangePercent : Float;
  };

  type OldUser = {
    name : Text;
    email : Text;
    mobile : Text;
    balance : Float;
  };

  type OldOrder = {
    id : Text;
    user : Principal;
    symbol : Text;
    quantity : Float;
    price : Float;
    orderType : OldOrderType;
    tradeType : OldTradeType;
    side : OldSide;
    status : OldOrderStatus;
    marginUsed : Float;
    timestamp : Time.Time;
  };

  type OldPosition = {
    symbol : Text;
    quantity : Float;
    avgBuyPrice : Float;
    tradeType : OldTradeType;
    marginUsed : Float;
    unrealizedPnL : Float;
    timestamp : Time.Time;
  };

  type OldInstrumentUpdate = {
    symbol : Text;
    currentPrice : Float;
    previousClose : Float;
  };

  type OldWithdrawalRequest = {
    id : Text;
    user : Principal;
    amount : Float;
    status : OldWithdrawalStatus;
    requestTime : Time.Time;
  };

  // New types
  type Category = { #stock; #crypto; #forex; #commodity };
  type OrderType = { #market; #limit; #stopLoss };
  type TradeType = { #intraday; #carryForward };
  type Side = { #buy; #sell };
  type OrderStatus = { #pending; #executed; #cancelled; #rejected };
  type WithdrawalStatus = { #pending; #approved; #rejected };
  type WithdrawalMethod = { #upi; #bank };

  type Instrument = {
    symbol : Text;
    name : Text;
    category : Category;
    currentPrice : Float;
    previousClose : Float;
    priceChangePercent : Float;
  };

  type User = {
    name : Text;
    email : Text;
    mobile : Text;
    balance : Float;
  };

  type Order = {
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

  type Position = {
    symbol : Text;
    quantity : Float;
    avgBuyPrice : Float;
    tradeType : TradeType;
    marginUsed : Float;
    unrealizedPnL : Float;
    timestamp : Time.Time;
  };

  type WithdrawalRequest = {
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

  type PaymentSettings = {
    upiId : Text;
    qrCodeData : Text;
  };

  // Old and new actor types
  type OldActor = {
    instrumentsMap : Map.Map<Text, OldInstrument>;
    usersMap : Map.Map<Principal, OldUser>;
    watchlistsMap : Map.Map<Principal, Set.Set<Text>>;
    ordersMap : Map.Map<Text, OldOrder>;
    positionsMap : Map.Map<Principal, Map.Map<Text, OldPosition>>;
    withdrawalRequestsMap : Map.Map<Text, OldWithdrawalRequest>;
    adminPrincipal : Principal;
  };

  type NewActor = {
    instrumentsMap : Map.Map<Text, Instrument>;
    usersMap : Map.Map<Principal, User>;
    watchlistsMap : Map.Map<Principal, Set.Set<Text>>;
    ordersMap : Map.Map<Text, Order>;
    positionsMap : Map.Map<Principal, Map.Map<Text, Position>>;
    withdrawalRequestsMap : Map.Map<Text, WithdrawalRequest>;
    paymentSettings : ?PaymentSettings;
  };

  public func run(old : OldActor) : NewActor {
    let withdrawalRequests = old.withdrawalRequestsMap.map<Text, OldWithdrawalRequest, WithdrawalRequest>(
      func(_id, oldRequest) {
        {
          id = oldRequest.id;
          user = oldRequest.user;
          amount = oldRequest.amount;
          status = oldRequest.status;
          requestTime = oldRequest.requestTime;
          withdrawalMethod = #upi;
          upiId = null;
          bankName = null;
          accountNumber = null;
          ifscCode = null;
        };
      }
    );
    {
      instrumentsMap = old.instrumentsMap;
      usersMap = old.usersMap;
      watchlistsMap = old.watchlistsMap;
      ordersMap = old.ordersMap;
      positionsMap = old.positionsMap;
      withdrawalRequestsMap = withdrawalRequests;
      paymentSettings = null;
    };
  };
};
