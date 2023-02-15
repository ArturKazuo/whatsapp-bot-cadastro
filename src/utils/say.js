module.exports = (text, message) => {
            return {
                text: text,
                channelData: {
                    ...message?.incoming_message?.channelData,
                    text: text
                }
            }
        }
        