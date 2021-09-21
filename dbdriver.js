import level from 'level'

export default async function connect() {
  const db = level('rus-word-con-bot_db')
  db.has = async key => {
    try {
      await global.db.get(key)
    } catch (e) {
      if(e.type === 'NotFoundError') return false
      else throw e
    }
    return true
  }
  global.db = db
}
