import { v2 as cloudinary } from 'cloudinary'
import { json, readBody, auth, preflight } from '../lib/http.js'

function configureCloudinary() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME
  const key = process.env.CLOUDINARY_API_KEY
  const secret = process.env.CLOUDINARY_API_SECRET
  if (!cloud || !key || !secret) return false
  cloudinary.config({ cloud_name: cloud, api_key: key, api_secret: secret, secure: true })
  return true
}

export default async function handler(req, res) {
  if (preflight(req, res)) return
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  if (!auth(req)) return json(res, 401, { error: 'Please sign in again' })

  try {
    const body = await readBody(req)
    const data = body.data || body.image || ''
    const filename = String(body.filename || 'portfolio').replace(/[^\w.-]/g, '_')

    if (!data || typeof data !== 'string') {
      return json(res, 400, { error: 'No image data provided' })
    }

    if (!configureCloudinary()) {
      return json(res, 503, { error: 'Image upload is not configured. Use a direct link instead.' })
    }

    const uploadSource = data.startsWith('data:') ? data : `data:image/jpeg;base64,${data}`
    const result = await cloudinary.uploader.upload(uploadSource, {
      folder: 'nizamul-portfolio',
      public_id: `${filename}-${Date.now()}`,
      resource_type: 'image',
    })

    return json(res, 200, { url: result.secure_url })
  } catch (err) {
    return json(res, 500, { error: err.message || 'Upload failed' })
  }
}
