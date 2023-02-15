/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const { Botkit, BotkitConversation } = require('botkit');

module.exports = function (controller) {


    controller.hears('robot', 'message,direct_message', async (bot, message) => {

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

        console.log('Robot', message);

        const MY_DIALOG_ID = message?.user || 'my-dialog-name-robot';
        let convo = new BotkitConversation(MY_DIALOG_ID, controller);

        // console.log('MESSAGE=====>', JSON.stringify(message));

        convo.before('default', (convo, bot) => {
            //console.log('Here are the vars in convo:', convo);
        });

        // send a greeting
        convo.say(say('Hello!'));

        // ask a question, store the response in 'name'
        convo.ask(say('What is your name?'), async (response, convo, bot) => {
            console.log(`user name is ${response}`);
            // do something?
        }, 'name');

        // use add action to switch to a different thread, defined below...
        convo.addAction('favorite_color');

        // add a message and a prompt to a new thread called `favorite_color`
        //convo.addMessage('Awesome {{vars.name}}!', 'favorite_color');
        convo.addQuestion(say('Awesome {{vars.name}}! Now, what is your favorite color?'), async (response, convo, bot) => {
            console.log(`user favorite color is ${response}`);
        }, 'color', 'favorite_color');

        // go to a confirmation
        convo.addAction('confirmation', 'favorite_color');

        // do a simple conditional branch looking for user to say "no"
        convo.addQuestion(say('Your name is {{vars.name}} and your favorite color is {{vars.color}}. Is that right?'), [
            {
                pattern: 'no',
                handler: async (response, convo, bot) => {
                    // if user says no, go back to favorite color.
                    await convo.gotoThread('favorite_color');
                }
            },
            {
                default: true,
                handler: async (response, convo, bot) => {
                    // do nothing, allow convo to complete.
                    //await convo.say(say('YES!'));
                    await bot.reply(message, 'I heard a sample message.');
                }
            }
        ], 'confirm', 'confirmation');


        controller.addDialog(convo);


        await bot.beginDialog(MY_DIALOG_ID);
    });


}
