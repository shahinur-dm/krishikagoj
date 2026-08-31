import { Router } from 'express'
import { Readable } from 'node:stream'
import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'
import Media from '../models/Media.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'

const router = Router()

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
const MAX_BYTES = 4 * 1024 * 1024
const hasCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

function uploadBufferToCloudinary(buffer, originalName) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'krishi-kagoj',
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        format: undefined,
        public_id: originalName ? originalName.replace(/\.[^.]+$/, '') : undefined,
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      },
    )

    Readable.from(buffer).pipe(stream)
  })
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED.has(file.mimetype)) {
      cb(new Error('শুধু JPG, PNG, WEBP, GIF বা SVG আপলোড করা যাবে'))
      return
    }
    cb(null, true)
  },
})

router.get(
  '/',
  requireAuth,
  requirePermission('post', 'gallery', 'setting', 'allpost', 'ads'),
  async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1)
      const limit = Math.min(36, Math.max(12, Number(req.query.limit) || 24))
      const q = String(req.query.q || '').trim()
      const filter = q
        ? {
            $or: [
              { filename: { $regex: q, $options: 'i' } },
              { publicId: { $regex: q, $options: 'i' } },
            ],
          }
        : {}
      const [docs, total] = await Promise.all([
        Media.find(filter)
          .select('filename mimeType size url secureUrl provider createdAt')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Media.countDocuments(filter),
      ])
      res.json({
        items: docs.map((doc) => ({
          id: String(doc._id),
          filename: doc.filename || '',
          mimeType: doc.mimeType,
          size: doc.size,
          url: doc.secureUrl || doc.url || `/api/media/${doc._id}`,
          createdAt: doc.createdAt,
        })),
        page,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      })
    } catch (e) {
      res.status(500).json({ message: e.message || 'মিডিয়া লোড ব্যর্থ' })
    }
  },
)

router.post(
  '/',
  requireAuth,
  requirePermission('post', 'gallery', 'setting', 'allpost', 'ads'),
  (req, res) => {
    upload.single('file')(req, res, async (err) => {
      try {
        if (err) {
          const msg = err.code === 'LIMIT_FILE_SIZE' ? 'ফাইল সর্বোচ্চ ৪MB হতে পারে' : err.message
          return res.status(400).json({ message: msg })
        }
        if (!req.file?.buffer?.length) {
          return res.status(400).json({ message: 'কোনো ফাইল পাওয়া যায়নি' })
        }

        let cloudAsset = null
        if (hasCloudinary) {
          try {
            cloudAsset = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname)
          } catch (uploadErr) {
            console.warn('Cloudinary upload failed:', uploadErr.message)
          }
        }

        const doc = await Media.create({
          filename: req.file.originalname || 'upload',
          mimeType: req.file.mimetype,
          size: req.file.size,
          data: req.file.buffer,
          provider: cloudAsset ? 'cloudinary' : 'local',
          url: cloudAsset?.secure_url || '',
          secureUrl: cloudAsset?.secure_url || '',
          publicId: cloudAsset?.public_id || '',
          uploadedBy: req.user._id,
        })

        res.status(201).json({
          id: doc._id,
          url: doc.secureUrl || `/api/media/${doc._id}`,
          secureUrl: doc.secureUrl || '',
          provider: doc.provider,
          mimeType: doc.mimeType,
          size: doc.size,
          filename: doc.filename,
        })
      } catch (e) {
        res.status(500).json({ message: e.message || 'আপলোড ব্যর্থ' })
      }
    })
  },
)

router.get('/:id', async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(404).json({ message: 'Not found' })
    }
    const doc = await Media.findById(req.params.id).select('mimeType data secureUrl updatedAt').lean()
    if (doc?.secureUrl) {
      return res.redirect(302, doc.secureUrl)
    }
    if (!doc?.data) return res.status(404).json({ message: 'Not found' })

    const buffer = doc.data.buffer || doc.data
    res.set({
      'Content-Type': doc.mimeType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': buffer.length,
    })
    if (doc.updatedAt) res.set('Last-Modified', new Date(doc.updatedAt).toUTCString())
    res.send(buffer)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
