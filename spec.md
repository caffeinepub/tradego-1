# TradeGo.1

## Current State
The app uses email/password authentication but internally keys all user data by `caller` (Motoko Principal). Since the frontend uses an anonymous actor (no Internet Identity), all calls share the same anonymous principal (`2vxsx-fae`). This means:
- Only ONE user can ever register (second registration is blocked by `usersMap.containsKey(caller)`)
- Login fails after the first user since `emailToPrincipalMap` maps all emails to the same anonymous principal
- All user data (positions, watchlists, orders, balances, withdrawals, deposits) collides

## Requested Changes (Diff)

### Add
- `usersByEmail` map keyed by email (Text) for all user lookups
- `watchlistsByEmail`, `positionsByEmail`, `ordersByEmail` maps keyed by email
- `withdrawalsByEmail`, `depositsByEmail` maps for user-scoped data
- Token-to-email map (`sessionsEmailMap`) so all session lookups return email, not principal
- `getSessionFullByEmail` that works with email-keyed data

### Modify
- `registerUserWithPassword`: remove `usersMap` (Principal-keyed), store in `usersByEmail`; generate unique "user-{timestamp}" pseudo-principal per user for internal ID
- `loginFull`: look up user by email, verify password, create token mapping to email
- All user-scoped queries (portfolio, positions, orders, watchlist, deposits, withdrawals): look up user via session token → email → data maps
- `placeOrder`, `executeBuy`, `executeSell`: use email-keyed positions
- Admin functions: iterate email-keyed maps
- `redeemCreditCode`, `requestDeposit`, `requestWithdrawal`: use token param to identify caller
- All shared functions that use `caller` as user identity: switch to token-based lookup

### Remove
- `usersMap` (Principal-keyed) - replaced by `usersByEmail`
- `watchlistsMap` (Principal-keyed) - replaced by `watchlistsByEmail`
- `positionsMap` (Principal-keyed) - replaced by `positionsByEmail`
- `emailToPrincipalMap` - no longer needed
- `sessionsMap` (token → Principal) - replaced by token → email map

## Implementation Plan
1. Rewrite backend main.mo with email as primary key throughout
2. Update all session/auth functions to use token → email → data pattern
3. Update frontend to pass session token for user-scoped operations (placeOrder, deposit, withdraw, watchlist, positions)
4. Update backend.d.ts to reflect new function signatures
5. Update frontend hooks and pages to pass token where required
