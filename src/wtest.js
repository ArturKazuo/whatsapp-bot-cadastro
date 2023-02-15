const fetch = require('node-fetch');


async function apiLogin() {
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

      return {
        solID,
        token
      }
    } catch (error) {
      console.error(error);
    }
  }

apiLogin().then((retorno) => {
    console.log(retorno)
})
