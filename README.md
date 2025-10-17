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

1. **Identity Integrity** — Proof-of-personhood or KYC prevents bot or Sybil manipulation
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

## 🪙 Token & Economy

**$VOCE** — Reward and governance token, distributed to users who align with verified outcomes.

**XP / Marketplace Coin** — Non-transferable score representing community trust and influence; used for tiered privileges and governance rights.

## 🎯 Use Cases

- **Public Sentiment Forecasting** — Track and visualise community beliefs before events unfold
- **Media Integrity Tools** — Measure how narratives evolve before outcomes
- **DAO Decision Making** — Combine reputation-weighted consensus with truth verification
- **SocialFi & GameFi Extensions** — Gamified competitions around news, sports, or markets

## 💼 Business Model

**Phase 1: Bootstrap for $VOCE**
- Users buy voting tickets with stablecoin → 80% of event ticket rewards go to truth winners
- Users stake $VOCE to post events → Earn 5% of event ticket rewards

## 🛠 Current Implementation Features

- **Event Categories**: Technology, Crypto, Politics, Finance, Health, Space, Sports, Environment
- **Regional Markets**: Global, Americas, Europe, Asia, Africa
- **Dual Reward System**:
  - Digital XP rewards for matching majority votes
  - Cryptocurrency (USDC) rewards for matching real-world outcomes
- **Hidden Voting Ratios**: Percentages stay hidden until voting closes to encourage authentic predictions
- **Level System**: 10 levels with coin rewards based on XP accumulation
- **Marketplace**: Purchase voting tickets and exclusive NFTs with XP or crypto
- **Leaderboard**: Track top predictors and creators
- **User Profiles**: Complete statistics, prediction history, and achievements

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Routing**: React Router v6
- **State Management**: React Query
- **UI Components**: shadcn/ui, Radix UI
- **Styling**: Tailwind CSS with custom design system
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

## 📦 Installation

Follow these steps to set up the project locally:

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd voce-truth-stake

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:8080`

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🌐 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── EventCard.tsx   # Event display card
│   ├── Header.tsx      # Navigation header
│   └── ...
├── pages/              # Main application pages
│   ├── Index.tsx       # Homepage
│   ├── Categories.tsx  # Browse by region
│   ├── Marketplace.tsx # NFTs and tickets shop
│   ├── CreateEvent.tsx # Create new events
│   ├── Leaderboard.tsx # Rankings
│   ├── Profile.tsx     # User profile
│   └── ...
├── data/               # Mock data
│   └── mockEvents.ts
├── types/              # TypeScript definitions
│   ├── level.ts
│   └── marketplace.ts
└── lib/                # Utility functions
    └── utils.ts
```

## 🎨 Design System

The application uses a dark theme with purple/blue gradient accents:

- **Primary**: Purple gradient (`hsl(271 81% 56%)`)
- **Secondary**: Teal blue (`hsl(187 85% 43%)`)
- **Background**: Dark blue (`hsl(222 47% 11%)`)
- **Cards**: Semi-transparent with backdrop blur effects

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Add your environment variables here
```

### Tailwind Configuration

The project uses a custom Tailwind configuration with:
- CSS custom properties for theming
- Custom gradients and shadows
- Responsive breakpoints
- Animation utilities

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Deploy to Static Hosting

This project can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🔗 Links

- [Live Demo](#) - Add your demo URL here
- [Documentation](#) - Add documentation link here
- [API Reference](#) - Add API reference here

## 🌟 Vision

To build the belief layer for the decentralised web — where human perception, community consensus, and real-world truth converge transparently on-chain.

**"Predict together. Believe smarter. Earn for being right — and for being real."**

## 📈 Roadmap

- [ ] Aptos blockchain integration
- [ ] Oracle integration for real-world outcome verification
- [ ] Commit-reveal voting mechanism implementation
- [ ] Proof-of-personhood/Sybil resistance system
- [ ] $VOCE token launch and distribution
- [ ] Advanced analytics dashboard
- [ ] DAO governance features
- [ ] Mobile app development

## 🔬 Current Development Status

**Phase 0: Frontend Demo**
- ✅ React-based frontend with TypeScript
- ✅ Mock event data and user interactions
- ✅ XP and reputation system simulation
- ✅ Responsive design and UI components
- ⏳ Waiting for blockchain backend integration

## 🐛 Known Limitations

- Currently a frontend demo with mock data
- No actual blockchain integration yet
- Simulated rewards (USDC demo only)
- No real oracle connectivity
- No proof-of-personhood verification

## 💡 Future Enhancements

- Real-time oracle feeds and data sources
- Advanced reputation algorithms
- Community governance features
- Enhanced SocialFi integrations
- Mobile-first responsive design improvements
- Performance optimizations and caching
- Advanced security features and audits
- Cross-chain expansion to other L1s