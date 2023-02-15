/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
 const { Botkit, BotkitConversation } = require('botkit');
 const Store = require('../../utils/store');
 const Quotation = require('../../components/Quotation');
 const quote = new Quotation();

module.exports = function(controller) {

    function say(text, message) {
        return {
            text: text,
            channelData: {
                ...message?.incoming_message?.channelData,
                text: text
            }
        }
    }

    // // use a function to match a condition in the message
    // controller.hears(async (message) => message.text && message.text.toLowerCase() === 'foo', ['message'], async (bot, message) => {
    //     await bot.reply(message, 'I heard "foo" via a function test');
    // });

    // // use a regular expression to match the text of the message
    // controller.hears(new RegExp(/^\d+$/), ['message','direct_message'], async function(bot, message) {
    //     await bot.reply(message,{ text: 'I heard a number using a regular expression.' });
    // });

    // // match any one of set of mixed patterns like a string, a regular expression
    // controller.hears(['allcaps', new RegExp(/^[A-Z\s]+$/)], ['message','direct_message'], async function(bot, message) {
    //     await bot.reply(message,{ text: 'I HEARD ALL CAPS!' });
    // });
	
	
	/*
    controller.hears(['receber cotação diária', 'cotação diária', 'cotacao diaria'], 'message,direct_message', async (bot, message) => {

        function say(text) {
            return {
                text: text,
                channelData: {
                    ...message?.incoming_message?.channelData,
                    text: text
                }
            }
        }
        //await bot.reply(message, 'I heard a sample message.');

        const MY_DIALOG_ID = 'my-dialog-cotacao-diaria';
        let convo = new BotkitConversation(MY_DIALOG_ID, controller);

        // do a simple conditional branch looking for user to say "no"

        convo.addAction('confirmation');

        convo.addQuestion(say(`Olá ${message?.channelData?.data?.pushname || ''}! Confirma a sua inclusão na lista de cotação diária?`), [
            {
                pattern: 'não',
                handler: async (response, convo, bot) => {
                    // if user says no, go back to favorite color.
                    //await convo.gotoThread('favorite_color');
                    await bot.reply(message, say('Seu nome será removido da lista!'));
                }
            },
            {
                pattern: ['sim', 'ok'],
                handler: async (response, convo, bot) => {
                    // if user says no, go back to favorite color.
                    await bot.reply(message, say('Adicionado com sucesso!'));
                }
            },
            {
                default: true,
                handler: async (response, convo, bot) => {
                    // do nothing, allow convo to complete.
                    //await convo.say(say('YES!'));
                    await bot.reply(message, say('Adicionado com sucesso!'));
                }
            }
        ], 'confirm', 'confirmation');


        controller.addDialog(convo);


        await bot.beginDialog(MY_DIALOG_ID);
    });
	
	*/

   /* controller.hears(["cotação do dia", "cotação", "preço do feijão", "preço de hoje", "quanto está o feijão", "quanto tá o feijão", "cotacao"],'message,direct_message', async(bot, message) => {

        await bot.reply(message, say("Aguarde, já estou verificando.", message));

        const resposta = await quote.getQuote();
		
        for (const key in resposta) {
            const textSend = resposta[key];
            await await bot.reply(message, say(textSend, message));
          }
    }); */

    controller.hears(["bom dia", "boa tarde", "boa noite", "como vai", "olá"], 'message,direct_message', async(bot, message) => {
        await bot.reply(message, say(`Olá ${message?.channelData?.data?.pushname || ''}! ‎A Meu Locker agradece pelo contato! Como podemos ajudar?\nSe quiser ver os serviços automáticos envie a mensagem "ajuda".`, message));
    });

    controller.hears(["quero ajuda", "ajuda", "como funciona"], 'message', async(bot, message) => {
        await bot.reply(message, say(`${message?.channelData?.data?.pushname || ''}, você pode solicitar alguns serviços direto pelo atendente virtual da Meu Locker, basta digitar o seguinte:\n- Conversar com Atendente: para conversar com atendente.\n- Aplicativos: para solicitar o link para baixar os aplicativos.`, message));
    });

    /*
    controller.hears(["aplicativos", "app", 'aplicativo'], 'message', async(bot, message) => {
        await bot.reply(message, say(`Para baixar o aplicativo, clique no link referente ao seu celular.`, message));
        await bot.reply(message, say(`Android: https://play.google.com/store/apps/details?id=br.com.agrify.app`, message));
        await bot.reply(message, say(`iOS: https://apps.apple.com/us/app/agrify/id1538844015`, message));
    });
	*/





    controller.hears(['conversar com atendente', 'atendente'], 'message', async(bot, message) => {

        function say(text) {
            return {
                text: text,
                channelData: {
                    ...message?.incoming_message?.channelData,
                    text: text
                }
            }
        }
        //await bot.reply(message, 'I heard a sample message.');

        const MY_DIALOG_ID = 'my-dialog-atendente';
        let convo = new BotkitConversation(MY_DIALOG_ID, controller);

        // do a simple conditional branch looking for user to say "no"

        convo.addAction('confirmation');

        convo.addQuestion(say(`Gostaria de conversar com um atendente?`), [
            {
                pattern: 'não',
                handler: async (response, convo, bot) => {
                    // if user says no, go back to favorite color.
                    //await convo.gotoThread('favorite_color');
                    await bot.reply(message, say('ok'));
                }
            },
            {
                pattern: ['sim', 'ok'],
                handler: async (response, convo, bot) => {
                    // if user says no, go back to favorite color.
                    await bot.reply(message, say('Um atendente entrará em contato.'));
                }
            },
            {
                default: true,
                handler: async (response, convo, bot) => {
                    // do nothing, allow convo to complete.
                    //await convo.say(say('YES!'));
                    await bot.reply(message, say('Um atendente entrará em contato.'));
                }
            }
        ], 'confirm', 'confirmation');


        controller.addDialog(convo);


        await bot.beginDialog(MY_DIALOG_ID);

    });

    controller.on('message,direct_message', async(bot, message) => {
        //await bot.reply(message, `Echo: ${ message.text }`);
    });

}