const Store = require('../utils/store');
const fetch = require('node-fetch');


module.exports = class Quotation {

  constructor () {
  }

  getQuote() {
    return new Promise(async (resolve) => {

      const resposta = [];
      const response = await fetch('https://api.agrify.com.br/api/cotacoes');
      const data = await response.json();

      for (const key in data) {
        const quote = data[key];
        resposta.push(await this.getQuoteText(quote));
      }
      //console.log(data);

      resolve(resposta);

      // fetch(`https://api.agrify.com.br/api/cotacoes`)
      //   .then(function(response) {
      //     return response.json();
      //   })
      //   .then(function(resposta) {
      //     return resposta;
      //   });

    })

  }

  getQuoteText(quote) {
    let resposta = `${quote?.titulo} (${quote?.dataCotacao}) (${quote?.fonte})`;

    for (const key in quote?.data) {
      const cota = quote?.data[key];
      resposta = `${resposta}\n${cota?.titulo}: R$${cota?.valor},00`
    }

    //resposta.concat(`${quote?.titulo} (${quote?.dataCotacao}) (${quote?.fonte})\n`)

    return resposta;
  }


}