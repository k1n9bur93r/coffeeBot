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
    },
    DisableButton:function(Hash:string,ID:string)
    {
        //TODO:stubbing this out, sometimes there are commands that act differently depending on if the User who is interacting with it for a second time, this could be a way to bubble up an action without having to go through the DiscordEntry logic pipeline
    }
};

