module voce::prediction_market {
    use std::string::String;
    use std::error;
    use std::signer;
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
        outcome: bool, // true = yes, false = no, false (default) = not resolved
        total_votes: u64,
        yes_votes: u64,
        no_votes: u64,
        xp_reward: u64,
        apt_reward: u64,
        created_at: u64,
    }

    struct Vote has key, store {
        event_id: u64,
        event_creator: address,
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

    #[event]
    struct EventCreated has drop, store {
        event_id: u64,
        creator: address,
        title: String,
        category: String,
        xp_reward: u64,
        apt_reward: u64,
        timestamp: u64,
    }

    #[event]
    struct VoteCast has drop, store {
        event_id: u64,
        voter: address,
        prediction: bool,
        timestamp: u64,
    }

    #[event]
    struct EventResolved has drop, store {
        event_id: u64,
        outcome: bool,
        resolved_by: address,
        timestamp: u64,
    }

    #[event]
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
        admin: &signer,
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
    ) acquires EventCounter, UserStats {
        let creator_addr = signer::address_of(creator);
        let current_time = timestamp::now_seconds();

        // Validate deadlines
        assert!(voting_deadline > current_time, error::invalid_argument(E_INVALID_DEADLINE));
        assert!(result_deadline > voting_deadline, error::invalid_argument(E_INVALID_DEADLINE));

        // Get and increment event counter
        let admin_addr = signer::address_of(admin);
        let event_counter = borrow_global_mut<EventCounter>(admin_addr);
        let event_id = event_counter.counter;
        event_counter.counter = event_id + 1;

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
            outcome: false, // default value, not resolved yet
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
        let user_stats = borrow_global_mut<UserStats>(creator_addr);
        user_stats.created_events = user_stats.created_events + 1;

        // Emit event
        event::emit(EventCreated {
            event_id,
            creator: creator_addr,
            title: title,
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
        let prediction_event = borrow_global_mut<PredictionEvent>(event_creator);

        // Validate voting is still open
        assert!(!prediction_event.is_voting_closed, error::permission_denied(E_VOTING_CLOSED));
        assert!(current_time < prediction_event.voting_deadline, error::permission_denied(E_VOTING_CLOSED));

        // Check if user already voted (limit to one vote per event per user)
        assert!(!exists<Vote>(voter_addr), error::already_exists(E_ALREADY_VOTED));

        // Create vote record
        let vote = Vote {
            event_id,
            event_creator,
            prediction,
            timestamp: current_time,
            claimed_rewards: false,
        };
        move_to(voter, vote);

        // Update event statistics
        prediction_event.total_votes = prediction_event.total_votes + 1;
        if (prediction) {
            prediction_event.yes_votes = prediction_event.yes_votes + 1;
        } else {
            prediction_event.no_votes = prediction_event.no_votes + 1;
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

        let user_stats = borrow_global_mut<UserStats>(voter_addr);
        user_stats.total_votes = user_stats.total_votes + 1;

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

        // Get vote
        let user_vote = borrow_global_mut<Vote>(claimer_addr);
        assert!(!user_vote.claimed_rewards, error::already_exists(E_REWARDS_ALREADY_CLAIMED));
        assert!(user_vote.event_id == event_id && user_vote.event_creator == event_creator, error::invalid_argument(0)); // Validate this vote is for this event

        // Get event
        let prediction_event = borrow_global<PredictionEvent>(event_creator);
        assert!(prediction_event.is_resolved, error::permission_denied(E_EVENT_NOT_RESOLVED));

        let prediction_correct = prediction_event.outcome == user_vote.prediction;

        // Calculate rewards
        let (xp_reward, apt_reward) = if (prediction_correct) {
            (prediction_event.xp_reward, prediction_event.apt_reward)
        } else {
            // Majority vote bonus (simplified logic)
            let majority_correct = if (prediction_event.outcome) {
                prediction_event.yes_votes > prediction_event.no_votes
            } else {
                prediction_event.no_votes > prediction_event.yes_votes
            };

            if (majority_correct) {
                (prediction_event.xp_reward / 2, 0) // 50% XP for matching majority
            } else {
                (0, 0)
            }
        };

        // Update vote record
        user_vote.claimed_rewards = true;

        // Update user stats
        let user_stats = borrow_global_mut<UserStats>(claimer_addr);
        user_stats.total_xp = user_stats.total_xp + xp_reward;
        user_stats.total_earned = user_stats.total_earned + apt_reward;

        if (prediction_correct) {
            user_stats.correct_predictions = user_stats.correct_predictions + 1;
        };

        // Update accuracy (basis points)
        if (user_stats.total_votes > 0) {
            user_stats.accuracy = (user_stats.correct_predictions * 10000) / user_stats.total_votes;
        };

        // Update level (simplified: 1000 XP per level)
        user_stats.level = user_stats.total_xp / 1000 + 1;

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

        let prediction_event = borrow_global_mut<PredictionEvent>(event_creator);
        let current_time = timestamp::now_seconds();

        // Validate voting deadline has passed
        assert!(current_time >= prediction_event.voting_deadline, error::permission_denied(E_VOTING_CLOSED));
        assert!(!prediction_event.is_resolved, error::invalid_argument(E_EVENT_NOT_RESOLVED));

        // Resolve the event
        prediction_event.is_resolved = true;
        prediction_event.is_voting_closed = true;
        prediction_event.outcome = outcome;

        // Emit event resolved
        event::emit(EventResolved {
            event_id,
            outcome,
            resolved_by: admin_addr,
            timestamp: current_time,
        });
    }

    // ===== HELPER FUNCTIONS =====

    
    // ===== VIEW FUNCTIONS =====

    // Get event details
    public fun get_event(creator: address, _event_id: u64): PredictionEvent acquires PredictionEvent {
        let event_ref = borrow_global<PredictionEvent>(creator);
        PredictionEvent {
            id: event_ref.id,
            creator: event_ref.creator,
            title: event_ref.title,
            description: event_ref.description,
            category: event_ref.category,
            region: event_ref.region,
            voting_deadline: event_ref.voting_deadline,
            result_deadline: event_ref.result_deadline,
            resolution_criteria: event_ref.resolution_criteria,
            data_sources: event_ref.data_sources,
            is_voting_closed: event_ref.is_voting_closed,
            is_resolved: event_ref.is_resolved,
            outcome: event_ref.outcome,
            total_votes: event_ref.total_votes,
            yes_votes: event_ref.yes_votes,
            no_votes: event_ref.no_votes,
            xp_reward: event_ref.xp_reward,
            apt_reward: event_ref.apt_reward,
            created_at: event_ref.created_at,
        }
    }

    // Get user stats
    public fun get_user_stats(user: address): UserStats acquires UserStats {
        let stats_ref = borrow_global<UserStats>(user);
        UserStats {
            address: stats_ref.address,
            total_xp: stats_ref.total_xp,
            total_earned: stats_ref.total_earned,
            total_votes: stats_ref.total_votes,
            correct_predictions: stats_ref.correct_predictions,
            accuracy: stats_ref.accuracy,
            level: stats_ref.level,
            created_events: stats_ref.created_events,
        }
    }

    // Get vote details
    public fun get_vote(voter: address): Vote acquires Vote {
        let vote_ref = borrow_global<Vote>(voter);
        Vote {
            event_id: vote_ref.event_id,
            event_creator: vote_ref.event_creator,
            prediction: vote_ref.prediction,
            timestamp: vote_ref.timestamp,
            claimed_rewards: vote_ref.claimed_rewards,
        }
    }

    // Check if user has voted
    public fun has_voted(voter: address): bool {
        exists<Vote>(voter)
    }

    // Get next event ID
    public fun get_next_event_id(admin: address): u64 acquires EventCounter {
        borrow_global<EventCounter>(admin).counter + 1
    }
}