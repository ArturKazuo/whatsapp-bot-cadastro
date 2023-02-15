/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const { Botkit, BotkitConversation } = require('botkit');
const say = require('../../utils/say');
const sayQrcode = require('../../utils/sayQrcode');
const RedeAPI = require('../../components/apiRede1Minuto');
const apiRede = new RedeAPI();

async function processaAPI(convo, code, bot, message) {

    try {
        const retorno = await apiRede.reservadoLocker(convo.vars.user, code);
        console.log('RETORNO::::', JSON.stringify(retorno));

        if ((retorno?.info_encomendas) && (retorno?.info_encomendas.length > 0)) {
            convo.setVar('Geracao_Codigo_Abertura_Porta', retorno?.info_encomendas[0]?.Geracao_Codigo_Abertura_Porta);
            return true;
        } else {
            const mensagem = await apiRede.getCodeMsg(retorno);
            console.log('MENSAGEM:', mensagem);
            await bot.reply(message, say(mensagem.text, message));
            // await convo.say(say('Não existem compartimentos disponíveis para a sua solicitação. Tente outro tamanho de porta.', message));
            await convo.gotoThread('select_size');
            return false;
        }

    } catch (error) {
        throw new Error(error)
    }
}

module.exports = function (controller) {

    controller.hears(new RegExp(/^Tenho uma reserva no locker (.*)$/i), 'message,direct_message', async (bot, message) => {

        let lockerID = message.matches[1];
        let lockerName = (message.matches[1]).split(" ").join('');
        let MY_DIALOG_ID = `reservado_${message?.user}${lockerName}` || 'my-dialog-name-robot';
        let convo = new BotkitConversation(MY_DIALOG_ID, controller);

        convo.before('default', (convo, bot) => {
            console.log('Default', MY_DIALOG_ID);
            convo.setVar(`name`, message?.channelData?.data?.pushname);
            convo.setVar(`lockerID`, lockerID);
            convo.setVar(`lockerName`, lockerName);
            convo.setVar(`countSize`, 0);
            // convo.setVar(`user`, message?.user);
        });


        convo.before('step1', (convo, bot) => {
            console.log(' Before Step 1', lockerID, lockerName);
        });


        convo.addAction('step1');

        convo.addMessage(say(`Bem-vindo(a) {{vars.name}}, sou o atendente Rede1Minuto.`, message), 'step1');
        // convo.addAction('step2', 'step1');

        // convo.addMessage(say(`Para prosseguir necessitamos que esteja perto do locker {{vars.lockerName}}.`, message), 'step2');

        // use add action to switch to a different thread, defined below...
        convo.addAction('select_size', 'step1');

        // add a message and a prompt to a new thread called `select_size`
        convo.addQuestion(say('Por favor digite seu código de reserva:', message), async (response, convo, bot) => {
            const code = response.toUpperCase();
            console.log(`Code is ${code}`);
            // do something?
            convo.setVar('sizeText', 'Pequeno');
            const retorno = await processaAPI(convo, code, bot, message);
            console.log(retorno);
            if (retorno)
                await convo.gotoThread('confirmation');
        }, 'size', 'select_size' );


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
