import 'dotenv/config'
import { Readable } from 'node:stream'
import { v2 as cloudinary } from 'cloudinary'
import { connectDb } from '../app.js'
import Media from '../models/Media.js'

const requiredEnv = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
const missing = requiredEnv.filter((key) => !process.env[key])

if (missing.length) {
  throw new Error(`Missing Cloudinary env vars: ${missing.join(', ')}`)
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

function uploadBufferToCloudinary(buffer, originalName, id) {
  const safeName = String(originalName || 'media')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  const publicId = `${id}-${safeName || 'media'}`.slice(0, 180)

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'krishi-kagoj/media',
        resource_type: 'image',
        use_filename: true,
        unique_filename: false,
        overwrite: true,
        public_id: publicId,
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      },
    )

    Readable.from(buffer).pipe(stream)
  })
}

async function main() {
  await connectDb()

  const items = await Media.find({
    data: { $exists: true, $ne: null },
    $or: [{ secureUrl: { $exists: false } }, { secureUrl: '' }, { provider: { $ne: 'cloudinary' } }],
  })
    .select('filename mimeType size data provider secureUrl publicId url')
    .sort({ createdAt: 1 })

  if (!items.length) {
    console.log('No media items need migration.')
    return
  }

  let migrated = 0
  let skipped = 0

  for (const item of items) {
    if (!item?.data?.length) {
      skipped += 1
      continue
    }

    try {
      const uploaded = await uploadBufferToCloudinary(item.data, item.filename, String(item._id))
      await Media.updateOne(
        { _id: item._id },
        {
          $set: {
            provider: 'cloudinary',
            url: uploaded.secure_url,
            secureUrl: uploaded.secure_url,
            publicId: uploaded.public_id,
          },
        },
      )
      migrated += 1
      console.log(`Migrated ${item._id} -> ${uploaded.secure_url}`)
    } catch (error) {
      console.error(`Failed to migrate ${item._id}:`, error.message)
    }
  }

  console.log(`Done. Migrated: ${migrated}, skipped: ${skipped}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
