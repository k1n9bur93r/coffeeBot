const {DiscordClientInstance} =require ("./DiscordClient"); 

module.exports={
     BotChannelMessage:function (message,embed,channelId) { 
        var ChannelTarget= DiscordClientInstance.client.channels.cache.get(channelId);

        if (embed && message == "") {
            ChannelTarget.send({ embeds: [embed] });
        } else if (embed) {
            ChannelTarget.send({
                content: message,
                embeds: [embed]
            });
        } else {
            ChannelTarget.send(message);
        }
    }
};

