const venom = require('venom-bot');
const fs = require('fs');


module.exports = class Bot {

  /**
   * Defino seu construtor recebendo o client do WhatsApp 
   * para que eu possa responder as mensagems por aqui.
   */
  constructor(SESSION_NAME, receiveMessage) {

    const SESSION_FILE_PATH = `../sessions/session${SESSION_NAME}.json`;

    let sessionCfg;
    if (fs.existsSync(SESSION_FILE_PATH)) {
      //    sessionCfg = require(SESSION_FILE_PATH);
      sessionCfg = JSON.parse(fs.readFileSync(SESSION_FILE_PATH, 'utf-8'))
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
        this.start(client, receiveMessage);
        // return this.client;
      })
      .catch((erro) => {
        console.log(erro);
      });

    // this.contact = '5531984024474@c.us'
  }

  start(client, receiveMessage) {

    // console.log("Temos Client!")

    client.onMessage((message) => {
      try {
        console.log(JSON.stringify(message));
        const contact = message?.sender;
        receiveMessage(message.body, contact);
      } catch (error) {
        process.exit(1);
      }
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
          this.client.close();
        }, 80000);
      }
    });

    // function to detect incoming call
    client.onIncomingCall(async (call) => {
      console.log(call);
      this.client.sendText(call.peerJid, "Desculpe, ainda nao atendemos ligacoes pelo Whatsapp.");
    });

    this.client = client;

  }

  async sendText(phone, text, qrcode) {
    //console.log(`${phone} ${text}`);
    if (!this.client) return;
    if (!text) return;
    if (!phone) return;
    console.log(`${phone} ${text}`);

    try {
      const msg = await this.client.sendText(phone, text);
      return msg;
      // console.log('MSG', msg);
    } catch (error) {
      throw error;
    }

  }

}