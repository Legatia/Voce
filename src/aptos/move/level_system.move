module voce::level_system {
    use std::error;
    use std::signer;
    use aptos_framework::object::{Self, Object};
    use aptos_framework::dynamic_field;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use std::math64;

    /// Reentrancy guard
    struct ReentrancyGuard has key {
        entered: bool,
    }

    /// Multi-signature governance for level system operations
    struct LevelSystemGovernance has key {
        signers: vector<address>,
        authorized_admins: vector<address>,
        pending_operations: std::simple_map::SimpleMap<u64, PendingOperation>,
        next_op_id: u64,
        operation_threshold: u64,
        paused: bool,
    }

    struct PendingOperation has store {
        op_id: u64,
        operation_type: String,
        target_user: address,
        amount: u64,
        reason: vector<u8>,
        approvals: vector<address>,
        created_at: u64,
        expires_at: u64,
    }

    /// Enhanced user level data with security features
    struct UserLevelData has key, store {
        xp: u64,
        level: u32,
        total_earned_coins: u64,
        current_streak: u32,
        best_streak: u32,
        prediction_count: u32,
        correct_predictions: u32,
        last_updated: u64,
        is_suspended: bool,
        suspension_reason: vector<u8>,
        last_activity: u64,
        daily_xp_earned: u64,
        last_xp_reset_time: u64,
        total_events_participated: u32,
        unique_events_won: u32,
        reputation_score: u32,
    }

    /// Resource to store user level data with enhanced tracking
    struct UserLevelRegistry has key {
        user_data: dynamic_field::Field<address, Object<UserLevelData>>,
        total_users: u64,
        total_xp_distributed: u64,
        total_coins_distributed: u64,
        last_global_update: u64,
        user_count_by_level: std::simple_map::SimpleMap<u32, u64>,
        daily_stats: DailyStats,
    }

    struct DailyStats has store {
        date: u64, // YYYYMMDD format
        active_users: u64,
        xp_distributed: u64,
        coins_distributed: u64,
        predictions_made: u64,
        new_users: u64,
    }

    /// XP and level limits for security
    struct SystemLimits has key {
        max_daily_xp: u64,
        max_level: u32,
        xp_per_prediction_base: u64,
        streak_bonus_multiplier: u64,
        reputation_threshold: u32,
        max_streak_bonus: u64,
    }

    /// Enhanced events for transparency
    struct XPAdded has drop, store {
        user: address,
        amount: u64,
        reason: vector<u8>,
        new_level: u32,
        new_total_xp: u64,
        timestamp: u64,
        admin: address,
        operation_id: u64,
    }

    struct CoinsAdded has drop, store {
        user: address,
        amount: u64,
        reason: vector<u8>,
        new_total_coins: u64,
        timestamp: u64,
        admin: address,
        operation_id: u64,
    }

    struct LevelUp has drop, store {
        user: address,
        old_level: u32,
        new_level: u32,
        coins_awarded: u64,
        timestamp: u64,
    }

    struct StreakUpdated has drop, store {
        user: address,
        new_streak: u32,
        best_streak: u32,
        is_correct: bool,
        timestamp: u64,
    }

    struct UserSuspended has drop, store {
        user: address,
        reason: vector<u8>,
        suspended_by: address,
        timestamp: u64,
    }

    struct SystemPaused has drop, store {
        reason: vector<u8>,
        paused_by: address,
        timestamp: u64,
    }

    /// Security constants
    const MAX_DAILY_XP: u64 = 10000;
    const MAX_LEVEL: u32 = 1000;
    const XP_PER_PREDICTION_BASE: u64 = 10;
    const STREAK_BONUS_MULTIPLIER: u64 = 2;
    const REPUTATION_THRESHOLD: u32 = 100;
    const MAX_STREAK_BONUS: u64 = 500;
    const MIN_ADMINS: u64 = 3;
    const OPERATION_THRESHOLD: u64 = 2;
    const OPERATION_EXPIRY: u64 = 86400; // 24 hours
    const MAX_OPERATIONS_PENDING: u64 = 100;
    const MIN_XP_PER_TRANSACTION: u64 = 1;
    const MAX_XP_PER_TRANSACTION: u64 = 10000;
    const SUSPENSION_DURATION: u64 = 86400 * 7; // 7 days

    /// Enhanced error codes
    const ENOT_AUTHORIZED: u64 = 4001;
    const ELEVEL_DATA_NOT_FOUND: u64 = 4002;
    const EINVALID_LEVEL_CALCULATION: u64 = 4003;
    const EINSUFFICIENT_XP: u64 = 4004;
    const EUSER_SUSPENDED: u64 = 4005;
    const EDAILY_XP_LIMIT_EXCEEDED: u64 = 4006;
    const EINVALID_AMOUNT: u64 = 4007;
    const EREENTRANCY_DETECTED: u64 = 4008;
    const ESYSTEM_PAUSED: u64 = 4009;
    const EOPERATION_NOT_FOUND: u64 = 4010;
    const EOPERATION_EXPIRED: u64 = 4011;
    const EOPERATION_ALREADY_APPROVED: u64 = 4012;
    const EOPERATION_THRESHOLD_NOT_MET: u64 = 4013;
    const EMAX_LEVEL_REACHED: u64 = 4014;
    const EUSER_ALREADY_EXISTS: u64 = 4015;

    /// Initialize the enhanced level system with governance
    public entry fun initialize_level_system(
        admin: &signer,
        initial_admins: vector<address>
    ) {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @voce_admin, error::permission_denied(ENOT_AUTHORIZED));
        assert!(vector::length(&initial_admins) >= MIN_ADMINS, error::invalid_argument(ENOT_AUTHORIZED));

        // Initialize reentrancy guard
        if (!exists<ReentrancyGuard>(admin_addr)) {
            move_to(admin, ReentrancyGuard { entered: false });
        }

        // Initialize governance
        if (!exists<LevelSystemGovernance>(admin_addr)) {
            let governance = LevelSystemGovernance {
                signers: initial_admins,
                authorized_admins: initial_admins,
                pending_operations: std::simple_map::create(),
                next_op_id: 1,
                operation_threshold: OPERATION_THRESHOLD,
                paused: false,
            };
            move_to(admin, governance);
        }

        // Initialize system limits
        if (!exists<SystemLimits>(admin_addr)) {
            let limits = SystemLimits {
                max_daily_xp: MAX_DAILY_XP,
                max_level: MAX_LEVEL,
                xp_per_prediction_base: XP_PER_PREDICTION_BASE,
                streak_bonus_multiplier: STREAK_BONUS_MULTIPLIER,
                reputation_threshold: REPUTATION_THRESHOLD,
                max_streak_bonus: MAX_STREAK_BONUS,
            };
            move_to(admin, limits);
        }

        // Initialize user level registry
        if (!exists<UserLevelRegistry>(admin_addr)) {
            let current_date = get_current_date();
            let daily_stats = DailyStats {
                date: current_date,
                active_users: 0,
                xp_distributed: 0,
                coins_distributed: 0,
                predictions_made: 0,
                new_users: 0,
            };

            let registry = UserLevelRegistry {
                user_data: dynamic_field::new_field(admin_addr),
                total_users: 0,
                total_xp_distributed: 0,
                total_coins_distributed: 0,
                last_global_update: timestamp::now_seconds(),
                user_count_by_level: std::simple_map::create(),
                daily_stats,
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

    /// Get current date in YYYYMMDD format
    fun get_current_date(): u64 {
        let timestamp = timestamp::now_seconds();
        let days_since_epoch = math64::div(timestamp, 86400)?; // Seconds in a day
        // Convert to YYYYMMDD (simplified - in production use proper date conversion)
        let year = math64::div(math64::div(days_since_epoch, 365)?, 100)? + 1970;
        let day_of_year = math64::mod(days_since_epoch, 365)?;
        math64::add(math64::mul(year, 10000)?, day_of_year)?
    }

    /// Check if system is paused
    fun is_system_paused(): bool acquires LevelSystemGovernance {
        let governance = borrow_global<LevelSystemGovernance>(@voce_admin);
        governance.paused
    }

    /// Check if address is authorized admin
    fun is_authorized_admin(addr: address): bool acquires LevelSystemGovernance {
        let governance = borrow_global<LevelSystemGovernance>(@voce_admin);
        vector::contains(&governance.authorized_admins, &addr)
    }

    /// Get system limits
    fun get_system_limits(): &SystemLimits acquires SystemLimits {
        borrow_global<SystemLimits>(@voce_admin)
    }

    /// Check and update daily stats
    fun check_and_update_daily_stats(registry: &mut UserLevelRegistry) {
        let current_date = get_current_date();
        if (registry.daily_stats.date != current_date) {
            // Reset daily stats
            registry.daily_stats = DailyStats {
                date: current_date,
                active_users: 0,
                xp_distributed: 0,
                coins_distributed: 0,
                predictions_made: 0,
                new_users: 0,
            };
        }
    }

    /// Create or get user data with enhanced validation
    fun get_or_create_user_data(registry: &mut UserLevelRegistry, user: address): &mut Object<UserLevelData> {
        if (!dynamic_field::exists(&registry.user_data, user)) {
            let limits = get_system_limits();

            let user_level_data = UserLevelData {
                xp: 0,
                level: 1,
                total_earned_coins: 0,
                current_streak: 0,
                best_streak: 0,
                prediction_count: 0,
                correct_predictions: 0,
                last_updated: timestamp::now_seconds(),
                is_suspended: false,
                suspension_reason: vector::empty(),
                last_activity: timestamp::now_seconds(),
                daily_xp_earned: 0,
                last_xp_reset_time: get_current_date(),
                total_events_participated: 0,
                unique_events_won: 0,
                reputation_score: 0,
            };

            let user_object = object::new(user_level_data);
            dynamic_field::add_field(&mut registry.user_data, user, user_object);

            // Update registry stats
            registry.total_users = math64::add(registry.total_users, 1)?;
            check_and_update_daily_stats(registry);
            registry.daily_stats.new_users = math64::add(registry.daily_stats.new_users, 1)?;

            // Update level count
            let level_1_count = if (std::simple_map::contains(&registry.user_count_by_level, &1)) {
                *std::simple_map::borrow(&registry.user_count_by_level, &1)
            } else {
                0
            };
            std::simple_map::add(&mut registry.user_count_by_level, 1, math64::add(level_1_count, 1)?);
        };

        dynamic_field::borrow_mut(&mut registry.user_data, user)
    }

    /// Check if user has level data
    public fun has_user_data(registry: &UserLevelRegistry, user: address): bool {
        dynamic_field::exists(&registry.user_data, user)
    }

    /// Add XP with multi-sig approval and daily limits
    public entry fun add_xp_multi_sig(
        proposer: &signer,
        user: address,
        xp_amount: u64,
        reason: vector<u8>
    ) acquires LevelSystemGovernance {
        let proposer_addr = signer::address_of(proposer);
        assert!(is_authorized_admin(proposer_addr), error::permission_denied(ENOT_AUTHORIZED));
        assert!(!is_system_paused(), error::permission_denied(ESYSTEM_PAUSED));
        assert!(xp_amount >= MIN_XP_PER_TRANSACTION && xp_amount <= MAX_XP_PER_TRANSACTION, error::invalid_argument(EINVALID_AMOUNT));

        let governance = borrow_global_mut<LevelSystemGovernance>(@voce_admin);
        assert!(std::simple_map::length(&governance.pending_operations) < MAX_OPERATIONS_PENDING, error::invalid_argument(EOPERATION_NOT_FOUND));

        let op_id = governance.next_op_id;
        governance.next_op_id = math64::add(op_id, 1)?;

        let operation = PendingOperation {
            op_id,
            operation_type: string::utf8(b"add_xp"),
            target_user: user,
            amount: xp_amount,
            reason,
            approvals: vector::empty(),
            created_at: timestamp::now_seconds(),
            expires_at: math64::add(timestamp::now_seconds(), OPERATION_EXPIRY)?,
        };

        std::simple_map::add(&mut governance.pending_operations, op_id, operation);
    }

    /// Approve pending operation
    public entry fun approve_operation(
        admin: &signer,
        op_id: u64
    ) acquires LevelSystemGovernance {
        let admin_addr = signer::address_of(admin);
        assert!(is_authorized_admin(admin_addr), error::permission_denied(ENOT_AUTHORIZED));

        let governance = borrow_global_mut<LevelSystemGovernance>(@voce_admin);
        assert!(std::simple_map::contains(&governance.pending_operations, &op_id), error::not_found(EOPERATION_NOT_FOUND));

        let operation = std::simple_map::borrow_mut(&mut governance.pending_operations, &op_id);

        // Check if operation has expired
        assert!(timestamp::now_seconds() < operation.expires_at, error::invalid_argument(EOPERATION_EXPIRED));

        // Check if already approved
        assert!(!vector::contains(&operation.approvals, &admin_addr), error::invalid_argument(EOPERATION_ALREADY_APPROVED));

        vector::push_back(&mut operation.approvals, admin_addr);

        // Check if threshold is met
        if (vector::length(&operation.approvals) >= governance.operation_threshold) {
            // Execute the operation
            if (operation.operation_type == string::utf8(b"add_xp")) {
                execute_add_xp(operation.target_user, operation.amount, operation.reason, op_id);
            } else if (operation.operation_type == string::utf8(b"add_coins")) {
                execute_add_coins(operation.target_user, operation.amount, operation.reason, op_id);
            }

            // Remove completed operation
            std::simple_map::remove(&mut governance.pending_operations, &op_id);
        }
    }

    /// Execute approved XP addition
    fun execute_add_xp(
        user: address,
        xp_amount: u64,
        reason: vector<u8>,
        op_id: u64
    ) acquires UserLevelRegistry, SystemLimits {
        enter_non_reentrant(@voce_admin);

        let registry = borrow_global_mut<UserLevelRegistry>(@voce_admin);
        let limits = get_system_limits();

        let user_obj = get_or_create_user_data(registry, user);
        let user_data = object::borrow_mut(user_obj);

        // Check if user is suspended
        assert!(!user_data.is_suspended, error::permission_denied(EUSER_SUSPENDED));

        // Check daily XP limit
        check_and_update_daily_stats(registry);
        let new_daily_xp = math64::add(user_data.daily_xp_earned, xp_amount)?;
        assert!(new_daily_xp <= limits.max_daily_xp, error::permission_denied(EDAILY_XP_LIMIT_EXCEEDED));

        let current_time = timestamp::now_seconds();
        let old_level = user_data.level;

        // Add XP
        user_data.xp = math64::add(user_data.xp, xp_amount)?;
        user_data.daily_xp_earned = new_daily_xp;
        user_data.last_updated = current_time;
        user_data.last_activity = current_time;

        // Update registry stats
        registry.total_xp_distributed = math64::add(registry.total_xp_distributed, xp_amount)?;
        registry.daily_stats.xp_distributed = math64::add(registry.daily_stats.xp_distributed, xp_amount)?;
        registry.daily_stats.active_users = math64::add(registry.daily_stats.active_users, 1)?;

        // Calculate new level
        let new_level = calculate_level_from_xp_secure(user_data.xp, limits.max_level);
        if (new_level > old_level && new_level <= limits.max_level) {
            user_data.level = new_level;

            // Update level count statistics
            update_level_count(registry, old_level, new_level);

            // Award level-up coins
            let level_coins = calculate_level_coins_secure(new_level);
            user_data.total_earned_coins = math64::add(user_data.total_earned_coins, level_coins)?;

            registry.total_coins_distributed = math64::add(registry.total_coins_distributed, level_coins)?;
            registry.daily_stats.coins_distributed = math64::add(registry.daily_stats.coins_distributed, level_coins)?;

            // Emit level-up event
            event::emit(LevelUp {
                user,
                old_level,
                new_level,
                coins_awarded: level_coins,
                timestamp: current_time,
            });
        }

        // Emit XP added event
        event::emit(XPAdded {
            user,
            amount: xp_amount,
            reason,
            new_level: user_data.level,
            new_total_xp: user_data.xp,
            timestamp: current_time,
            admin: @voce_admin,
            operation_id: op_id,
        });

        exit_non_reentrant(@voce_admin);
    }

    /// Execute approved coins addition
    fun execute_add_coins(
        user: address,
        coins_amount: u64,
        reason: vector<u8>,
        op_id: u64
    ) acquires UserLevelRegistry {
        enter_non_reentrant(@voce_admin);

        let registry = borrow_global_mut<UserLevelRegistry>(@voce_admin);
        let user_obj = get_or_create_user_data(registry, user);
        let user_data = object::borrow_mut(user_obj);

        assert!(!user_data.is_suspended, error::permission_denied(EUSER_SUSPENDED));

        let current_time = timestamp::now_seconds();

        user_data.total_earned_coins = math64::add(user_data.total_earned_coins, coins_amount)?;
        user_data.last_updated = current_time;
        user_data.last_activity = current_time;

        // Update registry stats
        registry.total_coins_distributed = math64::add(registry.total_coins_distributed, coins_amount)?;
        check_and_update_daily_stats(registry);
        registry.daily_stats.coins_distributed = math64::add(registry.daily_stats.coins_distributed, coins_amount)?;

        // Emit coins added event
        event::emit(CoinsAdded {
            user,
            amount: coins_amount,
            reason,
            new_total_coins: user_data.total_earned_coins,
            timestamp: current_time,
            admin: @voce_admin,
            operation_id: op_id,
        });

        exit_non_reentrant(@voce_admin);
    }

    /// Update prediction statistics with validation
    public entry fun update_prediction_stats(
        admin: &signer,
        user: address,
        is_correct: bool
    ) acquires UserLevelRegistry, SystemLimits {
        let admin_addr = signer::address_of(admin);
        assert!(is_authorized_admin(admin_addr), error::permission_denied(ENOT_AUTHORIZED));
        assert!(!is_system_paused(), error::permission_denied(ESYSTEM_PAUSED));

        enter_non_reentrant(@voce_admin);

        let registry = borrow_global_mut<UserLevelRegistry>(@voce_admin);
        let limits = get_system_limits();
        let user_obj = get_or_create_user_data(registry, user);
        let user_data = object::borrow_mut(user_obj);

        assert!(!user_data.is_suspended, error::permission_denied(EUSER_SUSPENDED));

        let current_time = timestamp::now_seconds();

        user_data.prediction_count = math64::add(user_data.prediction_count, 1)?;
        user_data.total_events_participated = math64::add(user_data.total_events_participated, 1)?;
        user_data.last_activity = current_time;

        if (is_correct) {
            user_data.correct_predictions = math64::add(user_data.correct_predictions, 1)?;
            user_data.current_streak = math64::add(user_data.current_streak, 1)?;

            // Update best streak if current is better
            if (user_data.current_streak > user_data.best_streak) {
                user_data.best_streak = user_data.current_streak;
            }

            // Update reputation score
            if (user_data.correct_predictions % 10 == 0) {
                user_data.reputation_score = math64::add(user_data.reputation_score, 1)?;
            }
        } else {
            user_data.current_streak = 0;
        }

        // Update registry stats
        check_and_update_daily_stats(registry);
        registry.daily_stats.predictions_made = math64::add(registry.daily_stats.predictions_made, 1)?;

        // Emit streak update event
        event::emit(StreakUpdated {
            user,
            new_streak: user_data.current_streak,
            best_streak: user_data.best_streak,
            is_correct,
            timestamp: current_time,
        });

        exit_non_reentrant(@voce_admin);
    }

    /// Suspend user account
    public entry fun suspend_user(
        admin: &signer,
        user: address,
        reason: vector<u8>
    ) acquires UserLevelRegistry {
        let admin_addr = signer::address_of(admin);
        assert!(is_authorized_admin(admin_addr), error::permission_denied(ENOT_AUTHORIZED));

        let registry = borrow_global_mut<UserLevelRegistry>(@voce_admin);
        assert!(dynamic_field::exists(&registry.user_data, user), error::not_found(ELEVEL_DATA_NOT_FOUND));

        let user_obj = dynamic_field::borrow_mut(&mut registry.user_data, user);
        let user_data = object::borrow_mut(user_obj);

        user_data.is_suspended = true;
        user_data.suspension_reason = reason;

        event::emit(UserSuspended {
            user,
            reason,
            suspended_by: admin_addr,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Unsuspend user account
    public entry fun unsuspend_user(
        admin: &signer,
        user: address
    ) acquires UserLevelRegistry {
        let admin_addr = signer::address_of(admin);
        assert!(is_authorized_admin(admin_addr), error::permission_denied(ENOT_AUTHORIZED));

        let registry = borrow_global_mut<UserLevelRegistry>(@voce_admin);
        assert!(dynamic_field::exists(&registry.user_data, user), error::not_found(ELEVEL_DATA_NOT_FOUND));

        let user_obj = dynamic_field::borrow_mut(&mut registry.user_data, user);
        let user_data = object::borrow_mut(user_obj);

        user_data.is_suspended = false;
        user_data.suspension_reason = vector::empty();
    }

    /// Emergency pause system
    public entry fun emergency_pause_system(
        admin: &signer,
        reason: vector<u8>
    ) acquires LevelSystemGovernance {
        let admin_addr = signer::address_of(admin);
        assert!(is_authorized_admin(admin_addr), error::permission_denied(ENOT_AUTHORIZED));

        let governance = borrow_global_mut<LevelSystemGovernance>(@voce_admin);
        governance.paused = true;

        event::emit(SystemPaused {
            reason,
            paused_by: admin_addr,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Resume system
    public entry fun resume_system(admin: &signer) acquires LevelSystemGovernance {
        let admin_addr = signer::address_of(admin);
        assert!(is_authorized_admin(admin_addr), error::permission_denied(ENOT_AUTHORIZED));

        let governance = borrow_global_mut<LevelSystemGovernance>(@voce_admin);
        governance.paused = false;
    }

    /// Update level count statistics
    fun update_level_count(registry: &mut UserLevelRegistry, old_level: u32, new_level: u32) {
        // Decrease old level count
        if (std::simple_map::contains(&registry.user_count_by_level, &old_level)) {
            let old_count = *std::simple_map::borrow(&registry.user_count_by_level, &old_level);
            if (old_count > 1) {
                std::simple_map::add(&mut registry.user_count_by_level, old_level, math64::sub(old_count, 1)?);
            } else {
                std::simple_map::remove(&mut registry.user_count_by_level, &old_level);
            }
        }

        // Increase new level count
        let new_count = if (std::simple_map::contains(&registry.user_count_by_level, &new_level)) {
            *std::simple_map::borrow(&registry.user_count_by_level, &new_level)
        } else {
            0
        };
        std::simple_map::add(&mut registry.user_count_by_level, new_level, math64::add(new_count, 1)?);
    }

    /// Calculate level from XP with overflow protection
    fun calculate_level_from_xp_secure(xp: u64, max_level: u32): u32 {
        // Levels 1-25: Progressive XP requirements
        if (xp < 1000) { return 1; }
        if (xp < 2500) { return 2; }
        if (xp < 5000) { return 3; }
        if (xp < 8000) { return 4; }
        if (xp < 12000) { return 5; }
        if (xp < 17000) { return 6; }
        if (xp < 23000) { return 7; }
        if (xp < 30000) { return 8; }
        if (xp < 40000) { return 9; }
        if (xp < 52000) { return 10; }
        if (xp < 65000) { return 11; }
        if (xp < 79000) { return 12; }
        if (xp < 94000) { return 13; }
        if (xp < 110000) { return 14; }
        if (xp < 127000) { return 15; }
        if (xp < 145000) { return 16; }
        if (xp < 164000) { return 17; }
        if (xp < 184000) { return 18; }
        if (xp < 205000) { return 19; }
        if (xp < 227000) { return 20; }
        if (xp < 250000) { return 21; }
        if (xp < 274000) { return 22; }
        if (xp < 299000) { return 23; }
        if (xp < 325000) { return 24; }
        if (xp < 370000) { return 25; }

        // Level 26+: Static 45,000 XP per level with max level limit
        if (xp >= 370000) {
            let xp_beyond_25 = math64::sub(xp, 325000)?;
            let additional_levels = math64::div(xp_beyond_25, 45000)?;
            let calculated_level = math64::add(25, additional_levels)?;

            if (calculated_level > max_level) {
                return max_level
            } else {
                calculated_level as u32
            }
        } else {
            25
        }
    }

    /// Calculate coin reward for leveling up
    fun calculate_level_coins_secure(level: u32): u64 {
        if (level <= 25) {
            // Pre-defined coin rewards for levels 1-25
            match level {
                2 => 100,
                3 => 150,
                4 => 200,
                5 => 300,
                6 => 400,
                7 => 500,
                8 => 600,
                9 => 750,
                10 => 1000,
                11 => 1250,
                12 => 1500,
                13 => 1750,
                14 => 2000,
                15 => 2250,
                16 => 2500,
                17 => 2750,
                18 => 3000,
                19 => 3250,
                20 => 3500,
                21 => 3750,
                22 => 4000,
                23 => 4250,
                24 => 4500,
                25 => 5000,
                _ => 0
            }
        } else {
            // Levels 26+: 250 coin increase per level
            let base = 5250; // Level 26 reward
            let increase = 250;
            math64::add(base, math64::mul(level - 26, increase)?)?
        }
    }

    /// Public view functions with enhanced safety

    /// Get user level data with validation
    public fun view_user_level_data(registry: &UserLevelRegistry, user: address): (u64, u32, u64, u32, u32, u32, u32) {
        assert!(has_user_data(registry, user), error::not_found(ELEVEL_DATA_NOT_FOUND));
        let user_obj = dynamic_field::borrow(&registry.user_data, user);
        let data = object::borrow(user_obj);

        (
            data.xp,
            data.level,
            data.total_earned_coins,
            data.current_streak,
            data.best_streak,
            data.prediction_count,
            data.correct_predictions
        )
    }

    /// Get XP required for next level
    public fun get_xp_for_next_level(current_xp: u64): u64 {
        let current_level = calculate_level_from_xp_secure(current_xp, MAX_LEVEL);

        if (current_level < 25) {
            // Use pre-defined XP requirements
            match current_level + 1 {
                2 => 1000,
                3 => 2500,
                4 => 5000,
                5 => 8000,
                6 => 12000,
                7 => 17000,
                8 => 23000,
                9 => 30000,
                10 => 40000,
                11 => 52000,
                12 => 65000,
                13 => 79000,
                14 => 94000,
                15 => 110000,
                16 => 127000,
                17 => 145000,
                18 => 164000,
                19 => 184000,
                20 => 205000,
                21 => 227000,
                22 => 250000,
                23 => 274000,
                24 => 299000,
                25 => 325000,
                _ => 0
            }
        } else if (current_level < MAX_LEVEL) {
            // Static 45k XP per level after 25
            math64::add(325000, math64::mul(current_level - 24, 45000)?)?
        } else {
            0 // Already at max level
        }
    }

    /// Get level progress percentage with overflow protection
    public fun get_level_progress(current_xp: u64): u8 {
        let current_level = calculate_level_from_xp_secure(current_xp, MAX_LEVEL);

        if (current_level >= MAX_LEVEL) {
            return 100;
        }

        let next_level_xp = get_xp_for_next_level(current_xp);
        let current_level_xp = if (current_level == 1) 0 else get_xp_for_next_level(math64::sub(current_xp, 1)?);

        if (next_level_xp <= current_level_xp) {
            return 100;
        }

        let xp_in_level = math64::sub(current_xp, current_level_xp)?;
        let xp_needed = math64::sub(next_level_xp, current_level_xp)?;

        if (xp_needed == 0) return 100;

        math64::div(math64::mul(xp_in_level, 100)?, xp_needed) as u8
    }

    /// Get accuracy rate with division safety
    public fun get_accuracy(registry: &UserLevelRegistry, user: address): u8 {
        assert!(has_user_data(registry, user), error::not_found(ELEVEL_DATA_NOT_FOUND));
        let user_obj = dynamic_field::borrow(&registry.user_data, user);
        let data = object::borrow(user_obj);

        if (data.prediction_count == 0) {
            return 0;
        }

        math64::div(math64::mul(data.correct_predictions, 100)?, data.prediction_count) as u8
    }

    /// Get system statistics
    public fun get_system_statistics(): (u64, u64, u64, u64, u64) acquires UserLevelRegistry {
        let registry = borrow_global<UserLevelRegistry>(@voce_admin);
        (
            registry.total_users,
            registry.total_xp_distributed,
            registry.total_coins_distributed,
            registry.daily_stats.active_users,
            registry.daily_stats.xp_distributed,
        )
    }

    /// Get daily statistics
    public fun get_daily_statistics(): (u64, u64, u64, u64, u64) acquires UserLevelRegistry {
        let registry = borrow_global<UserLevelRegistry>(@voce_admin);
        (
            registry.daily_stats.active_users,
            registry.daily_stats.xp_distributed,
            registry.daily_stats.coins_distributed,
            registry.daily_stats.predictions_made,
            registry.daily_stats.new_users,
        )
    }

    /// Check if user is in good standing
    public fun is_user_in_good_standing(registry: &UserLevelRegistry, user: address): bool {
        if (!has_user_data(registry, user)) return false;

        let user_obj = dynamic_field::borrow(&registry.user_data, user);
        let data = object::borrow(user_obj);

        !data.is_suspended && data.reputation_score >= REPUTATION_THRESHOLD
    }

    /// Get pending operations for admins
    public fun get_pending_operations(): vector<u64> acquires LevelSystemGovernance {
        let governance = borrow_global<LevelSystemGovernance>(@voce_admin);
        let operations = std::simple_map::keys(&governance.pending_operations);
        operations
    }
}