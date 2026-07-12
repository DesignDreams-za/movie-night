import { createServer } from 'node:http'
import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import { healthRouter } from './routes/health.js'
import { registerSocketHandlers } from './socket/index.js'
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from './socket/types.js'

const PORT = process.env.PORT ?? 4000
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'

const app = express()
app.use(cors({ origin: CLIENT_ORIGIN }))
app.use('/health', healthRouter)

const httpServer = createServer(app)
const io = new Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>(httpServer, {
  cors: { origin: CLIENT_ORIGIN },
})

registerSocketHandlers(io)

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Movie Night server listening on http://localhost:${PORT}`)
})
