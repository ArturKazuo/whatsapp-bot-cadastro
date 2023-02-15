const fetch = require('node-fetch');
var moment = require('moment'); // require



function postLocker(user, lockerID) {
  return new Promise(async (resolve, reject) => {

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
    const solID = data.ID_do_Solicitante;
    const token = "Bearer " + data.token;

    const headers = { 'Content-Type': 'application/json', Accept: '*/*', 'Authorization': token };
    
    const ms05 = {
      "Codigo_de_MSG": "MS05",
      "ID_de_Referencia": user,
      "ID_do_Solicitante": solID,
      "ID_Rede_Lockers": 1,
      "Data_Hora_Solicitacao": moment().format("YYYY-MM-DD HH:MM:SS"),
      "ID_da_Estacao_do_Locker": lockerID,
      "Tipo_de_Serviço_Reserva": 2,
      "ID_PSL_Designado": 1,
      "Autenticacao_Login_Operador_Logistico": 0,
      "Categoria_Porta": "SRTM",
      "Geracao_de_QRCODE_na_Resposta_MS06": 1,
      "Geracao_de_Codigo_de_Abertura_de_Porta_na_Resposta_MS06": 1,
      "URL_CALL_BACK": "http://ec2-34-238-49-214.compute-1.amazonaws.com:60010/confirm",
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
    

    const responseMS5 = await fetch('http://apimensageriaprod.rede1minuto.com.br/msg/v01/lockers/reservation', {
      method: 'POST',
      body: JSON.stringify(ms05),
      headers: headers
    });

    const dataMS5 = await responseMS5.json();

    resolve(dataMS5);

    console.log(JSON.stringify(dataMS5))

  })

}

postLocker('553198040904@c.us', '645d57ae-32a8-11ec-8d39-5cc9d363c015');


function getCodeMsg(msg) {
 const cdResposta = msg?.cdResposta;
 if (!cdResposta) return null;

 const codeArray = cdResposta.split(' ');
 const code = codeArray[0];
 if (!code) return null;

  const dict = {
    WH4001 :	"Reserva efetivada	Reserva confirmada, você pode utilizar o armário por duas horas",
    WH4002 :	"Cancelamento Reserva",
    WH4003 :	"Prorrogação Reserva",	
    WH4023 :	"Entrega Encomenda no Locker",	
    WH4024 :	"A partir de agora você pode deixar seus pertences guardados por duas horas.",
    WH4025 :	"Retirada Shopper  Muito obrigado por utilizar nossos Serviços",
    WH4026 :	"Cancelamento com Encomenda no Locker",
    WH4032 :	"Coleta de encomenda não retirada SLA pelo Shopper",	
    WH4040 :	"Encomenda devolvida - Tempo Excedido"
  }

  return dict[`${code}`];
}


console.log(moment().format("YYYY-MM-DD HH:MM:SS"))

const ddd = {
  "idDeReferencia":"421748559",
  "idTransacaoUnica":"f07321fe-ebec-11ec-bb4e-0242ac110002",
  "dataHoraRegistro":"2022-06-21 16:58:34",
  "idRede":1,
  "cdMsg":"WH004",
  "cdResposta":"WH4032 - Coleta de encomenda não retirada SLA pelo Shopper",
  "geracaoCodigoAberturaPorta":"192551383772",
  "geracaoQrCode":"192551383772"
};

console.log(getCodeMsg(ddd));