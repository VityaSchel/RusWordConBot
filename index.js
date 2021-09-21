import 'dotenv/config'
import TelegramBot from 'node-telegram-bot-api'
import fastify from 'fastify'
import { checkPreviousWord, sendNewWord } from './words.js'
import connectDB from './dbdriver.js'

const url = process.env.WEBHOOK_HOST
const port = process.env.WEBHOOK_PORT
const TOKEN = process.env.TELEGRAM_TOKEN

const app = fastify()
app.post(`/bot${TOKEN}`, (req, reply) => {
  global.bot.processUpdate(req.body)
  reply.status(200).send()
})

app.listen(port, '127.0.0.1', async (err, address) => {
  if(err) throw err
  await connectDB()
  console.log(`Conjugation bot server is listening on ${address}`)

  const bot = new TelegramBot(TOKEN)
  global.bot = bot
  bot.setWebHook(`${url}/bot${TOKEN}`, { drop_pending_updates: true })
  bot.on('message', async msg => {
    if(msg.chat.type !== 'private') { return }
    await checkPreviousWord(msg)
    sendNewWord(msg)
  })
})

process.on('SIGINT', () => {
  console.log('Closing connections...')
  app.close()
  global.dbclient.close()
  console.log('Closed all connections')
  process.exit(2)
})
