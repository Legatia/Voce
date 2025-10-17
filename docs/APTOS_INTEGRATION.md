# Aptos DApp Integration Guide

This document explains how the Voce prediction market platform has been transformed into a full Aptos blockchain dApp.

## 🏗️ Architecture Overview

### Smart Contract Layer
- **PredictionMarket.move**: Core prediction market logic
- **Marketplace.move**: NFT and voting ticket marketplace
- **Token Management**: APT coin rewards and XP system

### Frontend Integration
- **Wallet Connection**: In-browser wallet management
- **Transaction Layer**: Contract interaction utilities
- **State Management**: React hooks for blockchain data
- **UI Components**: Aptos-specific components

### Network Configuration
- **Multi-network Support**: Mainnet, Testnet, Devnet
- **Switchable Networks**: Easy network switching in UI
- **Environment-specific**: Different configs per network

## 📁 Directory Structure

```
src/
├── aptos/                          # Aptos integration
│   ├── config/
│   │   └── network.ts             # Network configurations
│   ├── types/
│   │   └── index.ts               # TypeScript definitions
│   ├── contracts/
│   │   ├── predictionMarket.ts    # Prediction market interface
│   │   └── marketplace.ts         # Marketplace interface
│   ├── utils/
│   │   ├── wallet.ts              # Wallet utilities
│   │   └── transactions.ts        # Transaction service
│   ├── hooks/
│   │   ├── useAptosWallet.ts      # Wallet connection hook
│   │   └── usePredictionMarket.ts # DApp data hook
│   └── components/
│       └── WalletConnect.ts       # Wallet connection UI
├── contracts/                     # Move smart contracts
│   └── PredictionMarket.move      # Main contract
└── scripts/
    └── deploy.js                  # Deployment script
```

## 🔧 Smart Contract Features

### Prediction Market (`PredictionMarket.move`)

#### Core Functions:
- `create_event`: Create new prediction markets
- `vote`: Cast predictions on events
- `claim_rewards`: Claim XP and APT rewards
- `resolve_event`: Resolve events (admin/oracle function)

#### Data Structures:
- `PredictionEvent`: Event information and state
- `Vote`: User voting records
- `UserStats`: User statistics and level system

#### Reward System:
- **Correct Predictions**: Full XP + APT rewards
- **Majority Match**: 50% XP bonus
- **Level System**: 1000 XP per level
- **Event Creation**: Creator rewards based on participation

### Security Features:
- **Deadline Validation**: Prevents voting after deadlines
- **Duplicate Vote Prevention**: One vote per user per event
- **Reward Claiming Protection**: Prevents double claiming
- **Access Control**: Admin-only event resolution

## 💻 Frontend Integration

### Wallet Connection

The dApp includes a comprehensive wallet system:

#### Features:
- **Account Generation**: Create new Aptos accounts
- **Import Wallet**: Import existing private keys
- **Balance Display**: Real-time APT balance
- **Network Switching**: Switch between networks
- **Transaction History**: View past transactions

#### Usage:
```tsx
import { WalletConnect } from "@/aptos/components/WalletConnect";

// In your component
<WalletConnect />
```

### Transaction Management

#### Prediction Market Hook:
```tsx
import { usePredictionMarket } from "@/aptos/hooks/usePredictionMarket";

const {
  events,
  userVotes,
  userStats,
  createEvent,
  vote,
  claimRewards,
  isLoading,
  error
} = usePredictionMarket();
```

#### Wallet Hook:
```tsx
import { useAptosWallet } from "@/aptos/hooks/useAptosWallet";

const {
  isConnected,
  account,
  balance,
  network,
  connect,
  disconnect,
  switchNetwork
} = useAptosWallet();
```

### Contract Interaction

#### Creating an Event:
```tsx
const handleCreateEvent = async (params) => {
  const result = await createEvent({
    title: "Will BTC reach $100K by Q2 2025?",
    description: "Bitcoin price prediction...",
    category: "Crypto",
    region: "Global",
    votingDeadline: 1750896000, // Unix timestamp
    resultDeadline: 1753574400,  // Unix timestamp
    resolutionCriteria: "Price on major exchanges...",
    dataSources: ["Coinbase", "Binance"],
    xpReward: 1000,
    aptReward: 1000000000, // 10 APT in octas
  });

  if (result.success) {
    console.log("Event created:", result.txHash);
  }
};
```

#### Voting on an Event:
```tsx
const handleVote = async (eventId, prediction) => {
  const result = await vote({
    eventId,
    prediction: true, // or false
  });

  if (result.success) {
    console.log("Vote cast:", result.txHash);
  }
};
```

## 🚀 Deployment Guide

### Prerequisites
- Node.js 18+
- Aptos CLI
- Git

### 1. Install Dependencies
```bash
npm install
```

### 2. Compile Contracts
```bash
# Install Aptos CLI
curl -fsSL https://aptos.dev/install-cli.sh | sh

# Compile the Move contract
aptos move compile --package-dir contracts/ \
  --save-metadata \
  --named-addresses voce=0x1
```

### 3. Deploy Contracts
```bash
# Run deployment script
node scripts/deploy.js

# Or deploy manually with Aptos CLI
aptos move publish --package-dir contracts/ \
  --named-addresses voce=DEPLOYER_ADDRESS \
  --profile default
```

### 4. Update Configuration
Update the contract addresses in `src/aptos/types/index.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  PREDICTION_MARKET: "0xYOUR_DEPLOYED_ADDRESS",
  MARKETPLACE: "0xYOUR_DEPLOYED_ADDRESS",
} as const;
```

### 5. Start the Frontend
```bash
npm run dev
```

## 🔒 Security Considerations

### Smart Contract Security:
- **Input Validation**: All inputs are validated
- **Reentrancy Protection**: State changes before external calls
- **Integer Overflow**: Using Safe Math operations
- **Access Control**: Proper signer checks

### Frontend Security:
- **Private Key Storage**: Keys stored only in browser localStorage
- **Network Validation**: Validate network configurations
- **Transaction Verification**: Verify transaction success
- **Error Handling**: Comprehensive error handling

### Recommended Practices:
- Use hardware wallets for production
- Implement multi-signature for admin functions
- Regular security audits
- Test on testnet before mainnet deployment

## 🌐 Network Configuration

### Supported Networks:
- **Mainnet**: Production network (real APT)
- **Testnet**: Testing network (test APT from faucet)
- **Devnet**: Development network (easiest to get test APT)

### Faucet URLs:
- Testnet: https://faucet.testnet.aptoslabs.com
- Devnet: https://faucet.devnet.aptoslabs.com

### Network Switching:
Users can switch between networks directly in the UI. The app automatically:
- Updates RPC endpoints
- Refreshes account data
- Validates contract addresses
- Updates explorer URLs

## 🎯 Development Workflow

### 1. Local Development
```bash
# Start development server
npm run dev

# Test on devnet (default)
# Connect wallet and test functionality
```

### 2. Smart Contract Development
```bash
# Compile contracts
aptos move compile --package-dir contracts/

# Run unit tests
aptos move test --package-dir contracts/

# Deploy to devnet
node scripts/deploy.js
```

### 3. Frontend Testing
```bash
# Run linter
npm run lint

# Run tests (when implemented)
npm run test

# Build for production
npm run build
```

### 4. Production Deployment
1. Audit smart contracts
2. Deploy to testnet for final testing
3. Deploy to mainnet
4. Update frontend configuration
5. Deploy frontend to Vercel/Netlify

## 🔄 Transaction Flow

### Event Creation Flow:
1. User fills event creation form
2. Frontend validates input
3. Wallet signs transaction
4. Contract creates event
5. Frontend updates state
6. Event appears in marketplace

### Voting Flow:
1. User selects prediction (YES/NO)
2. Frontend checks voting deadline
3. Wallet signs transaction
4. Contract records vote
5. Frontend updates user state
6. Vote appears in user history

### Reward Claiming Flow:
1. Event is resolved by oracle
2. User clicks "Claim Rewards"
3. Contract calculates rewards
4. Frontend shows reward breakdown
5. Wallet signs claim transaction
6. Rewards transferred to user wallet

## 📊 Data Management

### On-Chain Data:
- Event information and state
- User votes and statistics
- Transaction history
- Reward calculations

### Off-Chain Data:
- Event metadata (images, descriptions)
- User preferences
- UI state
- Caching layer

### Data Synchronization:
- Real-time updates via WebSocket
- Polling for transaction confirmations
- Cache invalidation on state changes
- Optimistic updates for better UX

## 🐛 Troubleshooting

### Common Issues:
- **Transaction Failed**: Check gas fees and deadlines
- **Connection Lost**: Refresh page and reconnect wallet
- **Balance Not Updating**: Manually refresh balance
- **Network Issues**: Switch to a different network

### Debug Tools:
- Aptos Explorer: https://explorer.aptoslabs.com
- Developer Console: Check for JavaScript errors
- Network Tab: Monitor API calls
- Local Storage: Check wallet data

## 📚 Additional Resources

- [Aptos Developer Documentation](https://aptos.dev/)
- [Move Language Guide](https://move-book.com/)
- [Aptos Wallet Adapter](https://github.com/aptos-labs/aptos-wallet-adapter)
- [TypeScript SDK](https://github.com/aptos-labs/aptos-ts-sdk)

## 🤝 Contributing

When contributing to the Aptos integration:

1. Test on devnet before submitting PRs
2. Follow the existing code structure
3. Add proper error handling
4. Update documentation
5. Include tests for new features

## 📈 Future Enhancements

- **Advanced NFTs**: Dynamic NFTs with real-time updates
- **Governance**: Community voting on platform decisions
- **Analytics**: On-chain analytics and insights
- **Mobile Wallets**: Integration with mobile wallet apps
- **Layer 2**: Integration with Aptos L2 solutions
- **Cross-chain**: Bridge to other blockchains