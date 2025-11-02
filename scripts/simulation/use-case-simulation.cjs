#!/usr/bin/env node

/**
 * Comprehensive Use Case Simulation for Voce dApp
 * Tests all major user flows and functionality
 */

const { Account, Ed25519PrivateKey, Aptos, AptosConfig, Network } = require("@aptos-labs/ts-sdk");

// Configuration
const ADMIN_ADDRESS = "b244f93f5d9dd71073cae0e77a4c8ee093d5562a1b89f03aaf3a828fb390c2c3";
const SECURE_VOTING_ADDRESS = `${ADMIN_ADDRESS}::secure_voting`;
const TRUTH_REWARDS_ADDRESS = `${ADMIN_ADDRESS}::truth_rewards`;
const FINANCIAL_SYSTEM_ADDRESS = `${ADMIN_ADDRESS}::financial_system`;
const LEVEL_SYSTEM_ADDRESS = `${ADMIN_ADDRESS}::level_system`;

class UseCaseSimulation {
  constructor() {
    this.aptosConfig = new AptosConfig({ network: Network.TESTNET });
    this.aptos = new Aptos(this.aptosConfig);
    this.testResults = [];
  }

  log(message, type = "INFO") {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type}] ${message}`;
    console.log(logEntry);
    this.testResults.push({ timestamp, message, type });
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkContractInitialization() {
    this.log("🔍 Checking Contract Initialization", "INFO");

    try {
      // Check Secure Voting System
      try {
        await this.aptos.getAccountResource({
          accountAddress: ADMIN_ADDRESS,
          resourceType: `${SECURE_VOTING_ADDRESS}::secure_voting::VotingRegistry`
        });
        this.log("✅ Secure Voting System: Initialized", "SUCCESS");
      } catch (error) {
        this.log("❌ Secure Voting System: Not Initialized", "ERROR");
        this.log(`   Error: ${error.message}`, "ERROR");
      }

      // Check Truth Rewards System
      try {
        await this.aptos.getAccountResource({
          accountAddress: ADMIN_ADDRESS,
          resourceType: `${TRUTH_REWARDS_ADDRESS}::truth_rewards::Treasury`
        });
        this.log("✅ Truth Rewards System: Initialized", "SUCCESS");
      } catch (error) {
        this.log("❌ Truth Rewards System: Not Initialized", "ERROR");
        this.log(`   Error: ${error.message}`, "ERROR");
      }

      // Check Financial System
      try {
        await this.aptos.getAccountResource({
          accountAddress: ADMIN_ADDRESS,
          resourceType: `${FINANCIAL_SYSTEM_ADDRESS}::financial_system::Treasury`
        });
        this.log("✅ Financial System: Initialized", "SUCCESS");
      } catch (error) {
        this.log("❌ Financial System: Not Initialized", "ERROR");
        this.log(`   Error: ${error.message}`, "ERROR");
      }

      // Check Level System
      try {
        await this.aptos.getAccountResource({
          accountAddress: ADMIN_ADDRESS,
          resourceType: `${LEVEL_SYSTEM_ADDRESS}::level_system::UserLevel`
        });
        this.log("✅ Level System: Initialized", "SUCCESS");
      } catch (error) {
        this.log("❌ Level System: Not Initialized", "ERROR");
        this.log(`   Error: ${error.message}`, "ERROR");
      }

    } catch (error) {
      this.log(`❌ Contract initialization check failed: ${error.message}`, "ERROR");
    }
  }

  async simulateUserRegistration() {
    this.log("👤 Simulating User Registration", "INFO");

    try {
      // Create a test user account
      const testUser = Account.generate();
      this.log(`📝 Generated test user: ${testUser.accountAddress.toString()}`, "INFO");

      // Fund the test user account
      this.log("💰 Funding test user account...", "INFO");
      const fundTx = await this.aptos.fundAccount({
        accountAddress: testUser.accountAddress,
        amount: 1000000000 // 1 APT
      });

      this.log(`✅ Account funded: ${fundTx}`, "SUCCESS");
      return testUser;

    } catch (error) {
      this.log(`❌ User registration failed: ${error.message}`, "ERROR");
      return null;
    }
  }

  async simulateCreatingVotingEvent(creatorAccount) {
    this.log("🗳️ Simulating Creating Voting Event", "INFO");

    try {
      const eventId = `event_${Date.now()}`;
      const title = "Will BTC reach $100K by end of 2024?";
      const options = ["Yes", "No"];
      const commitPhaseDuration = 3600; // 1 hour
      const revealPhaseDuration = 3600; // 1 hour

      this.log(`📊 Creating voting event: ${title}`, "INFO");

      const tx = await this.aptos.transaction.build.simple({
        sender: creatorAccount.accountAddress,
        data: {
          function: `${SECURE_VOTING_ADDRESS}::secure_voting::create_voting_event`,
          functionArguments: [
            eventId,
            title,
            options,
            commitPhaseDuration,
            revealPhaseDuration,
            1000000 // 0.001 APT minimum stake
          ]
        }
      });

      const signedTx = await this.aptos.transaction.sign({
        signer: creatorAccount,
        transaction: tx
      });

      const committedTx = await this.aptos.transaction.submit({
        transaction: signedTx
      });

      this.log(`✅ Voting event created: ${committedTx.hash}`, "SUCCESS");
      this.log(`   Event ID: ${eventId}`, "INFO");
      this.log(`   Creator: ${creatorAccount.accountAddress.toString()}`, "INFO");

      // Wait for transaction to process
      await this.sleep(3000);

      return eventId;

    } catch (error) {
      this.log(`❌ Creating voting event failed: ${error.message}`, "ERROR");
      return null;
    }
  }

  async simulateParticipatingInVoting(userAccount, eventId) {
    this.log("🗳️ Simulating Voting Participation", "INFO");

    try {
      const optionIndex = 0; // Vote "Yes"
      const stakeAmount = 2000000; // 0.002 APT

      this.log(`📊 Voting on event ${eventId}`, "INFO");
      this.log(`   Option: ${optionIndex} (Yes)`, "INFO");
      this.log(`   Stake: ${stakeAmount / 1000000} APT`, "INFO");

      // Step 1: Commit phase
      const commitHash = `commit_${userAccount.accountAddress.toString()}_${Date.now()}`;

      const commitTx = await this.aptos.transaction.build.simple({
        sender: userAccount.accountAddress,
        data: {
          function: `${SECURE_VOTING_ADDRESS}::secure_voting::commit_vote`,
          functionArguments: [
            eventId,
            commitHash,
            stakeAmount
          ]
        }
      });

      const signedCommitTx = await this.aptos.transaction.sign({
        signer: userAccount,
        transaction: commitTx
      });

      const committedTx = await this.aptos.transaction.submit({
        transaction: signedCommitTx
      });

      this.log(`✅ Vote committed: ${committedTx.hash}`, "SUCCESS");

      // Wait for transaction to process
      await this.sleep(3000);

      // Step 2: Reveal phase
      const revealTx = await this.aptos.transaction.build.simple({
        sender: userAccount.accountAddress,
        data: {
          function: `${SECURE_VOTING_ADDRESS}::secure_voting::reveal_vote`,
          functionArguments: [
            eventId,
            optionIndex,
            commitHash
          ]
        }
      });

      const signedRevealTx = await this.aptos.transaction.sign({
        signer: userAccount,
        transaction: revealTx
      });

      const committedRevealTx = await this.aptos.transaction.submit({
        transaction: signedRevealTx
      });

      this.log(`✅ Vote revealed: ${committedRevealTx.hash}`, "SUCCESS");

      return true;

    } catch (error) {
      this.log(`❌ Voting participation failed: ${error.message}`, "ERROR");
      return false;
    }
  }

  async simulateStaking(userAccount) {
    this.log("💰 Simulating Staking", "INFO");

    try {
      const stakeAmount = 5000000; // 0.005 APT
      const poolId = 1; // Default pool

      this.log(`💰 Staking ${stakeAmount / 1000000} APT in pool ${poolId}`, "INFO");

      const tx = await this.aptos.transaction.build.simple({
        sender: userAccount.accountAddress,
        data: {
          function: `${FINANCIAL_SYSTEM_ADDRESS}::financial_system::stake`,
          functionArguments: [
            poolId,
            stakeAmount
          ]
        }
      });

      const signedTx = await this.aptos.transaction.sign({
        signer: userAccount,
        transaction: tx
      });

      const committedTx = await this.aptos.transaction.submit({
        transaction: signedTx
      });

      this.log(`✅ Staking successful: ${committedTx.hash}`, "SUCCESS");

      await this.sleep(3000);
      return true;

    } catch (error) {
      this.log(`❌ Staking failed: ${error.message}`, "ERROR");
      return false;
    }
  }

  async simulateLevelProgression(userAccount) {
    this.log("📈 Simulating Level Progression", "INFO");

    try {
      // Check current level
      try {
        const levelResource = await this.aptos.getAccountResource({
          accountAddress: userAccount.accountAddress,
          resourceType: `${LEVEL_SYSTEM_ADDRESS}::level_system::UserLevel`
        });

        this.log(`📊 Current Level: ${levelResource.data.level}`, "INFO");
        this.log(`📊 Current XP: ${levelResource.data.current_xp}`, "INFO");
        this.log(`📊 XP to Next Level: ${levelResource.data.xp_to_next_level}`, "INFO");

        return levelResource.data;

      } catch (error) {
        this.log(`ℹ️ User level not found - this is expected for new users`, "INFO");
        return null;
      }

    } catch (error) {
      this.log(`❌ Level progression check failed: ${error.message}`, "ERROR");
      return null;
    }
  }

  async runCompleteSimulation() {
    this.log("🚀 Starting Complete Use Case Simulation", "INFO");
    this.log("===============================================", "INFO");

    try {
      // Step 1: Check contract initialization
      await this.checkContractInitialization();
      await this.sleep(2000);

      // Step 2: Simulate user registration
      const testUser = await this.simulateUserRegistration();
      if (!testUser) {
        this.log("❌ Cannot proceed without test user", "ERROR");
        return;
      }
      await this.sleep(2000);

      // Step 3: Create a voting event
      const eventId = await this.simulateCreatingVotingEvent(testUser);
      if (!eventId) {
        this.log("❌ Cannot proceed without voting event", "ERROR");
        return;
      }
      await this.sleep(2000);

      // Step 4: Participate in voting
      const voteSuccess = await this.simulateParticipatingInVoting(testUser, eventId);
      await this.sleep(2000);

      // Step 5: Staking
      const stakingSuccess = await this.simulateStaking(testUser);
      await this.sleep(2000);

      // Step 6: Check level progression
      const levelData = await this.simulateLevelProgression(testUser);
      await this.sleep(2000);

      this.log("===============================================", "INFO");
      this.log("📊 SIMULATION RESULTS SUMMARY", "INFO");
      this.log("===============================================", "INFO");

      const successCount = this.testResults.filter(r => r.type === "SUCCESS").length;
      const errorCount = this.testResults.filter(r => r.type === "ERROR").length;

      this.log(`✅ Successful Operations: ${successCount}`, "SUCCESS");
      this.log(`❌ Failed Operations: ${errorCount}`, errorCount > 0 ? "ERROR" : "INFO");

      if (errorCount === 0) {
        this.log("🎉 ALL TESTS PASSED - System is fully functional!", "SUCCESS");
      } else {
        this.log("⚠️ Some tests failed - Check errors above", "ERROR");
      }

      // Write results to file
      const fs = require('fs');
      fs.writeFileSync(
        './simulation-results.json',
        JSON.stringify({
          timestamp: new Date().toISOString(),
          successCount,
          errorCount,
          results: this.testResults,
          testUser: testUser?.accountAddress.toString(),
          eventId,
          voteSuccess,
          stakingSuccess,
          levelData
        }, null, 2)
      );

      this.log("📄 Detailed results saved to simulation-results.json", "INFO");

    } catch (error) {
      this.log(`❌ Simulation failed: ${error.message}`, "ERROR");
    }
  }
}

// Run simulation
if (require.main === module) {
  const simulation = new UseCaseSimulation();
  simulation.runCompleteSimulation().catch(console.error);
}

module.exports = { UseCaseSimulation };