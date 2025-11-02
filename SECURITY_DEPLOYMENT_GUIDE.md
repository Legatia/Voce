# 🔒 Voce Smart Contracts - Security Deployment Guide

## 🚨 CRITICAL SECURITY NOTICE

**All original contracts have been identified with CRITICAL vulnerabilities.**
**DO NOT DEPLOY the original contracts to mainnet under any circumstances.**

This guide is for the **SECURED** versions only (files ending in `_secure.move`).

---

## 📋 Table of Contents

1. [Pre-Deployment Security Checklist](#pre-deployment-security-checklist)
2. [Smart Contract Security Fixes Applied](#smart-contract-security-fixes-applied)
3. [Deployment Environment Setup](#deployment-environment-setup)
4. [Step-by-Step Deployment Process](#step-by-step-deployment-process)
5. [Security Testing Procedures](#security-testing-procedures)
6. [Monitoring and Incident Response](#monitoring-and-incident-response)
7. [Emergency Procedures](#emergency-procedures)

---

## 🔐 Pre-Deployment Security Checklist

### ✅ REQUIRED BEFORE MAINNET DEPLOYMENT

- [ ] **Professional Security Audit Completed**
  - Engage at least 2 reputable security firms
  - All critical and high vulnerabilities must be resolved
  - Audit reports must be publicly available

- [ ] **Multi-Sig Admin Setup**
  - Minimum 3 authorized signers
  - Geographic distribution of signers
  - Hardware security modules (HSMs) for key management

- [ ] **Oracle Integration Tested**
  - At least 2 independent oracles configured
  - Oracle response time < 30 seconds
  - Oracle fallback mechanisms in place

- [ ] **Escrow System Funded**
  - Treasury wallet funded with sufficient APT
  - Insurance fund established (minimum 10% of TVL)
  - Emergency withdrawal mechanisms tested

- [ ] **Rate Limiting Configured**
  - Daily transaction limits per user
  - Global system limits configured
  - Abuse detection mechanisms active

- [ ] **Monitoring Systems Deployed**
  - Real-time transaction monitoring
  - Gas usage tracking
  - Error rate monitoring
  - Performance metrics collection

---

## 🛡️ Smart Contract Security Fixes Applied

### 1. **Secure Voting Contract** (`secure_voting_secure.move`)

#### ✅ FIXED VULNERABILITIES:
- **CRITICAL**: Escrow system implemented - funds now locked in treasury instead of going to creators
- **CRITICAL**: Reentrancy protection added to all external functions
- **HIGH**: Proper Keccak256 hashing with nonce for commitment verification
- **HIGH**: Multi-signature admin controls implemented
- **HIGH**: Rate limiting for event creation (max 10 per creator)
- **MEDIUM**: Minimum participant requirements (3 users minimum)
- **MEDIUM**: Emergency pause functionality
- **MEDIUM**: Enhanced overflow protection using `math64` operations

#### 🔒 NEW SECURITY FEATURES:
- Treasury-based fund management
- Oracle integration for event resolution
- Commitment nonce system
- Event participant minimums
- System-wide pause mechanism

### 2. **Truth Rewards Contract** (`truth_rewards_secure.move`)

#### ✅ FIXED VULNERABILITIES:
- **CRITICAL**: Complete treasury system with proper fund management
- **CRITICAL**: Escrow protection for all prize pools
- **CRITICAL**: Double-claim prevention with claim tracking
- **HIGH**: Oracle-based event resolution system
- **HIGH**: Multi-signature reward distribution
- **MEDIUM**: Rate limiting for event creation
- **MEDIUM**: Minimum participant validation

#### 🔒 NEW SECURITY FEATURES:
- Oracle consensus mechanism
- Claim ID system to prevent double-spending
- Enhanced reward calculation with overflow protection
- Treasury operation transparency
- Event verification tracking

### 3. **Financial System Contract** (`financial_system_secure.move`)

#### ✅ FIXED VULNERABILITIES:
- **CRITICAL**: Proper treasury fund separation (staking, operational, rewards, insurance)
- **HIGH**: Account creation security with proper validation
- **HIGH**: Early withdrawal penalty system
- **MEDIUM**: Daily transaction limits
- **MEDIUM**: Pool caps and individual limits
- **MEDIUM**: KYC verification flags
- **LOW**: Enhanced reward calculation precision

#### 🔒 NEW SECURITY FEATURES:
- Four-tier treasury system
- Insurance fund for emergencies
- Penalty pool for slashing
- User suspension capabilities
- Comprehensive audit trails

### 4. **Level System Contract** (`level_system_secure.move`)

#### ✅ FIXED VULNERABILITIES:
- **HIGH**: Multi-signature governance for XP/coin additions
- **HIGH**: Daily XP limits to prevent abuse
- **MEDIUM**: User suspension system
- **MEDIUM**: Resource exhaustion protection
- **LOW**: Syntax errors and calculation fixes

#### 🔒 NEW SECURITY FEATURES:
- Governance operations with approval workflow
- Daily statistics and limits
- User reputation system
- Emergency pause capabilities
- Comprehensive event logging

---

## 🚀 Deployment Environment Setup

### 1. **Prerequisites**

```bash
# Install required tools
curl -sSf https://dl.aptos.dev/tools/install.sh | sh

# Verify installation
aptos --version

# Clone the secured contracts repository
git clone <secured-repo-url>
cd voce-truth-stake
```

### 2. **Network Configuration**

```bash
# Testnet deployment
export NETWORK=testnet
export ADMIN_ADDRESS="0x YOUR_ADMIN_ADDRESS"

# Mainnet deployment (ONLY AFTER FULL SECURITY AUDIT)
export NETWORK=mainnet
export ADMIN_ADDRESS="0x YOUR_MAINNET_ADMIN_ADDRESS"
```

### 3. **Multi-Sig Setup**

```bash
# Create multi-sig admin accounts
aptos account create --network $NETWORK
# Repeat for at least 3 admins

# Fund the admin accounts
aptos account fund-with-faucet --account $ADMIN_ADDRESS --network testnet
```

---

## 📋 Step-by-Step Deployment Process

### **⚠️ IMPORTANT: Deploy to TESTNET first, validate extensively, then proceed to mainnet**

### Phase 1: Testnet Deployment

#### 1. **Initialize Core Systems**

```bash
# 1. Deploy Level System
aptos move publish --package-name voce::level_system \
  --included-artifacts level_system_secure.move \
  --network $NETWORK \
  --private-key $ADMIN_PRIVATE_KEY \
  --assume-yes

# 2. Deploy Financial System
aptos move publish --package-name voce::financial_system \
  --included-artifacts financial_system_secure.move \
  --network $NETWORK \
  --private-key $ADMIN_PRIVATE_KEY \
  --assume-yes

# 3. Deploy Truth Rewards
aptos move publish --package-name voce::truth_rewards \
  --included-artifacts truth_rewards_secure.move \
  --network $NETWORK \
  --private-key $ADMIN_PRIVATE_KEY \
  --assume-yes

# 4. Deploy Secure Voting
aptos move publish --package-name voce::secure_voting \
  --included-artifacts secure_voting_secure.move \
  --network $NETWORK \
  --private-key $ADMIN_PRIVATE_KEY \
  --assume-yes
```

#### 2. **Initialize Contracts with Multi-Sig**

```bash
# Initialize Level System (requires 3 signatures)
aptos move run \
  --function-id voce::level_system::initialize_level_system \
  --args $ADMIN1_ADDRESS $ADMIN2_ADDRESS $ADMIN3_ADDRESS \
  --network $NETWORK \
  --private-key $ADMIN1_PRIVATE_KEY

# Initialize Financial System
aptos move run \
  --function-id voce::financial_system::initialize_financial_system \
  --network $NETWORK \
  --private-key $ADMIN1_PRIVATE_KEY

# Initialize Truth Rewards with Oracles
aptos move run \
  --function-id voce::truth_rewards::initialize_truth_rewards \
  --args $ADMIN1_ADDRESS $ORACLE1_ADDRESS $ORACLE2_ADDRESS \
  --network $NETWORK \
  --private-key $ADMIN1_PRIVATE_KEY

# Initialize Secure Voting with Multi-Sig
aptos move run \
  --function-id voce::secure_voting::initialize_secure_voting \
  --args $ADMIN1_ADDRESS $ADMIN2_ADDRESS $ADMIN3_ADDRESS 2 \
  --network $NETWORK \
  --private-key $ADMIN1_PRIVATE_KEY
```

#### 3. **Fund Treasury**

```bash
# Fund the treasury with initial liquidity (minimum 10,000 APT for testnet)
aptos account transfer \
  --account $ADMIN_ADDRESS \
  --to $VOCE_ADMIN_ADDRESS \
  --amount 10000 \
  --network $NETWORK \
  --private-key $ADMIN_PRIVATE_KEY
```

### Phase 2: Security Testing

#### 1. **Functionality Testing**

```bash
# Test basic voting flow
./test-scripts/test_voting_flow.sh

# Test reward distribution
./test-scripts/test_rewards_distribution.sh

# Test staking operations
./test-scripts/test_staking_operations.sh

# Test level system
./test-scripts/test_level_system.sh
```

#### 2. **Security Testing**

```bash
# Test reentrancy protection
./test-scripts/test_reentrancy_protection.sh

# Test overflow protection
./test-scripts/test_overflow_protection.sh

# Test access controls
./test-scripts/test_access_controls.sh

# Test rate limiting
./test-scripts/test_rate_limiting.sh
```

#### 3. **Load Testing**

```bash
# Test high-volume transactions
./test-scripts/load_test_voting.sh

# Test concurrent operations
./test-scripts/concurrent_operations_test.sh

# Test system limits
./test-scripts/test_system_limits.sh
```

### Phase 3: Mainnet Deployment (⚠️ AFTER FULL AUDIT)

#### 1. **Pre-Deployment Checks**

```bash
# Verify all contracts are deployed and working
aptos move view --function-id voce::level_system::get_system_statistics

# Verify treasury is funded
aptos account query --account $VOCE_ADMIN_ADDRESS --network mainnet

# Verify multi-sig is working
aptos move view --function-id voce::level_system::get_pending_operations
```

#### 2. **Deploy to Mainnet**

```bash
# Repeat deployment steps for mainnet
export NETWORK=mainnet

# Deploy contracts in order
# 1. Level System
# 2. Financial System
# 3. Truth Rewards
# 4. Secure Voting
```

#### 3. **Post-Deployment Verification**

```bash
# Verify all systems are operational
./scripts/health_check.sh

# Verify monitoring is active
./scripts/monitoring_check.sh

# Verify emergency controls work
./scripts/test_emergency_controls.sh
```

---

## 🧪 Security Testing Procedures

### 1. **Automated Security Tests**

```bash
# Run comprehensive security test suite
./security-tests/run_all_security_tests.sh

# Specific vulnerability tests
./security-tests/test_escrow_protection.sh
./security-tests/test_reentrancy_protection.sh
./security-tests/test_oracle_manipulation.sh
```

### 2. **Manual Security Verification**

#### Escrow System Verification
```bash
# 1. Create a voting event
# 2. Place commitment with funds
# 3. Verify funds are in escrow (not creator wallet)
# 4. Check treasury balance reflects escrowed funds
```

#### Multi-Sig Verification
```bash
# 1. Propose operation with admin 1
# 2. Verify operation is pending
# 3. Approve with admin 2
# 4. Approve with admin 3
# 5. Verify operation executed
```

#### Oracle Verification
```bash
# 1. Create truth event
# 2. Submit oracle verifications
# 3. Verify consensus mechanism works
# 4. Test oracle fallback
```

### 3. **Penetration Testing**

```bash
# Test common attack vectors
./penetration-tests/test_front_running.sh
./penetration-tests/test_rug_pull_attempts.sh
./penetration-tests/test_oracle_manipulation.sh
./penetration-tests/test_reentrancy_attacks.sh
```

---

## 📊 Monitoring and Incident Response

### 1. **Real-Time Monitoring Setup**

```bash
# Deploy monitoring stack
docker-compose up -d monitoring/

# Configure alerts
./monitoring/setup_alerts.sh

# Verify monitoring is working
./monitoring/health_check.sh
```

### 2. **Key Metrics to Monitor**

- **Treasury Balance**: Must never go negative
- **Escrow Pool Balances**: Should match total user stakes
- **Gas Usage**: Unusual spikes may indicate attacks
- **Error Rates**: Sudden increases need investigation
- **Transaction Volume**: Abnormal patterns may signal abuse
- **Oracle Response Times**: Should be < 30 seconds

### 3. **Alert Thresholds**

```yaml
alerts:
  treasury_balance_low:
    threshold: 1000 APT
    action: immediate_notification

  high_error_rate:
    threshold: 5% over 5 minutes
    action: investigate_and_potential_pause

  unusual_gas_usage:
    threshold: 3x normal usage
    action: investigate_potential_attack

  oracle_timeout:
    threshold: 30 seconds
    action: fallback_oracle_activation
```

### 4. **Incident Response Procedures**

#### 🚨 CRITICAL INCIDENT (Treasury compromise)
1. **IMMEDIATE**: Emergency pause all systems
2. **NOTIFY**: All admins and security team
3. **ASSESS**: Scope of compromise
4. **COMMUNICATE**: Public announcement if user funds at risk
5. **RECOVER**: Restore from backup if available
6. **INVESTIGATE**: Root cause analysis
7. **PREVENT**: Implement additional safeguards

#### ⚠️ HIGH PRIORITY (System abuse)
1. **QUICK**: Identify and block malicious actors
2. **TEMPORARY**: Pause affected functions
3. **INVESTIGATE**: Attack pattern and impact
4. **REMEDIATE**: Patch vulnerabilities
5. **COMMUNICATE**: Update on resolution status

#### 📋 MEDIUM PRIORITY (Performance issues)
1. **MONITOR**: System performance metrics
2. **OPTIMIZE**: Contract interactions
3. **SCALE**: Additional resources if needed
4. **DOCUMENT**: Performance baselines

---

## 🆘 Emergency Procedures

### 1. **Emergency System Pause**

```bash
# Pause all systems immediately
aptos move run \
  --function-id voce::secure_voting::emergency_pause \
  --args "CRITICAL_SECURITY_INCIDENT" \
  --network mainnet \
  --private-key $EMERGENCY_ADMIN_KEY

# Pause other systems
aptos move run \
  --function-id voce::truth_rewards::emergency_pause \
  --args "CRITICAL_SECURITY_INCIDENT" \
  --network mainnet \
  --private-key $EMERGENCY_ADMIN_KEY
```

### 2. **Emergency User Withdrawals**

```bash
# Enable emergency withdrawals
aptos move run \
  --function-id voce::financial_system::enable_emergency_withdrawals \
  --network mainnet \
  --private-key $EMERGENCY_ADMIN_KEY
```

### 3. **Fund Recovery Procedures**

```bash
# If treasury is compromised, work with Aptos team
# Contact: security@aptos.dev
# Provide: Transaction hashes, affected addresses, timeline
```

### 4. **Communication Protocol**

1. **Internal**: Alert all team members via secure channels
2. **External**: Public announcement within 1 hour of critical incident
3. **Users**: Clear instructions for fund protection
4. **Authorities**: Report if criminal activity suspected

---

## ✅ Post-Deployment Security Checklist

### Daily Monitoring
- [ ] Treasury balances checked
- [ ] Transaction volumes normal
- [ ] Error rates within threshold
- [ ] Oracle responses timely
- [ ] No pending multi-sig operations expired

### Weekly Reviews
- [ ] Security audit log review
- [ ] Access control changes reviewed
- [ ] Performance metrics analyzed
- [ ] Incident response procedures tested
- [ ] Backup systems verified

### Monthly Assessments
- [ ] Full security audit review
- [ ] Threat model updated
- [ ] Emergency procedures tested
- [ ] Team security training
- [ ] Public security report published

---

## 📞 Emergency Contacts

### Security Team
- **Lead Security Engineer**: [Contact Information]
- **Smart Contract Auditor**: [Contact Information]
- **Multi-sig Admins**: [Contact List]

### External Support
- **Aptos Security Team**: security@aptos.dev
- **Smart Contract Security Firm**: [Contact Information]
- **Legal Counsel**: [Contact Information]

### Communication Channels
- **Internal Security Slack**: #security-alerts
- **Emergency Email**: security@voce.io
- **Public Announcements**: Twitter @VoceSecurity

---

## ⚠️ FINAL WARNING

**These contracts have been significantly hardened but no system is 100% secure.**

Always:
- Start with small amounts on mainnet
- Monitor systems continuously
- Have emergency procedures ready
- Keep security teams on standby
- Never disable security features for convenience

**Security is an ongoing process, not a one-time setup.**

---

*Last Updated: October 24, 2025*
*Security Version: 1.0.0*
*Audit Status: PENDING - DO NOT DEPLOY TO MAINNET*