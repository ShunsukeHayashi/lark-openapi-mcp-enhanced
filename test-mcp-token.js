const { Client } = require('@larksuiteoapi/node-sdk');

async function testTokenAcquisition() {
  console.log('Testing Lark MCP Token Acquisition...\n');

  const appId = 'cli_a8d2fdb1f1f8d02d';
  const appSecret = 'V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ';
  const domain = 'https://open.larksuite.com';

  try {
    // Test 1: Direct token fetch
    console.log('Test 1: Direct tenant access token fetch');
    const tokenResponse = await fetch(`${domain}/open-apis/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret
      })
    });

    const tokenData = await tokenResponse.json();
    console.log('Token Response:', JSON.stringify(tokenData, null, 2));

    if (tokenData.code !== 0) {
      console.error('❌ Failed to get token:', tokenData.msg);
      return;
    }

    console.log('✅ Token obtained successfully!\n');

    // Test 2: SDK Client initialization
    console.log('Test 2: Lark SDK Client initialization');
    const client = new Client({
      appId: appId,
      appSecret: appSecret,
      domain: domain,
      loggerLevel: 2 // Enable debug logging
    });

    console.log('✅ Client initialized successfully!\n');

    // Test 3: Make a simple API call
    console.log('Test 3: Test API call - Get app info');
    try {
      const appInfoResponse = await client.request({
        url: '/open-apis/auth/v3/app_info',
        method: 'GET'
      });
      
      console.log('App Info Response:', JSON.stringify(appInfoResponse.data, null, 2));
      console.log('✅ API call successful!\n');
    } catch (apiError) {
      console.error('❌ API call failed:', apiError.message);
      if (apiError.response) {
        console.error('Response data:', apiError.response.data);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testTokenAcquisition();