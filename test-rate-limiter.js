/**
 * Quick test script for rate limiting functionality
 */

const { TieredRateLimiter, DEFAULT_RATE_LIMITS } = require('./dist/utils/rate-limiter');

async function testRateLimiting() {
  console.log('🚀 Testing Rate Limiting System...\n');

  // Create rate limiter with default configurations
  const rateLimiter = new TieredRateLimiter(DEFAULT_RATE_LIMITS);

  // Test 1: Basic consumption
  console.log('📊 Test 1: Basic Token Consumption');
  const readResult = await rateLimiter.consume('read', 5);
  console.log(`Read operation (5 tokens): ${readResult ? '✅ Allowed' : '❌ Rate limited'}`);

  const writeResult = await rateLimiter.consume('write', 3);
  console.log(`Write operation (3 tokens): ${writeResult ? '✅ Allowed' : '❌ Rate limited'}`);

  // Test 2: Rate limiting behavior
  console.log('\n📊 Test 2: Rate Limiting Behavior');
  const adminResults = [];
  for (let i = 0; i < 8; i++) {
    const result = await rateLimiter.consume('admin', 1);
    adminResults.push(result);
    console.log(`Admin operation ${i + 1}: ${result ? '✅ Allowed' : '❌ Rate limited'}`);
  }

  // Test 3: Metrics
  console.log('\n📊 Test 3: Rate Limiter Metrics');
  const metrics = rateLimiter.getAllMetrics();
  
  for (const [tier, metric] of Object.entries(metrics)) {
    console.log(`\n${tier.toUpperCase()} Tier:`);
    console.log(`  Available tokens: ${metric.availableTokens}`);
    console.log(`  Total requests: ${metric.totalRequests}`);
    console.log(`  Rate limited: ${metric.rateLimitedRequests}`);
    console.log(`  Success rate: ${((metric.totalRequests - metric.rateLimitedRequests) / metric.totalRequests * 100).toFixed(1)}%`);
  }

  // Test 4: Rapid consumption
  console.log('\n📊 Test 4: Rapid Consumption Test');
  const rapidResults = [];
  const promises = [];
  
  for (let i = 0; i < 10; i++) {
    promises.push(rateLimiter.consume('default', 1));
  }
  
  const results = await Promise.all(promises);
  const allowed = results.filter(r => r).length;
  const blocked = results.filter(r => !r).length;
  
  console.log(`Rapid requests: ${allowed} allowed, ${blocked} blocked`);

  console.log('\n✅ Rate limiting test completed!');
}

testRateLimiting().catch(console.error);