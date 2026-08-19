import app, { connectDb } from '../server/app.js'

await connectDb()

export default app
