# TradeGo.1

## Current State
Full-stack trading app with email/password auth (no Internet Identity), 1000+ instruments (NSE stocks, crypto, forex, commodities), 500x intraday / 100x carry forward margin, zero brokerage, admin panel with deposit/withdrawal management, QR code upload, credit codes, option chain (Nifty/Sensex/Bank Nifty), market timings enforcement, stop loss/target price, trade history with P&L, PWA install support.

The backend canister keeps entering a "stopped" state (IC0508 error) causing "Server is restarting" errors on login and signup. A fresh canister deployment is needed.

## Requested Changes (Diff)

### Add
- Fresh backend canister deployment (resolves IC0508 "canister stopped" error)
- Frontend: immediate sign-in/sign-up without any blocking spinner or "connecting" delay -- buttons always active, errors shown inline if server unavailable
- Frontend: retry button on connection failure that reloads the page

### Modify
- Backend: regenerate with all existing functionality intact but as a new canister instance
- Frontend App.tsx: reduce actor wait timeout to 5s max, show login form immediately without waiting for actor
- Frontend Registration.tsx: buttons never disabled due to actor loading state; only disable during active form submission

### Remove
- Any "Connecting to server..." loading states that block the user from attempting login/signup

## Implementation Plan
1. Write spec.md (this file)
2. Regenerate Motoko backend (all existing features: email auth, instruments, trading, deposits, withdrawals, admin, credit codes, option chain, settings)
3. Update App.tsx: show login form immediately, reduce timeouts, never block on actor loading
4. Update Registration.tsx: remove isActorLoading disabled state from buttons, always allow form submission
5. Deploy to production
