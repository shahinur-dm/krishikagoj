import 'dotenv/config'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { connectDb } from './server/app.js'
import User from './server/models/User.js'
import Category from './server/models/Category.js'

async function run() {
  await connectDb()

  // Find or create user
  let user = await User.findOne({ role: 'superadmin' })
  if (!user) {
    user = await User.create({
      name: 'Test Admin',
      email: 'test@admin.com',
      password: 'password',
      role: 'superadmin',
      isActive: true,
      permissions: { post: true }
    })
  }
  // Create token
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'krishikajosh-secret-change-me', { expiresIn: '1h' })

  // Find a category
  let category = await Category.findOne({ isActive: true })
  if (!category) {
    category = await Category.create({ name: 'Test Category', slug: 'test-cat', order: 1, isActive: true })
  }

  const uniqueId = Date.now()
  const title = `E2E Test Post ${uniqueId}`

  console.log('1. Creating article via API...')
  const createRes = await fetch('http://localhost:5050/api/articles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title,
      body: '<p>This is a test post body.</p>',
      category: category._id.toString(),
      isPublished: true,
      latest: true
    })
  })
  
  if (!createRes.ok) {
    console.error('Failed to create article:', await createRes.text())
    process.exit(1)
  }
  const created = await createRes.json()
  console.log('Created article:', created.title)

  console.log('2. Fetching Home API to check latest news...')
  const homeRes = await fetch('http://localhost:5050/api/home')
  const homeData = await homeRes.json()

  const foundInLatest = homeData.latest.find(a => a.title === title)
  
  if (foundInLatest) {
    console.log('✅ SUCCESS: The newly created article was found immediately in the "latest" UI data!')
  } else {
    console.log('❌ ERROR: The newly created article was NOT found in the "latest" UI data!')
    console.log('Latest items in UI:', homeData.latest.map(a => a.title))
  }

  process.exit(0)
}

run().catch(console.error)
