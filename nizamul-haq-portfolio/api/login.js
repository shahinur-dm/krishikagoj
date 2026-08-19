import jwt from 'jsonwebtoken'
import { json, readBody, adminCreds, preflight } from '../lib/http.js'

export default async function handler(req, res) {
  if (preflight(req, res)) return
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  try {
    const body = await readBody(req)
    const user = String(body.user || body.username || '').trim()
    const password = String(body.password || '')
    const creds = adminCreds()
    if (user === creds.user && password === creds.password) {
      const token = jwt.sign({ user }, creds.secret, { expiresIn: '7d' })
      return json(res, 200, { token, user })
    }
    return json(res, 401, { error: 'Invalid username or password' })
  } catch (err) {
    return json(res, 500, { error: err.message || 'Server error' })
  }
}
