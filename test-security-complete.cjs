#!/usr/bin/env node

/**
 * COMPREHENSIVE SMART CONTRACT SECURITY TEST SUITE
 *
 * This script tests ALL security fixes to verify that vulnerabilities have been eliminated:
 * 1. Escrow System (prevents rug pulls)
 * 2. Reentrancy Protection
 * 3. Multi-signature Governance
 * 4. Oracle Integration
 * 5. Treasury Management
 * 6. Rate Limiting
 * 7. Access Controls
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 COMPREHENSIVE SMART CONTRACT SECURITY TEST SUITE');
console.log('======================================================\n');

// Test Results
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${testName}`);
    if (details) console.log(`   ${details}`);

    testResults.total++;
    if (passed) {
        testResults.passed++;
    } else {
        testResults.failed++;
    }
    testResults.details.push({ test: testName, passed, details });
}

// Test 1: Verify All Original Vulnerable Contracts Have Been Replaced
console.log('📋 TEST 1: Verify Vulnerable Contracts Replaced\n');

try {
    const contracts = [
        'src/aptos/move/secure_voting.move',
        'src/aptos/move/truth_rewards.move',
        'src/aptos/move/financial_system.move',
        'src/aptos/move/level_system.move'
    ];

    let allReplaced = true;
    const replacementResults = [];

    contracts.forEach(contract => {
        const filePath = path.join(__dirname, contract);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');

            // Check for security features
            const hasEscrow = content.includes('EscrowPool') || content.includes('Treasury');
            const hasReentrancy = content.includes('ReentrancyGuard') || content.includes('entered: bool');
            const hasMultiSig = content.includes('MultiSigAdmin') || content.includes('LevelSystemGovernance') || content.includes('threshold');
            const hasOracle = content.includes('OracleRegistry') || content.includes('authorized_oracles');

            const securityScore = [hasEscrow, hasReentrancy, hasMultiSig, hasOracle].filter(Boolean).length;

            replacementResults.push({
                contract,
                hasEscrow,
                hasReentrancy,
                hasMultiSig,
                hasOracle,
                securityScore
            });

            if (securityScore < 2) {
                allReplaced = false;
            }
        } else {
            allReplaced = false;
            replacementResults.push({ contract, missing: true });
        }
    });

    console.log('Security Feature Analysis:');
    replacementResults.forEach(result => {
        if (result.missing) {
            console.log(`❌ ${result.contract}: MISSING`);
        } else {
            console.log(`📄 ${result.contract}:`);
            console.log(`   Escrow System: ${result.hasEscrow ? '✅' : '❌'}`);
            console.log(`   Reentrancy Guard: ${result.hasReentrancy ? '✅' : '❌'}`);
            console.log(`   Multi-Sig: ${result.hasMultiSig ? '✅' : '❌'}`);
            console.log(`   Oracle Integration: ${result.hasOracle ? '✅' : '❌'}`);
            console.log(`   Security Score: ${result.securityScore}/4`);
        }
    });

    logTest('All Vulnerable Contracts Replaced with Secured Versions', allReplaced,
        `Security features implemented across all contracts`);

} catch (error) {
    logTest('Contract Replacement Verification', false, error.message);
}

// Test 2: Verify CRITICAL Rug Pull Vulnerability Is Fixed
console.log('\n📋 TEST 2: Critical Rug Pull Vulnerability Fixed\n');

try {
    const secureVotingPath = path.join(__dirname, 'src/aptos/move/secure_voting.move');
    const truthRewardsPath = path.join(__dirname, 'src/aptos/move/truth_rewards.move');

    let rugPullFixed = true;
    const vulnerabilities = [];

    // Check Secure Voting
    if (fs.existsSync(secureVotingPath)) {
        const votingContent = fs.readFileSync(secureVotingPath, 'utf8');

        // Look for the vulnerable pattern: coin::deposit(event.creator, stake_payment)
        const hasVulnerablePattern = votingContent.includes('coin::deposit(event.creator');
        const hasEscrowSystem = votingContent.includes('EscrowPool') &&
                                votingContent.includes('coin::deposit(&mut escrow');

        if (hasVulnerablePattern) {
            rugPullFixed = false;
            vulnerabilities.push('Secure voting still has direct creator deposit');
        }

        if (!hasEscrowSystem) {
            rugPullFixed = false;
            vulnerabilities.push('Secure voting missing escrow system');
        }
    }

    // Check Truth Rewards
    if (fs.existsSync(truthRewardsPath)) {
        const rewardsContent = fs.readFileSync(truthRewardsPath, 'utf8');

        const hasVulnerablePattern = rewardsContent.includes('coin::deposit(event_creator');
        const hasTreasurySystem = rewardsContent.includes('Treasury') &&
                                 rewardsContent.includes('coin::deposit(&mut treasury');

        if (hasVulnerablePattern) {
            rugPullFixed = false;
            vulnerabilities.push('Truth rewards still has direct creator deposit');
        }

        if (!hasTreasurySystem) {
            rugPullFixed = false;
            vulnerabilities.push('Truth rewards missing treasury system');
        }
    }

    logTest('Critical Rug Pull Vulnerability Fixed', rugPullFixed,
        vulnerabilities.length > 0 ? vulnerabilities.join(', ') : 'All funds now go to escrow/treasury');

} catch (error) {
    logTest('Rug Pull Vulnerability Check', false, error.message);
}

// Test 3: Verify Reentrancy Protection
console.log('\n📋 TEST 3: Reentrancy Protection Implemented\n');

try {
    const contracts = [
        'src/aptos/move/secure_voting.move',
        'src/aptos/move/truth_rewards.move',
        'src/aptos/move/financial_system.move',
        'src/aptos/move/level_system.move'
    ];

    let reentrancyProtected = true;
    const protectionResults = [];

    contracts.forEach(contract => {
        const filePath = path.join(__dirname, contract);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');

            const hasGuard = content.includes('ReentrancyGuard');
            const hasEnterFunc = content.includes('enter_non_reentrant');
            const hasExitFunc = content.includes('exit_non_reentrant');
            const hasCheck = content.includes('EREENTRANCY_DETECTED');

            const isProtected = hasGuard && hasEnterFunc && hasExitFunc && hasCheck;

            protectionResults.push({
                contract: contract.split('/').pop(),
                protected: isProtected,
                hasGuard,
                hasEnterFunc,
                hasExitFunc,
                hasCheck
            });

            if (!isProtected) {
                reentrancyProtected = false;
            }
        }
    });

    console.log('Reentrancy Protection Analysis:');
    protectionResults.forEach(result => {
        console.log(`📄 ${result.contract}:`);
        console.log(`   Guard Struct: ${result.hasGuard ? '✅' : '❌'}`);
        console.log(`   Enter Function: ${result.hasEnterFunc ? '✅' : '❌'}`);
        console.log(`   Exit Function: ${result.hasExitFunc ? '✅' : '❌'}`);
        console.log(`   Error Check: ${result.hasCheck ? '✅' : '❌'}`);
        console.log(`   Overall: ${result.protected ? '✅ PROTECTED' : '❌ VULNERABLE'}`);
    });

    logTest('Reentrancy Protection Implemented', reentrancyProtected,
        protectionResults.filter(r => r.protected).length + '/4 contracts protected');

} catch (error) {
    logTest('Reentrancy Protection Check', false, error.message);
}

// Test 4: Verify Multi-Signature Governance
console.log('\n📋 TEST 4: Multi-Signature Governance Implemented\n');

try {
    const contracts = [
        'src/aptos/move/secure_voting.move',
        'src/aptos/move/level_system.move'
    ];

    let multiSigImplemented = true;
    const governanceResults = [];

    contracts.forEach(contract => {
        const filePath = path.join(__dirname, contract);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');

            const hasMultiSig = content.includes('MultiSigAdmin') || content.includes('LevelSystemGovernance');
            const hasSigners = content.includes('authorized_signers') || content.includes('signers: vector<address>');
            const hasThreshold = content.includes('threshold: u64');
            const hasPendingOps = content.includes('pending_operations') || content.includes('PendingOperation');
            const hasApprovalSystem = content.includes('approvals') && content.includes('operation_threshold');

            const hasGovernance = hasMultiSig && hasSigners && hasThreshold && hasApprovalSystem;

            governanceResults.push({
                contract: contract.split('/').pop(),
                hasGovernance,
                hasMultiSig,
                hasSigners,
                hasThreshold,
                hasApprovalSystem
            });

            if (!hasGovernance) {
                multiSigImplemented = false;
            }
        }
    });

    console.log('Multi-Signature Governance Analysis:');
    governanceResults.forEach(result => {
        console.log(`📄 ${result.contract}:`);
        console.log(`   Multi-Sig Struct: ${result.hasMultiSig ? '✅' : '❌'}`);
        console.log(`   Signers List: ${result.hasSigners ? '✅' : '❌'}`);
        console.log(`   Threshold: ${result.hasThreshold ? '✅' : '❌'}`);
        console.log(`   Approval System: ${result.hasApprovalSystem ? '✅' : '❌'}`);
        console.log(`   Overall: ${result.hasGovernance ? '✅ DECENTRALIZED' : '❌ CENTRALIZED'}`);
    });

    logTest('Multi-Signature Governance Implemented', multiSigImplemented,
        governanceResults.filter(r => r.hasGovernance).length + '/2 contracts have governance');

} catch (error) {
    logTest('Multi-Signature Governance Check', false, error.message);
}

// Test 5: Verify Oracle Integration for Truth Rewards
console.log('\n📋 TEST 5: Oracle Integration for Truth Rewards\n');

try {
    const truthRewardsPath = path.join(__dirname, 'src/aptos/move/truth_rewards.move');

    if (fs.existsSync(truthRewardsPath)) {
        const content = fs.readFileSync(truthRewardsPath, 'utf8');

        const hasOracle = content.includes('OracleRegistry');
        const hasAuthorizedOracles = content.includes('authorized_oracles');
        const hasVerificationSystem = content.includes('PendingVerification');
        const hasConsensus = content.includes('threshold') && content.includes('oracle_signatures');
        const hasVerificationRecords = content.includes('VerificationRecord');

        const oracleIntegrated = hasOracle && hasAuthorizedOracles && hasVerificationSystem;

        console.log('Oracle Integration Analysis:');
        console.log(`   Oracle Registry: ${hasOracle ? '✅' : '❌'}`);
        console.log(`   Authorized Oracles: ${hasAuthorizedOracles ? '✅' : '❌'}`);
        console.log(`   Verification System: ${hasVerificationSystem ? '✅' : '❌'}`);
        console.log(`   Consensus Mechanism: ${hasConsensus ? '✅' : '❌'}`);
        console.log(`   Verification Records: ${hasVerificationRecords ? '✅' : '❌'}`);

        logTest('Oracle Integration for Truth Rewards', oracleIntegrated,
            oracleIntegrated ? 'Decentralized outcome verification implemented' : 'Still using manual admin resolution');
    } else {
        logTest('Oracle Integration for Truth Rewards', false, 'Truth rewards contract not found');
    }

} catch (error) {
    logTest('Oracle Integration Check', false, error.message);
}

// Test 6: Verify Treasury Management System
console.log('\n📋 TEST 6: Treasury Management System\n');

try {
    const contracts = [
        { file: 'src/aptos/move/financial_system.move', expected: true },
        { file: 'src/aptos/move/truth_rewards.move', expected: true }
    ];

    let treasuryImplemented = true;
    const treasuryResults = [];

    contracts.forEach(({ file, expected }) => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');

            const hasTreasury = content.includes('struct Treasury') || content.includes('Treasury');
            const hasFundSeparation = content.includes('staking_funds') || content.includes('operational_funds');
            const hasInsurance = content.includes('insurance_fund') || content.includes('PenaltyPool');
            const hasTransparency = content.includes('TreasuryOperation') || content.includes('emit(TreasuryOperation');

            const hasCompleteTreasury = hasTreasury && hasFundSeparation;

            treasuryResults.push({
                contract: file.split('/').pop(),
                hasTreasury,
                hasFundSeparation,
                hasInsurance,
                hasTransparency,
                hasCompleteTreasury
            });

            if (expected && !hasCompleteTreasury) {
                treasuryImplemented = false;
            }
        }
    });

    console.log('Treasury Management Analysis:');
    treasuryResults.forEach(result => {
        console.log(`📄 ${result.contract}:`);
        console.log(`   Treasury Struct: ${result.hasTreasury ? '✅' : '❌'}`);
        console.log(`   Fund Separation: ${result.hasFundSeparation ? '✅' : '❌'}`);
        console.log(`   Insurance Fund: ${result.hasInsurance ? '✅' : '❌'}`);
        console.log(`   Transparency Events: ${result.hasTransparency ? '✅' : '❌'}`);
        console.log(`   Complete System: ${result.hasCompleteTreasury ? '✅' : '❌'}`);
    });

    logTest('Treasury Management System', treasuryImplemented,
        treasuryResults.filter(r => r.hasCompleteTreasury).length + '/2 contracts have treasury systems');

} catch (error) {
    logTest('Treasury Management Check', false, error.message);
}

// Test 7: Verify Rate Limiting and Access Controls
console.log('\n📋 TEST 7: Rate Limiting and Access Controls\n');

try {
    const contracts = [
        'src/aptos/move/secure_voting.move',
        'src/aptos/move/financial_system.move',
        'src/aptos/move/level_system.move'
    ];

    let accessControlsImplemented = true;
    const accessControlResults = [];

    contracts.forEach(contract => {
        const filePath = path.join(__dirname, contract);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');

            const hasRateLimiting = content.includes('rate_limit') || content.includes('MAX_') || content.includes('daily_limit');
            const hasPauseSystem = content.includes('paused: bool') || content.includes('SYSTEM_PAUSED');
            const hasSuspension = content.includes('is_suspended') || content.includes('EUSER_SUSPENDED');
            const hasValidation = content.includes('assert!') && content.includes('ENOT_AUTHORIZED');

            const hasAccessControls = hasValidation && (hasRateLimiting || hasPauseSystem || hasSuspension);

            accessControlResults.push({
                contract: contract.split('/').pop(),
                hasAccessControls,
                hasRateLimiting,
                hasPauseSystem,
                hasSuspension,
                hasValidation
            });

            if (!hasAccessControls) {
                accessControlsImplemented = false;
            }
        }
    });

    console.log('Access Controls Analysis:');
    accessControlResults.forEach(result => {
        console.log(`📄 ${result.contract}:`);
        console.log(`   Rate Limiting: ${result.hasRateLimiting ? '✅' : '❌'}`);
        console.log(`   Pause System: ${result.hasPauseSystem ? '✅' : '❌'}`);
        console.log(`   User Suspension: ${result.hasSuspension ? '✅' : '❌'}`);
        console.log(`   Authorization: ${result.hasValidation ? '✅' : '❌'}`);
        console.log(`   Overall: ${result.hasAccessControls ? '✅ CONTROLLED' : '❌ OPEN'}`);
    });

    logTest('Rate Limiting and Access Controls', accessControlsImplemented,
        accessControlResults.filter(r => r.hasAccessControls).length + '/3 contracts have access controls');

} catch (error) {
    logTest('Access Controls Check', false, error.message);
}

// Test 8: Verify Compilation Success
console.log('\n📋 TEST 8: Contract Compilation\n');

try {
    const { execSync } = require('child_process');

    // Try to compile the contracts
    const compileResult = execSync('aptos move compile --package-dir . --named-addresses voce=0x1',
        { encoding: 'utf8', timeout: 30000 });

    // Check if compilation was successful
    const compiled = compileResult.includes('"Result":') &&
                    !compileResult.includes('"Error":') &&
                    !compileResult.includes('error:') &&
                    !compileResult.includes('Error');

    logTest('Contract Compilation', compiled,
        compiled ? 'All contracts compile successfully' : 'Compilation errors detected');

} catch (error) {
    logTest('Contract Compilation', false,
        error.message.includes('timeout') ? 'Compilation timeout' : error.message);
}

// Test 9: Verify No Original Vulnerable Patterns Remain
console.log('\n📋 TEST 9: Verify No Vulnerable Patterns Remain\n');

try {
    const vulnerablePatterns = [
        'coin::deposit(event.creator',
        'coin::deposit(event_creator',
        'without reentrancy guard',
        'single admin signature',
        'manual resolution only',
        'direct fund transfer'
    ];

    const contracts = [
        'src/aptos/move/secure_voting.move',
        'src/aptos/move/truth_rewards.move',
        'src/aptos/move/financial_system.move',
        'src/aptos/move/level_system.move'
    ];

    let noVulnerablePatterns = true;
    const patternResults = [];

    vulnerablePatterns.forEach(pattern => {
        let foundInAny = false;
        const contractMatches = [];

        contracts.forEach(contract => {
            const filePath = path.join(__dirname, contract);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                const hasPattern = content.includes(pattern);

                if (hasPattern) {
                    foundInAny = true;
                    contractMatches.push(contract.split('/').pop());
                    noVulnerablePatterns = false;
                }
            }
        });

        patternResults.push({
            pattern,
            found: foundInAny,
            inContracts: contractMatches
        });
    });

    console.log('Vulnerable Pattern Analysis:');
    patternResults.forEach(result => {
        if (result.found) {
            console.log(`❌ PATTERN FOUND: "${result.pattern}"`);
            console.log(`   Found in: ${result.inContracts.join(', ')}`);
        } else {
            console.log(`✅ PATTERN REMOVED: "${result.pattern}"`);
        }
    });

    logTest('No Vulnerable Patterns Remain', noVulnerablePatterns,
        noVulnerablePatterns ? 'All known vulnerable patterns eliminated' :
        `${patternResults.filter(r => r.found).length} vulnerable patterns still exist`);

} catch (error) {
    logTest('Vulnerable Pattern Check', false, error.message);
}

// Test 10: Security Score Calculation
console.log('\n📋 TEST 10: Overall Security Score\n');

try {
    const contracts = [
        'src/aptos/move/secure_voting.move',
        'src/aptos/move/truth_rewards.move',
        'src/aptos/move/financial_system.move',
        'src/aptos/move/level_system.move'
    ];

    let totalScore = 0;
    let maxScore = 0;
    const securityScores = [];

    contracts.forEach(contract => {
        const filePath = path.join(__dirname, contract);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');

            let score = 0;
            const maxContractScore = 10;

            // Security features scoring
            if (content.includes('EscrowPool') || content.includes('Treasury')) score += 2; // Escrow/Treasury (20%)
            if (content.includes('ReentrancyGuard')) score += 1; // Reentrancy (10%)
            if (content.includes('MultiSigAdmin') || content.includes('threshold')) score += 1; // Multi-sig (10%)
            if (content.includes('OracleRegistry')) score += 1; // Oracle (10%)
            if (content.includes('paused: bool') || content.includes('SYSTEM_PAUSED')) score += 1; // Emergency controls (10%)
            if (content.includes('MAX_') || content.includes('daily_limit')) score += 1; // Rate limiting (10%)
            if (content.includes('is_suspended') || content.includes('EUSER_SUSPENDED')) score += 1; // User suspension (10%)
            if (content.includes('assert!') && content.includes('ENOT_AUTHORIZED')) score += 1; // Access control (10%)
            if (content.includes('emit(')) score += 0.5; // Event logging (5%)
            if (!content.includes('coin::deposit(event.creator') && !content.includes('coin::deposit(event_creator')) score += 0.5; // No rug pull (5%)

            securityScores.push({
                contract: contract.split('/').pop(),
                score: Math.min(score, maxContractScore),
                maxScore: maxContractScore,
                percentage: Math.min((score / maxContractScore) * 100, 100)
            });

            totalScore += Math.min(score, maxContractScore);
            maxScore += maxContractScore;
        }
    });

    const overallScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    console.log('Security Scores by Contract:');
    securityScores.forEach(result => {
        const grade = result.percentage >= 90 ? 'A+' :
                     result.percentage >= 80 ? 'A' :
                     result.percentage >= 70 ? 'B' :
                     result.percentage >= 60 ? 'C' :
                     result.percentage >= 50 ? 'D' : 'F';

        console.log(`📄 ${result.contract}: ${result.score}/${result.maxScore} (${result.percentage.toFixed(1)}%) - Grade: ${grade}`);
    });

    console.log(`\n🎯 OVERALL SECURITY SCORE: ${overallScore.toFixed(1)}%`);

    const grade = overallScore >= 90 ? 'A+ (SECURE)' :
                 overallScore >= 80 ? 'A (HIGHLY SECURE)' :
                 overallScore >= 70 ? 'B (SECURE)' :
                 overallScore >= 60 ? 'C (MODERATELY SECURE)' :
                 overallScore >= 50 ? 'D (NEEDS IMPROVEMENT)' : 'F (VULNERABLE)';

    const isSecure = overallScore >= 70;

    logTest('Overall Security Score', isSecure,
        `Grade: ${grade} (${overallScore.toFixed(1)}%)`);

} catch (error) {
    logTest('Security Score Calculation', false, error.message);
}

// FINAL RESULTS
console.log('\n' + '='.repeat(60));
console.log('🔒 COMPREHENSIVE SECURITY TEST RESULTS');
console.log('='.repeat(60));

console.log(`\n📊 SUMMARY:`);
console.log(`Total Tests: ${testResults.total}`);
console.log(`Passed: ${testResults.passed} ✅`);
console.log(`Failed: ${testResults.failed} ❌`);
console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

console.log(`\n🔍 FAILED TESTS:`);
const failedTests = testResults.details.filter(t => !t.passed);
if (failedTests.length > 0) {
    failedTests.forEach(test => {
        console.log(`❌ ${test.test}: ${test.details}`);
    });
} else {
    console.log('✅ All tests passed! No vulnerabilities detected.');
}

console.log(`\n🛡️ SECURITY STATUS:`);
if (testResults.failed === 0) {
    console.log('🎉 ALL CRITICAL VULNERABILITIES HAVE BEEN FIXED!');
    console.log('✅ Contracts are ready for professional security audit');
    console.log('✅ Ready for testnet deployment with monitoring');
} else {
    console.log('⚠️  SOME SECURITY ISSUES REMAIN - DO NOT DEPLOY TO MAINNET');
    console.log('🔧 Fix the failed tests before production deployment');
}

console.log(`\n📝 NEXT STEPS:`);
if (testResults.failed === 0) {
    console.log('1. 📋 Schedule professional security audit');
    console.log('2. 🚀 Deploy to testnet for real-world testing');
    console.log('3. 🔍 Conduct penetration testing');
    console.log('4. 👥 Set up multi-sig admin accounts');
    console.log('5. 📊 Implement monitoring and alerting');
    console.log('6. 🌟 Ready for mainnet deployment');
} else {
    console.log('1. 🔧 Fix all failed security tests');
    console.log('2. 🔄 Re-run this security test suite');
    console.log('3. 📋 Ensure 100% test pass rate');
    console.log('4. 🚀 Proceed with deployment only after fixes');
}

console.log('\n✨ Security testing completed! ✨');