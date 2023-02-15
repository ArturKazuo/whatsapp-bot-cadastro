/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const { Botkit, BotkitConversation } = require('botkit');
const say = require('../../utils/say');
const sayQrcode = require('../../utils/sayQrcode');
const RedeAPI = require('../../components/apiRede1Minuto');
const apiRede = new RedeAPI();

async function processaAPI(convo, bot, message) {

    try {
        // console.log('CONVO', JSON.stringify(convo.vars))
        const retorno = await apiRede.cadastroEvento(convo.vars.user, convo.vars.lockerID, convo.vars.name);
        // console.log('RETORNO API', JSON.stringify(retorno));

        return retorno;

    } catch (error) {
        throw new Error(error)
    }
}

const mensagemResposta = `Bem-vindo(a) {{vars.name}}, continue o processo de pagamento no tablet do locker.`;

module.exports = function (controller) {

        controller.hears(new RegExp(/Gostaria de guardar meu volume no locker da Rede1 Minuto.$/i), 'message,direct_message', async (bot, message) => {

            let lockerID = '0d000fd5-6f65-11ed-8616-040300000000';
            let lockerName = 'Salvador2';
            let MY_DIALOG_ID = `${message?.user}${lockerName}` || 'my-dialog-name-robot';
            let convo = new BotkitConversation(MY_DIALOG_ID, controller);
    
    
            console.log('Start', lockerID, MY_DIALOG_ID);
    
            convo.before('default', (convo, bot) => {
                // console.log('Default', lockerID, lockerName);
                convo.setVar(`name`, message?.channelData?.data?.pushname);
                convo.setVar(`lockerID`, lockerID);
                convo.setVar(`lockerName`, lockerName);
                convo.setVar(`countSize`, 0);
                // convo.setVar(`user`, message?.user);
            });
    
    
            convo.before('step1', async (convo, bot) => {
                // console.log(' Before Step 1', lockerID, lockerName);
                const retorno = await processaAPI(convo, bot, message);
                console.log(retorno);
            });
    
    
            convo.addAction('step1');
    
            convo.addMessage(say(mensagemResposta, message), 'step1');
            
            controller.addDialog(convo);
    
            controller.afterDialog(MY_DIALOG_ID, async (bot, results) => {
                // use results of dialog here
                await bot.cancelAllDialogs();
                console.log('RESULTS', results);
            });
    
            await bot.beginDialog(MY_DIALOG_ID);
        });


    controller.hears(new RegExp(/Desejaria guardar meu volume no locker da Rede1 Minuto.$/i), 'message,direct_message', async (bot, message) => {

        let lockerID = '01fffa39-6f65-11ed-8616-040300000000';
        let lockerName = 'Salvador1';
        let MY_DIALOG_ID = `${message?.user}${lockerName}` || 'my-dialog-name-robot';
        let convo = new BotkitConversation(MY_DIALOG_ID, controller);


        console.log('Start', lockerID, MY_DIALOG_ID);

        convo.before('default', (convo, bot) => {
            // console.log('Default', lockerID, lockerName);
            convo.setVar(`name`, message?.channelData?.data?.pushname);
            convo.setVar(`lockerID`, lockerID);
            convo.setVar(`lockerName`, lockerName);
            convo.setVar(`countSize`, 0);
            // convo.setVar(`user`, message?.user);
        });


        convo.before('step1', async (convo, bot) => {
            // console.log(' Before Step 1', lockerID, lockerName);
            const retorno = await processaAPI(convo, bot, message);
            console.log(retorno);
        });


        convo.addAction('step1');

        convo.addMessage(say(mensagemResposta, message), 'step1');
        
        controller.addDialog(convo);

        controller.afterDialog(MY_DIALOG_ID, async (bot, results) => {
            // use results of dialog here
            await bot.cancelAllDialogs();
            console.log('RESULTS', results);
        });

        await bot.beginDialog(MY_DIALOG_ID);
    });


}
