module.exports = {
  apps : [
      {
        name: "Rede1Minuto",
        script: "./rede1minuto.js",
        //watch: true,
        env: {
          "PORT": 3002,
          "APIPORT": 60010,
          "APINAME" : 'Rede1Minuto',
        }
      }
  ]
}