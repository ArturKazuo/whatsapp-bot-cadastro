/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const { Botkit, BotkitConversation } = require('botkit');
const { BotkitCMSHelper } = require('botkit-plugin-cms');
// const say = require('../../utils/say');
// const sayQrcode = require('../../utils/sayQrcode');
const MeuLockerAPI = require('../../components/apiMeuLocker');
const apiML = new MeuLockerAPI();
const { BotkitCmsLocalPlugin } = require('botkit-plugin-cms');
let APICount = 0;

module.exports = function (controller) {

//     let cms = new BotkitCMSHelper({
//         uri: 'http://localhost:3001',
//         token: 'TOKENBOTKIT'
//     });

//    // use the cms to test remote triggers
//     controller.on('message', async(bot, message) => {
//         await controller.plugins.cms.testTrigger(bot, message);
//     });
    
    // controller.usePlugin(cms);

    // var cms = require('botkit-cms')();
    // cms.useLocalStudio(controller);

    // cms.loadScriptsFromFile(__dirname + '/scripts.json').catch(function(err) {
    //     console.error('Error loading scripts', err);
    // });

    /***********************************************************************************************************


    Sessão de Cadastro

    Novo Hears


    ************************************************************************************************************/

    controller.hears([new RegExp(/gostaria de me cadastrar (.*)/i), 
                    new RegExp(/gostaria de cadastrar no locker (\S+)/i)], 'message,direct_message', async (bot, message) => {

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

        let celCad = message?.user;
        var newCel = newCelF(celCad);

        let userApi = await apiML.getUser(newCel);
        //let condominiosAPI = await apiML.getCondominioByUser(newCel)
        let condominioAPI = await apiML.getCondominio(lockerID)

        convo.before('default', (convo, bot) => {
            // console.log('Default', lockerID, lockerName);
            convo.setVar(`name`, message?.channelData?.data?.pushname);
            // convo.setVar(`lockerID`, lockerID);
            // convo.setVar(`lockerName`, lockerName);
            // convo.setVar(`countSize`, 0);
        });



        // if(userApi){
        //     convo.say(say(`Bem-vindo(a) ${userApi.nome}, sou o atendente da Meu Locker e estou disponível para realizar o seu cadastro no sistema da empresa.`, message));
        //     convo.addAction('stop_bot_conversation')
        // }
        // else{
        //     convo.say(say(`Bem-vindo(a) {{vars.name}}, sou o atendente da Meu Locker e estou disponível para realizar o seu cadastro no sistema da empresa.`, message));
        //     convo.addAction('stop_bot_conversation')
        // }
        convo.say(say(`Bem-vindo(a) {{vars.name}}, sou o atendente da Meu Locker e estou disponível para realizar o seu cadastro no sistema da empresa.`, message));
        convo.addAction('stop_bot_conversation')

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
                        // if(condominioAPI.bloco){
                        //     await convo.gotoThread('stepBlocoOther')
                        // }
                        // else{
                        //     await convo.gotoThread('stepAptoOther')
                        // }
                        await convo.gotoThread('stepAptoOther')
                    }
                    else{
                        await convo.gotoThread('err_Nome')
                    }
                }
            }
        ], 'nome', 'stepNomeOther');

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
                        // if(condominioAPI.bloco){
                        //     console.log("bloco")
                        //     await convo.gotoThread('stepBloco')
                        // }
                        // else {
                        //     await convo.gotoThread('stepApto')
                        // }
                        await convo.gotoThread('stepApto')
                    }
                    else{
                        await convo.gotoThread('err_Nome')
                    }
                }
            }
        ], 'nome', 'stepNome');

        // convo.addQuestion(say('Qual é o seu bloco de condomínio?'), [
        //     {
        //         pattern: "cancelar|cancele|pare|para|Cancelar|Cancele|Cancel|cancel|Pare|Para|Cancela|cancela",
        //         handler: async (response, convo, bot) => {
        //             console.log(response)
        //             convo.step.state.values.endConvo = true
        //             console.log(convo.step.state.values)
        //             await convo.gotoThread('end_convo')
        //         }
        //     },
        //     {
        //         default: true,
        //         handler: async (response, convo, bot) => {
        //             if(condominioAPI.ala){
        //                 await convo.gotoThread('stepAla');
        //             }
        //             else{
        //                 await convo.gotoThread("stepApto")
        //             }
        //             console.log(`bloco is ${response}`);
        //         }
        //     }
        // ], 'bloco', 'stepBloco');

        // convo.addQuestion(say('Qual é a ala em que seu apartamento se encontra?'), [
        //     {
        //         pattern: "cancelar|cancele|pare|para|Cancelar|Cancele|Cancel|cancel|Pare|Para|Cancela|cancela",
        //         handler: async (response, convo, bot) => {
        //             console.log(response)
        //             convo.step.state.values.endConvo = true
        //             console.log(convo.step.state.values)
        //             await convo.gotoThread('end_convo')
        //         }
        //     },
        //     {
        //         default: true,
        //         handler: async (response, convo, bot) => {
        //             await convo.gotoThread("stepApto")
        //             console.log(`ala is ${response}`);
        //         }
        //     }
        // ], 'ala', 'stepAla');

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

        // convo.addQuestion(say('Qual é o bloco do condomínio da pessoa que deseja cadastrar?'), [
        //     {
        //         pattern: "cancelar|cancele|pare|para|Cancelar|Cancele|Cancel|cancel|Pare|Para|Cancela|cancela",
        //         handler: async (response, convo, bot) => {
        //             console.log(response)
        //             convo.step.state.values.endConvo = true
        //             console.log(convo.step.state.values)
        //             await convo.gotoThread('end_convo')
        //         }
        //     },
        //     {
        //         default: true,
        //         handler: async (response, convo, bot) => {
        //             if(condominioAPI.ala){
        //                 await convo.gotoThread('stepAlaOther');
        //             }
        //             else{
        //                 await convo.gotoThread("stepAptoOther")
        //             }
        //             console.log(`bloco is ${response}`);
        //         }
        //     }
        // ], 'bloco', 'stepBlocoOther');

        // convo.addQuestion(say('Qual é a ala do apartamento da pessoa que deseja cadastrar?'), [
        //     {
        //         pattern: "cancelar|cancele|pare|para|Cancelar|Cancele|Cancel|cancel|Pare|Para|Cancela|cancela",
        //         handler: async (response, convo, bot) => {
        //             console.log(response)
        //             convo.step.state.values.endConvo = true
        //             console.log(convo.step.state.values)
        //             await convo.gotoThread('end_convo')
        //         }
        //     },
        //     {
        //         default: true,
        //         handler: async (response, convo, bot) => {
        //             await convo.gotoThread("stepAptoOther")
        //             console.log(`ala is ${response}`);
        //         }
        //     }
        // ], 'ala', 'stepAlaOther');

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


        // convo.addAction('confirmation', 'stepAptoOther');
        convo.addQuestion(say(`*Confirmando seus dados:*\n\nNome: {{vars.nome}}\nCelular: {{vars.celular}}\nApartamento: {{vars.apartamento}}\nCondomínio: ${condominioAPI.data.name}
${ifBloco()}
${ifAla()}\n\nTodas informações estão corretas?`), [
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

        convo.addMessage(say(`Caso deseje interromper o cadastro, digite "Pare"`), 'stop_bot_conversation')
        convo.addAction('stepCelularQuestion', 'stop_bot_conversation')

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

            if(!results.endConvo && APICount == 0){
                //recebe os resultados de todos os campos preenchidos para enviar para a api

                const resultsSend = {
                    nome: results.nome,
                    celular: results.celular,
                    bloco: results.bloco,
                    apartamento: results.apartamento,
                    ala: results.ala,
                    condominioId: condominioAPI.data.id,
                    lockerId: lockerID
                }
                try{
                    console.log("resultsSend", resultsSend)
                    if(apiML.sendCadastro(resultsSend)){

                    }
                    APICount = 1;
                } catch (e){
                    console.log(e)
                }
            }

            if(APICount == 1){
                console.log('RESULTS', results);
                APICount = 2
            }
        });

        APICount = 0;

        await bot.beginDialog(MY_DIALOG_ID);

        function ifBloco(){
            let resp = "";
        
            if(condominioAPI.bloco){
                resp = `Bloco: {{vars.bloco}}`
            }

            return resp;
        }

        function ifAla(){
            let resp = "";
        
            if(condominioAPI.ala){
                resp = `Ala: {{vars.ala}}`
            }

            return resp;
        }

    });


    /****************************************************************************************************************


    Sessão de Alterar o Cadastro

    Novo Hears


    *****************************************************************************************************************/


    controller.hears([new RegExp(/alterar meus dados$/i), 
                    new RegExp(/alterar dados$/i), 
                    new RegExp(/mudar meus dados$/i), 
                    new RegExp(/mudar dados$/i), 
                    new RegExp(/editar dados$/i),
                    new RegExp(/editar meus dados$/i)], 'message,direct_message', async (bot, message) => {

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
        let MY_DIALOG_ID = `${message?.user}${'UpdateCadastro'}` || 'my-dialog-name-robot';
        let convoUpdateCadastro = new BotkitConversation(MY_DIALOG_ID, controller);

        let celAlt = message?.user;
        var newCel = newCelF(celAlt);

        let userApi = await apiML.getUser(newCel);
        let condominiosAPI = await apiML.getCondominioByUser(newCel)
        let condominioAPI = await apiML.getCondominio(lockerName)

        convoUpdateCadastro.before('default', (convoUpdateCadastro, bot) => {
            // console.log('Default', lockerID, lockerName);
            convoUpdateCadastro.setVar(`name`, message?.channelData?.data?.pushname);
            // convoUpdateCadastro.setVar(`lockerID`, lockerID);
            // convoUpdateCadastro.setVar(`lockerName`, lockerName);
            // convoUpdateCadastro.setVar(`countSize`, 0);
        });

        if(userApi){    
            convoUpdateCadastro.addAction('loggedDB')
            convoUpdateCadastro.addMessage(say(`Bem-vindo(a) ${userApi.nome}, sou o atendente da Meu Locker e estou disponível para alterar os dados de seu cadastros.`), 'loggedDB');
            convoUpdateCadastro.addAction('stop_bot_conversation', 'loggedDB')
        }
        else{
            convoUpdateCadastro.addAction('notLoggedDB')
            convoUpdateCadastro.addMessage(say(`Para realizar o cadastro, digite o nome completo e o número usados no cadastro `), 'notLoggedDB');
            convoUpdateCadastro.addAction('stop_bot_conversation', 'notLoggedDB')
        }

        convoUpdateCadastro.addAction('', 'notLoggedDB');
        convoUpdateCadastro.addQuestion(say(`Quantos apartamentos existem no seu condomínio?`), [
            {
                pattern: "cancelar|cancele|pare|para|Cancelar|Cancele|Cancel|cancel|Pare|Para|Cancela|cancela",
                handler: async (response, convoUpdateCadastro, bot) => {
                    console.log(response)
                    convoUpdateCadastro.step.state.values.endConvoUpdateCadastro = true
                    await convoUpdateCadastro.gotoThread('end_convoUpdateCadastro')
                }
            },
            {
                default: true,
                handler: async (response, convoUpdateCadastro, bot) => {
                    console.log(response)
                    if(true){

                    }
                    await convoUpdateCadastro.gotoThread('');
                }
            }
        ], 'orcamento', '');

        convoUpdateCadastro.addMessage(say(`Caso deseje interromper a alteração dos dados de cadastro, digite "Pare"`), 'stop_bot_conversation')
        convoUpdateCadastro.addAction('', 'stop_bot_conversation')

        convoUpdateCadastro.addMessage(say('Não entendi sua resposta, repita por favor', message), 'orcamento_err')
        convoUpdateCadastro.addAction('', 'orcamento_err')

        convoUpdateCadastro.addMessage(say('Cálculo de orçamento cancelado.'), 'end_convoUpdateCadastro')
        convoUpdateCadastro.addAction('end_convoUpdateCadastro_without_results', 'end_convoUpdateCadastro')

        

        controller.addDialog(convoUpdateCadastro);

        convoUpdateCadastro.addAction('end_convoUpdateCadastro_without_results')

        controller.afterDialog(MY_DIALOG_ID, async (bot, results) => {
            await bot.cancelAllDialogs();

            if(!results.endConvoUpdateCadastro){
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
        let MY_DIALOG_ID = `${message?.user}${'Suporte'}` || 'my-dialog-name-robot';
        let convoSuporte = new BotkitConversation(MY_DIALOG_ID, controller);

        let celSup = message?.user;
        var newCel = newCelF(celSup);

        let userApi = await apiML.getUser(newCel);
        let condominiosAPI = await apiML.getCondominioByUser(newCel)
        let condominioAPI = await apiML.getCondominio(lockerName)

        convoSuporte.before('default', (convoSuporte, bot) => {
            // console.log('Default', lockerID, lockerName);
            convoSuporte.setVar(`name`, message?.channelData?.data?.pushname);
            // convo.setVar(`lockerID`, lockerID);
            // convo.setVar(`lockerName`, lockerName);
            // convo.setVar(`countSize`, 0);
        });

        console.log('foi suporte')

        //fazer checagem se número da pessoa está ou não cadastrado na empresa, por meio da api

        //nome = api.response


        if(userApi){
            convoSuporte.addAction('loggedDB');
            convoSuporte.addMessage(say(`Bem-vindo(a) ${userApi.nome}, sou o atendente da Meu Locker e estou disponível para solucionar seus problemas e dúvidas.`), 'loggedDB');
            convoSuporte.addAction('stop_bot_conversation', 'loggedDB');
        }
        else{
            convoSuporte.addAction('notLoggedDB')
            convoSuporte.addMessage(say(`Bem-vindo(a) {{vars.name}}, sou o atendente da Meu Locker e estou disponível para solucionar seus problemas e dúvidas.`), 'notLoggedDB');
            convoSuporte.addAction('stop_bot_conversation', 'notLoggedDB');
        }
    
        convoSuporte.addQuestion(say(`Qual é o problema que está tendo?`), [
            {
                pattern: "cancelar|cancele|pare|para|Cancelar|Cancele|Cancel|cancel|Pare|Para|Cancela|cancela",
                handler: async (response, convoSuporte, bot) => {
                    console.log(response)
                    convoSuporte.step.state.values.endConvoSuporte = true
                    await convoSuporte.gotoThread('end_convoSuporte')
                }
            },
            {
                default: true,
                handler: async (response, convoSuporte, bot) => {
                    console.log(response)
                    await convoSuporte.gotoThread('end_convoSuporte_without_results');
                }
            }
        ], 'suporteQuestion', 'stepAskProblem');

        convoSuporte.addMessage(say(`Caso deseje interromper o suporte, digite "Pare"`), 'stop_bot_conversation')
        convoSuporte.addAction('stepAskProblem', 'stop_bot_conversation')

        convoSuporte.addMessage(say('Não entendi sua resposta, repita por favor', message), 'suporteQuestion_err')
        convoSuporte.addAction('stepAskProblem', 'suporteQuestion_err')

        convoSuporte.addMessage(say('Suporte cancelado.'), 'end_convoSuporte')
        convoSuporte.addAction('end_convoSuporte_without_results', 'end_convoSuporte')

        controller.addDialog(convoSuporte);

        convoSuporte.addAction('end_convoSuporte_without_results')

        controller.afterDialog(MY_DIALOG_ID, async (bot, results) => {
            await bot.cancelAllDialogs();

            if(!results.endConvoSuporte){
                //recebe os resultados de todos os campos preenchidos para enviar para a api
            }

            console.log('RESULTS', results);
        });



        await bot.beginDialog(MY_DIALOG_ID);
    });


    /****************************************************************************************************************


    Sessão de Mídia Social

    Novo Hears


    *****************************************************************************************************************/


    controller.hears([new RegExp(/gostaria de saber os preços$/i), 
                    new RegExp(/preços$/i), 
                    new RegExp(/preciso dos preços$/i), 
                    new RegExp(/preço$/i), 
                    new RegExp(/gostaria dos preços$/i),
                    new RegExp(/orçamento$/i), 
                    new RegExp(/gostaria de saber o orçamento$/i), 
                    new RegExp(/preciso do orçamento$/i),
                    new RegExp(/gostaria do orçamento$/i)], 'message,direct_message', async (bot, message) => {

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
        let MY_DIALOG_ID = `${message?.user}${'Media'}` || 'my-dialog-name-robot';
        let convoMedia = new BotkitConversation(MY_DIALOG_ID, controller);

        let celMedia = message?.user;
        var newCel = newCelF(celMedia);

        let userApi = await apiML.getUser(newCel);
        let condominiosAPI = await apiML.getCondominioByUser(newCel)
        let condominioAPI = await apiML.getCondominio(lockerName)

        convoMedia.before('default', (convoMedia, bot) => {
            // console.log('Default', lockerID, lockerName);
            convoMedia.setVar(`name`, message?.channelData?.data?.pushname);
            // convoMedia.setVar(`lockerID`, lockerID);
            // convoMedia.setVar(`lockerName`, lockerName);
            // convoMedia.setVar(`countSize`, 0);
        });

        if(userApi){
            convoMedia.addAction('loggedDB');
            convoMedia.addMessage(say(`Bem-vindo(a) ${userApi.nome}, sou o atendente da Meu Locker e estou disponível para calcular o seu orçamento.`), 'loggedDB');            
            convoMedia.addAction('stop_bot_conversation', 'loggedDB');
        }
        else{
            convoMedia.addAction('notLoggedDB')
            convoMedia.addMessage(say(`Bem-vindo(a) {{vars.name}}, sou o atendente da Meu Locker e estou disponível para calcular o seu orçamento.`), 'notLoggedDB');            
            convoMedia.addAction('stop_bot_conversation', 'notLoggedDB');
        }

        convoMedia.addAction('stepAskOrcamento', 'notLoggedDB');
        convoMedia.addQuestion(say(`Quantos apartamentos existem no seu condomínio?`), [
            {
                pattern: "cancelar|cancele|pare|para|Cancelar|Cancele|Cancel|cancel|Pare|Para|Cancela|cancela",
                handler: async (response, convoMedia, bot) => {
                    console.log(response)
                    convoMedia.step.state.values.endConvoMedia = true
                    await convoMedia.gotoThread('end_convoMedia')
                }
            },
            {
                default: true,
                handler: async (response, convoMedia, bot) => {
                    console.log(response)
                    if(true){

                    }
                    await convoMedia.gotoThread('');
                }
            }
        ], 'orcamento', 'stepAskOrcamento');

        convoMedia.addMessage(say(`Caso deseje interromper o cálculo do orçamento, digite "Pare"`), 'stop_bot_conversation')
        convoMedia.addAction('stepAskOrcamento', 'stop_bot_conversation')

        convoMedia.addMessage(say('Não entendi sua resposta, repita por favor', message), 'orcamento_err')
        convoMedia.addAction('stepCelularQuestion', 'orcamento_err')


        convoMedia.addMessage(say('Cálculo de orçamento cancelado.'), 'end_convoMedia')
        convoMedia.addAction('end_convoMedia_without_results', 'end_convoMedia')

        controller.addDialog(convoMedia);

        convoMedia.addAction('end_convoMedia_without_results')

        controller.afterDialog(MY_DIALOG_ID, async (bot, results) => {
            await bot.cancelAllDialogs();

            if(!results?.endConvoMedia && APICount == 0){
                //recebe os resultados de todos os campos preenchidos para enviar para a api

                const resultsSend = {
                    
                }
                try{
                    apiML.sendOrcamento(resultsSend);
                    APICount = 1;
                } catch (e){
                    // sendCadastroError()
                    console.log(e)
                }
            }

            if(APICount == 1){
                console.log('RESULTS', results);
                APICount = 2
            }


            console.log('RESULTS', results);
        });

        APICount = 0;

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
        console.log(nome.charAt(i).charCodeAt(0))
        if(nome.charAt(i).charCodeAt(0) < 65 || (nome.charAt(i).charCodeAt(0) > 90 && nome.charAt(i).charCodeAt(0) < 97) || nome.charAt(i).charCodeAt(0) > 122){
            if(nome.charAt(i) == ' ' || nome.charAt(i).charCodeAt(0) > 127){
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
    }

    return bool
}

function newCelF(cel){
    let newCel = '';
    for(let i = 0; i < cel.length - 5; i++){
        if(i == 4){
            newCel += 9 + cel.charAt(i)
        }
        else{
            newCel += cel.charAt(i)
        }
    }

    return newCel
}
