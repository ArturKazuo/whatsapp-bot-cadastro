module.exports = {
  apps : [
      {
        name: "Pharmakos",
        script: "./Pharmakos.js",
        //watch: true,
        env: {
          "PORT": 3001,
		  "APIPORT": 60009,
		  "APINAME" : 'Pharmakos',
        }
      }
  ]
}