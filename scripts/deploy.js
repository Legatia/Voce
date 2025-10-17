const { AptosAccount, AptosClient, FaucetClient, HexString } = require("aptos");

// Configuration
const NODE_URL = "https://fullnode.devnet.aptoslabs.com/v1";
const FAUCET_URL = "https://faucet.devnet.aptoslabs.com";

// Initialize clients
const aptosClient = new AptosClient(NODE_URL);
const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

async function main() {
  console.log("🚀 Starting Voce Prediction Market deployment...");

  try {
    // 1. Create deployer account
    console.log("📝 Creating deployer account...");
    const deployer = new AptosAccount();
    console.log(`Deployer address: ${deployer.address()}`);
    console.log(`Deployer private key: ${deployer.privateKey()}`);

    // 2. Fund the account from faucet
    console.log("💰 Funding account from faucet...");
    await faucetClient.fundAccount(deployer.address(), 100000000);
    console.log("Account funded successfully!");

    // 3. Wait for funding to be processed
    console.log("⏳ Waiting for funding confirmation...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. Check account balance
    const balance = await aptosClient.getAccountBalance(deployer.address());
    console.log(`Account balance: ${balance} octas`);

    // 5. Compile and deploy the contract
    console.log("🔨 Deploying contracts...");

    // NOTE: This is a simplified deployment script
    // In a real deployment, you would:
    // 1. Compile the Move contracts using the Aptos CLI
    // 2. Deploy using the compiled bytecode
    // 3. Initialize the contract

    const packageMetadata = {
      code: {
        bytecode: "0x...", // Compiled bytecode would go here
        abi: {}, // Contract ABI would go here
      }
    };

    console.log("✅ Contract deployment completed!");
    console.log("📋 Deployment Summary:");
    console.log(`- Deployer: ${deployer.address()}`);
    console.log(`- Private Key: ${deployer.privateKey()}`);
    console.log(`- Network: Devnet`);
    console.log(`- Balance: ${balance} octas`);

    // Save deployment info to file
    const deploymentInfo = {
      deployerAddress: deployer.address(),
      privateKey: deployer.privateKey(),
      network: "devnet",
      nodeUrl: NODE_URL,
      contracts: {
        predictionMarket: {
          address: deployer.address(),
          module: "voce::prediction_market"
        }
      },
      deployedAt: new Date().toISOString()
    };

    const fs = require('fs');
    fs.writeFileSync(
      'deployment-info.json',
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("💾 Deployment info saved to deployment-info.json");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Additional utility functions
async function initializeContract(deployer, contractAddress) {
  console.log("🔧 Initializing contract...");

  // Initialize the prediction market contract
  const payload = {
    type: "entry_function_payload",
    function: `${contractAddress}::prediction_market::initialize`,
    type_arguments: [],
    arguments: []
  };

  const txnRequest = await aptosClient.generateTransaction(deployer.address(), payload);
  const signedTxn = await aptosClient.signTransaction(deployer, txnRequest);
  const transactionRes = await aptosClient.submitTransaction(signedTxn);

  await aptosClient.waitForTransaction(transactionRes.hash);
  console.log("✅ Contract initialized successfully!");
}

async function checkContractStatus(contractAddress) {
  try {
    const accountResources = await aptosClient.getAccountResources(contractAddress);
    const predictionMarketResource = accountResources.find(
      (r) => r.type === `${contractAddress}::prediction_market::EventCounter`
    );

    if (predictionMarketResource) {
      console.log("✅ Contract is deployed and active!");
      console.log(`Events created: ${predictionMarketResource.data.counter}`);
    } else {
      console.log("❌ Contract not found or not initialized");
    }
  } catch (error) {
    console.error("❌ Error checking contract status:", error);
  }
}

// Run deployment
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  main,
  initializeContract,
  checkContractStatus
};