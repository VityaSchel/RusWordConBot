import 'dotenv/config'
import TelegramBot from 'node-telegram-bot-api'
import fastify from 'fastify'
import mongodb from 'mongodb'
import assert from 'assert'

const url = 'https://conjugationbot.utidteam.com'
const port = 24521
console.log('env', process.env)
const TOKEN = process.env.TELEGRAM_TOKEN

const bot = new TelegramBot(TOKEN)

bot.setWebHook(`${url}/bot${TOKEN}`, { drop_pending_updates: true })

const app = fastify()

app.post(`/bot${TOKEN}`, (req, reply) => {
  console.log(req.body)
  bot.processUpdate(req.body)
  reply.code(200)
})

app.listen(port, () => console.log(`Conjugation bot server is listening on http://localhost:${port}`))

const dburl = `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_IP}:${process.env.DB_PORT}/?authSource=admin&readPreference=primary`
const dbName = 'conjugation_bot'
const dbclient = new mongodb.MongoClient(dburl)
let db
dbclient.connect(err => {
  assert.equal(null, err)
  console.log('Connected successfully to server')
  db = dbclient.db(dbName)
})

bot.on('message', async msg => {
  if(msg.chat.type !== 'private'){ return }
  await checkPreviousWord(msg)
  sendNewWord(msg)
})

const checkPreviousWord = async msg => {
  let { correctConjIndex, isException } = await previousWord(msg.chat.id)
  if(correctConjIndex !== null){
    if(msg.text == correctConjIndex)
      await bot.sendMessage(msg.chat.id, `✅ Правильно, это ${correctConjIndex} спряжение${isException?`, исключение из ${correctConjIndex==2?1:2} спряжения`:''}`)
    else
      await bot.sendMessage(msg.chat.id, `❌ Неправильно, это ${correctConjIndex} спряжение${isException?`, исключение из ${correctConjIndex==2?1:2} спряжения`:''}`)
  }
}

const previousWord = async chatID => {
  let user = await db.collection('user_data').findOne({ userID: chatID })
  if(user === null){
    db.collection('user_data').insertOne({userID: chatID})
    return { correctConjIndex: null, isException: null }
  } else {
    return { correctConjIndex: user.correctConjIndex, isException: user.isException }
  }
}

const sendNewWord = async msg => {
  let { conjIndex, isException, word } = await generateNewWord(msg.chat.id)
  bot.sendMessage(msg.chat.id, `Новое слово: <b>${word}</b>. В ответ отправьте номер спряжения (1 или 2)`, {parse_mode: 'HTML'})
}

const generateNewWord = userID => {
  const exceptions_of_1 = ['дышать', 'держать', 'гнать', 'ненавидеть', 'слышать', 'вертеть', 'смотреть', 'видеть',
    'обидеть', 'терпеть', 'зависеть']
  const exceptions_of_2 = ['брить', 'стелить', 'зиждиться', 'зыбиться']
  const spr1 = ['дать', 'брать', 'врать', 'ехать', 'сжать', 'подать', 'агитировать', 'базировать', 'гравировать',
    'доучивать', 'залетать', 'уметь', 'вдоветь', 'воспеть', 'вымереть', 'светлеть', 'свежеть', 'юнеть', 'яснеть',
    'вколоть', 'перемолоть', 'ахнуть', 'вязнуть', 'вдуть', 'вздохнуть']
  const spr2 = ['делить', 'давить', 'влить', 'вбить', 'варить', 'дарить', 'пить', 'банить', 'бесить', 'благоволить',
    'бороздить', 'будить', 'бутить', 'варить', 'вдохновить', 'засудить']

  let conjIndex = Math.floor(Math.random()*2)+1
  let isException = !Math.floor(Math.random()*5)

  let word = ''
  if(conjIndex === 1) {
    word = randomIndice(isException ? exceptions_of_2 : spr1)
  } else {
    word = randomIndice(isException ? exceptions_of_1 : spr2)
  }

  db.collection('user_data').updateOne(
    { userID: userID },
    { $set: { correctConjIndex: conjIndex, isException: isException } }
  )

  return {
    conjIndex: conjIndex,
    isException: isException,
    word: word
  }
}

const randomIndice = array => array[Math.floor(Math.random()*array.length)]

process.on('SIGINT', () => {
  app.close()
  dbclient.close()
})
