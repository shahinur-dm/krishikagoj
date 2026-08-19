import { json, readBody, auth, preflight } from '../lib/http.js'
import { saveMessage, listMessages } from '../lib/db.js'

export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    if (req.method === 'POST') {
      const body = await readBody(req)
      if (!body.name || !body.email || !body.message) {
        return json(res, 400, { error: 'Please fill in all fields' })
      }
      await saveMessage({
        name: String(body.name).slice(0, 120),
        email: String(body.email).slice(0, 160),
        message: String(body.message).slice(0, 4000),
      })
      return json(res, 200, { ok: true })
    }
    if (req.method === 'GET') {
      if (!auth(req)) return json(res, 401, { error: 'Please sign in again' })
      return json(res, 200, await listMessages())
    }
    return json(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    return json(res, 500, { error: err.message || 'Server error' })
  }
}
