# Wallet Feature Documentation

## Overview

The Wallet feature provides users with a comprehensive interface to manage their XLM (Stellar Lumens) tokens, view transaction history, and perform deposits and withdrawals.

## File Structure

```
app/wallet/
├── page.tsx                 # Main wallet page component
├── layout.tsx              # Wallet layout with sidebar
└── components/
    ├── wallet-main.tsx     # Main wallet content with balance and transactions
    ├── wallet-content.tsx  # Content wrapper with sidebar spacing
    ├── side-bar.tsx        # Navigation sidebar
    ├── sidebar-context.tsx # Sidebar state management
    ├── profile-card.tsx    # User profile display in sidebar
    └── footer.tsx          # Wallet page footer
```

## Mock Wallet Structure

### Balance Data

Currently using mock data for development:

```typescript
const balance = 100; // Mock balance in XLM
const usdRate = 0.12; // Mock XLM to USD conversion rate
```

**Future Integration:** This will be replaced with real-time data from the Stellar blockchain API or backend service.

### User Wallet Information

Mock user data includes:

- **Wallet Balance**: Total XLM tokens owned
- **USD Equivalent**: Real-time conversion to USD
- **User Profile**: Name, username, avatar, level/rank

## Transaction Types

The wallet supports three main transaction categories:

### 1. Deposit

Incoming tokens to the user's wallet

- **Icon**: ArrowDownLeft (green)
- **Color**: `#00C950` (dark theme), `text-green-700` (light theme)
- **Sources**: Credit Card, Bank Transfer, Rewards, Giveaway wins
- **Display**: Shows `+` symbol with amount

### 2. Withdrawal

Outgoing tokens from the user's wallet

- **Icon**: ArrowUpRight (blue)
- **Color**: `#155DFC` (dark theme), `text-blue-700` (light theme)
- **Destinations**: Bank Transfer, Other users, External wallets
- **Display**: Shows `-` symbol with amount

### Transaction Properties

```typescript
type MockT = {
  id: string;
  type: "Deposit" | "Withdrawal";
  amount: number;
  currency: string;
  from?: string; // For deposits
  to?: string; // For withdrawals
  reason?: string; // Transaction description
  label?: "Completed" | "Pending" | "Failed";
  timestamp: string; // ISO 8601 format
};
```

### Status Labels

- **Completed**: Green badge - transaction successfully processed
- **Pending**: Yellow badge - transaction in progress
- **Failed**: Red badge - transaction unsuccessful (not yet implemented)

## Components

### WalletMain

Main component displaying:

- Balance card with XLM and USD amounts
- Quick action buttons (Add Funds, Withdraw)
- Statistics cards (Received, Sent, Available)
- Recent transaction history

### BalanceCard

Displays:

- Current wallet balance in XLM
- USD equivalent value
- Action buttons for adding funds and withdrawing

### StatCard

Shows aggregated statistics:

- **Received**: Total deposits this month
- **Sent**: Total withdrawals this month
- **Available**: Current available balance

### TransactionCard

Lists recent transactions with:

- Transaction type and icon
- Amount with +/- indicator
- Status label
- Timestamp
- Transaction reason/description

## Theming

The wallet supports both light and dark themes with appropriate color schemes:

### Light Theme Colors

- Background: `bg-white`, `bg-orange-50`, `bg-gray-50`
- Borders: `border-gray-200`, `border-orange-200`
- Text: `text-gray-900`, `text-gray-700`
- Cards: `bg-white` with subtle shadows

### Dark Theme Colors

- Background: `dark:bg-[#44130633]`, `dark:bg-[#1E293980]`
- Borders: `dark:border-[#9F2D004D]`, `dark:border-[#364153]`
- Text: `dark:text-[#F3F4F6]`, `dark:text-white`
- Cards: Transparent with gradient borders

## Responsive Design

The wallet is fully responsive with breakpoints:

- **Mobile** (< 640px): Stacked layout, full-width components
- **Tablet** (640px - 1024px): 2-column grid for stats
- **Desktop** (> 1024px): 3-column grid, sidebar visible

### Mobile Features

- Collapsible sidebar with overlay
- Stacked transaction cards
- Mobile-optimized spacing and padding

## Testing Requirements

### ✅ Implemented Features Ready for Testing

1. **Balance Display**
   - Component renders balance in XLM
   - USD conversion displayed correctly
   - Responsive layout on all screen sizes

2. **Transaction List Rendering**
   - Displays all transactions from mock data
   - Correct icons for Deposit/Withdrawal types
   - Proper color coding for transaction types
   - Timestamps formatted correctly (DD/MM/YYYY)

3. **Empty State**
   - Shows "No recent transactions" message when array is empty
   - Centered text with muted styling

4. **All Transaction Types**
   - Deposit transactions render with green icon
   - Withdrawal transactions render with blue icon
   - Status labels (Completed/Pending) display correctly

5. **Responsive Layout**
   - Sidebar collapse/expand functionality works
   - Mobile overlay backdrop functional
   - Grid layout adjusts: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
   - All components are mobile-friendly

6. **Action Buttons**
   - Add Funds button styled and positioned
   - Withdraw button styled and positioned
   - Hover effects implemented
   - Currently functional (not disabled)

### ⚠️ Not Yet Implemented (For Testing)

**Note**: Action buttons are currently enabled but non-functional. To test disabled states:

1. Add `disabled` prop to buttons
2. Add `opacity-50 cursor-not-allowed` classes
3. Remove hover effects when disabled

### Manual Testing Checklist

- [ ] Open wallet page and verify balance displays
- [ ] Check USD conversion calculation
- [ ] Verify all 3 stat cards render with correct icons and colors
- [ ] Confirm transaction list shows all mock transactions
- [ ] Test empty state by setting `mockTransactions = []`
- [ ] Toggle between Deposit and Withdrawal to verify styling
- [ ] Test sidebar collapse/expand on desktop
- [ ] Test mobile sidebar with overlay
- [ ] Resize window to verify responsive breakpoints
- [ ] Test in both light and dark themes
- [ ] Verify all colors are visible in both themes
- [ ] Check button hover states
- [ ] Verify transaction status labels display correctly

### Unit Testing (Recommended)

While no test files exist yet, recommended tests include:

```typescript
// Example test structure (not implemented)
describe("WalletMain", () => {
  test("renders balance correctly", () => {});
  test("converts XLM to USD", () => {});
  test("displays transaction list", () => {});
  test("shows empty state when no transactions", () => {});
  test("formats dates correctly", () => {});
});

describe("StatCard", () => {
  test("renders with correct icon", () => {});
  test("displays amount with 2 decimal places", () => {});
  test("applies correct color based on type", () => {});
});

describe("TransactionCard", () => {
  test("renders Deposit with green styling", () => {});
  test("renders Withdrawal with blue styling", () => {});
  test("displays correct status label", () => {});
});
```

## Future Integration Notes

### Blockchain Integration

**Current State**: Using mock data for all wallet functionality

**Future Implementation**:

1. **Stellar SDK Integration**

   ```typescript
   import * as StellarSdk from "stellar-sdk";

   // Connect to Stellar network
   const server = new StellarSdk.Server("https://horizon.stellar.org");

   // Get account balance
   async function getBalance(publicKey: string) {
     const account = await server.loadAccount(publicKey);
     return account.balances;
   }
   ```

2. **Real-time Balance Updates**
   - Subscribe to account changes via WebSocket
   - Update balance when transactions occur
   - Show loading states during fetch

3. **Transaction History**
   - Fetch from Stellar Horizon API
   - Filter by transaction type
   - Paginate large transaction lists
   - Cache recent transactions

4. **Transaction Creation**
   - Implement payment transaction builder
   - Add transaction signing with user's private key
   - Handle transaction submission and confirmation
   - Display transaction status updates

### API Endpoints (Backend)

Future backend endpoints needed:

```typescript
// Get user wallet balance
GET /api/wallet/balance

// Get transaction history
GET /api/wallet/transactions?limit=10&offset=0

// Create deposit transaction
POST /api/wallet/deposit
Body: { amount: number, method: string }

// Create withdrawal transaction
POST /api/wallet/withdraw
Body: { amount: number, destination: string }

// Get exchange rates
GET /api/wallet/rates
```

### Security Considerations

1. **Private Key Management**
   - Never store private keys in frontend
   - Use secure key storage (hardware wallet, backend encryption)
   - Implement transaction signing on secure backend

2. **Transaction Validation**
   - Validate amounts before submission
   - Check sufficient balance
   - Verify destination addresses
   - Implement rate limiting

3. **Authentication**
   - Require authentication for all wallet operations
   - Implement 2FA for withdrawals
   - Session management and timeout

### State Management

Consider implementing:

- **Context API**: For wallet state across components
- **React Query**: For API data fetching and caching
- **Real-time Updates**: WebSocket for live transaction updates

### User Experience Enhancements

1. **Loading States**: Add skeleton loaders during data fetch
2. **Error Handling**: Display user-friendly error messages
3. **Confirmation Dialogs**: Require confirmation for withdrawals
4. **Transaction Notifications**: Toast messages for transaction status
5. **QR Codes**: For receiving payments
6. **Address Book**: Save frequent recipients

### Performance Optimization

1. **Pagination**: Load transactions in batches
2. **Virtual Scrolling**: For large transaction lists
3. **Lazy Loading**: Load stats only when needed
4. **Memoization**: Prevent unnecessary re-renders

## Dependencies

Current dependencies used:

- `lucide-react`: Icons
- `next`: Framework
- `react`: UI library

Future dependencies needed:

- `stellar-sdk`: Stellar blockchain integration
- `@tanstack/react-query`: Data fetching
- `zod`: Schema validation
- `date-fns`: Advanced date formatting

## Known Limitations

1. **Mock Data**: All data is currently static
2. **No Persistence**: Data resets on page refresh
3. **No Real Transactions**: Buttons are non-functional
4. **No Authentication**: No user-specific data
5. **No Error States**: No error handling implemented
6. **Static Exchange Rate**: USD conversion is fixed

## Conclusion

The wallet interface is fully implemented with all UI components, responsive design, and theme support. All visual elements are ready for testing. Integration with the Stellar blockchain and backend services is the next phase of development.
