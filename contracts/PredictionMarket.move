module voce::prediction_market {
    use std::string::{String, self};
    use std::error;
    use std::signer;
    use aptos_framework::account;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::event;

    // ===== ERRORS =====
    const E_INSUFFICIENT_BALANCE: u64 = 1;
    const E_VOTING_CLOSED: u64 = 2;
    const E_ALREADY_VOTED: u64 = 3;
    const E_EVENT_NOT_RESOLVED: u64 = 4;
    const E_REWARDS_ALREADY_CLAIMED: u64 = 5;
    const E_INVALID_DEADLINE: u64 = 6;
    const E_NOT_EVENT_CREATOR: u64 = 7;

    // ===== STRUCTS =====

    struct PredictionEvent has key, store {
        id: u64,
        creator: address,
        title: String,
        description: String,
        category: String,
        region: String,
        voting_deadline: u64,
        result_deadline: u64,
        resolution_criteria: String,
        data_sources: vector<String>,
        is_voting_closed: bool,
        is_resolved: bool,
        outcome: Option<bool>,
        total_votes: u64,
        yes_votes: u64,
        no_votes: u64,
        xp_reward: u64,
        apt_reward: u64,
        created_at: u64,
    }

    struct Vote has key, store {
        voter: address,
        event_id: u64,
        prediction: bool,
        timestamp: u64,
        claimed_rewards: bool,
    }

    struct UserStats has key {
        address: address,
        total_xp: u64,
        total_earned: u64,
        total_votes: u64,
        correct_predictions: u64,
        accuracy: u64, // stored as basis points (10000 = 100%)
        level: u64,
        created_events: u64,
    }

    struct EventCounter has key {
        counter: u64,
    }

    struct VoteCast has drop, store {
        event_id: u64,
        voter: address,
        prediction: bool,
        timestamp: u64,
    }

    struct EventCreated has drop, store {
        event_id: u64,
        creator: address,
        title: String,
        category: String,
        xp_reward: u64,
        apt_reward: u64,
        timestamp: u64,
    }

    struct EventResolved has drop, store {
        event_id: u64,
        outcome: bool,
        resolved_by: address,
        timestamp: u64,
    }

    struct RewardsClaimed has drop, store {
        event_id: u64,
        claimer: address,
        xp_reward: u64,
        apt_reward: u64,
        prediction_correct: bool,
        timestamp: u64,
    }

    // ===== PUBLIC FUNCTIONS =====

    // Initialize the contract
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        if (!exists<EventCounter>(admin_addr)) {
            move_to(admin, EventCounter { counter: 0 });
        };
    }

    // Create a new prediction event
    public entry fun create_event(
        creator: &signer,
        title: String,
        description: String,
        category: String,
        region: String,
        voting_deadline: u64,
        result_deadline: u64,
        resolution_criteria: String,
        data_sources: vector<String>,
        xp_reward: u64,
        apt_reward: u64,
    ) acquires EventCounter {
        let creator_addr = signer::address_of(creator);
        let current_time = timestamp::now_seconds();

        // Validate deadlines
        assert!(voting_deadline > current_time, error::invalid_argument(E_INVALID_DEADLINE));
        assert!(result_deadline > voting_deadline, error::invalid_argument(E_INVALID_DEADLINE));

        // Get and increment event counter
        let counter_ref = &mut borrow_global_mut<EventCounter>(@voce).counter;
        let event_id = *counter_ref;
        *counter_ref = event_id + 1;

        // Create the event
        let event = PredictionEvent {
            id: event_id,
            creator: creator_addr,
            title,
            description,
            category,
            region,
            voting_deadline,
            result_deadline,
            resolution_criteria,
            data_sources,
            is_voting_closed: false,
            is_resolved: false,
            outcome: option::none(),
            total_votes: 0,
            yes_votes: 0,
            no_votes: 0,
            xp_reward,
            apt_reward,
            created_at: current_time,
        };

        move_to(creator, event);

        // Initialize user stats if doesn't exist
        if (!exists<UserStats>(creator_addr)) {
            move_to(creator, UserStats {
                address: creator_addr,
                total_xp: 0,
                total_earned: 0,
                total_votes: 0,
                correct_predictions: 0,
                accuracy: 0,
                level: 1,
                created_events: 0,
            });
        };

        // Update user stats
        let stats_ref = &mut borrow_global_mut<UserStats>(creator_addr);
        stats_ref.created_events = stats_ref.created_events + 1;

        // Emit event
        event::emit(EventCreated {
            event_id,
            creator: creator_addr,
            title: string::copy(&title),
            category,
            xp_reward,
            apt_reward,
            timestamp: current_time,
        });
    }

    // Vote on an event
    public entry fun vote(
        voter: &signer,
        event_creator: address,
        event_id: u64,
        prediction: bool,
    ) acquires PredictionEvent, UserStats {
        let voter_addr = signer::address_of(voter);
        let current_time = timestamp::now_seconds();

        // Get event
        let event_ref = &mut borrow_global_mut<PredictionEvent>(event_creator);

        // Validate voting is still open
        assert!(!event_ref.is_voting_closed, error::permission_denied(E_VOTING_CLOSED));
        assert!(current_time < event_ref.voting_deadline, error::permission_denied(E_VOTING_CLOSED));

        // Check if user already voted
        let vote_key = vote_key(voter_addr, event_id);
        assert!(!account::exists_at(vote_key), error::already_exists(E_ALREADY_VOTED));

        // Create vote record
        let vote = Vote {
            voter: voter_addr,
            event_id,
            prediction,
            timestamp: current_time,
            claimed_rewards: false,
        };
        move_to(voter, vote);

        // Update event statistics
        event_ref.total_votes = event_ref.total_votes + 1;
        if (prediction) {
            event_ref.yes_votes = event_ref.yes_votes + 1;
        } else {
            event_ref.no_votes = event_ref.no_votes + 1;
        };

        // Initialize or update user stats
        if (!exists<UserStats>(voter_addr)) {
            move_to(voter, UserStats {
                address: voter_addr,
                total_xp: 0,
                total_earned: 0,
                total_votes: 0,
                correct_predictions: 0,
                accuracy: 0,
                level: 1,
                created_events: 0,
            });
        };

        let stats_ref = &mut borrow_global_mut<UserStats>(voter_addr);
        stats_ref.total_votes = stats_ref.total_votes + 1;

        // Emit vote event
        event::emit(VoteCast {
            event_id,
            voter: voter_addr,
            prediction,
            timestamp: current_time,
        });
    }

    // Claim rewards for a voted event
    public entry fun claim_rewards(
        claimer: &signer,
        event_creator: address,
        event_id: u64,
    ) acquires PredictionEvent, Vote, UserStats {
        let claimer_addr = signer::address_of(claimer);
        let vote_key = vote_key(claimer_addr, event_id);

        // Get vote
        let vote_ref = &mut borrow_global_mut<Vote>(vote_key);
        assert!(!vote_ref.claimed_rewards, error::already_exists(E_REWARDS_ALREADY_CLAIMED));

        // Get event
        let event_ref = &borrow_global<PredictionEvent>(event_creator);
        assert!(event_ref.is_resolved, error::permission_denied(E_EVENT_NOT_RESOLVED));

        let outcome = option::borrow(&event_ref.outcome);
        let prediction_correct = *outcome == vote_ref.prediction;

        // Calculate rewards
        let (xp_reward, apt_reward) = if (prediction_correct) {
            (event_ref.xp_reward, event_ref.apt_reward)
        } else {
            // Majority vote bonus (simplified logic)
            let majority_correct = if (*outcome) {
                event_ref.yes_votes > event_ref.no_votes
            } else {
                event_ref.no_votes > event_ref.yes_votes
            };

            if (majority_correct) {
                (event_ref.xp_reward / 2, 0) // 50% XP for matching majority
            } else {
                (0, 0)
            }
        };

        // Update vote record
        vote_ref.claimed_rewards = true;

        // Update user stats
        let stats_ref = &mut borrow_global_mut<UserStats>(claimer_addr);
        stats_ref.total_xp = stats_ref.total_xp + xp_reward;
        stats_ref.total_earned = stats_ref.total_earned + apt_reward;

        if (prediction_correct) {
            stats_ref.correct_predictions = stats_ref.correct_predictions + 1;
        };

        // Update accuracy (basis points)
        if (stats_ref.total_votes > 0) {
            stats_ref.accuracy = (stats_ref.correct_predictions * 10000) / stats_ref.total_votes;
        };

        // Update level (simplified: 1000 XP per level)
        stats_ref.level = stats_ref.total_xp / 1000 + 1;

        // Transfer APT rewards if any
        if (apt_reward > 0) {
            // In a real implementation, this would transfer from a reward pool
            // For now, we'll assume rewards are minted or transferred from admin
        };

        // Emit rewards claimed event
        event::emit(RewardsClaimed {
            event_id,
            claimer: claimer_addr,
            xp_reward,
            apt_reward,
            prediction_correct,
            timestamp: timestamp::now_seconds(),
        });
    }

    // Admin function to resolve an event
    public entry fun resolve_event(
        admin: &signer,
        event_creator: address,
        event_id: u64,
        outcome: bool,
    ) acquires PredictionEvent {
        // In production, this should be restricted to authorized oracles
        let admin_addr = signer::address_of(admin);

        let event_ref = &mut borrow_global_mut<PredictionEvent>(event_creator);
        let current_time = timestamp::now_seconds();

        // Validate voting deadline has passed
        assert!(current_time >= event_ref.voting_deadline, error::permission_denied(E_VOTING_CLOSED));
        assert!(!event_ref.is_resolved, error::invalid_argument(E_EVENT_NOT_RESOLVED));

        // Resolve the event
        event_ref.is_resolved = true;
        event_ref.is_voting_closed = true;
        event_ref.outcome = option::some(outcome);

        // Emit event resolved
        event::emit(EventResolved {
            event_id,
            outcome,
            resolved_by: admin_addr,
            timestamp: current_time,
        });
    }

    // ===== HELPER FUNCTIONS =====

    // Generate a unique key for each vote
    fun vote_key(voter: address, event_id: u64): address {
        let seed = voter;
        // Simple approach: combine voter address with event_id
        // In production, use a more sophisticated method
        seed
    }

    // ===== VIEW FUNCTIONS =====

    // Get event details
    public fun get_event(creator: address, event_id: u64): PredictionEvent acquires PredictionEvent {
        borrow_global<PredictionEvent>(creator)
    }

    // Get user stats
    public fun get_user_stats(user: address): UserStats acquires UserStats {
        borrow_global<UserStats>(user)
    }

    // Get vote details
    public fun get_vote(voter: address, event_id: u64): Vote acquires Vote {
        borrow_global<Vote>(vote_key(voter, event_id))
    }

    // Check if user has voted
    public fun has_voted(voter: address, event_id: u64): bool {
        account::exists_at(vote_key(voter, event_id))
    }

    // Get next event ID
    public fun get_next_event_id(): u64 acquires EventCounter {
        borrow_global<EventCounter>(@voce).counter + 1
    }
}