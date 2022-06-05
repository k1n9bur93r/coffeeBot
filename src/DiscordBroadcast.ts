const {DiscordClientInstance} =require ("./DiscordClient"); 

module.exports={
     BotChannelMessage:  function (message,embed,channelId) { 
        var ChannelTarget= DiscordClientInstance.client.channels.cache.get(channelId);
        let savedInteraction;

        if (embed && message == "") {
            ChannelTarget.send({ embeds: [embed] });
        } else if (embed) {
            ChannelTarget.send({
                content: message,
                embeds: [embed]
            }).then(sent=> savedInteraction=sent);
        } else {
            savedInteraction= ChannelTarget.send(message);
        }
        return savedInteraction;
    },
    EditBotChannelMessage:function (interaction,message,embed) { 

        // if (embed && message == "") {
        //     interaction.message.edit({ embeds: [embed] });
        // } else if (embed) {
        //     interaction.message.edit({
        //         content: message,
        //         embeds: [embed]
        //     });
        // } else {
            interaction.edit(message);
        //}
    }
};

