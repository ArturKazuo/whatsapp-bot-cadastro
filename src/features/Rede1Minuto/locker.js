/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const { Botkit, BotkitConversation } = require('botkit');
const say = require('../../utils/say');
const sayQrcode = require('../../utils/sayQrcode');
const RedeAPI = require('../../components/apiRede1Minuto');
const apiRede = new RedeAPI();

async function processaAPI(convo, size, bot, message) {

    try {
        const retorno = await apiRede.postLocker(convo.vars.user, convo.vars.lockerID, size);
        // console.log('RETORNO API', JSON.stringify(retorno));

        if ((retorno?.info_encomendas) && (retorno?.info_encomendas.length > 0)) {
            convo.setVar('Geracao_Codigo_Abertura_Porta', retorno?.info_encomendas[0]?.Geracao_Codigo_Abertura_Porta);
            return true;
        } else {
            await bot.reply(message, say('Não existem compartimentos disponíveis para a sua solicitação. Tente outro tamanho de porta.', message));
            // await convo.say(say('Não existem compartimentos disponíveis para a sua solicitação. Tente outro tamanho de porta.', message));
            await convo.gotoThread('select_size');
            return false;
        }

    } catch (error) {
        throw new Error(error)
    }
}

module.exports = function (controller) {

    // controller.hears(new RegExp(/Gostaria de reservar uma porta no locker (\S+)$/i), 'message,direct_message', async (bot, message) => {
    controller.hears(new RegExp(/reservar uma porta no locker (\S+)$/i), 'message,direct_message', async (bot, message) => {


        let mensagemFull = message.matches[0];
        let lockerID = message.matches[1];
        let lockerName = message.matches[1];
        let MY_DIALOG_ID = `${message?.user}${lockerName}` || 'my-dialog-name-robot';
        let convo = new BotkitConversation(MY_DIALOG_ID, controller);


        if ((lockerName == 'EventoFloripa01') || (lockerName == 'eventofloripa01')) {
            lockerID = '63a5c387-32a8-11ec-9bd5-5cc9d363c015';
        } else if (lockerName == 'EventoFloripa02') {
            lockerID = '63c98a4c-32a8-11ec-aa7a-5cc9d363c015';
        } else {
            lockerID = message.matches[1];
        }

        console.log('Start', lockerID, MY_DIALOG_ID, '==>', mensagemFull);

        convo.before('default', (convo, bot) => {
            console.log('Default', lockerID, lockerName);
            convo.setVar(`name`, message?.channelData?.data?.pushname);
            convo.setVar(`lockerID`, lockerID);
            convo.setVar(`lockerName`, lockerName);
            convo.setVar(`countSize`, 0);
        });


        convo.before('step1', (convo, bot) => {
            console.log(' Before Step 1', lockerID, lockerName);
        });


        convo.addAction('step1');

        convo.addMessage(say(`Bem-vindo(a) {{vars.name}}, sou o atendente Rede1Minuto.`, message), 'step1');
        convo.addAction('step2', 'step1');

        // convo.addMessage(say(`Para prosseguir necessitamos que esteja perto do locker {{vars.lockerName}}.`, message), 'step2');
        convo.addMessage(say(`Para prosseguir necessitamos que esteja perto do locker.`, message), 'step2');


        // use add action to switch to a different thread, defined below...
        convo.addAction('select_size', 'step2');

        // add a message and a prompt to a new thread called `select_size`
        convo.addQuestion(say('Qual tamanho de compartimento deseja?\n1 - Pequeno\n2 - Médio\n3 - Grande\n4 - GG', message), async (response, convo, bot) => {
            console.log(`user name is ${response}`);
            if ((response == '1') || (response.toLowerCase() == 'p') || (response.toLowerCase() == 'pequeno')) {
                convo.setVar('sizeText', 'Pequeno');
                const retorno = await processaAPI(convo, 'SRTP', bot, message);
                console.log(retorno);
                if (retorno)
                    await convo.gotoThread('confirmation');
            } else if ((response == '2') || (response.toLowerCase() == 'm') || (response.toLowerCase() == 'médio') || (response.toLowerCase() == 'medio')) {
                convo.setVar('sizeText', 'Médio');
                const retorno = await processaAPI(convo, 'SRTM', bot, message);
                if (retorno)
                    await convo.gotoThread('confirmation');
            } else if ((response == '3') || (response.toLowerCase() == 'g') || (response.toLowerCase() == 'grande')) {
                convo.setVar('sizeText', 'Grande');
                const retorno = await processaAPI(convo, 'SRTG', bot, message);
                if (retorno)
                    await convo.gotoThread('confirmation');
            } else if ((response == '4') || (response.toLowerCase() == 'gg')) {
                convo.setVar('sizeText', 'GG');
                const retorno = await processaAPI(convo, 'SRTGG', bot, message);
                if (retorno)
                    await convo.gotoThread('confirmation');
            } else {
                if (convo.vars.countSize < 4) {
                    convo.setVar(`countSize`, convo.vars.countSize + 1);
                    console.log('convo.vars.countSize', convo.vars.countSize);
                    await convo.gotoThread('select_size');
                    await bot.reply(message, say('Favor digitar o número ou o tamanho referente ao compartimento que desejar.', message));
                } else {
                    await convo.gotoThread('cancelado');
                }
            }
            // do something?
        }, 'size', 'select_size');

        // go to a confirmation
        // convo.addAction('confirmation', 'select_size');
        convo.addMessage(say('Desculpe, mas não foi possível atender sua solicitação. Tente novamente neste ou em outro locker.', message), 'cancelado');

        convo.addMessage(sayQrcode('Obrigado! A partir de agora você pode deixar seus pertences guardados por até duas horas. Utilize o QRCode ou a senha {{vars.Geracao_Codigo_Abertura_Porta}} para depósito e retirada.', message, '{{vars.Geracao_Codigo_Abertura_Porta}}'), 'confirmation');

        controller.addDialog(convo);

        controller.afterDialog(MY_DIALOG_ID, async (bot, results) => {
            // use results of dialog here
            await bot.cancelAllDialogs();
            console.log('RESULTS', results);
        });



        await bot.beginDialog(MY_DIALOG_ID);
    });


}
