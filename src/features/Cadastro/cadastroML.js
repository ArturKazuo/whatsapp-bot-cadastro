/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const { Botkit, BotkitConversation } = require('botkit');
// const say = require('../../utils/say');
// const sayQrcode = require('../../utils/sayQrcode');
const RedeAPI = require('../../components/apiRede1Minuto');
const apiRede = new RedeAPI();

module.exports = function (controller) {

    /***********************************************************************************************************


    Sessão de Cadastro

    Novo Hears


    ************************************************************************************************************/

    controller.hears([new RegExp(/gostaria de me cadastrar$/i), 
                    new RegExp(/Gostaria de cadastrar no locker (\S+)$/i),], 'message,direct_message', async (bot, message) => {

        function say(text) {
            return {
                text: text,
                channelData: {
                    ...message?.incoming_message?.channelData,
                    text: text
                }
            }
        }

        let mensagemFull = message.matches[0];
        let lockerID = message.matches[1];
        let lockerName = message.matches[1];
        let MY_DIALOG_ID = `${message?.user}${'Cadastro'}` || 'my-dialog-name-robot';
        let convo = new BotkitConversation(MY_DIALOG_ID, controller);

        convo.before('default', (convo, bot) => {
            // console.log('Default', lockerID, lockerName);
            convo.setVar(`name`, message?.channelData?.data?.pushname);
            // convo.setVar(`lockerID`, lockerID);
            // convo.setVar(`lockerName`, lockerName);
            // convo.setVar(`countSize`, 0);
        });

        //console.log(bot._config.context._activity)
        convo.say(say(`Bem-vindo(a) {{vars.name}}, sou o atendente da Meu Locker e estou disponível para realizar o seu cadastro no sistema da empresa.`, message));
        // convo.addAction('step2', 'step1');

        convo.addAction('stepCelularQuestion');
        var cel = bot._config.activity.channelData.user;
        var newCel = '';
        for(let i = 0; i < cel.length - 5; i++){
            if(i == 4){
                newCel += 9 + cel.charAt(i)
            }
            else{
                newCel += cel.charAt(i)
            }
        }
        convo.addQuestion(say(`O cadastro será feito com o número ${addSimbolos(newCel)}?`), [
            {
                pattern: "sim|Sim|ss|SS|Ss",
                handler: async (response, convo, bot) => {
                    console.log(response)
                    convo.step.state.values.celular = addSimbolos(newCel)
                    await convo.gotoThread('stepNome');
                }
            },
            {
                pattern: "não|Não|nn|NN|Nn|nao|Nao",
                handler: async (response, convo, bot) => {
                    console.log(response)
                    await convo.gotoThread('stepCelular');
                }
            },
            {
                pattern: "cancelar|cancele|pare|para|Cancelar|Cancele|Cancel|cancel|Pare|Para|Cancela|cancela",
                handler: async (response, convo, bot) => {
                    console.log(response)
                    convo.step.state.values.endConvo = true
                    console.log(convo.step.state.values)
                    await convo.gotoThread('end_convo')
                }
            },
            {
                default: true,
                handler: async (response, convo, bot) => {
                    console.log(response)
                    await convo.gotoThread('celQuestion_err')
                }
            }
        ], 'celularQuestion', 'stepCelularQuestion');

        convo.addMessage(say('Não entendi sua resposta, repita por favor', message), 'celQuestion_err')
        convo.addAction('stepCelularQuestion', 'celQuestion_err')

        //convo.addAction('stepCelular', 'stepCelularQuestion');
        convo.addQuestion(say('Qual é o DDD e telefone a ser cadastrado?'), [
            {
                pattern: "cancelar|cancele|pare|para|Cancelar|Cancele|Cancel|cancel|Pare|Para|Cancela|cancela",
                handler: async (response, convo, bot) => {
                    console.log(response)
                    convo.step.state.values.endConvo = true
                    console.log(convo.step.state.values)
                    await convo.gotoThread('end_convo')
                }
            },
            {
                default: true,
                handler: async (response, convo, bot) => {
                    console.log(response)
                    if(response.length > 13 || response.length < 11 ){
                        await convo.gotoThread('tel_err');
                    }
                    else{
                        convo.step.state.values.celular = addSimbolos(removeSimbolos(response))
                        if(response.charAt(0) != '5' && response.charAt(1) != '5'){
                            convo.step.state.values.celular = addSimbolos(removeSimbolos("55" + response))
                        }   
                        await convo.gotoThread('stepNomeOther');
                    }
                }
            }
        ], 'celular', 'stepCelular');

        //convo.addAction('stepNomeOther');
        convo.addQuestion(say('Qual é o nome completo da pessoa que deseja cadastrar?'), [
            {
                pattern: "cancelar|cancele|pare|para|Cancelar|Cancele|Cancel|cancel|Pare|Para|Cancela|cancela",
                handler: async (response, convo, bot) => {
                    console.log(response)
                    convo.step.state.values.endConvo = true
                    console.log(convo.step.state.values)
                    await convo.gotoThread('end_convo')
                }
            },
            {
                default: true,
                handler: async (response, convo, bot) => {
                    console.log(response)
                    if(checkNome(response)){ //returns true or false
                        await convo.gotoThread('stepAptoOther')
                    }
                    else{
                        await convo.gotoThread('err_Nome')
                    }
                }
            }
        ], 'nome', 'stepNomeOther');

        //convo.addAction('stepNome');
        convo.addQuestion(say('Qual é o seu nome completo?'), [
            {
                pattern: "cancelar|cancele|pare|para|Cancelar|Cancele|Cancel|cancel|Pare|Para|Cancela|cancela",
                handler: async (response, convo, bot) => {
                    console.log(response)
                    convo.step.state.values.endConvo = true
                    console.log(convo.step.state.values)
                    await convo.gotoThread('end_convo')
                }
            },
            {
                default: true,
                handler: async (response, convo, bot) => {
                    console.log(response)
                    if(checkNome(response)){ //returns true or false
                        await convo.gotoThread('stepApto')
                    }
                    else{
                        await convo.gotoThread('err_Nome')
                    }
                }
            }
        ], 'nome', 'stepNome');

        //convo.addAction('stepApto', 'stepCelular');
        convo.addQuestion(say('Qual é o seu apartamento?'), [
            {
                pattern: "cancelar|cancele|pare|para|Cancelar|Cancele|Cancel|cancel|Pare|Para|Cancela|cancela",
                handler: async (response, convo, bot) => {
                    console.log(response)
                    convo.step.state.values.endConvo = true
                    console.log(convo.step.state.values)
                    await convo.gotoThread('end_convo')
                }
            },
            {
                default: true,
                handler: async (response, convo, bot) => {
                    console.log(`apto is ${response}`);
                }
            }
        ], 'apartamento', 'stepApto');

        convo.addAction('confirmation', 'stepApto');

        convo.addQuestion(say('Qual é o apartamento da pessoa que deseja cadastrar?'), [
            {
                pattern: "cancelar|cancele|pare|para|Cancelar|Cancele|Cancel|cancel|Pare|Para|Cancela|cancela",
                handler: async (response, convo, bot) => {
                    console.log(response)
                    convo.step.state.values.endConvo = true
                    console.log(convo.step.state.values)
                    await convo.gotoThread('end_convo')
                }
            },
            {
                default: true,
                handler: async (response, convo, bot) => {
                    console.log(`apto is ${response}`);
                }
            }
        ], 'apartamento', 'stepAptoOther');


        convo.addAction('confirmation', 'stepAptoOther');
        convo.addQuestion(say('*Confirmando seus dados:*\n\nNome: {{vars.nome}}\nCelular: ' + '{{vars.celular}}' + '\nApartamento: {{vars.apartamento}}\n\nTodas informações estão corretas?'), [
            {
                pattern: "nao|Nao|Não|não|nn|Nn|NN",
                handler: async (response, convo, bot) => {
                    console.log('não')
                    await convo.gotoThread('stepCelularQuestion');
                }
            },
            {
                pattern: "sim|Sim|ss|Ss|SS",
                handler: async (response, convo, bot) => {
                    convo.step.state.values.celular = removeSimbolos(convo.step.state.values.celular)
                    console.log('sim')
                    await convo.gotoThread('agradecimento');
                }
            },
            {
                pattern: "cancelar|cancele|pare|para|Cancelar|Cancele|Cancel|cancel|Pare|Para|Cancela|cancela",
                handler: async (response, convo, bot) => {
                    console.log(response)
                    convo.step.state.values.endConvo = true
                    console.log(convo.step.state.values)
                    await convo.gotoThread('end_convo')
                }
            },
            {
                default: true,
                handler: async (response, convo, bot) => {
                    console.log('default')
                    await convo.gotoThread('default_message')
                }
            }
        ], 'confirm', 'confirmation');

        convo.addMessage(say('Nome inválido. Retire todo e qualquer número e caractere especial, se houver'), 'err_Nome')
        convo.addAction('stepNome', 'err_Nome')

        convo.addMessage(say('Número de telefone inválido. Tente retirar os espaços e símbolos, caso tenha colocado.'), 'tel_err')
        convo.addAction('stepCelular', 'tel_err')
        
        convo.addMessage(say('Não entendi sua resposta, repita por favor', message), 'default_message');
        convo.addAction('confirmation', 'default_message');

        convo.addMessage(say('Cadastro cancelado.'), 'end_convo')
        convo.addAction('end_convo_without_results', 'end_convo')

        convo.addMessage(say('Obrigado! Recebemos seus dados com sucesso! \nAguarde 24 horas para atualizarmos seu locker com suas informações.', message), 'agradecimento');

        controller.addDialog(convo);
        convo.addAction('end_convo_without_results')

        controller.afterDialog(MY_DIALOG_ID, async (bot, results) => {
            await bot.cancelAllDialogs();

            if(!results.endConvo){
                //recebe os resultados de todos os campos preenchidos para enviar para a api
            }

            console.log('RESULTS', results);
        });



        await bot.beginDialog(MY_DIALOG_ID);
    });

    /****************************************************************************************************************


    Sessão de Suporte

    Novo Hears


    *****************************************************************************************************************/

    controller.hears([new RegExp(/gostaria de suporte$/i), 
                    new RegExp(/suporte$/i), 
                    new RegExp(/preciso de suporte$/i), 
                    new RegExp(/quero suporte$/i), 
                    new RegExp(/quero ajuda$/i), 
                    new RegExp(/ajuda$/i), 
                    new RegExp(/preciso de ajuda$/i)], 'message,direct_message', async (bot, message) => {

        function say(text) {
            return {
                text: text,
                channelData: {
                    ...message?.incoming_message?.channelData,
                    text: text
                }
            }
        }

        let mensagemFull = message.matches[0];
        let lockerID = message.matches[1];
        let lockerName = message.matches[1];
        let MY_DIALOG_ID = `${message?.user}${'Cadastro'}` || 'my-dialog-name-robot';
        let convo = new BotkitConversation(MY_DIALOG_ID, controller);

        convo.before('default', (convo, bot) => {
            // console.log('Default', lockerID, lockerName);
            convo.setVar(`name`, message?.channelData?.data?.pushname);
            // convo.setVar(`lockerID`, lockerID);
            // convo.setVar(`lockerName`, lockerName);
            // convo.setVar(`countSize`, 0);
        });

        //fazer checagem se número da pessoa está ou não cadastrado na empresa, por meio da api

        //nome = api.response

        convo.addMessage(say(`Bem-vindo(a) {{vars.name}}, sou o atendente da Meu Locker e estou disponível para solucionar seus problemas e dúvidas.`), 'notLoggedDB');

        convo.addMessage(say(`Bem-vindo(a) ${nome}, sou o atendente da Meu Locker e estou disponível para solucionar seus problemas e dúvidas.`), 'loggedDB');

        convo.addAction('stepAskProblem');
        convo.addQuestion(say(`Qual é o problema que está tendo?`), [
            {
                pattern: "",
                handler: async (response, convo, bot) => {
                    console.log(response)
                    await convo.gotoThread('stepNome');
                }
            },
            {
                pattern: "",
                handler: async (response, convo, bot) => {
                    console.log(response)
                    await convo.gotoThread('stepCelular');
                }
            },
            {
                pattern: "cancelar|cancele|pare|para|Cancelar|Cancele|Cancel|cancel|Pare|Para|Cancela|cancela",
                handler: async (response, convo, bot) => {
                    console.log(response)
                    convo.step.state.values.endConvo = true
                    console.log(convo.step.state.values)
                    await convo.gotoThread('end_convo')
                }
            },
            {
                default: true,
                handler: async (response, convo, bot) => {
                    console.log(response)
                    await convo.gotoThread('suporteQuestion_err');
                }
            }
        ], 'suporteQuestion', 'stepAskProblem');

        convo.addMessage(say('Não entendi sua resposta, repita por favor', message), 'suporteQuestion_err')
        convo.addAction('stepCelularQuestion', 'suporteQuestion_err')

        convo.addMessage(say('Cadastro cancelado.'), 'end_convo')
        convo.addAction('end_convo_without_results', 'end_convo')

        controller.addDialog(convo);

        convo.addAction('end_convo_without_results')

        controller.afterDialog(MY_DIALOG_ID, async (bot, results) => {
            await bot.cancelAllDialogs();

            //recebe os resultados de todos os campos preenchidos para enviar para a api

            console.log('RESULTS', results);
        });



        await bot.beginDialog(MY_DIALOG_ID);
    });


}

function addSimbolos(num){
    let newNum = '';
    num = '+' + num 
    for(let i=0; i<num.length; i++){
        if(i == 3){
            newNum += ' (' + num.charAt(i);
            i++
            newNum += num.charAt(i) + ') '
        }
        else{
            if(i == 10){
                newNum += '-' + num.charAt(i)
            }
            else{
                newNum += num.charAt(i)
            }
        }
    }

    return newNum
}

function removeSimbolos(num){
    let newNum = '';
    for(let i=0; i<num.length; i++){
        if(num.charAt(i) == '+' || num.charAt(i) == ' ' || num.charAt(i) == '(' || num.charAt(i) == ')' || num.charAt(i) == '-'){
        }
        else{
            newNum += num.charAt(i)
        }
    }

    return newNum
}

function checkNome(nome){
    let bool = true
    for(let i=0; i<nome.length; i++){
        console.log(nome.charAt(i))
        if(nome.charAt(i) < 65 || (nome.charAt(i) > 90 && nome.charAt(i) < 97) || nome.charAt(i).charCodeAt(0) > 122){
            if(nome.charAt(i) == ' '){
                bool = true
            }   
            else if(nome.charAt(i).charCodeAt(0) > 122){
                bool = false
                break;
            }
            else{
                bool = false
                break;
            }
        }
        console.log(nome.charAt(i).charCodeAt(0))
    }

    return bool
}