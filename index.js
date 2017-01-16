'use strict'
loadConfig()
const db = require('./core/db/mongoose')
const statistic = require('./core/statistic/statistic')
const commands = require('./commands')

function handler(req, context, callback) {
  req = req.body ? JSON.parse(req.body) : req
  console.log(req) // eslint-disable-line no-console

  processRequest(req)
    .then(message => sendResponse(message, req, callback))
    .catch(() => sendResponse('something going wrong :c', req, callback))
}

function processRequest(req) {
  if (!req || !req.message || !req.message.chat || !req.message.text) {
    return Promise.resolve('not a telegram message')
  }

  //waiting for slow aws (node 4.3 -> 6.0)
  // const {message: {text, message_id, from, chat}} = req
  const message = req.message
  const text = message.text
  const from = message.from
  const chat = message.chat
  const message_id = message.message_id

  return Promise.all([commands.processQuery(text, message_id, chat.id).catch(() => {}),
    updateMessageStat(from, chat.id).catch(() => {})])
    .then(db.closeConnection)
}

function updateMessageStat(user_info, chat_id) {
  return db.openConnection().then(() => statistic.updateStatistic(user_info, chat_id))
}

function sendResponse(message, input, callback) {
  const response = {
    statusCode: 200,
    body: JSON.stringify({message, input}),
  }

  return callback(null, response)
}

function loadConfig() {
  try {
    const config = require('./config')
    for (let key in config) {
      process.env[key] = config[key]
    }
  } catch (err) {
    // ignore
  }
}

exports.handler = handler // eslint-disable-line
