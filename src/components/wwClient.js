const { Client, LocalAuth, Buttons, List, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QR = require('qrcode');

module.exports = class Bot {

  /**
   * Defino seu construtor recebendo o client do WhatsApp 
   * para que eu possa responder as mensagems por aqui.
   */
  constructor(SESSION_NAME, receiveMessage) {
    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: SESSION_NAME })
    })

    this.client.on('qr', qr => {
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      console.log(`${SESSION_NAME} WhatsApp client is ready!`);
    });

    this.client.on('authenticated', () => {
      console.log('AUTHENTICATED');
    });

    this.client.on('auth_failure', msg => {
      // Fired if session restore was unsuccessful
      console.error('AUTHENTICATION FAILURE', msg);
    });

    this.client.on('message_create', (msg) => {
      // Fired on all message creations, including your own
      if (msg.fromMe) {
        // do stuff here
      }
    });

    this.client.on('message_revoke_everyone', async (after, before) => {
      // Fired whenever a message is deleted by anyone (including you)
      console.log(after); // message after it was deleted.
      if (before) {
        console.log(before); // message before it was deleted.
      }
    });

    this.client.on('message_revoke_me', async (msg) => {
      // Fired whenever a message is only deleted in your own view.
      console.log(msg.body); // message before it was deleted.
    });

    this.client.on('message_ack', (msg, ack) => {
      /*
          == ACK VALUES ==
          ACK_ERROR: -1
          ACK_PENDING: 0
          ACK_SERVER: 1
          ACK_DEVICE: 2
          ACK_READ: 3
          ACK_PLAYED: 4
      */

      if (ack == 3) {
        // The message was read
      }
    });

    this.client.on('group_join', (notification) => {
      // User has joined or been added to the group.
      console.log('join', notification);
      notification.reply('User joined.');
    });

    this.client.on('group_leave', (notification) => {
      // User has left or been kicked from the group.
      console.log('leave', notification);
      notification.reply('User left.');
    });

    this.client.on('group_update', (notification) => {
      // Group picture, subject or description has been updated.
      console.log('update', notification);
    });

    this.client.on('change_state', state => {
      console.log('CHANGE STATE', state);
    });

    this.client.on('disconnected', (reason) => {
      console.log(`${SESSION_NAME} WhatsApp client was logged out`, reason);
    });

    this.client.on('message', (msg) => {
      try {
        const contact = msg?._data?.from;
        const channelData = {
          data: {
            pushname: msg?._data?.notifyName,
            contact: contact
          }
        }

        if (msg.body === '!buttons') {
          let button = new Buttons('Button body', [{ body: 'bt1' }, { body: 'bt2' }, { body: 'bt3' }], 'title', 'footer');
          this.client.sendMessage(msg.from, button);
        } else if (msg.body === '!list') {
          let sections = [{ title: 'sectionTitle', rows: [{ title: 'ListItem1', description: 'desc' }, { title: 'ListItem2' }] }];
          let list = new List('List body', 'btnText', sections, 'Title', 'footer');
          this.client.sendMessage(msg.from, list);
        }

        // console.log(msg);
        receiveMessage(msg.body, contact, channelData);
        //bot.parseMessage(message, contact)
      } catch (error) {
        process.exit(1);
      }
    });

    this.client.initialize();
  }

  async sendText(phone, text, qrcode) {
    //console.log(`${phone} ${text}`);
    if (!this.client) return;
    if (!text) return;
    if (!phone) return;

    try {

      if (qrcode) {
        const msg = await this.sendQrCode(phone, text, qrcode);
        return msg;
      } else {
        const msg = await this.client.sendMessage(phone, text);
        return msg;
      }
      // console.log('MSG', msg);
    } catch (error) {
      throw new Error(error)
    }

  }

  async sendQrCode(phone, text, qrcode) {

    if (!this.client) return;
    if (!text) return;
    if (!phone) return;

    try {
      var imgData = await QR.toDataURL(qrcode);
      // console.log(imgData)
      const msg = await this.sendMedia(phone, text, imgData.replace('data:image/png;base64,',''));
      return msg;
      // console.log('MSG', msg);
    } catch (error) {
      throw new Error(error)
    }

  }

  async sendMedia(phone, text, b64data) {
    //console.log(`${phone} ${text}`);
    if (!this.client) return;
    if (!text) return;
    if (!phone) return;

    try {
      // const b64data  = FS.readFileSync(DOCS_PATH+"/"+send_from_file, {encoding: 'base64'});
      // const filename = PATH.basename(DOCS_PATH+"/"+send_from_file);
      const mimetype = 'image/png'; //MIME.getType(DOCS_PATH+"/"+send_from_file); 
      const send_media =  new MessageMedia(mimetype, b64data);
      const msg = await this.client.sendMessage(phone, send_media, {"caption": text});
      return msg;
      // console.log('MSG', msg);
    } catch (error) {
      throw new Error(error)
    }

  }

  // async sendText(phone, text) {
  //   //console.log(`${phone} ${text}`);
  //   if (!this.client) return;

  //   try {
  //     // await this.client.sendMessage(phone, text);
  //     await this.client.sendText(phone, text);
  //   } catch (error) {
  //    // throw new Error(error)
  //   }

  // }

}