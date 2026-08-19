import { json, readBody, auth, preflight } from '../lib/http.js'
import { getContent, saveContent } from '../lib/db.js'
import { defaultContent } from '../lib/defaultContent.js'

export default async function handler(req, res) {
  if (preflight(req, res)) return
  try {
    if (req.method === 'GET') {
      return json(res, 200, await getContent())
    }
    if (req.method === 'POST') {
      if (!auth(req)) return json(res, 401, { error: 'Please sign in again' })
      const body = await readBody(req)
      const saved = await saveContent({ ...defaultContent, ...body })
      return json(res, 200, saved)
    }
    return json(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    return json(res, 500, { error: err.message || 'Server error' })
  }
}
