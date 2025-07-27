async function getTenantAccessToken(appId, appSecret) {
  try {
    const response = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret
      })
    });

    const data = await response.json();

    if (data.code === 0) {
      console.log('Successfully obtained tenant access token!');
      console.log('Token:', data.tenant_access_token);
      console.log('Expires in:', data.expire, 'seconds');
      return data.tenant_access_token;
    } else {
      console.error('Failed to get token:', data.msg);
      return null;
    }
  } catch (error) {
    console.error('Error getting token:', error.message);
    return null;
  }
}

// Using the credentials from your config
const appId = 'cli_a8d2fdb1f1f8d02d';
const appSecret = 'V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ';

getTenantAccessToken(appId, appSecret);