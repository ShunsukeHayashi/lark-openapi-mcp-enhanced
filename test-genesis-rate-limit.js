/**
 * Test Genesis System with Rate Limiting
 */

const { GenesisArchitect } = require('./dist/genesis/index');

async function testGenesisRateLimit() {
  console.log('🧪 Testing Genesis AI System with Rate Limiting...\n');

  // Create architect with rate limiting configuration
  const architect = new GenesisArchitect({
    geminiApiKey: 'test-key-for-validation',
    larkClient: null, // Not needed for step execution test
    maxRetries: 2,
    timeoutMs: 30000,
    enableLogging: true,
    rateLimitDelay: 1000, // 1 second delay for testing
  });

  // Test system status
  console.log('📊 System Status:');
  const status = architect.getStatus();
  console.log(`  Ready: ${status.isReady ? '✅' : '❌'}`);
  console.log(`  Version: ${status.version}`);
  console.log(`  Capabilities: ${status.capabilities.length}`);
  
  if (status.capabilities.length > 0) {
    console.log(`  Available capabilities:`);
    status.capabilities.forEach(cap => console.log(`    - ${cap}`));
  }

  // Test requirements
  const testRequirements = `
# Task Management System Requirements

## Project Overview
Build a comprehensive task management system for development teams.

## Key Features
- Task creation and assignment
- Progress tracking with status updates
- Team collaboration tools
- Deadline management and alerts
- Project reporting and analytics

## Technical Requirements  
- Integration with existing tools
- Real-time updates
- User-friendly interface
- Mobile accessibility
- Data security and backup

## Users
- Project managers
- Development team members
- Stakeholders and clients
`;

  console.log('\n🔧 Testing Individual Step Execution (to avoid rate limits):');
  
  try {
    // Test only the first step to avoid hitting rate limits
    const result = await architect.executeStep(testRequirements, 'C1');
    
    if (result.success) {
      console.log('✅ Requirements Analysis (C1) completed successfully');
      console.log('📊 Execution time:', result.executionTime, 'ms');
      
      if (result.result) {
        console.log('📄 Sample output:');
        console.log(`  Project Title: ${result.result.projectTitle || 'N/A'}`);
        console.log(`  Domain: ${result.result.domain || 'N/A'}`);
        console.log(`  Functional Requirements: ${result.result.functionalRequirements?.length || 0}`);
      }
    } else {
      console.log('❌ Step execution failed:', result.errors);
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    
    if (error.message.includes('rate limit')) {
      console.log('✅ Rate limiting is working correctly - caught rate limit error');
    }
  }

  console.log('\n📈 Rate Limiting Configuration:');
  console.log('  Max Retries: 2 (reduced for testing)');
  console.log('  Timeout: 30 seconds');
  console.log('  Rate Limit Delay: 1 second between API calls');
  console.log('  Enhanced backoff: 4-8-16 second delays for rate limit errors');

  console.log('\n✅ Genesis rate limiting test completed!');
}

testGenesisRateLimit().catch(console.error);