import { MongoClient } from 'mongodb'
import { defaultContent } from './defaultContent.js'

let client
let dbPromise

export function getDb() {
  const uri = process.env.MONGODB_URI
  if (!uri) return null
  if (!dbPromise) {
    dbPromise = (async () => {
      client = new MongoClient(uri)
      await client.connect()
      return client.db()
    })()
  }
  return dbPromise
}

export async function getContent() {
  const db = await getDb()
  if (!db) return defaultContent
  const doc = await db.collection('nizamul_portfolio').findOne({ _id: 'site' })
  const data = doc?.data
  if (!data) return defaultContent
  return {
    ...defaultContent,
    ...data,
    profile: { ...defaultContent.profile, ...data.profile },
    gallery: { ...defaultContent.gallery, ...data.gallery },
  }
}

export async function saveContent(data) {
  const db = await getDb()
  if (!db) throw new Error('Database not configured')
  await db.collection('nizamul_portfolio').updateOne(
    { _id: 'site' },
    { $set: { data, updatedAt: new Date() } },
    { upsert: true },
  )
  return data
}

export async function saveMessage(msg) {
  const db = await getDb()
  if (!db) return { ok: true, stored: false }
  const doc = { ...msg, createdAt: new Date(), read: false }
  await db.collection('nizamul_messages').insertOne(doc)
  return { ok: true, stored: true }
}

export async function listMessages() {
  const db = await getDb()
  if (!db) return []
  return db.collection('nizamul_messages').find({}).sort({ createdAt: -1 }).limit(80).toArray()
}
