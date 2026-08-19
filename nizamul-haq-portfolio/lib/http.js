import jwt from 'jsonwebtoken'

export function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.end(JSON.stringify(body))
}

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
}

export function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body)
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error('Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

export function adminCreds() {
  return {
    user: String(process.env.ADMIN_USER || 'admin').trim().replace(/^["']|["']$/g, ''),
    password: String(process.env.ADMIN_PASSWORD || 'Nizamul@2026').trim().replace(/^["']|["']$/g, ''),
    secret: String(process.env.JWT_SECRET || 'dev-secret').trim(),
  }
}

export function auth(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return null
  try {
    return jwt.verify(token, adminCreds().secret)
  } catch {
    return null
  }
}

export function preflight(req, res) {
  if (req.method !== 'OPTIONS') return false
  cors(res)
  res.statusCode = 204
  res.end()
  return true
}
