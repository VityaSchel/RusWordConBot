import mongodb from 'mongodb'

export default async function connect() {
  const dburl = `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_IP}:${process.env.DB_PORT}/?authSource=admin&readPreference=primary`
  const dbName = 'conjugation_bot'
  const dbclient = new mongodb.MongoClient(dburl)

  await dbclient.connect()

  global.dbclient = dbclient
  global.db = dbclient.db(dbName)
}
