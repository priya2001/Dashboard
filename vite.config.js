import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

function saveJsonPlugin() {
  return {
    name: 'save-json-endpoint',
    configureServer(server) {
      server.middlewares.use('/api/save-json', async (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          let body = ''
          for await (const chunk of req) {
            body += chunk
          }

          const payload = JSON.parse(body || '{}')
          const fileName = String(payload.fileName || 'well-data').replace(/\.[^.]+$/, '')
          const safeName = fileName.replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'well-data'
          const targetDir = path.join(rootDir, 'generated')
          const targetPath = path.join(targetDir, `${safeName}.json`)

          await fs.mkdir(targetDir, { recursive: true })
          await fs.writeFile(targetPath, JSON.stringify(payload.data ?? [], null, 2), 'utf8')

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true, path: path.relative(rootDir, targetPath) }))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Failed to save JSON' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), saveJsonPlugin()],
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
  },
})
