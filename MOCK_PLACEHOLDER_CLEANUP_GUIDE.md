# 🧹 Mock Data & Placeholder Cleanup Guide

## 📋 Overview
This guide identifies all mock data, placeholder values, and hardcoded addresses that need to be replaced for production deployment.

## 🚨 Critical Placeholders to Replace

### 1. Contract Address Placeholders
**Files:** All Aptos service files
- `src/aptos/services/truthRewards.ts`
- `src/aptos/services/onchainLevels.ts`
- `src/aptos/services/secureVotingService.ts`
- `src/aptos/services/financialSystemService.ts`
- `src/aptos/services/voteTrackingService.ts`

**Replace these patterns:**
```typescript
// ❌ PLACEHOLDER VALUES (CURRENT)
VITE_TRUTH_REWARDS_ADDRESS=0x1
VITE_LEVEL_SYSTEM_ADDRESS=0x1
VITE_SECURE_VOTING_ADDRESS=0x1
VITE_FINANCIAL_SYSTEM_ADDRESS=0x1
VITE_VOCE_ADMIN_ADDRESS=0x123

// ✅ PRODUCTION VALUES (REQUIRED)
VITE_TRUTH_REWARDS_ADDRESS=<ACTUAL_DEPLOYED_ADDRESS>
VITE_LEVEL_SYSTEM_ADDRESS=<ACTUAL_DEPLOYED_ADDRESS>
VITE_SECURE_VOTING_ADDRESS=<ACTUAL_DEPLOYED_ADDRESS>
VITE_FINANCIAL_SYSTEM_ADDRESS=<ACTUAL_DEPLOYED_ADDRESS>
VITE_VOCE_ADMIN_ADDRESS=<ACTUAL_ADMIN_ADDRESS>
```

### 2. Mock Transaction Hashes
**File:** `src/aptos/services/financialSystemService.ts`
```typescript
// ❌ CURRENT MOCK VALUES
transactionHash: "0xabc123..."
transactionHash: "0xdef456..."

// ✅ REPLACE WITH: Real transaction hashes from blockchain
```

## 🎭 Mock Implementations to Remove

### 1. Complete Mock Backend
**File:** `src/services/mockBackend.ts`
- **Action:** Remove entire file in production
- **Dependency:** Update all imports to use real blockchain services
- **Files to update:** Any components importing from `mockBackend.ts`

### 2. Mock Event Data
**File:** `src/data/mockEvents.ts`
- **Action:** Remove entire file in production
- **Replacement:** Load events from smart contracts via `src/aptos/services/`

### 3. Service Layer Mock Functions
All Aptos services contain "For demo" mock implementations:

#### `src/aptos/services/truthRewards.ts`
```typescript
// ❌ LINE 516 - REMOVE
return new MockSubscription(/* ... */);

// ✅ REPLACE WITH: Real blockchain subscription
```

#### `src/aptos/services/secureVotingService.ts`
```typescript
// ❌ LINES 145, 263, 331, 334, 433 - REMOVE ALL "For demo" code
// Extract event ID from transaction events (simplified for demo)
// Simple hash for demo - in production, this would be done by the smart contract
// For demo, return mock phase information
// For demo, return empty array

// ✅ REPLACE WITH: Real blockchain implementations
```

#### `src/aptos/services/financialSystemService.ts`
```typescript
// ❌ LINES 143, 211, 410, 483, 490, 497, 512, 563 - REMOVE ALL MOCKS
// Extract pool ID from transaction events (simplified for demo)
// Calculate expected amount and rewards (simplified for demo)
// For demo, simulate rewards for first few pools
// For demo, return mock history
// creator: "0x123", // Would come from smart contract
// transactionHash: "0xabc123..."
// transactionHash: "0xdef456..."
// For demo, return mock performance data

// ✅ REPLACE WITH: Real blockchain data retrieval
```

#### `src/aptos/services/voteTrackingService.ts`
```typescript
// ❌ LINES 95, 133 - REMOVE MOCKS
// For demo, generate realistic commit events
// For demo, generate reveal events (should match commits but with some attrition)

// ✅ REPLACE WITH: Real event tracking from blockchain
```

## 📁 Files to Delete in Production

1. **`src/services/mockBackend.ts`** - Entire mock backend service
2. **`src/data/mockEvents.ts`** - Mock event data
3. **Test files** (optional):
   - `test-security-complete.cjs`
   - `test-integration.cjs`
   - `test-smart-contracts.cjs`

## 🔧 Production Deployment Checklist

### ✅ Pre-Deployment
- [ ] Deploy all Move smart contracts to mainnet
- [ ] Record actual deployed contract addresses
- [ ] Set up proper admin addresses with multi-signature
- [ ] Configure oracle integrations
- [ ] Test all blockchain integrations on testnet

### ✅ Configuration Updates
- [ ] Replace all `0x1` placeholder addresses with deployed addresses
- [ ] Replace `0x123` admin placeholder with actual admin address
- [ ] Update `VITE_APTOS_NETWORK=MAINNET`
- [ ] Set `VITE_DEBUG_MODE=false`
- [ ] Configure production API keys and secrets

### ✅ Code Cleanup
- [ ] Remove all "For demo" code blocks
- [ ] Delete `mockBackend.ts` and `mockEvents.ts`
- [ ] Update all imports to use real services
- [ ] Remove mock transaction hashes and data
- [ ] Test all functionality with real blockchain

### ✅ Final Testing
- [ ] End-to-end testing with mainnet contracts
- [ ] Verify all blockchain calls work correctly
- [ ] Test reward distributions and treasury operations
- [ ] Validate voting mechanisms with real commitments
- [ ] Check level system and XP calculations

## 🎯 Production-Ready Files

### ✅ Ready for Production:
- ✅ `Move.toml` - Using proper addresses
- ✅ Smart contracts in `src/aptos/move/` - All security fixes implemented
- ✅ Core UI components - No blockchain dependencies
- ✅ Authentication and wallet connection

### ⚠️ Requires Updates:
- ⚠️ All Aptos service files need mock removal
- ⚠️ Environment configuration needs real addresses
- ⚠️ Components using mock data need real integration

## 🚀 Deployment Priority

### **Phase 1 - Critical (Must Fix)**
1. Replace all contract address placeholders
2. Remove mock transaction data
3. Update admin addresses

### **Phase 2 - Important (Should Fix)**
1. Remove "For demo" code from services
2. Delete mock backend and event data
3. Update component imports

### **Phase 3 - Nice to Have**
1. Remove test files from production build
2. Add production error handling
3. Implement monitoring and logging

---

**⚠️ WARNING**: Deploying with placeholder values will result in non-functional application and potential security vulnerabilities. Ensure all mock data is removed and real addresses are configured before mainnet deployment.