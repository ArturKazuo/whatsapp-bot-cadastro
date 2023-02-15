//const { Client, Location } = require('whatsapp-web.js');
//  __   __  ___        ___
// |__) /  \  |  |__/ |  |  
// |__) \__/  |  |  \ |  |  

// This is the main file for the Agrify bot.

const { Botkit } = require('botkit');
const { WebAdapter } = require('botbuilder-adapter-web');
const { MongoDbStorage } = require('botbuilder-storage-mongodb');
const Bot = require('./components/Bot');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const venom = require('venom-bot');
const fetch = require('node-fetch');
let bot = null;




const SESSION_NAME = 'MeuLocker';
const API_PORT = 60008;
const SESSION_FILE_PATH = './session.json';



let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
  //    sessionCfg = require(SESSION_FILE_PATH);
  sessionCfg = JSON.parse(fs.readFileSync(SESSION_FILE_PATH, 'utf-8'))
}

// Load process.env values from .env file
require('dotenv').config();

const use_sockets = false;
const config = {
  ws_url: 'ws://localhost', //(location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.host,
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


const adapter = new WebAdapter({});


const controller = new Botkit({
  webhook_uri: '/api/messages',
  adapter: adapter,
  storage
});

controller.ready(() => {

  controller.loadModules(__dirname + `/features/${SESSION_NAME}`);

  // Log every message received
  controller.middleware.receive.use(function (bot, message, next) {
    //console.log('RECEIVED: ', message);
    next();
  });

  // Log every message sent
  controller.middleware.send.use(async function (bot, message, next) {
    //console.log('SENT: ', message);
    await sendText(message.channelData?.user, message.text);
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


function receiveMessage(text, contact) {

  if (!text) {
    return;
  }

  const message = {
    type: 'message',
    text: text,
    user: contact.id,
    channel: use_sockets ? 'websocket' : 'webhook',
    channelData: {
      data: contact
    }
  }

  deliverMessage(message);

  controller.trigger('sent', message);

  return false;
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

  //console.log('WEBHOOK MESSAGE', message);

  request('http://localhost:3000/api/messages', message).then(function (messages) {
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

  socket = new WebSocket(ws_url);

  // Connection opened
  socket.addEventListener('open', function (event) {
    console.log('CONNECTED TO SOCKET');
    controller.trigger('connected', event);
    // deliverMessage({
    //     type: connectEvent,
    //     user: that.guid,
    //     channel: 'socket',
    //     user_profile: that.current_user ? that.current_user : null,
    // });
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

    // if (that.reconnect_count < config.max_reconnect) {
    //     setTimeout(function () {
    //         console.log('RECONNECTING ATTEMPT ', ++that.reconnect_count);
    //         that.connectWebsocket(that.config.ws_url);
    //     }, that.config.reconnect_timeout);
    // } else {
    //     that.message_window.className = 'offline';
    // }
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

    // console.log(body);
    // console.log(url);

    try {

      const response = await fetch(url, {
        method: 'post',
        body: JSON.stringify(body),
        headers: {'Content-Type': 'application/json'}
      });

      //console.log('RESPONSE:', response.status);
  
      const data = await response.json();

      resolve(data);

      
    } catch (error) {
      reject(error);
    }


    // var xmlhttp = new XMLHttpRequest();

    // xmlhttp.onreadystatechange = function () {
    //   if (xmlhttp.readyState == XMLHttpRequest.DONE) {
    //     if (xmlhttp.status == 200) {
    //       var response = xmlhttp.responseText;
    //       if (response != '') {
    //         var message = null;
    //         try {
    //           message = JSON.parse(response);
    //         } catch (err) {
    //           reject(err);
    //           return;
    //         }
    //         resolve(message);
    //       } else {
    //         resolve([]);
    //       }
    //     } else {
    //       reject(new Error('status_' + xmlhttp.status));
    //     }
    //   }
    // };

    // xmlhttp.open("POST", url, true);
    // xmlhttp.setRequestHeader("Content-Type", "application/json");
    // xmlhttp.send(JSON.stringify(body));
  });

};










function start(client) {
  bot = new Bot(client);

  client.onMessage((message) => {

    try {
      const contact = message?.sender;
      console.log(message);
      receiveMessage(message.body, contact);
      //bot.parseMessage(message, contact)
    } catch (error) {
      process.exit(1);
    }


    // if (message.body === 'Hi' && message.isGroupMsg === false) {
    //   client
    //     .sendText(message.from, 'Welcome Venom 🕷')
    //     .then((result) => {
    //       //console.log('Result: ', result); //return object success
    //     })
    //     .catch((erro) => {
    //       //console.error('Error when sending: ', erro); //return object error
    //     });
    // }
  });

  // function to detect conflits and change status
  // Force it to keep the current session
  // Possible state values:
  // CONFLICT
  // CONNECTED
  // DEPRECATED_VERSION
  // OPENING
  // PAIRING
  // PROXYBLOCK
  // SMB_TOS_BLOCK
  // TIMEOUT
  // TOS_BLOCK
  // UNLAUNCHED
  // UNPAIRED
  // UNPAIRED_IDLE
  client.onStateChange(async (state) => {
    console.log('State changed: ', state);
    // force whatsapp take over
    if ('CONFLICT'.includes(state)) client.useHere();
    // detect disconnect on whatsapp
    if ('UNPAIRED'.includes(state)) console.log('logout');

    if ('CONNECTED'.includes(state)) {
      const session = await client.getSessionTokenBrowser();
      console.log('AUTHENTICATED', session);
      sessionCfg = session;
      fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) {
          console.error(err);
          //process.exit(1);
        }
      });

    }
  });

  // DISCONNECTED
  // SYNCING
  // RESUMING
  // CONNECTED
  let time = 0;
  client.onStreamChange((state) => {
    console.log('State Connection Stream: ' + state);
    clearTimeout(time);
    if (state === 'DISCONNECTED' || state === 'SYNCING') {
      time = setTimeout(() => {
        client.close();
      }, 80000);
    }
  });

  // function to detect incoming call
  client.onIncomingCall(async (call) => {
    console.log(call);
    client.sendText(call.peerJid, "Desculpe, ainda nao atendemos ligacoes pelo Whatsapp.");
  });

}

async function sendText(phone, text) {
  //console.log(`${phone} ${text}`);
  if (!bot) return;
  if (!text) return;
  if (!phone) return;

  try {
    await bot.sendText(phone, text);
  } catch (error) {
    // throw new Error(error)
  }
}

venom
  .create(
    //session
    SESSION_NAME, //Pass the name of the client you want to start the bot
    //catchQR
    (base64Qrimg, asciiQR, attempts, urlCode) => {
      console.log('Number of attempts to read the qrcode: ', attempts);
      //console.log('Terminal qrcode: ', asciiQR);
      //console.log('base64 image string qrcode: ', base64Qrimg);
      //console.log(base64Qrimg);
      //console.log('urlCode (data-ref): ', urlCode);
    },
    // statusFind
    (statusSession, session) => {
      console.log('Status Session: ', statusSession); //return isLogged || notLogged || browserClose || qrReadSuccess || qrReadFail || autocloseCalled || desconnectedMobile || deleteToken || chatsAvailable || deviceNotConnected || serverWssNotConnected || noOpenBrowser
      //Create session wss return "serverClose" case server for close
      console.log('Session name: ', session);
    },
    // options
    {
      multidevice: true,
      folderNameToken: 'tokens', //folder name when saving tokens
      mkdirFolderToken: '', //folder directory tokens, just inside the venom folder, example:  { mkdirFolderToken: '/node_modules', } //will save the tokens folder in the node_modules directory
      headless: true, // Headless chrome
      devtools: false, // Open devtools by default
      //useChrome: true, // If false will use Chromium instance
      debug: false, // Opens a debug session
      logQR: true, // Logs QR automatically in terminal
      //browserWS: '', // If u want to use browserWSEndpoint
      //browserArgs: [''], //Original parameters  ---Parameters to be added into the chrome browser instance
      //puppeteerOptions: {}, // Will be passed to puppeteer.launch
      disableSpins: true, // Will disable Spinnies animation, useful for containers (docker) for a better log
      disableWelcome: true, // Will disable the welcoming message which appears in the beginning
      updatesLog: true, // Logs info updates automatically in terminal
      autoClose: 60000, // Automatically closes the venom-bot only when scanning the QR code (default 60 seconds, if you want to turn it off, assign 0 or false)
      createPathFileToken: false //creates a folder when inserting an object in the client's browser, to work it is necessary to pass the parameters in the function create browserSessionToken
    },
    // BrowserSessionToken
    // To receive the client's token use the function await clinet.getSessionTokenBrowser()
    {
      // WABrowserId: '"UnXjH....."',
      // WASecretBundle:
      //   '{"key":"+i/nRgWJ....","encKey":"kGdMR5t....","macKey":"+i/nRgW...."}',
      // WAToken1: '"0i8...."',
      // WAToken2: '"1@lPpzwC...."'
      ...sessionCfg
    },
    // BrowserInstance
    (browser, waPage) => {
      console.log('Browser PID:', browser.process().pid);
      //waPage.screenshot({ path: 'screenshot.png' });
    }
  )
  .then((client) => {
    start(client);
  })
  .catch((erro) => {
    console.log(erro);
  });






var express = require('express');
var app = express();
//app.set('port', 8000);
app.listen(API_PORT, function () {
  console.log(`Example app listening on port ${API_PORT}!`);
});

app.get('/send', function (req, res) {
  function formatPhoneNumber(phoneNumberString) {
    var numberPattern = /\d+/g;
    var match = phoneNumberString.match(numberPattern);
    return `${match}`;
  }

  const telefone = formatPhoneNumber(req.query.phone).replace(/\,/g, '');

  let phone = null;
  phone = `${telefone}@c.us`;

  /*if (telefone.length == 13) {
    const parte1 = telefone.substring(0, 4);
    const parte2 = telefone.substring(5, 13);
    phone = `${parte1}${parte2}@c.us`

  } else if (req.query.phone.length == 12) {
    phone = `${telefone}@c.us`;
  }*/

  if (phone) {
    let text = req.query.text;
    //bot.sendMessage(phone, text);
    try {
      sendText(phone, text);
    } catch (error) {

    }

  }

  res.send(`ok`);
});
