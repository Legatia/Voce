# Voce: A Belief Market Protocol

Voce is a decentralised belief-to-earn platform where users vote on real-world events to earn:

- **Reputation** for aligning with community consensus
- **Tokens** for aligning with actual outcomes

Built on Aptos, it leverages scalable, parallelised blockchain architecture to power thousands of fast, secure, and transparent voting pools.

## 🎯 The Problem

There's no on-chain system that measures collective perception and truth accuracy simultaneously — until now.

**Traditional Markets**
- Focus only on truth outcomes
- Ignore community beliefs
- → Became pseudo casino

**Social Media**
- Amplifies consensus
- Lacks credibility & accountability
- → Bubble of their own belief

**Missing Link:** No on-chain system for both perception & truth.

## 💡 Our Solution

Belief Market introduces a dual-layer reward system:

**Social Consensus Rewards (Profile XP)**
Users earn non-transferable marketplace coins for aligning with the community's majority view.
Builds a social graph of collective belief and influence.

**Truth Alignment Rewards (Token Incentives)**
Once a real-world outcome is verified via oracle, users who voted correctly earn tradable tokens.
Anchors the platform to objective reality.

Bridging the gap between Web3 social sentiment and verifiable data.

## 🔧 How It Works

1. **Identity Integrity** — AIP-62 Wallet Standard ensures secure wallet connections
2. **Event Creation** — Anyone can list a real-world event
3. **Commit–Reveal Voting** — Users submit hidden votes before the deadline to avoid herding
4. **Consensus Phase** — After votes are revealed, majority-aligned users gain XP
5. **Outcome Verification** — When oracles confirm results, factually correct users receive token rewards
6. **Emergency Controls** — Pools can auto-freeze if breaking news creates information imbalance

## ⚡ Why Aptos

- **Parallel Execution & Scalability** — Aptos's Block-STM enables thousands of simultaneous event pools
- **Modular Event Logic** — Each voting pool runs as an independent smart module
- **Low Latency** — Instant feedback and reward distribution
- **Secure State Management** — Move-based resource system ensures privacy and safety
- **AIP-62 Wallet Standard** — Modern wallet integration with future-proof architecture

## 🎯 Implemented Features

### ✅ **Smart Contracts (Testnet Deployed)**
- **Prediction Market**: Complete voting and reward distribution system
- **Secure Voting**: Commit-reveal mechanism with cryptographic security
- **Level System**: On-chain user statistics and reputation tracking
- **Multi-sig Governance**: Enhanced security for administrative operations
- **Reentrancy Protection**: Comprehensive security audit and fixes

### ✅ **Frontend Features**
- **Modern Wallet Integration**: AIP-62 Wallet Standard with Petra, Martian, Pontem support
- **Live Streaming Platform**: Complete streaming studio with recording capabilities
- **Shelby Protocol Integration**: Decentralized video storage and streaming
- **Gamification System**: XP, levels, achievements, and leaderboards
- **Real-time Voting**: Interactive voting with commit-reveal mechanism
- **Event Creation**: Create prediction events with media support
- **User Profiles**: Complete statistics and prediction history
- **Marketplace**: Trading and rewards system

### ✅ **Technical Infrastructure**
- **AIP-62 Wallet Standard**: Future-proof wallet integration
- **Shelby SDK Integration**: Decentralized storage for media content
- **Real-time Updates**: Live voting results and statistics
- **Responsive Design**: Mobile-first dark theme UI
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Comprehensive error management and user feedback

## 🛠 Tech Stack

### **Frontend**
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with custom design system
- **shadcn/ui** components with Radix UI primitives
- **React Query** for state management
- **React Router v6** for navigation

### **Blockchain**
- **Aptos** blockchain with Move smart contracts
- **AIP-62 Wallet Standard** for modern wallet integration
- **@aptos-labs/wallet-adapter-react** for wallet connections
- **@aptos-labs/ts-sdk** for blockchain interactions

### **Storage & Media**
- **Shelby Protocol** SDK for decentralized video storage
- **Live streaming** with recording capabilities
- **Media upload** system with progress tracking

## 📦 Installation

Follow these steps to set up the project locally:

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd voce-truth-stake

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Configure your environment
# Edit .env.local with your Aptos and Shelby API keys

# Start the development server
npm run dev
```

The application will be available at `http://localhost:8080`

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Shelby API Configuration (for video storage)
VITE_SHELBY_API_KEY=your_shelby_api_key_here
VITE_SHELBY_NETWORK=SHELBYNET
VITE_SHELBY_ACCOUNT_ADDRESS=your_aptos_address_here
VITE_SHELBY_ACCOUNT_PRIVATE_KEY=your_private_key_here

# Aptos Configuration
VITE_APTOS_NETWORK=TESTNET
VITE_VOCE_ADMIN_ADDRESS=b244f93f5d9dd71073cae0e77a4c8ee093d5562a1b89f03aaf3a828fb390c2c3

# Feature Flags
VITE_ENABLE_SHELBY_INTEGRATION=true
VITE_ENABLE_PRIVATE_KEY_IMPORT=false
VITE_ENABLE_LIVE_STREAMING=true

# Application Configuration
VITE_APP_NAME=Voce
VITE_APP_VERSION=1.0.0
```

### Contract Deployment

**Testnet Contracts Deployed:**
- **Address**: `b244f93f5d9dd71073cae0e77a4c8ee093d5562a1b89f03aaf3a828fb390c2c3`
- **Package**: `VocePredictionMarket`
- **Module**: `prediction_market`

**To initialize the contract:**
1. Connect your admin wallet to the app
2. Navigate to Contract Integration Test
3. Click "⚙️ Initialize Contract" button
4. Approve the transaction in your wallet

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🌐 Project Structure

```
src/
├── components/              # Reusable UI components
│   ├── ui/                 # shadcn/ui base components
│   ├── streaming/          # Live streaming components
│   ├── voting/             # Voting and prediction components
│   ├── gamification/       # XP and level system
│   └── test/               # Contract integration testing
├── pages/                  # Main application pages
│   ├── Index.tsx           # Homepage with event grid
│   ├── LiveStreamingPage.tsx # Live streaming platform
│   ├── Marketplace.tsx     # NFTs and tickets shop
│   └── Profile.tsx         # User profile and statistics
├── aptos/                  # Blockchain integration
│   ├── services/           # Smart contract interactions
│   ├── hooks/              # React hooks for blockchain
│   ├── components/         # Wallet and blockchain UI
│   └── move/               # Move smart contract source
├── hooks/                  # Custom React hooks
├── services/               # External API services
└── types/                  # TypeScript definitions
```

## 🚀 Deployment

### Production Build

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Environment Setup

**Development (Testnet):**
- Use `.env.testnet` configuration
- Contract deployed to Aptos testnet
- Shelby integration configured for testing

**Production (Mainnet):**
- Use `.env.production` configuration
- Requires mainnet contract deployment
- Shelby mainnet configuration needed

## 🎮 How to Use

### **For Users:**

1. **Connect Wallet**: Use AIP-62 compatible wallet (Petra, Martian, Pontem)
2. **Browse Events**: View available prediction markets
3. **Place Predictions**: Use commit-reveal voting mechanism
4. **Earn Rewards**: Gain XP for consensus, tokens for correct predictions
5. **Track Progress**: Monitor statistics and level progression

### **For Admins:**

1. **Initialize Contract**: Use Contract Integration Test component
2. **Create Events**: Set up prediction markets with proper parameters
3. **Verify Outcomes**: Resolve events with real-world outcomes
4. **Manage Platform**: Monitor user activity and platform health

## 🔬 Current Development Status

**Phase 1: Production-Ready Platform**
- ✅ Smart contracts deployed and audited on Aptos testnet
- ✅ Complete frontend with modern wallet integration
- ✅ Live streaming platform with Shelby integration
- ✅ Gamification system with XP and levels
- ✅ Real-time voting with commit-reveal mechanism
- ✅ AIP-62 Wallet Standard implementation
- ✅ Comprehensive error handling and user feedback
- ⏳ Mainnet deployment pending
- ⏳ Oracle integration for automated outcome verification

## 📊 Security Features

- **AIP-62 Compliance**: Modern wallet standard implementation
- **Smart Contract Audits**: Comprehensive security review completed
- **Reentrancy Protection**: Guard against recursive calls
- **Multi-sig Governance**: Enhanced administrative security
- **Commit-Reveal Voting**: Cryptographic voting privacy
- **Input Validation**: Comprehensive parameter checking

## 🐛 Known Limitations

- **Testnet Only**: Currently deployed on Aptos testnet
- **Manual Oracle**: Event resolution requires manual verification
- **Mock Data**: Some features use placeholder data for demonstration
- **Shelby Setup**: Requires Shelby API key for video storage

## 💡 Future Enhancements

- **Mainnet Deployment**: Full production deployment on Aptos mainnet
- **Oracle Integration**: Automated real-world outcome verification
- **Mobile App**: Native mobile applications
- **Advanced Analytics**: Enhanced dashboard and insights
- **Cross-chain Expansion**: Support for other blockchains
- **DAO Governance**: Community-driven platform governance

## 🔗 Links

- **Live Demo**: `http://localhost:8080` (when running locally)
- **Aptos Explorer**: [Contract on Testnet](https://explorer.aptoslabs.com/account/b244f93f5d9dd71073cae0e77a4c8ee093d5562a1b89f03aaf3a828fb390c2c3)
- **Shelby Protocol**: [Decentralized Storage](https://shelby.xyz)

## 🌟 Vision

To build the belief layer for the decentralised web — where human perception, community consensus, and real-world truth converge transparently on-chain.

**"Predict together. Believe smarter. Earn for being right — and for being real."**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.