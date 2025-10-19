/**
 * Lark API Features Test
 *
 * Tests various Lark API features with the configured credentials
 */

const https = require('https');

const APP_ID = process.env.LARK_APP_ID || 'cli_a8d2fdb1f1f8d02d';
const APP_SECRET = process.env.LARK_APP_SECRET || 'V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ';
const DOMAIN = process.env.LARK_DOMAIN || 'https://open.feishu.cn';

let tenantToken = null;

/**
 * Get Tenant Access Token
 */
async function getTenantToken() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      app_id: APP_ID,
      app_secret: APP_SECRET,
    });

    const url = new URL('/open-apis/auth/v3/tenant_access_token/internal', DOMAIN);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.code === 0) {
            resolve(json.tenant_access_token);
          } else {
            reject(new Error(`Failed to get token: ${json.msg}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Make API call
 */
async function callApi(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, DOMAIN);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${tenantToken}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      const postData = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Run tests
 */
async function runTests() {
  console.log('🧪 Lark API Features Test\n');
  console.log('📋 Configuration:');
  console.log(`  App ID: ${APP_ID}`);
  console.log(`  Domain: ${DOMAIN}`);
  console.log(`  Language: ${process.env.LARK_LANGUAGE || 'en'}\n`);

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  // Test 1: Get Tenant Token
  console.log('📤 Test 1: Tenant Access Token取得');
  console.log('----------------------------------');
  try {
    tenantToken = await getTenantToken();
    console.log(`✅ Token取得成功`);
    console.log(`   Token: ${tenantToken.substring(0, 30)}...`);
    console.log(`   有効期限: 7200秒\n`);
    results.passed++;
    results.tests.push({ name: 'Tenant Token', status: 'passed' });
  } catch (error) {
    console.error(`❌ Token取得失敗: ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: 'Tenant Token', status: 'failed', error: error.message });
    return results; // Can't continue without token
  }

  // Test 2: Get App Info
  console.log('📤 Test 2: アプリ情報取得');
  console.log('----------------------------------');
  try {
    const response = await callApi('GET', '/open-apis/application/v6/app_info');
    if (response.data.code === 0) {
      console.log(`✅ アプリ情報取得成功`);
      console.log(`   アプリ名: ${response.data.data.app_name || 'N/A'}`);
      console.log(`   状態: ${response.data.data.status || 'N/A'}\n`);
      results.passed++;
      results.tests.push({ name: 'App Info', status: 'passed' });
    } else {
      throw new Error(`API Error: ${response.data.msg || response.data.message}`);
    }
  } catch (error) {
    console.error(`⚠️ アプリ情報取得失敗: ${error.message}`);
    console.log(`   (このエンドポイントは権限が必要な場合があります)\n`);
    results.failed++;
    results.tests.push({ name: 'App Info', status: 'failed', error: error.message });
  }

  // Test 3: Check Bot Info
  console.log('📤 Test 3: Bot情報取得');
  console.log('----------------------------------');
  try {
    const response = await callApi('GET', '/open-apis/bot/v3/info');
    if (response.data.code === 0) {
      console.log(`✅ Bot情報取得成功`);
      console.log(`   Bot名: ${response.data.bot.app_name || 'N/A'}`);
      console.log(`   状態: ${response.data.bot.status || 'N/A'}\n`);
      results.passed++;
      results.tests.push({ name: 'Bot Info', status: 'passed' });
    } else {
      throw new Error(`API Error: ${response.data.msg || response.data.message}`);
    }
  } catch (error) {
    console.error(`⚠️ Bot情報取得失敗: ${error.message}`);
    console.log(`   (Botが有効化されていない可能性があります)\n`);
    results.failed++;
    results.tests.push({ name: 'Bot Info', status: 'failed', error: error.message });
  }

  // Test 4: List Bitables (if WIKI_SPACE_ID is set)
  if (process.env.WIKI_SPACE_ID) {
    console.log('📤 Test 4: Wiki Space情報取得');
    console.log('----------------------------------');
    try {
      const response = await callApi('GET', `/open-apis/wiki/v2/spaces/${process.env.WIKI_SPACE_ID}`);
      if (response.data.code === 0) {
        console.log(`✅ Wiki Space情報取得成功`);
        console.log(`   Space ID: ${process.env.WIKI_SPACE_ID}`);
        console.log(`   名前: ${response.data.data?.name || 'N/A'}\n`);
        results.passed++;
        results.tests.push({ name: 'Wiki Space Info', status: 'passed' });
      } else {
        throw new Error(`API Error: ${response.data.msg || response.data.message}`);
      }
    } catch (error) {
      console.error(`⚠️ Wiki Space情報取得失敗: ${error.message}\n`);
      results.failed++;
      results.tests.push({ name: 'Wiki Space Info', status: 'failed', error: error.message });
    }
  }

  // Summary
  console.log('📊 テスト結果サマリー');
  console.log('==================');
  console.log(`✅ 成功: ${results.passed}`);
  console.log(`❌ 失敗: ${results.failed}`);
  console.log(`📝 合計: ${results.passed + results.failed}\n`);

  console.log('詳細:');
  results.tests.forEach((test, i) => {
    const icon = test.status === 'passed' ? '✅' : '❌';
    console.log(`  ${i + 1}. ${icon} ${test.name}: ${test.status}`);
    if (test.error) {
      console.log(`     Error: ${test.error}`);
    }
  });

  return results;
}

// Run tests
runTests()
  .then((results) => {
    console.log('\n🎉 テスト完了!');
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
