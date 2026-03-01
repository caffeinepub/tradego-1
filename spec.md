# TradeGo.1

## Current State
Full-stack trading app with admin panel. Admin can manage instruments, users, withdrawals, deposits, and payment settings (UPI/QR). Deposit flow: user enters amount → sees QR/UPI → submits UTR number → admin approves.

## Requested Changes (Diff)

### Add
- **Credit Code system**: Admin can create credit codes (code string + amount). When a client enters a valid credit code in the deposit dialog, their balance is credited instantly (no admin approval needed).
- **Admin Credit Codes tab**: New tab in admin panel to create codes (code + amount), view all existing codes with their status (active/redeemed), and delete unused codes.
- **Client deposit credit code field**: Optional "Have a credit code?" input in the deposit dialog (first step). When a valid code is entered and submitted, balance is credited immediately.

### Modify
- `main.mo`: Add CreditCode type, credit codes map, createCreditCode (admin), redeemCreditCode (user), getCreditCodes (admin), deleteCreditCode (admin).
- `backend.d.ts`: Add CreditCode interface, CreditCodeStatus enum, and new function signatures.
- `AdminPanel.tsx`: Add "Credit Codes" tab with form to create code+amount, table showing all codes (code, amount, status, redeemed by/when), delete button for active codes.
- `Account.tsx`: Add optional credit code input on the deposit amount step. On submit, call redeemCreditCode; if successful, show success and close.

### Remove
- Nothing removed.

## Implementation Plan
1. Add CreditCode type and backend functions to `main.mo`
2. Update `backend.d.ts` with new types and functions
3. Add CreditCodesTab component to `AdminPanel.tsx` with create + list + delete
4. Add credit code input + redemption flow to deposit dialog in `Account.tsx`
5. Wire hooks for new backend functions
