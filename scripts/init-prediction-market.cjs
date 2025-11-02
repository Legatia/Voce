#!/usr/bin/env node

/**
 * Initialize Prediction Market Contract
 * Calls the initialize function on the deployed prediction_market module
 */

const { execSync } = require('child_process');

async function initializePredictionMarket() {
  try {
    console.log("🚀 Initializing Prediction Market Contract");
    console.log("=========================================");

    // Use the admin account to initialize the contract
    const adminAddress = "b244f93f5d9dd71073cae0e77a4c8ee093d5562a1b89f03aaf3a828fb390c2c3";
    const moduleAddress = `${adminAddress}::prediction_market`;

    console.log(`📝 Admin Address: ${adminAddress}`);
    console.log(`📦 Module: ${moduleAddress}`);

    try {
      // Initialize the prediction market contract
      console.log("🔧 Calling initialize function...");

      const command = `aptos move run \
        --function-id ${moduleAddress}::initialize \
        --account ${adminAddress} \
        --assume-yes`;

      console.log(`🔄 Executing: ${command}`);

      const result = execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      console.log("✅ Initialization successful!");
      console.log("Result:", result);

    } catch (error) {
      console.error("❌ Initialization failed:", error.message);

      // Check if it's already initialized
      if (error.message.includes("ALREADY_INITIALIZED") ||
          error.message.includes("already been initialized")) {
        console.log("ℹ️ Contract appears to be already initialized");
      } else {
        console.log("🔍 Trying to check if contract is already initialized...");

        try {
          const checkCommand = `aptos account list --query resources --account ${adminAddress} | grep "prediction_market"`;
          const checkResult = execSync(checkCommand, { encoding: 'utf8' });
          console.log("✅ Contract resources found - likely already initialized");
        } catch (checkError) {
          console.log("❌ Could not verify initialization status");
        }
      }
    }

    console.log("\n🎯 Next Steps:");
    console.log("1. Visit http://localhost:8084/");
    console.log("2. Connect your wallet");
    console.log("3. Test the contract integration");

  } catch (error) {
    console.error("❌ Script failed:", error.message);
  }
}

initializePredictionMarket();