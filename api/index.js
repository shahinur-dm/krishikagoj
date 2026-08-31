import app, { connectDb } from '../server/app.js'

async function handler(req, res) {
  try {
    await connectDb()
  } catch (err) {
    console.error('DB connect failed:', err.message)
    if (!res.headersSent) {
      res.status(500).json({
        message: 'ডাটাবেস সংযোগ ব্যর্থ। Atlas cluster চালু আছে এবং Network Access-এ 0.0.0.0/0 আছে কিনা দেখুন।',
      })
    }
    return
  }
  return app(req, res)
}

export default handler
