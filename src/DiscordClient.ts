"use strict"
const { Client, Intents } = require("discord.js");
let {discordToken}=require('../config.json')

class TrueDiscordClient
{
    private static _instance:TrueDiscordClient;
    public client ;
    private constructor(){  
        this.client = new Client({
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_PRESENCES,
                Intents.FLAGS.GUILD_MEMBERS,
            ],
        });
        //this.client.login(discordToken);
        this.client.login(process.env.discordToken);
        this.client.once("ready", () => 
        {
            this.client.user.setActivity("/commands", { type: "LISTENING" });

        });
    }
public static get Client()
{
    if (TrueDiscordClient._instance) {
        return this._instance;
        
    }
    TrueDiscordClient._instance = new TrueDiscordClient();
    return this._instance;
}
}

module.exports.DiscordClientInstance= TrueDiscordClient.Client


