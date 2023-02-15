
module.exports = class Bot {

  /**
   * Defino seu construtor recebendo o client do WhatsApp 
   * para que eu possa responder as mensagems por aqui.
   */
  constructor (client) {
    this.client = client
    this.contact = '5531984024474@c.us'
  }

  async sendText(phone, text) {
    //console.log(`${phone} ${text}`);
    if (!this.client) return;

    try {
      // await this.client.sendMessage(phone, text);
      await this.client.sendText(phone, text);
    } catch (error) {
     // throw new Error(error)
    }
  }
  
  async sendTextNew(phone, text) {
    console.log(`${phone} ${text}`);
    if (!text) return;
    if (!phone) return;

    try {
      const chat = await this.client.checkNumberStatus(phone)
      .then(async (result) => {
          console.log('Result: ', result); //return object success
          const msg = await this.client.sendText(phone, text);
          return msg;
      }).catch((erro) => {
           console.error('Error when sending: ', erro); //return object error
		   //throw new Error(erro)
		   throw erro;
      });
      // console.log('MSG', msg);
    } catch (error) {
      //throw new Error(error)
	  throw error;
    }

  }

}