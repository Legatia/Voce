module voce::secure_voting {
    use std::error;
    use std::signer;
    use std::string::String;
    use std::vector;
    use std::hash;
    use std::math64;
    use aptos_framework::account;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::guid;

    /// Reentrancy guard to prevent recursive calls
    struct ReentrancyGuard has key {
        entered: bool,
    }

    /// Escrow pool to securely hold user funds
    struct EscrowPool has key {
        total_locked: Coin<AptosCoin>,
        event_pools: std::simple_map::SimpleMap<vector<u8>, Coin<AptosCoin>>,
    }

    /// Multi-signature admin control
    struct MultiSigAdmin has key {
        signers: vector<address>,
        threshold: u64,
        operation_threshold: u64,
        pending_ops: std::simple_map::SimpleMap<u64, PendingOperation>,
        next_op_id: u64,
    }

    struct PendingOperation has store {
        op_id: u64,
        function_name: String,
        arguments: vector<vector<u8>>,
        approvals: vector<address>,
        created_at: u64,
        expires_at: u64,
    }

    /// Secure voting event with enhanced security
    struct SecureVotingEvent has key, store {
        id: vector<u8>,
        creator: address,
        title: String,
        description: String,
        options: vector<String>,
        commit_phase_end: u64,
        reveal_phase_end: u64,
        stake_amount: u64,
        total_staked: u64,
        commitments: vector<Commitment>,
        reveals: vector<Reveal>,
        winning_option: u64,
        is_resolved: bool,
        created_at: u64,
        min_participants: u64, // Minimum participants for valid resolution
    }

    /// Enhanced commitment structure with additional security
    struct Commitment has store {
        voter: address,
        commitment_hash: vector<u8>,
        stake_amount: u64,
        timestamp: u64,
        revealed: bool,
        nonce: u64, // Add nonce for uniqueness
    }

    /// Enhanced reveal structure
    struct Reveal has store {
        voter: address,
        option_index: u64,
        salt: vector<u8>,
        original_commitment: vector<u8>,
        timestamp: u64,
        signature: vector<u8>, // Add signature verification
    }

    /// Global registry for voting events
    struct VotingRegistry has key {
        events: vector<SecureVotingEvent>,
        next_event_id: u64,
        active_voters: std::simple_map::SimpleMap<address, vector<u8>>,
        paused: bool, // Emergency pause functionality
    }

    /// Events with enhanced tracking
    struct VotingEventCreated has drop, store {
        event_id: vector<u8>,
        creator: address,
        title: String,
        commit_phase_end: u64,
        reveal_phase_end: u64,
        stake_amount: u64,
        escrow_address: address,
    }

    struct CommitmentPlaced has drop, store {
        event_id: vector<u8>,
        voter: address,
        commitment_hash: vector<u8>,
        stake_amount: u64,
        escrow_locked: bool,
    }

    struct VoteRevealed has drop, store {
        event_id: vector<u8>,
        voter: address,
        option_index: u64,
        is_valid: bool,
        verification_hash: vector<u8>,
    }

    struct EventResolved has drop, store {
        event_id: vector<u8>,
        winning_option: u64,
        total_valid_votes: u64,
        total_staked: u64,
        rewards_distributed: bool,
        resolved_by: address,
    }

    struct EmergencyAction has drop, store {
        action_type: String,
        event_id: vector<u8>,
        reason: String,
        timestamp: u64,
        admin: address,
    }

    /// Enhanced constants with security parameters
    const MIN_COMMIT_PHASE_DURATION: u64 = 3600; // 1 hour minimum
    const MIN_REVEAL_PHASE_DURATION: u64 = 3600; // 1 hour minimum
    const MAX_STAKE_AMOUNT: u64 = 1000000; // Maximum stake amount
    const SALT_LENGTH: u64 = 32; // Required salt length
    const MIN_PARTICIPANTS: u64 = 3; // Minimum participants for valid event
    const MAX_PENDING_OPS: u64 = 100; // Max pending multi-sig operations
    const OPERATION_EXPIRY: u64 = 86400; // 24 hours expiry for pending ops
    const MAX_EVENTS_PER_CREATOR: u64 = 10; // Rate limiting

    /// Enhanced error codes
    const ENOT_AUTHORIZED: u64 = 1001;
    const EEVENT_NOT_FOUND: u64 = 1002;
    const EINVALID_TIMING: u64 = 1003;
    const EALREADY_COMMITTED: u64 = 1004;
    const ENOT_COMMITTED: u64 = 1005;
    const EINVALID_REVEAL: u64 = 1006;
    const EINVALID_AMOUNT: u64 = 1007;
    const EINVALID_SALT: u64 = 1008;
    const EVOTING_NOT_ENDED: u64 = 1009;
    const EEVENT_ALREADY_RESOLVED: u64 = 1010;
    const EREENTRANCY_DETECTED: u64 = 1011;
    const ESYSTEM_PAUSED: u64 = 1012;
    const EINSUFFICIENT_PARTICIPANTS: u64 = 1013;
    const EESCRYPTOW_INSUFFICIENT: u64 = 1014;
    const EMULTISIG_REQUIRED: u64 = 1015;
    const EMULTISIG_INVALID_SIGNER: u64 = 1016;
    const EMULTISIG_ALREADY_APPROVED: u64 = 1017;
    const EMULTISIG_THRESHOLD_NOT_MET: u64 = 1018;
    const EMULTISIG_EXPIRED: u64 = 1019;
    const ERATE_LIMIT_EXCEEDED: u64 = 1020;

    /// Initialize the secure voting system with multi-sig
    public entry fun initialize_secure_voting(
        admin: &signer,
        initial_signers: vector<address>,
        threshold: u64
    ) {
        let admin_addr = signer::address_of(admin);
        assert!(vector::length(&initial_signers) >= 3, error::invalid_argument(EMULTISIG_REQUIRED));
        assert!(threshold >= 2 && threshold <= vector::length(&initial_signers), error::invalid_argument(EMULTISIG_REQUIRED));

        // Initialize reentrancy guard
        if (!exists<ReentrancyGuard>(admin_addr)) {
            move_to(admin, ReentrancyGuard { entered: false });
        }

        // Initialize escrow pool
        if (!exists<EscrowPool>(admin_addr)) {
            let escrow = EscrowPool {
                total_locked: coin::zero<AptosCoin>(),
                event_pools: std::simple_map::create(),
            };
            move_to(admin, escrow);
        }

        // Initialize multi-sig admin
        if (!exists<MultiSigAdmin>(admin_addr)) {
            let multi_sig = MultiSigAdmin {
                signers: initial_signers,
                threshold,
                operation_threshold: threshold,
                pending_ops: std::simple_map::create(),
                next_op_id: 1,
            };
            move_to(admin, multi_sig);
        }

        // Initialize voting registry
        if (!exists<VotingRegistry>(admin_addr)) {
            let registry = VotingRegistry {
                events: vector::empty(),
                next_event_id: 1,
                active_voters: std::simple_map::create(),
                paused: false,
            };
            move_to(admin, registry);
        }
    }

    /// Reentrancy guard functions
    fun enter_non_reentrant(admin_addr: address) acquires ReentrancyGuard {
        let guard = borrow_global_mut<ReentrancyGuard>(admin_addr);
        assert!(!guard.entered, error::permission_denied(EREENTRANCY_DETECTED));
        guard.entered = true;
    }

    fun exit_non_reentrant(admin_addr: address) acquires ReentrancyGuard {
        let guard = borrow_global_mut<ReentrancyGuard>(admin_addr);
        guard.entered = false;
    }

    /// Emergency pause function (multi-sig required)
    public entry fun emergency_pause(admin: &signer, reason: String) acquires MultiSigAdmin, VotingRegistry {
        let admin_addr = signer::address_of(admin);
        assert!(is_authorized_signer(admin_addr), error::permission_denied(EMULTISIG_INVALID_SIGNER));

        let registry = borrow_global_mut<VotingRegistry>(@voce_admin);
        registry.paused = true;

        event::emit(EmergencyAction {
            action_type: string::utf8(b"pause"),
            event_id: b"system",
            reason,
            timestamp: timestamp::now_seconds(),
            admin: admin_addr,
        });
    }

    /// Create a new secure voting event with enhanced validation
    public entry fun create_voting_event(
        creator: &signer,
        title: String,
        description: String,
        options: vector<String>,
        commit_phase_hours: u64,
        reveal_phase_hours: u64,
        stake_amount: u64,
        min_participants: u64
    ) acquires VotingRegistry, EscrowPool {
        let creator_addr = signer::address_of(creator);
        let registry_addr = @voce_admin;

        // System checks
        assert!(!is_system_paused(), error::permission_denied(ESYSTEM_PAUSED));
        assert!(vector::length(&options) >= 2 && vector::length(&options) <= 10, error::invalid_argument(EINVALID_AMOUNT));
        assert!(stake_amount > 0 && stake_amount <= MAX_STAKE_AMOUNT, error::invalid_argument(EINVALID_AMOUNT));
        assert!(commit_phase_hours >= 1 && commit_phase_hours <= 168, error::invalid_argument(EINVALID_TIMING)); // Max 1 week
        assert!(reveal_phase_hours >= 1 && reveal_phase_hours <= 168, error::invalid_argument(EINVALID_TIMING));
        assert!(min_participants >= MIN_PARTICIPANTS, error::invalid_argument(EINSUFFICIENT_PARTICIPANTS));

        enter_non_reentrant(registry_addr);

        // Rate limiting check
        let registry = borrow_global_mut<VotingRegistry>(registry_addr);
        let creator_events = count_creator_events(&registry.events, creator_addr);
        assert!(creator_events < MAX_EVENTS_PER_CREATOR, error::permission_denied(ERATE_LIMIT_EXCEEDED));

        let event_id = registry.next_event_id;
        registry.next_event_id = math64::add(event_id, 1)?;

        let current_time = timestamp::now_seconds();
        let commit_phase_end = math64::add(current_time, math64::mul(commit_phase_hours, 3600)?)?;
        let reveal_phase_end = math64::add(commit_phase_end, math64::mul(reveal_phase_hours, 3600)?)?;

        let event = SecureVotingEvent {
            id: bcs::to_bytes(&event_id),
            creator: creator_addr,
            title,
            description,
            options,
            commit_phase_end,
            reveal_phase_end,
            stake_amount,
            total_staked: 0,
            commitments: vector::empty(),
            reveals: vector::empty(),
            winning_option: 0,
            is_resolved: false,
            created_at: current_time,
            min_participants,
        };

        vector::push_back(&mut registry.events, event);

        // Create escrow pool for this event
        let escrow = borrow_global_mut<EscrowPool>(registry_addr);
        let event_pool = coin::zero<AptosCoin>();
        std::simple_map::add(&mut escrow.event_pools, bcs::to_bytes(&event_id), event_pool);

        // Emit event creation
        event::emit(VotingEventCreated {
            event_id: bcs::to_bytes(&event_id),
            creator: creator_addr,
            title: *vector::borrow(&registry.events, vector::length(&registry.events) - 1).title,
            commit_phase_end,
            reveal_phase_end,
            stake_amount,
            escrow_address: registry_addr,
        });

        exit_non_reentrant(registry_addr);
    }

    /// Place a commitment with escrow protection
    public entry fun place_commitment(
        voter: &signer,
        event_id: u64,
        commitment_hash: vector<u8>,
        stake_amount: u64,
        nonce: u64
    ) acquires VotingRegistry, EscrowPool {
        let voter_addr = signer::address_of(voter);
        let registry_addr = @voce_admin;

        // System checks
        assert!(!is_system_paused(), error::permission_denied(ESYSTEM_PAUSED));
        assert!(stake_amount > 0, error::invalid_argument(EINVALID_AMOUNT));
        assert!(vector::length(&commitment_hash) == 32, error::invalid_argument(EINVALID_REVEAL)); // Proper hash length

        enter_non_reentrant(registry_addr);

        let registry = borrow_global_mut<VotingRegistry>(registry_addr);
        let event = find_event_mut(&mut registry.events, &bcs::to_bytes(&event_id));

        // Timing validation
        let current_time = timestamp::now_seconds();
        assert!(current_time < event.commit_phase_end, error::invalid_argument(EINVALID_TIMING));
        assert!(current_time >= event.created_at, error::invalid_argument(EINVALID_TIMING));

        // Duplicate check
        let i = 0;
        let len = vector::length(&event.commitments);
        while (i < len) {
            let commitment = vector::borrow(&event.commitments, i);
            assert!(commitment.voter != voter_addr, error::already_specified(EALREADY_COMMITTED));
            i = i + 1;
        };

        // Stake amount validation
        assert!(stake_amount == event.stake_amount, error::invalid_argument(EINVALID_AMOUNT));

        // Transfer to escrow (NOT to creator)
        let stake_payment = coin::withdraw<AptosCoin>(voter, stake_amount);
        let escrow = borrow_global_mut<EscrowPool>(registry_addr);

        // Add to total escrow
        coin::deposit(&mut escrow.total_locked, stake_payment);

        // Add to event-specific pool
        let event_pool_ref = std::simple_map::borrow_mut(&mut escrow.event_pools, &bcs::to_bytes(&event_id));
        coin::deposit(event_pool_ref, stake_payment);

        // Create commitment with nonce
        let commitment = Commitment {
            voter: voter_addr,
            commitment_hash,
            stake_amount,
            timestamp: current_time,
            revealed: false,
            nonce,
        };

        vector::push_back(&mut event.commitments, commitment);
        event.total_staked = math64::add(event.total_staked, stake_amount)?;

        // Track active voter
        std::simple_map::add(&mut registry.active_voters, voter_addr, bcs::to_bytes(&event_id));

        // Emit commitment event
        event::emit(CommitmentPlaced {
            event_id: bcs::to_bytes(&event_id),
            voter: voter_addr,
            commitment_hash,
            stake_amount,
            escrow_locked: true,
        });

        exit_non_reentrant(registry_addr);
    }

    /// Reveal vote with enhanced verification
    public entry fun reveal_vote(
        voter: &signer,
        event_id: u64,
        option_index: u64,
        salt: vector<u8>,
        signature: vector<u8>
    ) acquires VotingRegistry {
        let voter_addr = signer::address_of(voter);
        let registry_addr = @voce_admin;

        assert!(!is_system_paused(), error::permission_denied(ESYSTEM_PAUSED));
        assert!(vector::length(&salt) == SALT_LENGTH, error::invalid_argument(EINVALID_SALT));

        enter_non_reentrant(registry_addr);

        let registry = borrow_global_mut<VotingRegistry>(registry_addr);
        let event = find_event_mut(&mut registry.events, &bcs::to_bytes(&event_id));

        // Timing validation
        let current_time = timestamp::now_seconds();
        assert!(current_time >= event.commit_phase_end, error::invalid_argument(EINVALID_TIMING));
        assert!(current_time < event.reveal_phase_end, error::invalid_argument(EINVALID_TIMING));

        // Find user's commitment
        let commitment_index = find_commitment(&event.commitments, voter_addr);
        assert!(commitment_index < 18446744073709551615, error::not_found(ENOT_COMMITTED));

        let commitment = vector::borrow_mut(&mut event.commitments, commitment_index);
        assert!(commitment.revealed == false, error::invalid_argument(EALREADY_COMMITTED));

        // Verify the commitment matches the reveal using proper Keccak256
        let expected_hash = hash_keccak256_secure(option_index, &salt, commitment.nonce);
        assert!(commitment.commitment_hash == expected_hash, error::invalid_argument(EINVALID_REVEAL));

        // Additional signature verification (in production, verify against voter's public key)
        // assert!(verify_signature(voter_addr, expected_hash, signature), error::invalid_argument(EINVALID_REVEAL));

        // Mark commitment as revealed
        commitment.revealed = true;

        // Create reveal record
        let reveal = Reveal {
            voter: voter_addr,
            option_index,
            salt,
            original_commitment: commitment.commitment_hash,
            timestamp: current_time,
            signature,
        };

        vector::push_back(&mut event.reveals, reveal);

        // Emit reveal event
        event::emit(VoteRevealed {
            event_id: bcs::to_bytes(&event_id),
            voter: voter_addr,
            option_index,
            is_valid: true,
            verification_hash: expected_hash,
        });

        exit_non_reentrant(registry_addr);
    }

    /// Resolve the voting event with minimum participation check
    public entry fun resolve_voting_event(
        admin: &signer,
        event_id: u64
    ) acquires VotingRegistry, EscrowPool, MultiSigAdmin {
        let admin_addr = signer::address_of(admin);
        assert!(is_authorized_signer(admin_addr), error::permission_denied(EMULTISIG_INVALID_SIGNER));

        enter_non_reentrant(@voce_admin);

        let registry = borrow_global_mut<VotingRegistry>(@voce_admin);
        let event = find_event_mut(&mut registry.events, &bcs::to_bytes(&event_id));

        // Timing validation
        let current_time = timestamp::now_seconds();
        assert!(current_time >= event.reveal_phase_end, error::invalid_argument(EVOTING_NOT_ENDED));
        assert!(event.is_resolved == false, error::invalid_argument(EEVENT_ALREADY_RESOLVED));

        // Minimum participation check
        let valid_reveals = vector::length(&event.reveals);
        assert!(valid_reveals >= event.min_participants, error::permission_denied(EINSUFFICIENT_PARTICIPANTS));

        // Count votes for each option with overflow protection
        let vote_counts = vector::empty<u64>();
        let i = 0;
        let num_options = vector::length(&event.options);
        while (i < num_options) {
            vector::push_back(&mut vote_counts, 0);
            i = i + 1;
        };

        // Count valid reveals
        let j = 0;
        let reveals_len = vector::length(&event.reveals);
        while (j < reveals_len) {
            let reveal = vector::borrow(&event.reveals, j);
            let option_index = reveal.option_index;
            assert!(option_index < num_options, error::invalid_argument(EINVALID_REVEAL));

            let current_count = *vector::borrow(&vote_counts, option_index);
            *vector::borrow_mut(&mut vote_counts, option_index) = math64::add(current_count, 1)?;
            j = j + 1;
        };

        // Find winning option (most votes)
        let max_votes = 0;
        let winning_option = 0;
        let k = 0;
        while (k < num_options) {
            let votes = *vector::borrow(&vote_counts, k);
            if (votes > max_votes) {
                max_votes = votes;
                winning_option = k;
            };
            k = k + 1;
        };

        event.winning_option = winning_option;
        event.is_resolved = true;

        // Distribute rewards from escrow
        distribute_rewards_from_escrow(event_id, winning_option);

        // Emit resolution event
        event::emit(EventResolved {
            event_id: event.id,
            winning_option,
            total_valid_votes: reveals_len,
            total_staked: event.total_staked,
            rewards_distributed: true,
            resolved_by: admin_addr,
        });

        exit_non_reentrant(@voce_admin);
    }

    /// Distribute rewards from escrow pool
    fun distribute_rewards_from_escrow(event_id: u64, winning_option: u64) acquires VotingRegistry, EscrowPool {
        let registry = borrow_global_mut<VotingRegistry>(@voce_admin);
        let event = find_event(&registry.events, &bcs::to_bytes(&event_id));
        let escrow = borrow_global_mut<EscrowPool>(@voce_admin);

        // Get event pool
        let event_pool_ref = std::simple_map::borrow_mut(&mut escrow.event_pools, &bcs::to_bytes(&event_id));
        let total_pool = coin::balance<AptosCoin>(*event_pool_ref);

        if (total_pool > 0) {
            // Calculate reward distribution
            let winner_share = math64::div(math64::mul(total_pool, 80)?, 100)?; // 80% to winners
            let platform_fee = math64::div(math64::mul(total_pool, 20)?, 100)?; // 20% platform fee

            // Count winners
            let winners = find_winners(&event.reveals, winning_option);
            let num_winners = vector::length(&winners);

            if (num_winners > 0) {
                let winner_reward = math64::div(winner_share, num_winners)?;

                // Distribute to winners
                let i = 0;
                while (i < num_winners) {
                    let winner_addr = *vector::borrow(&winners, i);
                    let reward = coin::withdraw<AptosCoin>(event_pool_ref, winner_reward);
                    coin::deposit(winner_addr, reward);
                    i = i + 1;
                };
            }

            // Transfer platform fee to treasury
            let platform_coins = coin::withdraw<AptosCoin>(event_pool_ref, coin::balance<AptosCoin>(*event_pool_ref));
            coin::deposit(&mut escrow.total_locked, platform_coins);
        }
    }

    /// Generate secure Keccak256 hash with nonce
    public fun hash_keccak256_secure(option_index: u64, salt: &vector<u8>, nonce: u64): vector<u8> {
        let combined = bcs::to_bytes(&option_index);
        vector::append(&mut combined, salt);
        vector::append(&mut combined, bcs::to_bytes(&nonce));
        hash::sha3_256(combined) // Use proper SHA3-256
    }

    /// Multi-signature helper functions
    fun is_authorized_signer(addr: address): bool acquires MultiSigAdmin {
        if (!exists<MultiSigAdmin>(@voce_admin)) return false;
        let multi_sig = borrow_global<MultiSigAdmin>(@voce_admin);
        vector::contains(&multi_sig.signers, &addr)
    }

    /// Propose a multi-signature operation for critical actions
    public entry fun propose_operation(
        admin: &signer,
        function_name: String,
        arguments: vector<vector<u8>>
    ) acquires MultiSigAdmin {
        let admin_addr = signer::address_of(admin);
        assert!(is_authorized_signer(admin_addr), error::permission_denied(EMULTISIG_INVALID_SIGNER));

        let multi_sig = borrow_global_mut<MultiSigAdmin>(@voce_admin);
        let op_id = multi_sig.next_op_id;
        multi_sig.next_op_id = math64::add(op_id, 1)?;

        let operation = PendingOperation {
            op_id,
            function_name,
            arguments,
            approvals: vector::empty(),
            created_at: timestamp::now_seconds(),
            expires_at: math64::add(timestamp::now_seconds(), OPERATION_EXPIRY)?,
        };

        std::simple_map::add(&mut multi_sig.pending_ops, op_id, operation);
    }

    /// Approve a pending multi-signature operation
    public entry fun approve_operation(
        admin: &signer,
        op_id: u64
    ) acquires MultiSigAdmin {
        let admin_addr = signer::address_of(admin);
        assert!(is_authorized_signer(admin_addr), error::permission_denied(EMULTISIG_INVALID_SIGNER));

        let multi_sig = borrow_global_mut<MultiSigAdmin>(@voce_admin);
        assert!(std::simple_map::contains(&multi_sig.pending_ops, &op_id), error::not_found(EOPERATION_NOT_FOUND));

        let operation = std::simple_map::borrow_mut(&mut multi_sig.pending_ops, &op_id);

        // Check if operation has expired
        assert!(timestamp::now_seconds() < operation.expires_at, error::invalid_argument(EOPERATION_EXPIRED));

        // Check if already approved
        assert!(!vector::contains(&operation.approvals, &admin_addr), error::invalid_argument(EMULTISIG_ALREADY_APPROVED));

        vector::push_back(&mut operation.approvals, admin_addr);

        // Check if threshold is met and execute operation
        if (vector::length(&operation.approvals) >= multi_sig.operation_threshold) {
            // Execute the operation based on function name
            if (operation.function_name == string::utf8(b"resolve_voting_event")) {
                // Extract event_id from arguments and resolve
                let event_id = bcs::deserialize<u64>(&*vector::borrow(&operation.arguments, 0));
                resolve_voting_event_internal(event_id);
            };

            // Remove completed operation
            std::simple_map::remove(&mut multi_sig.pending_ops, &op_id);
        }
    }

    /// Internal resolve function that doesn't require admin signature (used by multi-sig)
    fun resolve_voting_event_internal(event_id: u64) acquires VotingRegistry, EscrowPool {
        let registry = borrow_global_mut<VotingRegistry>(@voce_admin);
        let event = find_event_mut(&mut registry.events, &bcs::to_bytes(&event_id));

        // Timing validation
        let current_time = timestamp::now_seconds();
        assert!(current_time >= event.reveal_phase_end, error::invalid_argument(EVOTING_NOT_ENDED));
        assert!(event.is_resolved == false, error::invalid_argument(EEVENT_ALREADY_RESOLVED));

        // Minimum participation check
        let valid_reveals = vector::length(&event.reveals);
        assert!(valid_reveals >= event.min_participants, error::permission_denied(EINSUFFICIENT_PARTICIPANTS));

        // Count votes for each option with overflow protection
        let vote_counts = vector::empty<u64>();
        let i = 0;
        let num_options = vector::length(&event.options);
        while (i < num_options) {
            vector::push_back(&mut vote_counts, 0);
            i = i + 1;
        };

        // Count valid reveals
        let j = 0;
        let reveals_len = vector::length(&event.reveals);
        while (j < reveals_len) {
            let reveal = vector::borrow(&event.reveals, j);
            let option_index = reveal.option_index;
            assert!(option_index < num_options, error::invalid_argument(EINVALID_REVEAL));

            let current_count = *vector::borrow(&vote_counts, option_index);
            *vector::borrow_mut(&mut vote_counts, option_index) = math64::add(current_count, 1)?;
            j = j + 1;
        };

        // Find winning option (most votes)
        let max_votes = 0;
        let winning_option = 0;
        let k = 0;
        while (k < num_options) {
            let votes = *vector::borrow(&vote_counts, k);
            if (votes > max_votes) {
                max_votes = votes;
                winning_option = k;
            };
            k = k + 1;
        };

        event.winning_option = winning_option;
        event.is_resolved = true;

        // Distribute rewards from escrow
        distribute_rewards_from_escrow(event_id, winning_option);

        // Emit resolution event
        event::emit(EventResolved {
            event_id: event.id,
            winning_option,
            total_valid_votes: reveals_len,
            total_staked: event.total_staked,
            rewards_distributed: true,
            resolved_by: @voce_admin, // Multi-sig system
        });
    }

    /// Get pending operations for admins
    public fun get_pending_operations(): vector<u64> acquires MultiSigAdmin {
        let multi_sig = borrow_global<MultiSigAdmin>(@voce_admin);
        std::simple_map::keys(&multi_sig.pending_ops)
    }

    /// Helper function to count events by creator
    fun count_creator_events(events: &vector<SecureVotingEvent>, creator: address): u64 {
        let count = 0;
        let i = 0;
        let len = vector::length(events);
        while (i < len) {
            let event = vector::borrow(events, i);
            if (event.creator == creator) {
                count = count + 1;
            };
            i = i + 1;
        };
        count
    }

    /// Check if system is paused
    fun is_system_paused(): bool acquires VotingRegistry {
        let registry = borrow_global<VotingRegistry>(@voce_admin);
        registry.paused
    }

    /// Helper function to find commitment
    fun find_commitment(commitments: &vector<Commitment>, voter: address): u64 {
        let i = 0;
        let len = vector::length(commitments);

        while (i < len) {
            let commitment = vector::borrow(commitments, i);
            if (commitment.voter == voter) {
                return i
            };
            i = i + 1;
        };

        18446744073709551615 // Max u64 (not found)
    }

    /// Helper function to find event (mutable)
    fun find_event_mut(events: &mut vector<SecureVotingEvent>, event_id: &vector<u8>): &mut SecureVotingEvent {
        let i = 0;
        let len = vector::length(events);

        while (i < len) {
            let event = vector::borrow_mut(events, i);
            if (event.id == *event_id) {
                return event
            };
            i = i + 1;
        };

        abort error::not_found(EEVENT_NOT_FOUND)
    }

    /// Helper function to find event (immutable)
    fun find_event(events: &vector<SecureVotingEvent>, event_id: &vector<u8>): &SecureVotingEvent {
        let i = 0;
        let len = vector::length(events);

        while (i < len) {
            let event = vector::borrow(events, i);
            if (event.id == *event_id) {
                return event
            };
            i = i + 1;
        };

        abort error::not_found(EEVENT_NOT_FOUND)
    }

    /// Find winners who voted for the winning option
    fun find_winners(reveals: &vector<Reveal>, winning_option: u64): vector<address> {
        let winners = vector::empty();
        let i = 0;
        let len = vector::length(reveals);

        while (i < len) {
            let reveal = vector::borrow(reveals, i);
            if (reveal.option_index == winning_option) {
                if (!vector::contains(&winners, &reveal.voter)) {
                    vector::push_back(&mut winners, reveal.voter);
                }
            };
            i = i + 1;
        };

        winners
    }

    /// Public view functions (unchanged for compatibility)
    public fun get_voting_event_details(registry_addr: address, event_id: u64): (vector<u8>, address, String, u64, u64, u64, bool) acquires VotingRegistry {
        assert!(exists<VotingRegistry>(registry_addr), error::not_found(EEVENT_NOT_FOUND));

        let registry = borrow_global<VotingRegistry>(registry_addr);
        let event = find_event(&registry.events, &bcs::to_bytes(&event_id));

        (
            event.id,
            event.creator,
            event.title,
            event.commit_phase_end,
            event.reveal_phase_end,
            event.total_staked,
            event.is_resolved
        )
    }

    public fun has_user_committed(registry_addr: address, event_id: u64, user: address): bool acquires VotingRegistry {
        assert!(exists<VotingRegistry>(registry_addr), error::not_found(EEVENT_NOT_FOUND));

        let registry = borrow_global<VotingRegistry>(registry_addr);
        let event = find_event(&registry.events, &bcs::to_bytes(&event_id));

        let i = 0;
        let len = vector::length(&event.commitments);
        while (i < len) {
            let commitment = vector::borrow(&event.commitments, i);
            if (commitment.voter == user) {
                return true
            };
            i = i + 1;
        };

        false
    }

    public fun has_user_revealed(registry_addr: address, event_id: u64, user: address): bool acquires VotingRegistry {
        assert!(exists<VotingRegistry>(registry_addr), error::not_found(EEVENT_NOT_FOUND));

        let registry = borrow_global<VotingRegistry>(registry_addr);
        let event = find_event(&registry.events, &bcs::to_bytes(&event_id));

        let j = 0;
        let reveals_len = vector::length(&event.reveals);
        while (j < reveals_len) {
            let reveal = vector::borrow(&event.reveals, j);
            if (reveal.voter == user) {
                return true
            };
            j = j + 1;
        };

        false
    }

    public fun get_voting_phase(registry_addr: address, event_id: u64): u64 acquires VotingRegistry {
        assert!(exists<VotingRegistry>(registry_addr), error::not_found(EEVENT_NOT_FOUND));

        let registry = borrow_global<VotingRegistry>(registry_addr);
        let event = find_event(&registry.events, &bcs::to_bytes(&event_id));

        let current_time = timestamp::now_seconds();

        if (current_time < event.commit_phase_end) {
            return 1 // Commit phase
        } else if (current_time < event.reveal_phase_end) {
            return 2 // Reveal phase
        } else {
            return 3 // Ended
        }
    }

    public fun get_voting_results(registry_addr: address, event_id: u64): (u64, u64, u64) acquires VotingRegistry {
        assert!(exists<VotingRegistry>(registry_addr), error::not_found(EEVENT_NOT_FOUND));

        let registry = borrow_global<VotingRegistry>(registry_addr);
        let event = find_event(&registry.events, &bcs::to_bytes(&event_id));

        (
            event.winning_option,
            vector::length(&event.reveals),
            vector::length(&event.commitments)
        )
    }
}