module.exports = (text, message, qrcode) => {
            return {
                text: text,
                channelData: {
                    ...message?.incoming_message?.channelData,
                    text: text,
                    qrcode: qrcode
                }
            }
        }
        