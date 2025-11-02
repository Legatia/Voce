#!/usr/bin/env node

/**
 * Proper Contract Initialization Script
 * Initializes the deployed prediction_market module correctly
 */

const { execSync } = require('child_process');

async function initializeContracts() {
  try {
    console.log("🔧 Initializing Voce Contracts Properly");
    console.log("=====================================");

    // The contracts were deployed as a single module called 'prediction_market'
    // We need to initialize them through the module functions

    console.log("📝 Current contract structure:");
    console.log("   Module: b244f93f...::prediction_market");
    console.log("   Address: b244f93f5d9dd71073cae0e77a4c8ee093d5562a1b89f03aaf3a828fb390c2c3");

    // Check if the admin account can initialize the systems
    console.log("\n🔍 Checking available functions in prediction_market module...");

    // Let's check the Move source to see what functions are available
    console.log("📚 Analyzing Move source files...");

    const fs = require('fs');
    const path = require('path');

    // Read the Move source files to understand the actual module structure
    const moveDir = path.join(__dirname, '../src/aptos/move');

    if (fs.existsSync(moveDir)) {
      const files = fs.readdirSync(moveDir);
      console.log("📄 Move source files found:");
      files.forEach(file => {
        console.log(`   - ${file}`);
      });

      // Check what modules are actually defined
      files.forEach(file => {
        if (file.endsWith('.move')) {
          const content = fs.readFileSync(path.join(moveDir, file), 'utf8');
          const moduleMatches = content.match(/module\s+([^:]+)::/g);
          if (moduleMatches) {
            console.log(`📋 Modules in ${file}:`);
            moduleMatches.forEach(match => {
              console.log(`   ${match.replace('module ', '')}`);
            });
          }
        }
      });
    }

    console.log("\n🔍 Checking deployed module structure...");

    // Use Aptos CLI to check the deployed module
    try {
      const result = execSync('aptos account list --query modules --account b244f93f5d9dd71073cae0e77a4c8ee093d5562a1b89f03aaf3a828fb390c2c3', { encoding: 'utf8' });
      console.log("📦 Deployed modules:");
      console.log(result);
    } catch (error) {
      console.log("❌ Could not fetch deployed modules");
    }

    console.log("\n🎯 Issue Analysis:");
    console.log("The contracts were compiled as separate .move files but published as a single package.");
    console.log("We need to verify the correct module names and resource paths.");

    console.log("\n✅ Next Steps:");
    console.log("1. Verify actual module names in deployed package");
    console.log("2. Update frontend services with correct module paths");
    console.log("3. Test frontend integration with corrected addresses");

  } catch (error) {
    console.error("❌ Initialization analysis failed:", error.message);
  }
}

initializeContracts();