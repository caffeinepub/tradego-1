# TradeGo.1

## Current State
- Full-stack trading app with Motoko backend and React frontend
- Markets page shows instruments with simulated live prices (fluctuating from stored prices)
- OptionChain page has index configs with March 2026 approximate data (NIFTY ~22124, SENSEX ~73218, BANKNIFTY ~47386)
- Positions page shows Open Positions tab and Order History tab
- Order History shows: Time, Symbol, Side, Type, Price, Qty, Status
- Open Positions shows: Symbol, Qty, Avg Price, LTP, P&L (unrealized), Trade Type, Close button
- Prices are seeded into backend at instrument creation (prior data, not March 3 2026)

## Requested Changes (Diff)

### Add
- March 3, 2026 accurate prices for ALL instruments (NSE stocks, crypto, forex, commodities)
- Updated Option Chain spot prices for March 3, 2026: NIFTY ~22,800, SENSEX ~75,200, BANKNIFTY ~49,100
- Updated option chain expiry dates: Weekly (05 Mar 2026), Monthly (26 Mar 2026), Quarterly (25 Jun 2026)
- Complete Trade History page/tab with full P&L details:
  - Entry price, exit price (for closed trades), quantity, trade date/time
  - Current status (Open/Closed/Cancelled/Rejected)
  - Realized P&L for closed trades (exit price - entry price) * qty
  - Unrealized P&L for open trades calculated from live market prices
  - P&L % return column
  - Summary cards: Total P&L, Realized P&L, Unrealized P&L, Win Rate
- "Trade History" renamed/retitled clearly in Positions page — the history tab should show all trade details including entry/exit prices and P&L

### Modify
- OptionChain INDEX_CONFIGS: update spotPrice, atmStrike values to March 3, 2026 levels
- OptionChain expiry options: update date labels to March 2026
- Positions page Order History tab: enhance to show entry price, exit price (current market price for open, order price for closed), quantity, date, status, P&L per trade
- Seed prices in backend instruments updated to March 3, 2026 values for all markets
- useLivePrices: prices start from the March 3, 2026 base values loaded from backend

### Remove
- Nothing removed

## Implementation Plan

1. **Update OptionChain.tsx**:
   - Set NIFTY spotPrice: 22800, atmStrike: 22800, strikeStep: 50
   - Set SENSEX spotPrice: 75200, atmStrike: 75200, strikeStep: 200
   - Set BANKNIFTY spotPrice: 49100, atmStrike: 49100, strikeStep: 100
   - Update expiry labels to "05 Mar 2026", "26 Mar 2026", "25 Jun 2026"

2. **Enhance Positions.tsx Trade History tab**:
   - Rename "Order History" tab to "Trade History"
   - For each order, compute P&L:
     - For executed buy orders: P&L = (currentLTP - order.price) * order.quantity (unrealized if position still open)
     - For executed sell/close orders: P&L = (order.price - entry_price) * qty — derive from order pairs
     - Show entry price (order.price for buy orders), exit price (current LTP for open, sell order price for closed)
   - Add columns: Entry Price, Exit Price, P&L (₹), P&L %, Status
   - Add summary row/cards at top: Total Realized P&L, Unrealized P&L, Total Trades, Win Rate
   - Color-code P&L: green for profit, red for loss

3. **Update March 3, 2026 prices in backend seed data**:
   - NSE stocks: RELIANCE 1320, TCS 3640, INFY 1812, HDFCBANK 1648, ICICIBANK 1295, SBIN 798, WIPRO 287, TATAMOTORS 745, BAJFINANCE 9180, NIFTY50 22800
   - Crypto: BTC 7185000 (₹71.85L), ETH 220000, BNB 55800, SOL 18200, XRP 245
   - Forex: USDINR 87.40, EURINR 95.30, GBPINR 110.20, JPYINR 0.5820, AUDINR 54.80
   - Commodities: GOLD 86200, SILVER 96800, CRUDEOIL 6450, NATURALGAS 278, COPPER 795
   - Frontend seedInstruments function should use these March 3, 2026 prices

4. **All price labels should show "As of March 3, 2026" indicator** in Markets and OptionChain headers
