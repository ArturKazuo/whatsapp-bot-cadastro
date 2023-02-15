//  __   __  ___        ___
// |__) /  \  |  |__/ |  |  
// |__) \__/  |  |  \ |  |  

const { Botkit } = require('botkit');
const { WebAdapter } = require('botbuilder-adapter-web');
const { MongoDbStorage } = require('botbuilder-storage-mongodb');
const Client = require('./components/wwClient');
var express = require('express');
const fetch = require('node-fetch');
const RedeAPI = require('./components/apiRede1Minuto');
const apiRede = new RedeAPI();

const SESSION_NAME = 'Suporte';
const API_PORT = 60008;
const WS_PORT = 3000;

// Load process.env values from .env file
require('dotenv').config();

const use_sockets = false;
const config = {
  //ws_url: 'ws://localhost', //(location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.host,
  ws_url: `ws://localhost:${WS_PORT}`,
  reconnect_timeout: 3000,
  max_reconnect: 5,
  enable_history: false,
};
let socket;

let storage = null;
if (process.env.MONGO_URI) {
  storage = mongoStorage = new MongoDbStorage({
    url: process.env.MONGO_URI,
  });
}

//WhatsApp Server
const client = new Client(SESSION_NAME, receiveMessage);

const adapter = new WebAdapter({});


const controller = new Botkit({
  webhook_uri: '/api/messages',
  adapter: adapter,
  storage
});

controller.ready(() => {

  console.log(`/features/${SESSION_NAME}`);
  controller.loadModules(__dirname + `/features/${SESSION_NAME}`);

  // Log every message received
  controller.middleware.receive.use(function (bot, message, next) {
    //console.log('RECEIVED: ', message);
    next();
  });

  // Log every message sent
  controller.middleware.send.use(async function (bot, message, next) {
    // console.log('SENT: ', message);
    await sendText(message.channelData?.user, message.text, message.channelData?.qrcode);
    next();
  });

  controller.on('connected', function () {
    console.log('CONNECTED');
  })

  controller.on('disconnected', function () {
    console.log('DISCONNECTED');
  });

  controller.on('webhook_error', function (err) {
    //console.error('Webhook Error', err);
  });

  controller.on('typing', function () {

  });

  controller.on('sent', function () {
    // do something after sending
  });

  controller.on('message', function (message) {
    //console.log('RECEIVED MESSAGE', message);
  });

  controller.on('history_loaded', function (history) {
  });

  connect();

});


function convertToCharArray(word) {
  return Array.prototype.map.call(word, eachLetter => eachLetter.charCodeAt(0));
}


function receiveMessage(text, contact, channelData) {
  console.log('REC:', convertToCharArray(text));

  if (!text) {
    return
  } else {

    const message = {
      type: 'message',
      text: text,
      user: contact,
      channel: use_sockets ? 'websocket' : 'webhook',
      channelData: {
        // data: contact,
        ...channelData
      }
    }

    deliverMessage(message);
    controller.trigger('sent', message);

    return false;
  }
};

function deliverMessage(message) {
  //console.log('DELIVER MESSAGE', message);
  if (use_sockets) {
    // controller.adapter.socket.send(JSON.stringify(message));
    socket.send(JSON.stringify(message));
  } else {
    webhook(message);
  }
};

function webhook(message) {

  // console.log('WEBHOOK MESSAGE', message);
  request(`http://localhost:${WS_PORT}/api/messages`, message).then(function (messages) {
    messages.forEach((message) => {
      controller.trigger(message.type, message);
    });
  }).catch(function (err) {
    controller.trigger('webhook_error', err);
  });

};

function connect() {
  // connect to the chat server!
  if (use_sockets) {
    connectWebsocket(config.ws_url);
  } else {
    connectWebhook();
  }
};

function connectWebhook() {
  // connect immediately
  controller.trigger('connected', {});
  // webhook({
  //   type: 'welcome_back',
  //   user: 'that.guid',
  //   channel: 'webhook',
  // });
};

function connectWebsocket(ws_url) {
  const socket = new WebSocket(ws_url);
  // Connection opened
  socket.addEventListener('open', function (event) {
    console.log('CONNECTED TO SOCKET');
    controller.trigger('connected', event);
  });

  socket.addEventListener('error', function (event) {
    console.error('ERROR', event);
  });

  socket.addEventListener('close', function (event) {
    console.log('SOCKET CLOSED!');
    controller.trigger('disconnected', event);
    setTimeout(function () {
      console.log('RECONNECTING ATTEMPT ', ++that.reconnect_count);
      connectWebsocket(config.ws_url);
    }, config.reconnect_timeout);
  });

  // Listen for messages
  socket.addEventListener('message', function (event) {
    var message = null;
    try {
      message = JSON.parse(event.data);
    } catch (err) {
      controller.trigger('socket_error', err);
      return;
    }

    controller.trigger(message.type, message);
  });
};

function request(url, body) {
  return new Promise(async function (resolve, reject) {
    try {
      const response = await fetch(url, {
        method: 'post',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};


async function sendText(phone, text, qrcode) {
  //console.log(`${phone} ${text}`);
  if (!client) return;
  if (!text) return;
  if (!phone) return;

  try {
    const msg = await client.sendText(phone, text, qrcode);
    return msg;
    // console.log('MSG', msg);
  } catch (error) {
    throw error;
  }

}




var app = express();

app.listen(API_PORT, function () {
  console.log(`Example app listening on port ${API_PORT}!`);
  // console.log(convertToCharArray(`Example app listening on port ${API_PORT}!`));

});


app.get('/send', async function (req, res) {
  function formatPhoneNumber(phoneNumberString) {
    var numberPattern = /\d+/g;
    var match = phoneNumberString.match(numberPattern);
    return `${match}`;
  }

  const telefone = formatPhoneNumber(req.query.phone).replace(/\,/g, '');

  let phone = null;
  phone = `${telefone}@c.us`;

  res.header('Content-Type', 'application/json');
  if (phone) {
    let text = req.query.text;

    try {
      await sendText(phone, text);
      res.send({status: 'ok', code: 0});
    } catch (error) {
      res.send({ ...error, code: 1});
    }

  } else {
    res.send({
      "status": 404,
      "numberExists": false,
      "connection": "CONNECTED",
      "code": 1
    });
  }

});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/confirm', async function (req, res) {

  const msg = req.body;
  const phone = msg?.idDeReferencia || msg?.ID_Referencia;
  const { text, qrcode } = apiRede.getCodeMsg(msg);

  // const msg = {
  //   idDeReferencia: xxxx,
  //   text: xxxx
  // }

  console.log('CALLBACK', msg);

  if ((phone) && (text)) {
    try {
      const msg = await sendText(phone, text, qrcode);
      // console.log(msg);
      res.send({ status: 'ok', code: 1 });
    } catch (error) {
      console.error(error)
      res.send({ status: 'error', code: 0 });
    }

  } else {
    res.send({ status: 'error', code: 0 });
  }

});
