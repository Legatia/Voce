import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { predictionMarketService } from '@/aptos/services/predictionMarketService';
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import { secureVotingService } from '@/aptos/services/secureVotingService';
import { truthRewardsService } from '@/aptos/services/truthRewards';
import { financialSystemService } from '@/aptos/services/financialSystemService';
import { onChainLevelService } from '@/aptos/services/onchainLevels';

export const ContractIntegrationTest: React.FC = () => {
  const { account, isConnected } = useWallet();
  const { signAndSubmitTransaction, wallet, connected } = useAptosWallet();
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Debug wallet state
  console.log('🔍 Wallet Debug:', {
    isConnected: isConnected || connected,
    account: account?.accountAddress?.toString(),
    wallet: wallet?.name,
    hasSignFunction: !!signAndSubmitTransaction
  });

  const initializeContract = async () => {
    const isWalletConnected = isConnected || connected;
    if (!isWalletConnected || !signAndSubmitTransaction) {
      alert('Please connect your wallet first');
      return;
    }

    setIsInitializing(true);
    try {
      const payload = {
        type: "entry_function_payload",
        function: `${import.meta.env.VITE_VOCE_ADMIN_ADDRESS || "b244f93f5d9dd71073cae0e77a4c8ee093d5562a1b89f03aaf3a828fb390c2c3"}::prediction_market::initialize`,
        type_arguments: [],
        arguments: []
      };

      console.log('🚀 Sending transaction payload:', payload);
      console.log('🔍 Wallet function available:', typeof signAndSubmitTransaction);

      const response = await signAndSubmitTransaction(payload);
      console.log('✅ Contract initialized successfully:', response);
      alert('Contract initialized successfully! Please wait a few seconds for the transaction to process, then test again.');

      // Re-run tests after initialization
      setTimeout(() => testContractConnection(), 3000);
    } catch (error) {
      console.error('❌ Failed to initialize contract:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      alert(`Failed to initialize contract: ${error.message || error.toString()}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const testContractConnection = async () => {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    const results: Record<string, any> = {};

    try {
      // Test 1: Check if prediction market is initialized
      console.log('🔍 Testing prediction market initialization...');

      const predictionMarketInitialized = await predictionMarketService.isInitialized();
      results.predictionMarketInitialized = predictionMarketInitialized;
      console.log('✅ Prediction market initialized:', predictionMarketInitialized);

      // Test other services (will likely fail due to module structure, but let's check)
      const votingInitialized = await secureVotingService.isSecureVotingInitialized();
      results.votingInitialized = votingInitialized;

      const rewardsInitialized = await truthRewardsService.isTruthRewardsInitialized();
      results.rewardsInitialized = rewardsInitialized;

      const financialInitialized = await financialSystemService.isFinancialSystemInitialized();
      results.financialInitialized = financialInitialized;

      const levelsInitialized = await onChainLevelService.isLevelSystemInitialized();
      results.levelsInitialized = levelsInitialized;

      // Test 2: Get system statistics (only prediction market works)
      console.log('📊 Getting system statistics...');

      // Legacy services don't work with deployed contract structure
      // const financialStats = await financialSystemService.getSystemStatistics();
      // results.financialStats = financialStats;

      // const levelStats = await onChainLevelService.getSystemStatistics();
      // results.levelStats = levelStats;

      console.log('ℹ️ Legacy services skipped - not compatible with deployed contract structure');

      // Test 3: Check user-specific data (only if prediction market is initialized)
      if (predictionMarketInitialized) {
        console.log('👤 Getting user data...');

        // Test prediction market user stats
        const userStats = await predictionMarketService.getUserStats(account!.accountAddress.toString());
        results.userStats = userStats;

        // Check if user has voted
        const hasVoted = await predictionMarketService.hasVoted(account!.accountAddress.toString());
        results.hasVoted = hasVoted;

        // Get user's vote if exists
        const userVote = await predictionMarketService.getUserVote(account!.accountAddress.toString());
        results.userVote = userVote;
      } else {
        console.log('⚠️ Skipping user data tests - prediction market not initialized');
        results.error = "Prediction market contract is deployed but not initialized. Please initialize the contract first.";
      }

      // Legacy services (may not work due to module structure)
      // const userLevel = await onChainLevelService.getUserLevelData(account.accountAddress.toString());
      // results.userLevel = userLevel;

      // const userStakes = await financialSystemService.getUserStakes(account.accountAddress.toString());
      // results.userStakes = userStakes;

      console.log('✅ Contract tests completed:', results);

    } catch (error) {
      console.error('❌ Contract test failed:', error);
      results.error = error.message || error.toString();
    } finally {
      setTestResults(results);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-card rounded-lg shadow-lg border">
      <h2 className="text-2xl font-bold mb-6">🧪 Contract Integration Test</h2>

      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isConnected
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? '✅ Wallet Connected' : '❌ Wallet Not Connected'}
          </span>

          {isConnected && account?.accountAddress && (
            <span className="text-sm text-gray-600">
              Address: {account.accountAddress.toString().slice(0, 8)}...
              {account.accountAddress.toString().slice(-8)}
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={testContractConnection}
            disabled={!(isConnected || connected) || isLoading || isInitializing}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '🔄 Testing...' : '🧪 Test Contract Integration'}
          </button>

          {!testResults.predictionMarketInitialized && (isConnected || connected) && (
            <button
              onClick={initializeContract}
              disabled={isInitializing || isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isInitializing ? '🔄 Initializing...' : '⚙️ Initialize Contract'}
            </button>
          )}
        </div>
      </div>

      {Object.keys(testResults).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">📊 Test Results:</h3>

          {/* Contract Initialization Status */}
          <div className="bg-muted/50 p-4 rounded-lg border">
            <h4 className="font-medium mb-2">Contract Initialization:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>🎯 Prediction Market: {testResults.predictionMarketInitialized ? '✅ Initialized' : '❌ Not Initialized'}</div>
              <div>🔐 Secure Voting: {testResults.votingInitialized ? '✅ Initialized' : '❌ Not Available'}</div>
              <div>🏆 Truth Rewards: {testResults.rewardsInitialized ? '✅ Initialized' : '❌ Not Available'}</div>
              <div>💰 Financial System: {testResults.financialInitialized ? '✅ Initialized' : '❌ Not Available'}</div>
              <div>📈 Level System: {testResults.levelsInitialized ? '✅ Initialized' : '❌ Not Available'}</div>
            </div>
          </div>

          {/* System Statistics - Legacy services disabled */}
          {testResults.financialStats && (
            <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium mb-2">Financial System Stats (Legacy):</h4>
              <div className="text-sm">
                <div>Total Pools: {testResults.financialStats.totalPools}</div>
                <div>Total Staked: {testResults.financialStats.totalStaked}</div>
                <div>Active Users: {testResults.financialStats.activeUsers}</div>
              </div>
            </div>
          )}

          {testResults.levelStats && (
            <div className="bg-green-500/10 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium mb-2">Level System Stats (Legacy):</h4>
              <div className="text-sm">
                <div>Total Users: {testResults.levelStats.totalUsers}</div>
                <div>Total XP Distributed: {testResults.levelStats.totalXPDistributed}</div>
                <div>Average Level: {testResults.levelStats.averageLevel}</div>
              </div>
            </div>
          )}

          {/* User Data - Prediction Market */}
          {testResults.userStats && (
            <div className="bg-green-500/10 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium mb-2">Your Prediction Market Stats:</h4>
              <div className="text-sm space-y-1">
                <div>Total XP: <span className="font-mono">{testResults.userStats.totalXp}</span></div>
                <div>Total Earned: <span className="font-mono">{testResults.userStats.totalEarned} APT</span></div>
                <div>Total Votes: <span className="font-mono">{testResults.userStats.totalVotes}</span></div>
                <div>Correct Predictions: <span className="font-mono">{testResults.userStats.correctPredictions}</span></div>
                <div>Accuracy: <span className="font-mono">{testResults.userStats.accuracy}%</span></div>
                <div>Level: <span className="font-mono">{testResults.userStats.level}</span></div>
                <div>Created Events: <span className="font-mono">{testResults.userStats.createdEvents}</span></div>
              </div>
            </div>
          )}

          {testResults.hasVoted !== undefined && (
            <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium mb-2">Voting Status:</h4>
              <div className="text-sm space-y-1">
                <div>Has Voted: {testResults.hasVoted ? '✅ Yes' : '❌ No'}</div>
                {testResults.userVote && (
                  <>
                    <div>Event ID: <span className="font-mono">{testResults.userVote.eventId}</span></div>
                    <div>Prediction: <span className="font-mono">{testResults.userVote.prediction ? 'Yes' : 'No'}</span></div>
                    <div>Rewards Claimed: {testResults.userVote.claimedRewards ? '✅ Yes' : '❌ No'}</div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Legacy User Data */}
          {testResults.userLevel && (
            <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-200">
              <h4 className="font-medium mb-2">Legacy Level System:</h4>
              <div className="text-sm space-y-1">
                <div>Level: <span className="font-mono">{testResults.userLevel.level}</span></div>
                <div>Current XP: <span className="font-mono">{testResults.userLevel.currentXP}</span></div>
                <div>XP to Next Level: <span className="font-mono">{testResults.userLevel.xpToNextLevel}</span></div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {testResults.error && (
            <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
              <h4 className="font-medium mb-2 text-destructive">❌ Error:</h4>
              <div className="text-sm text-destructive/80 font-mono">{testResults.error}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};