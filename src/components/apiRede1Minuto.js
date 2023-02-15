const fetch = require('node-fetch');
var moment = require('moment');

const apiURL = 'http://r1m.meulocker.com.br:60010';


module.exports = class RedeAPI {

  constructor() {
  }

  async apiLogin() {
    return new Promise(async (resolve, reject) => {
      try {

        const bodyLogin = {
          "username": "Pico",
          "email": "pico.mirandola@gmail.com",
          "password": "23-11-DellaM"
        };

        const response = await fetch('http://apimensageriaprod.rede1minuto.com.br/login', {
          method: 'POST',
          body: JSON.stringify(bodyLogin),
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        const solID = data?.ID_do_Solicitante;
        const token = "Bearer " + data?.token;

        resolve({
          solID,
          token
        })
      } catch (error) {
        // console.error(error);
        reject(error)
      }
    })
  }

  postLocker(user, lockerID, size) {
    return new Promise(async (resolve, reject) => {

      try {

        const { solID, token } = await this.apiLogin();

        const headers = { 'Content-Type': 'application/json', Accept: '*/*', 'Authorization': token };

        const ms05 = {
          "Codigo_de_MSG": "MS05",
          "ID_de_Referencia": user,
          "ID_do_Solicitante": solID,
          "ID_Rede_Lockers": 1,
          "Data_Hora_Solicitacao": moment().format("YYYY-MM-DD HH:mm:00"),
          "ID_da_Estacao_do_Locker": lockerID,
          "Tipo_de_Serviço_Reserva": 2,
          "ID_PSL_Designado": 1,
          "Autenticacao_Login_Operador_Logistico": 0,
          "Categoria_Porta": size,
          "Geracao_de_QRCODE_na_Resposta_MS06": 1,
          "Geracao_de_Codigo_de_Abertura_de_Porta_na_Resposta_MS06": 1,
          "URL_CALL_BACK": `${apiURL}/confirm`,
          "Versao_Mensageria": "1.0.0",
          "Info_Encomendas": [
            {
              "ID_Encomenda": 9999,
              "Numero_Mobile_Shopper": "9999999999",
              "Endereco_de_Email_do_Shopper": "email@teste.com.br",
              "Codigo_Barras_Conteudo_Encomenda": "TESTE9999",
              "Encomenda_Assegurada": "0",
              "Largura_Encomenda": "0",
              "Altura_Encomenda": "0",
              "Profundidade_Encomenda": "0"
            }
          ]
        }

        // console.log('API ms05', JSON.stringify(ms05));
        //console.log('HEADER ms05', JSON.stringify(headers));


        const responseMS5 = await fetch('http://apimensageriaprod.rede1minuto.com.br/msg/v01/lockers/reservation', {
          method: 'POST',
          body: JSON.stringify(ms05),
          headers: headers
        });

        const dataMS5 = await responseMS5.json();

        console.log(JSON.stringify(dataMS5));

        resolve(dataMS5);

      } catch (error) {
        reject(error)
      }

    })

  }


  cadastroEvento(user, lockerID, username) {
    return new Promise(async (resolve, reject) => {

      try {

        const { solID, token } = await this.apiLogin();

        const headers = { 'Content-Type': 'application/json', Accept: '*/*', 'Authorization': token };

        const ms03 = {
          "Codigo_de_MSG": "MS23",
          "ID_de_Referencia": user,
          "ID_do_Solicitante": solID,      
          "ID_Locker": lockerID,
          "UserName": username,
          "MobileNumber": user,
          "URL_CALL_BACK": `${apiURL}/confirm`,
        }
        console.log('API MS@#', JSON.stringify(ms03));
        //console.log('HEADER ms05', JSON.stringify(headers));


        const responseMS5 = await fetch('http://apimensageriaprod.rede1minuto.com.br/msg/v01/whatsapp', {
          method: 'POST',
          body: JSON.stringify(ms03),
          headers: headers
        });

        const dataMS5 = await responseMS5.json();

        console.log(JSON.stringify(dataMS5));

        resolve(dataMS5);

      } catch (error) {
        reject(error)
      }

    })

  }

  reservadoLocker(user, code) {
    return new Promise(async (resolve, reject) => {

      try {

        const { solID, token } = await this.apiLogin();

        const headers = { 'Content-Type': 'application/json', Accept: '*/*', 'Authorization': token };

        const ms25 = {
          "Codigo_de_MSG": "MS25",
          "ID_de_Referencia": user,
          "ID_do_Solicitante": solID,
          "ID_Rede_Lockers": 1,
          "CD_Deposito": code
        }

        console.log('API ms25', ms25);


        const responseMS5 = await fetch('http://apimensageriaprod.rede1minuto.com.br/msg/v01/lockers/reservationevent', {
          method: 'POST',
          body: JSON.stringify(ms25),
          headers: headers
        });
		
		console.log('responseMS5: ', JSON.stringify(responseMS5));

        const dataMS5 = await responseMS5.json();

        console.log('dataMS5: ', JSON.stringify(dataMS5));

        resolve(dataMS5);

      } catch (error) {
        reject(error)
      }

    })

  }

  getCodeMsg(msg) {
    const cdResposta = msg?.cdResposta || msg?.CD_Resposta || msg?.Codigo_Resposta_MS06;
    if (!cdResposta) return null;

    const codeArray = cdResposta.split(' ');
    const code = codeArray[0];
    if (!code) return null;

    const dict = {
      "WH4001": "Reserva efetivada	Reserva confirmada, você pode utilizar o armário por duas horas",
      "WH4002": "Cancelamento Reserva",
      "WH4003": "Prorrogação Reserva",
      "WH4023": "Entrega Encomenda no Locker",
      "WH4024": "A partir de agora você pode deixar seus pertences guardados por duas horas.",
      "WH4025": "Retirada Shopper  Muito obrigado por utilizar nossos Serviços",
      "WH4026": "Cancelamento com Encomenda no Locker",
      "WH4032": "Coleta de encomenda não retirada SLA pelo Shopper",
      "WH4040": "Encomenda devolvida - Tempo Excedido",
      "WH1001": "Porta já reservada",
      "M06010": "Não existe este código",
      "M06011": "Código já utilizado"
    }

    let resposta = dict[`${code}`];

    if (code == "WH4024") {
      resposta = `A partir de agora você pode deixar seus pertences guardados por duas horas. Para retirá-los utilize o código de abertura de porta ${msg.geracaoCodigoAberturaPorta}`
    }

    return {
      text: resposta,
      qrcode: msg.geracaoCodigoAberturaPorta
    };
  }

}