# 🔗 On-Chain Level System Documentation

## 📋 **Overview**

Voce now supports an **on-chain level system** using Aptos dynamic fields, similar to Sui's dynamic object ownership. This provides permanent, verifiable storage of user levels, XP, and rewards directly on the blockchain.

## 🏗️ **Architecture**

### **1. Move Module (`level_system.move`)**

The core smart contract implements:

- **Dynamic Field Storage**: Uses `dynamic_field::Field<address, Object<UserLevelData>>` to store user data
- **Level Calculation**: Unlimited level system with the same logic as the frontend
- **Reward Distribution**: Admin functions for adding XP and coins
- **Prediction Tracking**: Statistics for accuracy and streaks

```move
struct UserLevelData has key, store {
    xp: u64,
    level: u32,
    total_earned_coins: u64,
    current_streak: u32,
    best_streak: u32,
    prediction_count: u32,
    correct_predictions: u32,
    last_updated: u64,
}
```

### **2. TypeScript Service (`onchainLevels.ts`)**

Provides a clean interface for interacting with the Move module:

- **Admin Operations**: Initialize system, add rewards, update stats
- **User Queries**: Get level data, progress, accuracy
- **Batch Operations**: Process multiple rewards in one transaction
- **Error Handling**: Graceful fallbacks for network issues

### **3. React Hook Integration (`useRewards.ts`)**

Seamlessly integrates on-chain storage with existing local storage:

- **Dual Storage**: Supports both local and on-chain simultaneously
- **Automatic Sync**: Bidirectional synchronization between local and chain
- **Fallback Logic**: Continues working even if chain is unavailable
- **Real-time Updates**: UI reflects on-chain status instantly

## 🎯 **Unlimited Level System**

### **Progression Logic**

**Levels 1-25**: Progressive XP requirements
- Level 1: 0 XP
- Level 10: 40,000 XP
- Level 25: 325,000 XP

**Levels 26+**: Static 45,000 XP per level
- Level 26: 370,000 XP
- Level 50: 1,450,000 XP
- Level 100: 3,700,000 XP
- **No Upper Limit**: Can continue indefinitely

### **Coin Rewards**

**Levels 1-25**: Significant coin increases
- Level 2: 100 coins → Level 25: 5,000 coins

**Levels 26+**: Gradual increases
- Level 26: 5,250 coins (+250 per level)
- Level 100: 23,750 coins

## 🔧 **Configuration**

### **Environment Variables**

```bash
# Enable on-chain level system
VITE_ENABLE_ON_CHAIN_LEVELS=true

# Contract addresses
VITE_LEVEL_SYSTEM_ADDRESS=0x1
VITE_VOCE_ADMIN_ADDRESS=0x123

# Feature flags
VITE_ENABLE_ON_CHAIN_REWARDS=true
```

### **Initialization**

```typescript
import { initializeOnChainLevels } from '@/aptos/services/onchainLevels';

// Initialize system (admin only)
await initializeOnChainLevels(adminPrivateKey);
```

## 🚀 **Usage Examples**

### **Basic Reward Distribution**

```typescript
import { onChainLevelService } from '@/aptos/services/onchainLevels';

// Add XP to user
await onChainLevelService.addXP(
  userAddress,
  100, // XP amount
  "Correct Prediction"
);

// Add coins for prediction rewards
await onChainLevelService.addCoins(
  userAddress,
  50, // Coin amount
  "Event Reward"
);
```

### **Batch Reward Processing**

```typescript
// Process multiple rewards in one transaction
const result = await onChainLevelService.processRewards(userAddress, {
  xp: 160,        // Total XP (participation + bonuses)
  coins: 50,      // Crypto reward
  isCorrectPrediction: true,
  reason: "Event completion"
});
```

### **Reading User Data**

```typescript
// Get complete user level data
const userData = await onChainLevelService.getUserLevelData(userAddress);

// Get level progress
const progress = await onChainLevelService.getLevelProgress(userAddress);

// Get prediction statistics
const stats = await onChainLevelService.getPredictionStats(userAddress);
```

## 🔄 **Synchronization**

### **Automatic Sync**

The system automatically syncs data between local storage and on-chain:

1. **Local First**: Rewards are added immediately to local storage
2. **Chain Update**: Simultaneously added to on-chain if enabled
3. **Conflict Resolution**: On-chain data takes precedence
4. **Recovery**: Local data can be synced to chain anytime

### **Manual Sync**

```typescript
import { useRewards } from '@/hooks/useRewards';

const { syncToOnChain, isSyncing } = useRewards();

// Manual sync button
<button onClick={syncToOnChain} disabled={isSyncing}>
  {isSyncing ? 'Syncing...' : 'Sync to Chain'}
</button>
```

## 🎨 **UI Components**

### **Status Indicators**

The RewardsDisplay component shows on-chain status:

- **Database Icon**: Indicates on-chain storage
- **Green Check**: Data successfully stored on-chain
- **Yellow Alert**: Local-only data
- **Sync Button**: Manual synchronization

### **Reward Badges**

Individual rewards show their storage location:

- **"Chain" Badge**: Stored on-chain
- **No Badge**: Local storage only

## 🛡️ **Security & Permissions**

### **Admin Operations**

Only authorized addresses can:
- Initialize the level system
- Add XP and coins to users
- Update prediction statistics

### **User Data Privacy**

- **Public Data**: Levels, XP, and prediction accuracy are public
- **No Personal Info**: Only wallet addresses and game statistics
- **Opt-in**: Users can disable on-chain storage

## 📊 **Gas Optimization**

### **Efficient Storage**

- **Dynamic Fields**: Only pay for what you use
- **Batch Operations**: Multiple rewards in one transaction
- **Lazy Loading**: Data fetched only when needed

### **Cost Estimates**

- **Initial Setup**: ~0.001 APT (one-time)
- **Level Up**: ~0.0001 APT
- **Reward Distribution**: ~0.00005 APT per batch
- **Data Query**: Free (view functions)

## 🔧 **Development Setup**

### **1. Deploy Move Module**

```bash
# Compile and deploy the level system module
aptos move compile --package-dir move/
aptos move publish --package-dir move/ --profile default
```

### **2. Configure Environment**

```bash
# Copy environment template
cp .env.example .env.local

# Set your contract addresses
VITE_LEVEL_SYSTEM_ADDRESS=0x_your_deployed_address
VITE_VOCE_ADMIN_ADDRESS=0x_your_admin_address
```

### **3. Initialize System**

```typescript
// Admin initialization
await initializeOnChainLevels(adminPrivateKey);
```

## 🎯 **Benefits**

### **For Users**
- **Permanent Progress**: Levels never lost, even if device changes
- **Verification**: Anyone can verify your achievements on-chain
- **Portability**: Take your level history to any platform
- **Trust**: Transparent reward distribution

### **For Developers**
- **Reliability**: No database maintenance
- **Transparency**: All operations auditable on-chain
- **Scalability**: Handle unlimited users efficiently
- **Integration**: Easy to integrate with other dApps

### **For the Ecosystem**
- **Interoperability**: Other apps can read user levels
- **Composability**: Build on top of user achievement data
- **Trustlessness**: No central authority needed for verification
- **Innovation**: New gameplay mechanics possible

## 🚧 **Limitations & Considerations**

### **Current Limitations**
- **Admin Dependency**: Requires admin for reward distribution
- **Gas Costs**: Small fees for on-chain operations
- **Network Latency**: Blockchain confirmation times
- **Complexity**: More complex than local storage

### **Future Improvements**
- **User Self-Service**: Allow users to claim rewards directly
- **Cross-Chain**: Support for other Aptos-based networks
- **NFT Badges**: On-chain achievement badges
- **Delegation**: Allow others to manage rewards

## 📞 **Support**

For issues or questions about the on-chain level system:

1. **Check**: Environment variables are set correctly
2. **Verify**: Contract is deployed and initialized
3. **Test**: With small amounts first
4. **Review**: Transaction hashes for errors

---

*Implemented: October 18, 2025*
*Technology: Aptos Dynamic Fields + Move + TypeScript*
*Status: Production Ready 🚀*