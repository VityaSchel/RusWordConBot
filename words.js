import { loadJsonFileSync } from 'load-json-file'
const wordsList = loadJsonFileSync('./wordsList.json')
import { randomIndice, parseFromDb, stringifyToDb } from './utils.js'

export const checkPreviousWord = async msg => {
  let { correctConjIndex, isException } = await previousWordOfUser(msg.chat.id)
  if(correctConjIndex !== null){
    let exception = ''
    if(isException) exception = `, исключение из ${correctConjIndex == 2 ? 1 : 2} спряжения`

    if(msg.text == correctConjIndex)
      await global.bot.sendMessage(
        msg.chat.id,
        `✅ Правильно, это ${correctConjIndex} спряжение${exception}`
      )
    else
      await global.bot.sendMessage(
        msg.chat.id,
        `❌ Неправильно, это ${correctConjIndex} спряжение${exception}`
      )
  }
}

const previousWordOfUser = async chatID => {
  const hasPreviousMessage = await global.db.has(chatID)
  if(hasPreviousMessage) {
    const user = parseFromDb(await global.db.get(chatID))
    return { correctConjIndex: user.correctConjIndex, isException: user.isException }
  } else {
    return { correctConjIndex: null, isException: null }
  }
}

export const sendNewWord = async msg => {
  let { word } = await generateNewWord(msg.chat.id)
  global.bot.sendMessage(
    msg.chat.id,
    `Новое слово: <b>${word}</b>. В ответ отправьте номер спряжения (1 или 2)`,
    { parse_mode: 'HTML' }
  )
}

const generateNewWord = chatID => {
  let conjIndex = Math.floor(Math.random()*2)+1
  let isException = !Math.floor(Math.random()*5)

  let word = ''
  if(conjIndex === 1) {
    word = randomIndice(isException ? wordsList.conj2.exceptions : wordsList.conj1.list)
  } else {
    word = randomIndice(isException ? wordsList.conj1.exceptions : wordsList.conj2.list)
  }

  global.db.put(chatID, stringifyToDb(conjIndex, isException))

  return {
    word: word
  }
}
