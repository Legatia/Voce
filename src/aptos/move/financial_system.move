module voce::financial_system {
    use std::error;
    use std::signer;
    use std::string::String;
    use std::vector;
    use std::math64;
    use aptos_framework::account;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::guid;

    /// Reentrancy guard
    struct ReentrancyGuard has key {
        entered: bool,
    }

    /// Enhanced treasury with separation of concerns
    struct Treasury has key {
        staking_funds: Coin<AptosCoin>,        // User staked funds
        operational_funds: Coin<AptosCoin>,    // Platform operational funds
        reward_reserve: Coin<AptosCoin>,       // Reserved for rewards
        insurance_fund: Coin<AptosCoin>,       // Insurance for emergencies
        last_updated: u64,
        total_deposits: u64,
        total_withdrawals: u64,
    }

    /// Secure staking pool with enhanced controls
    struct StakingPool has key, store {
        pool_id: u64,
        creator: address,
        total_staked: u64,
        lockup_duration: u64,
        apy_percentage: u64,
        stakers: vector<Staker>,
        created_at: u64,
        last_updated: u64,
        is_active: bool,
        is_paused: bool,                    // Emergency pause
        max_total_stake: u64,              // Pool cap
        min_stake_amount: u64,             // Minimum stake
        early_withdrawal_penalty: u64,      // Penalty percentage
    }

    /// Enhanced staker information with security features
    struct Staker has store {
        address: address,
        amount_staked: u64,
        staked_at: u64,
        unlock_time: u64,
        rewards_earned: u64,
        last_reward_calculation: u64,
        is_active: bool,
        withdrawal_requested: bool,        // For queued withdrawals
        early_withdrawal_penalty_applied: bool,
        stake_id: u64,                     // Unique identifier
    }

    /// User's financial profile with enhanced tracking
    struct UserProfile has key {
        owner: address,
        total_earned: u64,
        total_staked: u64,
        total_withdrawn: u64,
        staking_history: vector<StakingHistory>,
        reward_history: vector<RewardHistory>,
        level: u32,
        created_at: u64,
        last_activity: u64,
        is_suspended: bool,                // Account suspension
        kyc_verified: bool,                // KYC status
        daily_stake_limit: u64,            // Daily limits
        last_stake_time: u64,
    }

    /// Staking history record with enhanced details
    struct StakingHistory has store {
        pool_id: u64,
        amount: u64,
        action: String,
        timestamp: u64,
        transaction_hash: vector<u8>,
        stake_id: u64,
        penalty_applied: u64,
    }

    /// Reward history record with audit trail
    struct RewardHistory has store {
        source: String,
        amount: u64,
        timestamp: u64,
        transaction_hash: vector<u8>,
        pool_id: u64,
        reward_type: String,               // "staking", "prediction", "bonus", etc.
        distributed_by: address,           // Who distributed the reward
    }

    /// Global financial registry with enhanced governance
    struct FinancialRegistry has key {
        staking_pools: vector<StakingPool>,
        next_pool_id: u64,
        next_stake_id: u64,
        total_volume_locked: u64,
        total_rewards_distributed: u64,
        is_paused: bool,                   // System-wide pause
        emergency_withdrawal_enabled: bool,
        max_pools_per_creator: u64,
        system_settings: SystemSettings,
    }

    struct SystemSettings has store {
        max_apy_percentage: u64,
        max_lockup_duration: u64,
        min_lockup_duration: u64,
        platform_fee_percentage: u64,
        insurance_percentage: u64,
        daily_stake_limit: u64,
        max_stake_amount: u64,
    }

    /// Slashing and penalty system
    struct SlashRecord has store {
        staker_address: address,
        pool_id: u64,
        slash_amount: u64,
        reason: String,
        timestamp: u64,
        slashed_by: address,
    }

    struct PenaltyPool has key {
        total_penalties: Coin<AptosCoin>,
        slash_records: vector<SlashRecord>,
        last_distribution: u64,
    }

    /// Enhanced events for transparency
    struct StakingPoolCreated has drop, store {
        pool_id: u64,
        creator: address,
        lockup_duration: u64,
        apy_percentage: u64,
        max_total_stake: u64,
        treasury_address: address,
    }

    struct TokensStaked has drop, store {
        pool_id: u64,
        staker: address,
        amount: u64,
        unlock_time: u64,
        stake_id: u64,
        apy_percentage: u64,
    }

    struct TokensUnstaked has drop, store {
        pool_id: u64,
        staker: address,
        amount: u64,
        rewards_claimed: u64,
        penalty_applied: u64,
        stake_id: u64,
    }

    struct RewardsDistributed has drop, store {
        recipient: address,
        amount: u64,
        source: String,
        pool_id: u64,
        reward_type: String,
        transaction_hash: vector<u8>,
    }

    struct TreasuryOperation has drop, store {
        operation_type: String,
        amount: u64,
        from_pool: String,
        to_pool: String,
        timestamp: u64,
        operator: address,
        new_balance: Coin<AptosCoin>,
    }

    struct EmergencyAction has drop, store {
        action_type: String,
        reason: String,
        timestamp: u64,
        operator: address,
        affected_pools: vector<u64>,
    }

    /// Security constants with enhanced parameters
    const MIN_STAKE_AMOUNT: u64 = 1;
    const MAX_APY_PERCENTAGE: u64 = 50;
    const MIN_LOCKUP_DURATION: u64 = 3600;        // 1 hour minimum
    const MAX_LOCKUP_DURATION: u64 = 31536000;     // 1 year maximum
    const REWARD_CALCULATION_INTERVAL: u64 = 3600;  // Calculate rewards every hour
    const PLATFORM_FEE_PERCENTAGE: u64 = 5;
    const INSURANCE_PERCENTAGE: u64 = 2;
    const MAX_POOLS_PER_CREATOR: u64 = 5;
    const DAILY_STAKE_LIMIT: u64 = 10000;
    const MAX_STAKE_AMOUNT: u64 = 1000000;
    const MAX_POOL_TOTAL_STAKE: u64 = 10000000;    // Pool cap
    const EARLY_WITHDRAWAL_PENALTY: u64 = 10;      // 10% penalty
    const MIN_STAKE_AMOUNT_PER_POOL: u64 = 10;     // Pool-specific minimum

    /// Enhanced error codes
    const ENOT_AUTHORIZED: u64 = 3001;
    const EPOOL_NOT_FOUND: u64 = 3002;
    const EINSUFFICIENT_BALANCE: u64 = 3003;
    const EINVALID_AMOUNT: u64 = 3004;
    const ESTAKE_NOT_FOUND: u64 = 3005;
    const ESTAKE_LOCKED: u64 = 3006;
    const EPOOL_INACTIVE: u64 = 3007;
    const EINVALID_LOCKUP: u64 = 3008;
    const EINVALID_APY: u64 = 3009;
    const EUSER_PROFILE_NOT_FOUND: u64 = 3010;
    const EREENTRANCY_DETECTED: u64 = 3011;
    const ESYSTEM_PAUSED: u64 = 3012;
    const EUSER_SUSPENDED: u64 = 3013;
    const EDAILY_LIMIT_EXCEEDED: u64 = 3014;
    const EPOOL_CAP_EXCEEDED: u64 = 3015;
    const EACCOUNT_CREATION_FAILED: u64 = 3016;
    const EINSUFFICIENT_TREASURY: u64 = 3017;
    const EWITHDRAWAL_ALREADY_REQUESTED: u64 = 3018;
    const EINVALID_WITHDRAWAL_REQUEST: u64 = 3019;

    /// Initialize the enhanced financial system
    public entry fun initialize_financial_system(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @voce_admin, error::permission_denied(ENOT_AUTHORIZED));

        // Initialize reentrancy guard
        if (!exists<ReentrancyGuard>(admin_addr)) {
            move_to(admin, ReentrancyGuard { entered: false });
        }

        // Initialize enhanced treasury
        if (!exists<Treasury>(admin_addr)) {
            let treasury = Treasury {
                staking_funds: coin::zero<AptosCoin>(),
                operational_funds: coin::zero<AptosCoin>(),
                reward_reserve: coin::zero<AptosCoin>(),
                insurance_fund: coin::zero<AptosCoin>(),
                last_updated: timestamp::now_seconds(),
                total_deposits: 0,
                total_withdrawals: 0,
            };
            move_to(admin, treasury);
        }

        // Initialize penalty pool
        if (!exists<PenaltyPool>(admin_addr)) {
            let penalty_pool = PenaltyPool {
                total_penalties: coin::zero<AptosCoin>(),
                slash_records: vector::empty(),
                last_distribution: timestamp::now_seconds(),
            };
            move_to(admin, penalty_pool);
        }

        // Initialize enhanced financial registry
        if (!exists<FinancialRegistry>(admin_addr)) {
            let system_settings = SystemSettings {
                max_apy_percentage: MAX_APY_PERCENTAGE,
                max_lockup_duration: MAX_LOCKUP_DURATION,
                min_lockup_duration: MIN_LOCKUP_DURATION,
                platform_fee_percentage: PLATFORM_FEE_PERCENTAGE,
                insurance_percentage: INSURANCE_PERCENTAGE,
                daily_stake_limit: DAILY_STAKE_LIMIT,
                max_stake_amount: MAX_STAKE_AMOUNT,
            };

            let registry = FinancialRegistry {
                staking_pools: vector::empty(),
                next_pool_id: 1,
                next_stake_id: 1,
                total_volume_locked: 0,
                total_rewards_distributed: 0,
                is_paused: false,
                emergency_withdrawal_enabled: false,
                max_pools_per_creator: MAX_POOLS_PER_CREATOR,
                system_settings,
            };
            move_to(admin, registry);
        }
    }

    /// Reentrancy protection
    fun enter_non_reentrant(admin_addr: address) acquires ReentrancyGuard {
        let guard = borrow_global_mut<ReentrancyGuard>(admin_addr);
        assert!(!guard.entered, error::permission_denied(EREENTRANCY_DETECTED));
        guard.entered = true;
    }

    fun exit_non_reentrant(admin_addr: address) acquires ReentrancyGuard {
        let guard = borrow_global_mut<ReentrancyGuard>(admin_addr);
        guard.entered = false;
    }

    /// Create secure user profile with validation
    fun create_user_profile(user: &signer) acquires FinancialRegistry {
        let user_addr = signer::address_of(user);

        assert!(account::exists_at(user_addr), error::invalid_argument(EACCOUNT_CREATION_FAILED));

        let registry = borrow_global<FinancialRegistry>(@voce_admin);
        let daily_limit = registry.system_settings.daily_stake_limit;

        let current_time = timestamp::now_seconds();

        let profile = UserProfile {
            owner: user_addr,
            total_earned: 0,
            total_staked: 0,
            total_withdrawn: 0,
            staking_history: vector::empty(),
            reward_history: vector::empty(),
            level: 1,
            created_at: current_time,
            last_activity: current_time,
            is_suspended: false,
            kyc_verified: true, // Default to true for demo
            daily_stake_limit: daily_limit,
            last_stake_time: 0,
        };

        move_to(user, profile);
    }

    /// Create a new staking pool with enhanced validation
    public entry fun create_staking_pool(
        creator: &signer,
        lockup_duration_hours: u64,
        apy_percentage: u64,
        max_total_stake: u64
    ) acquires FinancialRegistry, Treasury {
        let creator_addr = signer::address_of(creator);
        let registry_addr = @voce_admin;

        // Security checks
        assert!(!is_system_paused(), error::permission_denied(ESYSTEM_PAUSED));
        assert!(lockup_duration_hours >= 1 && lockup_duration_hours <= 8760, error::invalid_argument(EINVALID_LOCKUP));
        assert!(apy_percentage > 0 && apy_percentage <= MAX_APY_PERCENTAGE, error::invalid_argument(EINVALID_APY));
        assert!(max_total_stake <= MAX_POOL_TOTAL_STAKE, error::invalid_argument(EPOOL_CAP_EXCEEDED));

        enter_non_reentrant(registry_addr);

        // Create user profile if doesn't exist
        if (!exists<UserProfile>(creator_addr)) {
            create_user_profile(creator);
        }

        let registry = borrow_global_mut<FinancialRegistry>(registry_addr);

        // Rate limiting: check pools per creator
        let creator_pools = count_pools_by_creator(&registry.staking_pools, creator_addr);
        assert!(creator_pools < registry.max_pools_per_creator, error::permission_denied(ERATE_LIMIT_EXCEEDED));

        let pool_id = registry.next_pool_id;
        registry.next_pool_id = math64::add(pool_id, 1)?;

        let lockup_duration = math64::mul(lockup_duration_hours, 3600)?;
        let current_time = timestamp::now_seconds();
        let unlock_time = math64::add(current_time, lockup_duration)?;

        let pool = StakingPool {
            pool_id,
            creator: creator_addr,
            total_staked: 0,
            lockup_duration,
            apy_percentage,
            stakers: vector::empty(),
            created_at: current_time,
            last_updated: current_time,
            is_active: true,
            is_paused: false,
            max_total_stake,
            min_stake_amount: MIN_STAKE_AMOUNT_PER_POOL,
            early_withdrawal_penalty: EARLY_WITHDRAWAL_PENALTY,
        };

        vector::push_back(&mut registry.staking_pools, pool);

        // Emit pool creation event
        event::emit(StakingPoolCreated {
            pool_id,
            creator: creator_addr,
            lockup_duration,
            apy_percentage,
            max_total_stake,
            treasury_address: registry_addr,
        });

        exit_non_reentrant(registry_addr);
    }

    /// Stake tokens with enhanced security and validation
    public entry fun stake_tokens(
        staker: &signer,
        pool_id: u64,
        amount: u64
    ) acquires FinancialRegistry, Treasury, UserProfile {
        let staker_addr = signer::address_of(staker);
        let registry_addr = @voce_admin;

        // Security checks
        assert!(!is_system_paused(), error::permission_denied(ESYSTEM_PAUSED));
        assert!(amount >= MIN_STAKE_AMOUNT, error::invalid_argument(EINVALID_AMOUNT));
        assert!(amount <= MAX_STAKE_AMOUNT, error::invalid_argument(EINVALID_AMOUNT));

        enter_non_reentrant(registry_addr);

        // Validate user profile
        assert!(exists<UserProfile>(staker_addr), error::not_found(EUSER_PROFILE_NOT_FOUND));
        let user_profile = borrow_global_mut<UserProfile>(staker_addr);
        assert!(!user_profile.is_suspended, error::permission_denied(EUSER_SUSPENDED));

        // Daily limit check
        let current_time = timestamp::now_seconds();
        let days_since_last_stake = if (user_profile.last_stake_time > 0) {
            math64::div(current_time - user_profile.last_stake_time, 86400)?
        } else {
            1
        };

        if (days_since_last_stake == 0) {
            // Check daily limit - this is simplified, in production track rolling 24h window
            assert!(amount <= user_profile.daily_stake_limit, error::permission_denied(EDAILY_LIMIT_EXCEEDED));
        }

        let registry = borrow_global_mut<FinancialRegistry>(registry_addr);
        let pool = find_pool_mut(&mut registry.staking_pools, pool_id);

        assert!(pool.is_active && !pool.is_paused, error::invalid_argument(EPOOL_INACTIVE));
        assert!(amount >= pool.min_stake_amount, error::invalid_argument(EINVALID_AMOUNT));
        assert!(pool.total_staked + amount <= pool.max_total_stake, error::invalid_argument(EPOOL_CAP_EXCEEDED));

        // Transfer to treasury staking funds (NOT to creator)
        let stake_payment = coin::withdraw<AptosCoin>(staker, amount);
        let treasury = borrow_global_mut<Treasury>(registry_addr);

        // Add to staking funds
        coin::deposit(&mut treasury.staking_funds, stake_payment);
        treasury.total_deposits = math64::add(treasury.total_deposits, amount)?;

        let stake_id = registry.next_stake_id;
        registry.next_stake_id = math64::add(stake_id, 1)?;

        let unlock_time = math64::add(current_time, pool.lockup_duration)?;

        // Create staker record with enhanced tracking
        let staker_record = Staker {
            address: staker_addr,
            amount_staked: amount,
            staked_at: current_time,
            unlock_time,
            rewards_earned: 0,
            last_reward_calculation: current_time,
            is_active: true,
            withdrawal_requested: false,
            early_withdrawal_penalty_applied: false,
            stake_id,
        };

        vector::push_back(&mut pool.stakers, staker_record);
        pool.total_staked = math64::add(pool.total_staked, amount)?;
        pool.last_updated = current_time;

        // Update global stats
        registry.total_volume_locked = math64::add(registry.total_volume_locked, amount)?;

        // Update user profile
        user_profile.total_staked = math64::add(user_profile.total_staked, amount)?;
        user_profile.last_activity = current_time;
        user_profile.last_stake_time = current_time;

        // Add to staking history
        let history_record = StakingHistory {
            pool_id,
            amount,
            action: string::utf8(b"stake"),
            timestamp: current_time,
            transaction_hash: bcs::to_bytes(&stake_id),
            stake_id,
            penalty_applied: 0,
        };
        vector::push_back(&mut user_profile.staking_history, history_record);

        // Emit staking event
        event::emit(TokensStaked {
            pool_id,
            staker: staker_addr,
            amount,
            unlock_time,
            stake_id,
            apy_percentage: pool.apy_percentage,
        });

        // Emit treasury operation
        let new_balance = coin::balance<AptosCoin>(registry_addr);
        event::emit(TreasuryOperation {
            operation_type: string::utf8(b"stake_deposit"),
            amount,
            from_pool: string::utf8(b"user"),
            to_pool: string::utf8(b"staking_funds"),
            timestamp: current_time,
            operator: staker_addr,
            new_balance: coin::zero<AptosCoin>(), // Simplified
        });

        exit_non_reentrant(registry_addr);
    }

    /// Unstake tokens with early withdrawal penalties
    public entry fun unstake_tokens(
        staker: &signer,
        pool_id: u64
    ) acquires FinancialRegistry, Treasury, UserProfile {
        let staker_addr = signer::address_of(staker);
        let registry_addr = @voce_admin;

        assert!(!is_system_paused() || is_emergency_withdrawal_enabled(), error::permission_denied(ESYSTEM_PAUSED));

        enter_non_reentrant(registry_addr);

        assert!(exists<UserProfile>(staker_addr), error::not_found(EUSER_PROFILE_NOT_FOUND));
        let user_profile = borrow_global_mut<UserProfile>(staker_addr);

        let registry = borrow_global_mut<FinancialRegistry>(registry_addr);
        let pool = find_pool_mut(&mut registry.staking_pools, pool_id);
        let treasury = borrow_global_mut<Treasury>(registry_addr);

        let current_time = timestamp::now_seconds();

        // Find staker record
        let staker_index = find_staker(&pool.stakers, staker_addr);
        assert!(staker_index < 18446744073709551615, error::not_found(ESTAKE_NOT_FOUND));

        let staker_record = vector::borrow_mut(&mut pool.stakers, staker_index);
        assert!(staker_record.is_active, error::not_found(ESTAKE_NOT_FOUND));

        let is_early_withdrawal = current_time < staker_record.unlock_time;
        let penalty_amount = 0;

        if (is_early_withdrawal && !is_emergency_withdrawal_enabled()) {
            // Apply early withdrawal penalty
            penalty_amount = math64::div(math64::mul(staker_record.amount_staked, pool.early_withdrawal_penalty)?, 100)?;
            staker_record.early_withdrawal_penalty_applied = true;

            // Transfer penalty to penalty pool
            let penalty_coins = coin::withdraw<AptosCoin>(@voce_admin, penalty_amount);
            if (exists<PenaltyPool>(registry_addr)) {
                let penalty_pool = borrow_global_mut<PenaltyPool>(registry_addr);
                coin::deposit(&mut penalty_pool.total_penalties, penalty_coins);
            }
        }

        // Calculate pending rewards
        let pending_rewards = calculate_pending_rewards_secure(staker_record, pool.apy_percentage, current_time);
        staker_record.rewards_earned = math64::add(staker_record.rewards_earned, pending_rewards)?;
        staker_record.is_active = false;

        let total_amount = math64::add(staker_record.amount_staked, pending_rewards)?;
        let final_amount = math64::sub(total_amount, penalty_amount)?;

        // Check treasury has sufficient funds
        let treasury_balance = coin::balance<AptosCoin>(registry_addr);
        assert!(treasury_balance >= final_amount, error::invalid_argument(EINSUFFICIENT_TREASURY));

        // Transfer from treasury staking funds
        let withdrawal = coin::withdraw<AptosCoin>(@voce_admin, final_amount);
        coin::deposit(staker_addr, withdrawal);

        // Update treasury
        treasury.total_withdrawals = math64::add(treasury.total_withdrawals, final_amount)?;
        let remaining_staking = math64::sub(coin::balance(&mut treasury.staking_funds), staker_record.amount_staked)?;
        coin::withdraw(&mut treasury.staking_funds, staker_record.amount_staked); // Remove from staking

        // Update pool
        pool.total_staked = math64::sub(pool.total_staked, staker_record.amount_staked)?;
        pool.last_updated = current_time;

        // Update global stats
        registry.total_volume_locked = math64::sub(registry.total_volume_locked, staker_record.amount_staked)?;

        // Update user profile
        user_profile.total_staked = math64::sub(user_profile.total_staked, staker_record.amount_staked)?;
        user_profile.total_withdrawn = math64::add(user_profile.total_withdrawn, final_amount)?;
        user_profile.total_earned = math64::add(user_profile.total_earned, pending_rewards)?;
        user_profile.last_activity = current_time;

        // Add to staking history
        let history_record = StakingHistory {
            pool_id,
            amount: staker_record.amount_staked,
            action: string::utf8(b"unstake"),
            timestamp: current_time,
            transaction_hash: bcs::to_bytes(&staker_record.stake_id),
            stake_id: staker_record.stake_id,
            penalty_applied: penalty_amount,
        };
        vector::push_back(&mut user_profile.staking_history, history_record);

        // Add to reward history
        if (pending_rewards > 0) {
            let reward_record = RewardHistory {
                source: string::utf8(b"staking"),
                amount: pending_rewards,
                timestamp: current_time,
                transaction_hash: bcs::to_bytes(&staker_record.stake_id),
                pool_id,
                reward_type: string::utf8(b"staking_reward"),
                distributed_by: @voce_admin,
            };
            vector::push_back(&mut user_profile.reward_history, reward_record);
        }

        // Emit unstaking event
        event::emit(TokensUnstaked {
            pool_id,
            staker: staker_addr,
            amount: staker_record.amount_staked,
            rewards_claimed: pending_rewards,
            penalty_applied: penalty_amount,
            stake_id: staker_record.stake_id,
        });

        exit_non_reentrant(registry_addr);
    }

    /// Distribute rewards with enhanced tracking
    public entry fun distribute_rewards(
        admin: &signer,
        recipient: address,
        amount: u64,
        source: String
    ) acquires FinancialRegistry, Treasury, UserProfile {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @voce_admin, error::permission_denied(ENOT_AUTHORIZED));
        assert!(amount > 0, error::invalid_argument(EINVALID_AMOUNT));

        // Create user profile if doesn't exist
        if (!exists<UserProfile>(recipient)) {
            let recipient_signer = &signer::create_account_for_test(recipient);
            create_user_profile(recipient_signer);
        }

        let registry = borrow_global_mut<FinancialRegistry>(admin_addr);
        let user_profile = borrow_global_mut<UserProfile>(recipient);
        let treasury = borrow_global_mut<Treasury>(admin_addr);

        // Calculate platform fee
        let platform_fee = math64::div(math64::mul(amount, PLATFORM_FEE_PERCENTAGE)?, 100)?;
        let user_reward = math64::sub(amount, platform_fee)?;

        // Check treasury has sufficient funds
        let treasury_balance = coin::balance<AptosCoin>(admin_addr);
        assert!(treasury_balance >= amount, error::invalid_argument(EINSUFFICIENT_TREASURY));

        // Transfer user reward
        let reward_payment = coin::withdraw<AptosCoin>(admin, user_reward);
        coin::deposit(recipient, reward_payment);

        // Add platform fee to operational funds
        let fee_payment = coin::withdraw<AptosCoin>(admin, platform_fee);
        coin::deposit(&mut treasury.operational_funds, fee_payment);

        // Update user profile
        user_profile.total_earned = math64::add(user_profile.total_earned, user_reward)?;
        user_profile.last_activity = timestamp::now_seconds();

        // Add to reward history
        let reward_record = RewardHistory {
            source,
            amount: user_reward,
            timestamp: timestamp::now_seconds(),
            transaction_hash: bcs::to_bytes(&user_reward),
            pool_id: 0, // 0 for external rewards
            reward_type: string::utf8(b"external_reward"),
            distributed_by: admin_addr,
        };
        vector::push_back(&mut user_profile.reward_history, reward_record);

        // Update registry stats
        registry.total_rewards_distributed = math64::add(registry.total_rewards_distributed, user_reward)?;

        // Emit reward distribution event
        event::emit(RewardsDistributed {
            recipient,
            amount: user_reward,
            source,
            pool_id: 0,
            reward_type: string::utf8(b"external_reward"),
            transaction_hash: bcs::to_bytes(&user_reward),
        });
    }

    /// Emergency pause function
    public entry fun emergency_pause(admin: &signer, reason: String) acquires FinancialRegistry {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @voce_admin, error::permission_denied(ENOT_AUTHORIZED));

        let registry = borrow_global_mut<FinancialRegistry>(admin_addr);
        registry.is_paused = true;

        event::emit(EmergencyAction {
            action_type: string::utf8(b"pause"),
            reason,
            timestamp: timestamp::now_seconds(),
            operator: admin_addr,
            affected_pools: vector::empty(),
        });
    }

    /// Enable emergency withdrawals
    public entry fun enable_emergency_withdrawals(admin: &signer) acquires FinancialRegistry {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @voce_admin, error::permission_denied(ENOT_AUTHORIZED));

        let registry = borrow_global_mut<FinancialRegistry>(admin_addr);
        registry.emergency_withdrawal_enabled = true;
    }

    /// Calculate pending rewards with overflow protection
    fun calculate_pending_rewards_secure(staker: &Staker, apy_percentage: u64, current_time: u64): u64 {
        if (!staker.is_active || staker.amount_staked == 0) {
            return 0
        }

        let time_staked = current_time - staker.last_reward_calculation;
        if (time_staked < REWARD_CALCULATION_INTERVAL) {
            return 0
        }

        // More precise calculation using larger units to avoid integer division issues
        let annual_rate_full = math64::mul(staker.amount_staked, math64::mul(apy_percentage, 1000000)?)?; // Multiply by 1M for precision
        let denominator = math64::mul(100 * 365 * 24 * 3600, 1000000)?; // Scale denominator
        let rate_per_second = math64::div(annual_rate_full, denominator)?;
        let pending_rewards = math64::div(math64::mul(rate_per_second, time_staked)?, 1000000)?; // Scale back

        pending_rewards
    }

    /// Check if system is paused
    fun is_system_paused(): bool acquires FinancialRegistry {
        let registry = borrow_global<FinancialRegistry>(@voce_admin);
        registry.is_paused
    }

    /// Check if emergency withdrawals are enabled
    fun is_emergency_withdrawal_enabled(): bool acquires FinancialRegistry {
        let registry = borrow_global<FinancialRegistry>(@voce_admin);
        registry.emergency_withdrawal_enabled
    }

    /// Helper function to count pools by creator
    fun count_pools_by_creator(pools: &vector<StakingPool>, creator: address): u64 {
        let count = 0;
        let i = 0;
        let len = vector::length(pools);
        while (i < len) {
            let pool = vector::borrow(pools, i);
            if (pool.creator == creator) {
                count = count + 1;
            };
            i = i + 1;
        };
        count
    }

    /// Helper function to find pool (mutable)
    fun find_pool_mut(pools: &mut vector<StakingPool>, pool_id: u64): &mut StakingPool {
        let i = 0;
        let len = vector::length(pools);

        while (i < len) {
            let pool = vector::borrow_mut(pools, i);
            if (pool.pool_id == pool_id) {
                return pool
            };
            i = i + 1;
        };

        abort error::not_found(EPOOL_NOT_FOUND)
    }

    /// Helper function to find staker
    fun find_staker(stakers: &vector<Staker>, staker_addr: address): u64 {
        let i = 0;
        let len = vector::length(stakers);

        while (i < len) {
            let staker = vector::borrow(stakers, i);
            if (staker.address == staker_addr && staker.is_active) {
                return i
            };
            i = i + 1;
        };

        18446744073709551615 // Max u64 (not found)
    }

    /// Public view functions (compatible with original interface)
    public fun get_user_profile_summary(user_addr: address): (u64, u64, u64, u32) acquires UserProfile {
        assert!(exists<UserProfile>(user_addr), error::not_found(EUSER_PROFILE_NOT_FOUND));

        let profile = borrow_global<UserProfile>(user_addr);
        (
            profile.total_earned,
            profile.total_staked,
            profile.total_withdrawn,
            profile.level
        )
    }

    public fun get_staking_pool_details(registry_addr: address, pool_id: u64): (u64, u64, u64, u64, bool) acquires FinancialRegistry {
        assert!(exists<FinancialRegistry>(registry_addr), error::not_found(ENOT_AUTHORIZED));

        let registry = borrow_global<FinancialRegistry>(registry_addr);
        let pool = find_pool(&registry.staking_pools, pool_id);

        (
            pool.total_staked,
            pool.lockup_duration,
            pool.apy_percentage,
            pool.created_at,
            pool.is_active
        )
    }

    public fun get_user_stake(registry_addr: address, pool_id: u64, user_addr: address): (u64, u64, u64, bool) acquires FinancialRegistry {
        assert!(exists<FinancialRegistry>(registry_addr), error::not_found(ENOT_AUTHORIZED));

        let registry = borrow_global<FinancialRegistry>(registry_addr);
        let pool = find_pool(&registry.staking_pools, pool_id);

        let i = 0;
        let len = vector::length(&pool.stakers);
        while (i < len) {
            let staker = vector::borrow(&pool.stakers, i);
            if (staker.address == user_addr && staker.is_active) {
                return (
                    staker.amount_staked,
                    staker.staked_at,
                    staker.unlock_time,
                    true
                )
            };
            i = i + 1;
        };

        (0, 0, 0, false) // No active stake found
    }

    public fun get_system_statistics(registry_addr: address): (u64, u64, u64) acquires FinancialRegistry {
        assert!(exists<FinancialRegistry>(registry_addr), error::not_found(ENOT_AUTHORIZED));

        let registry = borrow_global<FinancialRegistry>(registry_addr);
        (
            registry.total_volume_locked,
            registry.total_rewards_distributed,
            vector::length(&registry.staking_pools)
        )
    }

    /// Helper function to find pool (immutable)
    fun find_pool(pools: &vector<StakingPool>, pool_id: u64): &StakingPool {
        let i = 0;
        let len = vector::length(pools);

        while (i < len) {
            let pool = vector::borrow(pools, i);
            if (pool.pool_id == pool_id) {
                return pool
            };
            i = i + 1;
        };

        abort error::not_found(EPOOL_NOT_FOUND)
    }

    /// Get treasury balance for transparency
    public fun get_treasury_balance(): (u64, u64, u64, u64) acquires Treasury {
        let treasury = borrow_global<Treasury>(@voce_admin);
        (
            coin::balance<AptosCoin>(@voce_admin),
            coin::balance(&mut treasury.staking_funds),
            coin::balance(&mut treasury.operational_funds),
            coin::balance(&mut treasury.reward_reserve),
        )
    }

    /// Check if user account is in good standing
    public fun is_user_in_good_standing(user_addr: address): bool acquires UserProfile {
        if (!exists<UserProfile>(user_addr)) return false;

        let profile = borrow_global<UserProfile>(user_addr);
        !profile.is_suspended && profile.kyc_verified
    }
}