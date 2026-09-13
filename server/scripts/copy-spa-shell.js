import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const from = path.join(root, 'dist', 'index.html')
const to = path.join(root, 'server', 'generated-spa.html')

if (fs.existsSync(from)) {
  fs.copyFileSync(from, to)
}
