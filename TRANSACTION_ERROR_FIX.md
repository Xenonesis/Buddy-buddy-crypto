# Transaction Error Handling Fix

## Issue Fixed
Users were getting generic error messages when rejecting transactions in MetaMask, instead of user-friendly messages that explain what happened.

## Error Types Handled

### 1. User Rejection (Most Common)
**Error Conditions:**
- `error.code === 4001`
- `error.code === 'ACTION_REJECTED'` 
- `error.message` contains "User denied" or "user rejected"
- Nested error codes in `error.cause.code` or `error.info.error.code`

**User Message:** 
"Transaction cancelled - You rejected the transaction in MetaMask"

**Notification Type:** Warning (orange) instead of Error (red)

### 2. Insufficient Funds
**Error Conditions:**
- `error.message` contains "insufficient funds" or "Insufficient balance"

**User Message:**
"Insufficient balance to complete this transaction"

### 3. Gas Estimation Errors
**Error Conditions:**
- `error.message` contains "gas" or "Gas"

**User Message:**
"Transaction failed due to gas estimation error. Please try again."

### 4. Network Errors
**Error Conditions:**
- `error.message` contains "network" or "Network"

**User Message:**
"Network error. Please check your connection and try again."

### 5. Default/Unknown Errors
**Fallback:**
"Transaction failed: [original error message]"

## Implementation Details

### Files Modified:
1. **`src/store/app.ts`**: Added `handleTransactionError` helper function
2. **`src/components/Send.tsx`**: Enhanced error handling in form submission
3. **`src/services/wallet.ts`**: Added connection rejection handling

### Key Features:
- **User-friendly messages**: Clear explanations instead of technical error codes
- **Proper notification types**: Warning for user actions, Error for system issues  
- **Comprehensive coverage**: Handles MetaMask rejection patterns and common transaction errors
- **TypeScript safety**: Proper error typing with unknown instead of any

### Testing:
- Created test cases covering all error scenarios
- Verified proper message classification and display
- Confirmed user rejection shows as warning, not error

## Before vs After

**Before:**
```
❌ Transaction failed: user rejected action (action="sendTransaction", reason="rejected", info={ "error": { "code": 4001, "data": { "cause": "rejectAllApprovals" }, "message": "ethers-user-denied: MetaMask Tx Signature: User denied transaction signature." }
```

**After:**
```
⚠️ Transaction cancelled - You rejected the transaction in MetaMask
```

This fix provides a much better user experience by clearly communicating what happened and why, especially for the common case of users changing their mind about a transaction.