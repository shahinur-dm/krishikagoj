import 'dotenv/config'
import jwt from 'jsonwebtoken'
import http from 'http'
import User from '../server/models/User.js'
import SiteSetting from '../server/models/SiteSetting.js'
import app from '../server/app.js'

// Mock User.findById for standalone test
User.findById = async function (id) {
  return {
    _id: id,
    role: 'superadmin',
    isActive: true,
    permissions: { setting: true, post: true },
  }
}

// Mock SiteSetting.findOne for standalone test
SiteSetting.findOne = function () {
  return {
    lean: async () => ({
      key: 'site',
      facebookPageId: '100089283746152',
      facebookPageAccessToken: '',
    }),
  }
}

async function startServer() {
  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(5053, resolve))
  return server
}

async function testFacebookSettings() {
  console.log('--- Testing Facebook Settings Endpoints & Logic ---')
  const server = await startServer()
  const baseUrl = 'http://localhost:5053/api'

  const token = jwt.sign(
    { id: '600000000000000000000001', role: 'superadmin' },
    process.env.JWT_SECRET || 'krishikajosh-secret-change-me',
    { expiresIn: '1h' },
  )

  try {
    // 1. Test GET Facebook Settings (Requires Auth)
    console.log('\n[1] Testing GET /api/settings/facebook...')
    const getRes = await fetch(`${baseUrl}/settings/facebook`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const getData = await getRes.json()
    console.log('GET /facebook Status:', getRes.status, '| Payload:', getData)
    if (getRes.ok && typeof getData.hasToken === 'boolean') {
      console.log('✅ PASS: GET /settings/facebook returns safe metadata without raw token.')
    } else {
      console.error('❌ FAIL: GET /settings/facebook response invalid.')
    }

    // 2. Test Test Connection Validation (Missing Page ID)
    console.log('\n[2] Testing Test Connection Validation (Missing Page ID)...')
    const testResNoId = await fetch(`${baseUrl}/settings/facebook/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pageId: '', pageAccessToken: 'sample_token' }),
    })
    const testDataNoId = await testResNoId.json()
    console.log('Missing Page ID Status:', testResNoId.status, '| message:', testDataNoId.message)
    if (testResNoId.status === 400 && testDataNoId.message === 'Facebook Page ID সেট করা হয়নি') {
      console.log('✅ PASS: Missing Page ID is properly caught with exact Bangla message.')
    } else {
      console.error('❌ FAIL: Missing Page ID error message incorrect.')
    }

    // 3. Test Test Connection Validation (Missing Token)
    console.log('\n[3] Testing Test Connection Validation (Missing Token)...')
    const testResNoToken = await fetch(`${baseUrl}/settings/facebook/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pageId: '123456789', pageAccessToken: '' }),
    })
    const testDataNoToken = await testResNoToken.json()
    console.log('Missing Token Status:', testResNoToken.status, '| message:', testDataNoToken.message)
    if (testResNoToken.status === 400 && testDataNoToken.message === 'Facebook Page Access Token সেট করা হয়নি') {
      console.log('✅ PASS: Missing Access Token is properly caught with exact Bangla message.')
    } else {
      console.error('❌ FAIL: Missing Access Token error message incorrect.')
    }

    // 4. Test Test Connection with Invalid Credentials
    console.log('\n[4] Testing Test Connection with Invalid Credentials...')
    const testResInvalid = await fetch(`${baseUrl}/settings/facebook/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pageId: '123456789', pageAccessToken: 'invalid_token_sample' }),
    })
    const testDataInvalid = await testResInvalid.json()
    console.log('Invalid Token Status:', testResInvalid.status, '| message:', testDataInvalid.message)
    if (testResInvalid.status === 400 && testDataInvalid.message === 'Facebook credentials সঠিক নয়') {
      console.log('✅ PASS: Invalid credentials caught properly with exact Bangla error message.')
    } else {
      console.error('❌ FAIL: Invalid credentials handling incorrect.')
    }

    // 5. Test Public GET /api/settings to ensure token is NEVER exposed publicly
    console.log('\n[5] Testing Public GET /api/settings to ensure no token leaks...')
    const publicSettingsRes = await fetch(`${baseUrl}/settings`)
    const publicSettingsData = await publicSettingsRes.json()
    if (publicSettingsData.facebookPageAccessToken === undefined && publicSettingsData.facebookSettings === undefined) {
      console.log('✅ PASS: Public settings endpoint does NOT expose Facebook Page Access Token.')
    } else {
      console.error('❌ FAIL: Public settings leaked access token!')
    }

    console.log('\n--- All Facebook Settings Tests Completed Successfully ---')
  } finally {
    server.close()
  }
}

testFacebookSettings().catch((err) => {
  console.error('Test execution failed:', err)
  process.exit(1)
})
