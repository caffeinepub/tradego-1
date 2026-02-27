# TradeGo.1

## Current State

Full-stack trading app with:
- 25 instruments (stocks, crypto, forex, commodities) with live-simulated prices
- Admin panel accessible by a hardcoded admin principal (currently "2vxsx-fae")
- Admin can: view stats, manage instruments (add/edit/delete), view all users & orders
- Users can: register (name, email, mobile), deposit (min ₹500, instant), request withdrawal (min ₹500, 30-min processing), trade with 500x intraday / 100x carry-forward margin, zero brokerage
- WithdrawalRequest has: id, user, amount, status (pending/approved/rejected), requestTime
- Deposit flow: simple amount entry dialog → directly credits balance (no payment instructions shown)
- Withdraw flow: simple amount entry dialog → no UPI/bank details collected from user
- Admin withdrawal management tab is NOT present in current AdminPanel

## Requested Changes (Diff)

### Add

1. **Admin email-based identification**: Admin is `aman.mishra.04122000@gmail.com`. Since the app uses Internet Identity (no traditional email login), admin identity is still principal-based. Add a new `setAdminEmail` concept: store a mapping of email→principal in backend, and expose `getAdminByEmail` + `setAdminPrincipal` so the admin can log in with II and then be granted access by matching their stored email in user profile. However, since this app uses custom email-based registration (users register with email), the simpler path is: **admin is identified when a logged-in user's registered email equals `aman.mishra.04122000@gmail.com`**. Add a `isAdminUser(principal)` query that checks if that principal's registered email matches the hardcoded admin email.

2. **Payment settings (admin-managed)**:
   - New `PaymentSettings` type: `{ upiId: Text; qrCodeData: Text; qrImageUrl: Text }`
   - Backend: `setPaymentSettings(upiId, qrCodeData)` (admin only)
   - Backend: `getPaymentSettings()` (public query) returns the current UPI ID and QR data
   - Admin panel: new "Payments" tab where admin can set UPI ID and QR code (text-based QR data or image URL)

3. **Deposit flow with payment instructions**:
   - When user initiates deposit, after entering amount they see a "How to pay" modal showing:
     - QR code image (generated from admin-set QR data, or admin-uploaded image URL)
     - UPI ID to copy
     - Amount to pay
     - Instructions: "After payment, click confirm. Your balance will be credited manually by admin."
   - Backend: deposit() still credits balance (admin confirms via the approval flow below), OR keep instant for now and show payment instructions as reference

4. **Withdrawal with UPI/Bank details**:
   - `WithdrawalRequest` extended with: `upiId: Text; bankName: Text; accountNumber: Text; ifscCode: Text; withdrawalMethod: { #upi; #bank }`
   - When user requests withdrawal, they fill:
     - Amount
     - Method: UPI or Bank Transfer
     - If UPI: UPI ID
     - If Bank: Bank Name, Account Number, IFSC Code
   - These details are stored in the withdrawal request and shown in admin panel

5. **Admin Withdrawals tab**:
   - New "Withdrawals" tab in admin panel
   - Shows all withdrawal requests with: user principal, amount, method, UPI ID / bank details, status, requested time
   - Approve / Reject buttons per request

6. **Add 1000 stock instruments (seed)**:
   - Expand seed data from current 25 to include 1000 total instruments across all categories (primarily Indian stocks NSE/BSE)
   - Admin panel: ability to bulk-add instruments via the existing "Add Instrument" form

7. **Add stocks option from admin panel**:
   - Already exists (Add Instrument form in Instruments tab)
   - Ensure it's prominently visible and functional (no change needed)

### Modify

1. **Admin identity check**: Change `authenticateAdmin` to also check if the caller's registered email is `aman.mishra.04122000@gmail.com`. Keep fallback to principal check.

2. **WithdrawalRequest type**: Add `upiId`, `bankName`, `accountNumber`, `ifscCode`, `withdrawalMethod` fields.

3. **requestWithdrawal backend function**: Accept additional parameters: `withdrawalMethod`, `upiId`, `bankName`, `accountNumber`, `ifscCode`.

4. **Account page Withdraw dialog**: Extend to collect method + UPI/bank details.

5. **Account page Deposit dialog**: After amount entry, show payment instructions with QR code and UPI ID fetched from backend.

### Remove

Nothing to remove.

## Implementation Plan

### Backend (Motoko)
1. Add `PaymentSettings` type and a `stable var` to store it
2. Add `setPaymentSettings(upiId: Text, qrCodeData: Text)` - admin only
3. Add `getPaymentSettings()` - public query returning `?PaymentSettings`
4. Add `isAdminUser(principal: Principal)` - checks if registered email == "aman.mishra.04122000@gmail.com"
5. Modify `authenticateAdmin` to also call `isAdminUser`
6. Extend `WithdrawalRequest` type with payment method fields
7. Modify `requestWithdrawal` to accept and store payment method details
8. Keep all existing functions intact
9. Expand seed instruments to 1000 (handled in frontend seedData.ts, not backend)

### Frontend
1. Update `backend.d.ts` (auto-generated from new Motoko)
2. Update `useQueries.ts`: add `useGetPaymentSettings`, `useSetPaymentSettings`, update `useRequestWithdrawal`
3. Update `Account.tsx`:
   - Deposit dialog: after amount confirmed, show step 2 with QR code + UPI ID from backend
   - Withdraw dialog: add method selection + UPI/bank fields
4. Update `AdminPanel.tsx`:
   - Add "Withdrawals" tab: table with all withdrawal requests + approve/reject actions
   - Add "Payments" tab: form to set UPI ID and QR code data
   - Update nav items
5. Update `seedData.ts`: expand to ~1000 instruments (add more Indian stocks)
6. Update `App.tsx`: admin check uses `isAdminUser` via email matching
