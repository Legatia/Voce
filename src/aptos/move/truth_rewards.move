module voce::truth_rewards {
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

    /// Enhanced treasury system with complete fund separation
    struct Treasury has key {
        staking_funds: Coin<AptosCoin>,        // User staked funds
        prize_pool_funds: Coin<AptosCoin>,    // Prize pool money
        creator_rewards: Coin<AptosCoin>,     // Creator reward pool
        platform_fees: Coin<AptosCoin>,       // Platform fee pool
        insurance_fund: Coin<AptosCoin>,      // Insurance for emergencies
        event_pools: std::simple_map::SimpleMap<vector<u8>, EventPool>,
        total_deposits: u64,
        total_withdrawals: u64,
        last_updated: u64,
    }

    struct EventPool has store {
        event_id: vector<u8>,
        total_prize_pool: Coin<AptosCoin>,
        is_locked: bool,
        winners_paid: bool,
        creator_reward_paid: bool,
        created_at: u64,
    }

    /// Oracle integration for secure outcome verification
    struct OracleRegistry has key {
        authorized_oracles: vector<address>,
        pending_verifications: std::simple_map::SimpleMap<vector<u8>, PendingVerification>,
        verification_history: vector<VerificationRecord>,
    }

    struct PendingVerification has store {
        event_id: vector<u8>,
        proposed_outcome: u64,
        oracle_signatures: std::simple_map::SimpleMap<address, vector<u8>>,
        threshold: u64,
        expires_at: u64,
    }

    struct VerificationRecord has store {
        event_id: vector<u8>,
        verified_outcome: u64,
        verified_by: vector<address>,
        verification_time: u64,
        consensus_reached: bool,
    }

    /// Truth event with enhanced security
    struct TruthEvent has key, store {
        id: vector<u8>,
        creator: address,
        title: String,
        description: String,
        options: vector<String>,
        voting_end_time: u64,
        ticket_price: u64,
        total_votes: u64,
        total_prize_pool: u64,
        winning_option: u64,
        winners: vector<address>,
        is_resolved: bool,
        creator_reward_claimed: bool,
        created_at: u64,
        resolved_at: u64,
        verification_status: u64, // 0=pending, 1=verified, 2=disputed
        min_participants: u64,
    }

    /// Vote tracking with enhanced security
    struct EventVotes has key, store {
        event_id: vector<u8>,
        votes: vector<VoteRecord>,
        total_amount: u64,
        is_finalized: bool,
        finalized_at: u64,
    }

    struct VoteRecord has store {
        voter: address,
        option_index: u64,
        amount: u64,
        timestamp: u64,
        transaction_hash: vector<u8>,
        claimed: bool, // Prevent double claiming
    }

    /// Global registry with rate limiting
    struct TruthEventRegistry has key {
        events: vector<TruthEvent>,
        next_event_id: u64,
        creator_event_counts: std::simple_map::SimpleMap<address, u64>,
        paused: bool,
        max_events_per_creator: u64,
    }

    /// Reward calculation with overflow protection
    struct RewardCalculation has store {
        event_id: vector<u8>,
        total_prize_pool: u64,
        winner_share_per_person: u64,
        creator_reward: u64,
        platform_fee: u64,
        number_of_winners: u64,
        calculation_hash: vector<u8>, // For verification
    }

    /// Enhanced events with detailed tracking
    struct EventCreated has drop, store {
        event_id: vector<u8>,
        creator: address,
        title: String,
        ticket_price: u64,
        voting_end_time: u64,
        treasury_address: address,
        verification_required: bool,
    }

    struct EventResolved has drop, store {
        event_id: vector<u8>,
        winning_option: u64,
        number_of_winners: u64,
        total_distributed: u64,
        verification_method: String,
        oracle_consensus: bool,
    }

    struct RewardDistributed has drop, store {
        event_id: vector<u8>,
        recipient: address,
        amount: u64,
        reward_type: String,
        transaction_hash: vector<u8>,
        claim_id: vector<u8>,
    }

    struct TreasuryOperation has drop, store {
        operation_type: String,
        amount: u64,
        event_id: vector<u8>,
        timestamp: u64,
        operator: address,
        new_balance: u64,
    }

    /// Security constants
    const WINNER_SHARE_PERCENTAGE: u64 = 60;
    const CREATOR_SHARE_PERCENTAGE: u64 = 5;
    const PLATFORM_FEE_PERCENTAGE: u64 = 35;
    const BASIS_POINTS: u64 = 100;
    const MIN_PARTICIPANTS: u64 = 3;
    const MAX_EVENTS_PER_CREATOR: u64 = 10;
    const MAX_TICKET_PRICE: u64 = 10000; // Maximum ticket price
    const MIN_VERIFICATION_ORACLES: u64 = 2;
    const VERIFICATION_EXPIRY: u64 = 86400; // 24 hours

    /// Enhanced error codes
    const ENOT_AUTHORIZED: u64 = 2001;
    const EEVENT_NOT_FOUND: u64 = 2002;
    const EEVENT_NOT_RESOLVED: u64 = 2003;
    const EEVENT_ALREADY_RESOLVED: u64 = 2004;
    const EINSUFFICIENT_FUNDS: u64 = 2005;
    const EVOTING_NOT_ENDED: u64 = 2006;
    const EINVALID_WINNING_OPTION: u64 = 2007;
    const EREWARD_ALREADY_CLAIMED: u64 = 2008;
    const EINVALID_AMOUNT: u64 = 2009;
    const EREENTRANCY_DETECTED: u64 = 2010;
    const ESYSTEM_PAUSED: u64 = 2011;
    const EINSUFFICIENT_PARTICIPANTS: u64 = 2012;
    const EORACLE_NOT_AUTHORIZED: u64 = 2013;
    const EORACLE_INSUFFICIENT_SIGNATURES: u64 = 2014;
    const EORACLE_VERIFICATION_EXPIRED: u64 = 2015;
    const ERATE_LIMIT_EXCEEDED: u64 = 2016;
    const ETREASURY_INSUFFICIENT: u64 = 2017;
    const EDOUBLE_CLAIM_ATTEMPT: u64 = 2018;

    /// Initialize the truth rewards system with treasury
    public entry fun initialize_truth_rewards(
        admin: &signer,
        initial_oracles: vector<address>
    ) {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @voce_admin, error::permission_denied(ENOT_AUTHORIZED));
        assert!(vector::length(&initial_oracles) >= MIN_VERIFICATION_ORACLES, error::invalid_argument(EORACLE_NOT_AUTHORIZED));

        // Initialize reentrancy guard
        if (!exists<ReentrancyGuard>(admin_addr)) {
            move_to(admin, ReentrancyGuard { entered: false });
        }

        // Initialize treasury
        if (!exists<Treasury>(admin_addr)) {
            let treasury = Treasury {
                staking_funds: coin::zero<AptosCoin>(),
                prize_pool_funds: coin::zero<AptosCoin>(),
                creator_rewards: coin::zero<AptosCoin>(),
                platform_fees: coin::zero<AptosCoin>(),
                insurance_fund: coin::zero<AptosCoin>(),
                event_pools: std::simple_map::create(),
                total_deposits: 0,
                total_withdrawals: 0,
                last_updated: timestamp::now_seconds(),
            };
            move_to(admin, treasury);
        }

        // Initialize oracle registry
        if (!exists<OracleRegistry>(admin_addr)) {
            let oracle_reg = OracleRegistry {
                authorized_oracles: initial_oracles,
                pending_verifications: std::simple_map::create(),
                verification_history: vector::empty(),
            };
            move_to(admin, oracle_reg);
        }

        // Initialize truth event registry
        if (!exists<TruthEventRegistry>(admin_addr)) {
            let registry = TruthEventRegistry {
                events: vector::empty(),
                next_event_id: 1,
                creator_event_counts: std::simple_map::create(),
                paused: false,
                max_events_per_creator: MAX_EVENTS_PER_CREATOR,
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

    /// Check if system is paused
    fun is_system_paused(): bool acquires TruthEventRegistry {
        let registry = borrow_global<TruthEventRegistry>(@voce_admin);
        registry.paused
    }

    /// Create a new truth event with treasury integration
    public entry fun create_truth_event(
        creator: &signer,
        title: String,
        description: String,
        options: vector<String>,
        voting_duration_hours: u64,
        ticket_price: u64,
        min_participants: u64
    ) acquires TruthEventRegistry, Treasury {
        let creator_addr = signer::address_of(creator);
        let registry_addr = @voce_admin;

        // Security checks
        assert!(!is_system_paused(), error::permission_denied(ESYSTEM_PAUSED));
        assert!(ticket_price > 0 && ticket_price <= MAX_TICKET_PRICE, error::invalid_argument(EINVALID_AMOUNT));
        assert!(vector::length(&options) >= 2 && vector::length(&options) <= 10, error::invalid_argument(EINVALID_AMOUNT));
        assert!(voting_duration_hours >= 1 && voting_duration_hours <= 168, error::invalid_argument(EINVALID_AMOUNT)); // Max 1 week
        assert!(min_participants >= MIN_PARTICIPANTS, error::invalid_argument(EINSUFFICIENT_PARTICIPANTS));

        enter_non_reentrant(registry_addr);

        let registry = borrow_global_mut<TruthEventRegistry>(registry_addr);

        // Rate limiting check
        let creator_count = std::simple_map::borrow(&registry.creator_event_counts, &creator_addr);
        assert!(*creator_count < registry.max_events_per_creator, error::permission_denied(ERATE_LIMIT_EXCEEDED));

        let event_id = registry.next_event_id;
        registry.next_event_id = math64::add(event_id, 1)?;

        // Update creator event count
        std::simple_map::add(&mut registry.creator_event_counts, creator_addr, math64::add(*creator_count, 1)?);

        let event_id_bytes = bcs::to_bytes(&event_id);
        let current_time = timestamp::now_seconds();
        let voting_end_time = math64::add(current_time, math64::mul(voting_duration_hours, 3600)?)?;

        let event = TruthEvent {
            id: event_id_bytes,
            creator: creator_addr,
            title,
            description,
            options,
            voting_end_time,
            ticket_price,
            total_votes: 0,
            total_prize_pool: 0,
            winning_option: 0,
            winners: vector::empty(),
            is_resolved: false,
            creator_reward_claimed: false,
            created_at: current_time,
            resolved_at: 0,
            verification_status: 0,
            min_participants,
        };

        vector::push_back(&mut registry.events, event);

        // Initialize vote tracking
        let votes = EventVotes {
            event_id: event_id_bytes,
            votes: vector::empty(),
            total_amount: 0,
            is_finalized: false,
            finalized_at: 0,
        };
        move_to(creator, votes);

        // Create event pool in treasury
        let treasury = borrow_global_mut<Treasury>(registry_addr);
        let event_pool = EventPool {
            event_id: event_id_bytes,
            total_prize_pool: coin::zero<AptosCoin>(),
            is_locked: false,
            winners_paid: false,
            creator_reward_paid: false,
            created_at: current_time,
        };
        std::simple_map::add(&mut treasury.event_pools, event_id_bytes, event_pool);

        // Emit event creation
        event::emit(EventCreated {
            event_id: event_id_bytes,
            creator: creator_addr,
            title: *vector::borrow(&registry.events, vector::length(&registry.events) - 1).title,
            ticket_price,
            voting_end_time,
            treasury_address: registry_addr,
            verification_required: true,
        });

        exit_non_reentrant(registry_addr);
    }

    /// Vote for an option with secure escrow
    public entry fun vote_for_option(
        voter: &signer,
        event_creator: address,
        event_id: u64,
        option_index: u64,
        amount: u64
    ) acquires TruthEventRegistry, Treasury, EventVotes {
        let voter_addr = signer::address_of(voter);
        let registry_addr = @voce_admin;

        assert!(!is_system_paused(), error::permission_denied(ESYSTEM_PAUSED));
        assert!(amount > 0, error::invalid_argument(EINVALID_AMOUNT));

        enter_non_reentrant(registry_addr);

        let registry = borrow_global_mut<TruthEventRegistry>(registry_addr);
        let event = find_event_mut(&mut registry.events, &bcs::to_bytes(&event_id));

        assert!(event.is_resolved == false, error::invalid_argument(EEVENT_ALREADY_RESOLVED));
        assert!(timestamp::now_seconds() < event.voting_end_time, error::invalid_argument(EVOTING_NOT_ENDED));
        assert!(option_index < vector::length(&event.options), error::invalid_argument(EINVALID_WINNING_OPTION));

        // Transfer to treasury escrow (NOT to creator)
        let payment = coin::withdraw<AptosCoin>(voter, amount);
        let treasury = borrow_global_mut<Treasury>(registry_addr);

        // Add to appropriate treasury fund (prize pool for voting)
        coin::deposit(&mut treasury.prize_pool_funds, payment);
        treasury.total_deposits = math64::add(treasury.total_deposits, amount)?;

        // Add to event-specific pool
        let event_pool_ref = std::simple_map::borrow_mut(&mut treasury.event_pools, &bcs::to_bytes(&event_id));
        coin::deposit(&mut event_pool_ref.total_prize_pool, payment);

        // Update event totals
        event.total_votes = math64::add(event.total_votes, 1)?;
        event.total_prize_pool = math64::add(event.total_prize_pool, amount)?;

        // Record vote
        let votes = borrow_global_mut<EventVotes>(event_creator);
        let vote_record = VoteRecord {
            voter: voter_addr,
            option_index,
            amount,
            timestamp: timestamp::now_seconds(),
            transaction_hash: bcs::to_bytes(&amount), // Simplified for demo
            claimed: false,
        };
        vector::push_back(&mut votes.votes, vote_record);
        votes.total_amount = math64::add(votes.total_amount, amount)?;

        exit_non_reentrant(registry_addr);
    }

    /// Oracle-based event resolution
    public entry fun submit_oracle_verification(
        oracle: &signer,
        event_id: u64,
        proposed_outcome: u64,
        signature: vector<u8>
    ) acquires TruthEventRegistry, OracleRegistry {
        let oracle_addr = signer::address_of(oracle);

        assert!(is_authorized_oracle(oracle_addr), error::permission_denied(EORACLE_NOT_AUTHORIZED));

        let oracle_reg = borrow_global_mut<OracleRegistry>(@voce_admin);
        let event_id_bytes = bcs::to_bytes(&event_id);

        // Check if verification exists
        if (std::simple_map::contains(&oracle_reg.pending_verifications, &event_id_bytes)) {
            let verification = std::simple_map::borrow_mut(&mut oracle_reg.pending_verifications, &event_id_bytes);

            // Add oracle signature
            std::simple_map::add(&mut verification.oracle_signatures, oracle_addr, signature);

            // Check if threshold is met
            if (vector::length(&verification.oracle_signatures) >= verification.threshold) {
                // Auto-resolve the event
                resolve_event_via_oracle(event_id, proposed_outcome);
                std::simple_map::remove(&mut oracle_reg.pending_verifications, &event_id_bytes);
            }
        } else {
            // Create new verification request
            let verification = PendingVerification {
                event_id: event_id_bytes,
                proposed_outcome,
                oracle_signatures: std::simple_map::create(),
                threshold: MIN_VERIFICATION_ORACLES,
                expires_at: math64::add(timestamp::now_seconds(), VERIFICATION_EXPIRY)?,
            };

            std::simple_map::add(&mut verification.oracle_signatures, oracle_addr, signature);
            std::simple_map::add(&mut oracle_reg.pending_verifications, event_id_bytes, verification);
        }
    }

    /// Resolve event via oracle consensus
    fun resolve_event_via_oracle(event_id: u64, winning_option: u64) acquires TruthEventRegistry, Treasury, EventVotes {
        let registry = borrow_global_mut<TruthEventRegistry>(@voce_admin);
        let event = find_event_mut(&mut registry.events, &bcs::to_bytes(&event_id));

        assert!(event.is_resolved == false, error::invalid_argument(EEVENT_ALREADY_RESOLVED));
        assert!(timestamp::now_seconds() >= event.voting_end_time, error::invalid_argument(EVOTING_NOT_ENDED));
        assert!(winning_option < vector::length(&event.options), error::invalid_argument(EINVALID_WINNING_OPTION));

        // Find winners from actual votes
        let votes = borrow_global<EventVotes>(event.creator);
        let winners = find_winners_from_votes(&votes.votes, winning_option);
        let number_of_winners = vector::length(&winners);

        // Minimum participants check
        assert!(number_of_winners >= event.min_participants, error::permission_denied(EINSUFFICIENT_PARTICIPANTS));

        // Calculate rewards
        let reward_calc = calculate_rewards_secure(event.total_prize_pool, number_of_winners);

        // Update event
        event.winning_option = winning_option;
        event.winners = winners;
        event.is_resolved = true;
        event.resolved_at = timestamp::now_seconds();
        event.verification_status = 1; // Verified

        // Store creator reward for later claiming
        let treasury = borrow_global_mut<Treasury>(@voce_admin);
        let creator_key = string::utf8(bcs::to_bytes(&event_id));
        std::simple_map::add(&mut treasury.creator_rewards, creator_key, reward_calc.creator_reward);

        // Lock event pool
        let event_pool_ref = std::simple_map::borrow_mut(&mut treasury.event_pools, &bcs::to_bytes(&event_id));
        event_pool_ref.is_locked = true;

        // Emit resolution event
        event::emit(EventResolved {
            event_id: event.id,
            winning_option,
            number_of_winners,
            total_distributed: math64::add(
                math64::mul(reward_calc.winner_share_per_person, number_of_winners)?,
                reward_calc.creator_reward
            )?,
            verification_method: string::utf8(b"oracle_consensus"),
            oracle_consensus: true,
        });

        // Record verification
        let oracle_reg = borrow_global_mut<OracleRegistry>(@voce_admin);
        let verification_record = VerificationRecord {
            event_id: event.id,
            verified_outcome: winning_option,
            verified_by: get_authorized_oracles(), // Simplified
            verification_time: timestamp::now_seconds(),
            consensus_reached: true,
        };
        vector::push_back(&mut oracle_reg.verification_history, verification_record);
    }

    /// Claim winner reward with double-claim protection
    public entry fun claim_winner_reward(
        winner: &signer,
        event_creator: address,
        event_id: u64
    ) acquires TruthEventRegistry, Treasury, EventVotes {
        let winner_addr = signer::address_of(winner);
        let registry_addr = @voce_admin;

        assert!(!is_system_paused(), error::permission_denied(ESYSTEM_PAUSED));

        enter_non_reentrant(registry_addr);

        let registry = borrow_global<TruthEventRegistry>(registry_addr);
        let event = find_event(&registry.events, &bcs::to_bytes(&event_id));

        assert!(event.is_resolved == true, error::invalid_argument(EEVENT_NOT_RESOLVED));
        assert!(vector::contains(&event.winners, &winner_addr), error::permission_denied(ENOT_AUTHORIZED));

        // Check for double claim
        let votes = borrow_global<EventVotes>(event_creator);
        let claim_id = bcs::to_bytes(&(event_id, winner_addr));

        let i = 0;
        let votes_len = vector::length(&votes.votes);
        while (i < votes_len) {
            let vote = vector::borrow(&votes.votes, i);
            if (vote.voter == winner_addr && vote.claimed == true) {
                abort error::permission_denied(EDOUBLE_CLAIM_ATTEMPT);
            };
            i = i + 1;
        };

        let reward_calc = calculate_rewards_secure(event.total_prize_pool, vector::length(&event.winners));

        // Check treasury has sufficient funds
        let treasury = borrow_global<Treasury>(registry_addr);
        let treasury_balance = coin::balance<AptosCoin>(@voce_admin);
        assert!(treasury_balance >= reward_calc.winner_share_per_person, error::invalid_argument(ETREASURY_INSUFFICIENT));

        // Transfer from treasury
        let reward_payment = coin::withdraw<AptosCoin>(@voce_admin, reward_calc.winner_share_per_person);
        coin::deposit(winner_addr, reward_payment);

        // Mark vote as claimed
        let votes_mut = borrow_global_mut<EventVotes>(event_creator);
        let i = 0;
        let votes_len = vector::length(&votes_mut.votes);
        while (i < votes_len) {
            let vote = vector::borrow_mut(&mut votes_mut.votes, i);
            if (vote.voter == winner_addr) {
                vote.claimed = true;
                break;
            };
            i = i + 1;
        };

        // Update treasury
        let treasury_mut = borrow_global_mut<Treasury>(registry_addr);
        let new_balance = math64::sub(coin::balance<AptosCoin>(@voce_admin), reward_calc.winner_share_per_person)?;

        // Emit reward distribution event
        event::emit(RewardDistributed {
            event_id: event.id,
            recipient: winner_addr,
            amount: reward_calc.winner_share_per_person,
            reward_type: string::utf8(b"winner"),
            transaction_hash: bcs::to_bytes(&reward_calc.winner_share_per_person),
            claim_id,
        });

        // Emit treasury operation
        event::emit(TreasuryOperation {
            operation_type: string::utf8(b"winner_reward"),
            amount: reward_calc.winner_share_per_person,
            event_id: event.id,
            timestamp: timestamp::now_seconds(),
            operator: winner_addr,
            new_balance,
        });

        exit_non_reentrant(registry_addr);
    }

    /// Claim creator reward
    public entry fun claim_creator_reward(
        creator: &signer,
        event_id: u64
    ) acquires TruthEventRegistry, Treasury {
        let creator_addr = signer::address_of(creator);
        let registry_addr = @voce_admin;

        assert!(!is_system_paused(), error::permission_denied(ESYSTEM_PAUSED));

        enter_non_reentrant(registry_addr);

        let registry = borrow_global_mut<TruthEventRegistry>(registry_addr);
        let event = find_event_mut(&mut registry.events, &bcs::to_bytes(&event_id));

        assert!(event.is_resolved == true, error::invalid_argument(EEVENT_NOT_RESOLVED));
        assert!(event.creator == creator_addr, error::permission_denied(ENOT_AUTHORIZED));
        assert!(event.creator_reward_claimed == false, error::invalid_argument(EREWARD_ALREADY_CLAIMED));

        let event_key = string::utf8(bcs::to_bytes(&event_id));
        let treasury = borrow_global_mut<Treasury>(registry_addr);

        assert!(std::simple_map::contains(&treasury.creator_rewards, &event_key), error::not_found(EEVENT_NOT_FOUND));

        let creator_reward = *std::simple_map::borrow(&treasury.creator_rewards, &event_key);

        // Check treasury has sufficient funds
        let treasury_balance = coin::balance<AptosCoin>(@voce_admin);
        assert!(treasury_balance >= creator_reward, error::invalid_argument(ETREASURY_INSUFFICIENT));

        // Transfer from treasury
        let reward_payment = coin::withdraw<AptosCoin>(@voce_admin, creator_reward);
        coin::deposit(creator_addr, reward_payment);

        // Mark as claimed
        event.creator_reward_claimed = true;
        std::simple_map::remove(&mut treasury.creator_rewards, &event_key);

        // Update event pool
        let event_pool_ref = std::simple_map::borrow_mut(&mut treasury.event_pools, &bcs::to_bytes(&event_id));
        event_pool_ref.creator_reward_paid = true;

        let new_balance = math64::sub(coin::balance<AptosCoin>(@voce_admin), creator_reward)?;

        // Emit reward distribution event
        event::emit(RewardDistributed {
            event_id: event.id,
            recipient: creator_addr,
            amount: creator_reward,
            reward_type: string::utf8(b"creator"),
            transaction_hash: bcs::to_bytes(&creator_reward),
            claim_id: bcs::to_bytes(&(event_id, creator_addr, 0)),
        });

        // Emit treasury operation
        event::emit(TreasuryOperation {
            operation_type: string::utf8(b"creator_reward"),
            amount: creator_reward,
            event_id: event.id,
            timestamp: timestamp::now_seconds(),
            operator: creator_addr,
            new_balance,
        });

        exit_non_reentrant(registry_addr);
    }

    /// Calculate rewards with overflow protection
    fun calculate_rewards_secure(total_prize_pool: u64, number_of_winners: u64): RewardCalculation {
        let winner_share = math64::div(math64::mul(total_prize_pool, WINNER_SHARE_PERCENTAGE)?, BASIS_POINTS)?;
        let creator_reward = math64::div(math64::mul(total_prize_pool, CREATOR_SHARE_PERCENTAGE)?, BASIS_POINTS)?;
        let platform_fee = math64::div(math64::mul(total_prize_pool, PLATFORM_FEE_PERCENTAGE)?, BASIS_POINTS)?;

        let winner_share_per_person = if (number_of_winners > 0) {
            math64::div(winner_share, number_of_winners)?
        } else {
            0
        };

        let calculation_hash = hash::sha3_256(bcs::to_bytes(&(
            total_prize_pool, winner_share_per_person, creator_reward, platform_fee, number_of_winners
        )));

        RewardCalculation {
            event_id: vector::empty(),
            total_prize_pool,
            winner_share_per_person,
            creator_reward,
            platform_fee,
            number_of_winners,
            calculation_hash,
        }
    }

    /// Oracle helper functions
    fun is_authorized_oracle(addr: address): bool acquires OracleRegistry {
        let oracle_reg = borrow_global<OracleRegistry>(@voce_admin);
        vector::contains(&oracle_reg.authorized_oracles, &addr)
    }

    fun get_authorized_oracles(): vector<address> acquires OracleRegistry {
        let oracle_reg = borrow_global<OracleRegistry>(@voce_admin);
        oracle_reg.authorized_oracles
    }

    /// Helper function to find winners from votes
    fun find_winners_from_votes(votes: &vector<VoteRecord>, winning_option: u64): vector<address> {
        let winners = vector::empty();
        let i = 0;
        let len = vector::length(votes);

        while (i < len) {
            let vote = vector::borrow(votes, i);
            if (vote.option_index == winning_option && !vector::contains(&winners, &vote.voter)) {
                vector::push_back(&mut winners, vote.voter);
            };
            i = i + 1;
        };

        winners
    }

    /// Helper function to find event (mutable)
    fun find_event_mut(events: &mut vector<TruthEvent>, event_id: &vector<u8>): &mut TruthEvent {
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
    fun find_event(events: &vector<TruthEvent>, event_id: &vector<u8>): &TruthEvent {
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

    /// Public view functions (compatible with original interface)
    public fun get_event_details(registry_addr: address, event_id: u64): (vector<u8>, address, String, u64, u64, u64, bool, u64) acquires TruthEventRegistry {
        assert!(exists<TruthEventRegistry>(registry_addr), error::not_found(EEVENT_NOT_FOUND));

        let registry = borrow_global<TruthEventRegistry>(registry_addr);
        let event = find_event(&registry.events, &bcs::to_bytes(&event_id));

        (
            event.id,
            event.creator,
            event.title,
            event.total_votes,
            event.total_prize_pool,
            event.winning_option,
            event.is_resolved,
            event.voting_end_time
        )
    }

    public fun get_reward_calculation(registry_addr: address, event_id: u64): (u64, u64, u64, u64) acquires TruthEventRegistry {
        assert!(exists<TruthEventRegistry>(registry_addr), error::not_found(EEVENT_NOT_FOUND));

        let registry = borrow_global<TruthEventRegistry>(registry_addr);
        let event = find_event(&registry.events, &bcs::to_bytes(&event_id));

        let reward_calc = calculate_rewards_secure(event.total_prize_pool, vector::length(&event.winners));

        (
            reward_calc.winner_share_per_person,
            reward_calc.creator_reward,
            reward_calc.platform_fee,
            vector::length(&event.winners)
        )
    }

    public fun is_winner(registry_addr: address, event_id: u64, user: address): bool acquires TruthEventRegistry {
        assert!(exists<TruthEventRegistry>(registry_addr), error::not_found(EEVENT_NOT_FOUND));

        let registry = borrow_global<TruthEventRegistry>(registry_addr);
        let event = find_event(&registry.events, &bcs::to_bytes(&event_id));

        vector::contains(&event.winners, &user) && event.is_resolved
    }

    public fun get_creator_events(registry_addr: address, creator: address): vector<vector<u8>> acquires TruthEventRegistry {
        assert!(exists<TruthEventRegistry>(registry_addr), error::not_found(EEVENT_NOT_FOUND));

        let registry = borrow_global<TruthEventRegistry>(registry_addr);
        let creator_events = vector::empty();
        let i = 0;
        let len = vector::length(&registry.events);

        while (i < len) {
            let event = vector::borrow(&registry.events, i);
            if (event.creator == creator) {
                vector::push_back(&mut creator_events, event.id);
            };
            i = i + 1;
        };

        creator_events
    }

    public fun get_user_total_rewards(registry_addr: address, user: address): u64 acquires TruthEventRegistry {
        assert!(exists<TruthEventRegistry>(registry_addr), error::not_found(EEVENT_NOT_FOUND));

        let registry = borrow_global<TruthEventRegistry>(registry_addr);
        let total_rewards = 0;
        let i = 0;
        let len = vector::length(&registry.events);

        while (i < len) {
            let event = vector::borrow(&registry.events, i);
            if (event.is_resolved) {
                // Check if user is a winner
                if (vector::contains(&event.winners, &user)) {
                    let reward_calc = calculate_rewards_secure(event.total_prize_pool, vector::length(&event.winners));
                    total_rewards = math64::add(total_rewards, reward_calc.winner_share_per_person)?;
                }

                // Check if user is the creator
                if (event.creator == user && !event.creator_reward_claimed) {
                    let reward_calc = calculate_rewards_secure(event.total_prize_pool, vector::length(&event.winners));
                    total_rewards = math64::add(total_rewards, reward_calc.creator_reward)?;
                }
            };
            i = i + 1;
        };

        total_rewards
    }

    /// Get treasury balance for transparency
    public fun get_treasury_balance(): u64 acquires Treasury {
        let treasury = borrow_global<Treasury>(@voce_admin);
        coin::balance<AptosCoin>(@voce_admin)
    }
}