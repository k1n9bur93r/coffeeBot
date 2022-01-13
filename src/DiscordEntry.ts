"use strict"

let cardGame= require("./CardGame");
let BestOf = require("./BestOf");
let CardGameCommand= require("./Commands/CardGameCommands")
let ProfileCommand =require("./Commands/PlayerInfoCommands")
let BestOfCommand= require("./Commands/BestOfCommands");
let CoinFlipCommand= require("./Commands/CoinFlipCommands")
let ProfileWriteCommand= require("./Commands/ProfileWriteCommands");
let CoffeePotCommand= require("./Commands/CoffeePotCommands");
let RPSCommand= require("./Commands/RPSCommands");
let TalkCommand= require("./Commands/TalkCommands");
const { Client, Intents, MessageEmbed,MessageActionRow,MessageButton } = require("discord.js");
let {discordToken}=require('../config.json')


import {commandObject} from './Commands/SharedCommandObject';
import {commandArgs} from './Commands/SharedCommandObject';
import {commandExecute} from './Commands/SharedCommandObject';

let GlobalTimers=[];

function TimerObject(timer,timerName)
{
    return{
        Timer:timer,
        Name:timerName
    }
}
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MEMBERS,
    ],
});

const Commands= new Map();

module.exports = 
{
    Initalize: function()
 {
     let commandArray:Array<commandObject>=[];
    //client.login(discordToken);
    client.login(process.env.discordToken);
    client.once("ready", () => {
        client.user.setActivity("/commands", { type: "LISTENING" });
    });
    commandArray=commandArray.concat(CardGameCommand.LoadCommands());
    commandArray=commandArray.concat(ProfileCommand.LoadCommands());
    commandArray=commandArray.concat(BestOfCommand.LoadCommands());
    commandArray=commandArray.concat(ProfileWriteCommand.LoadCommands());
    commandArray=commandArray.concat(CoinFlipCommand.LoadCommands());
    commandArray=commandArray.concat(CoffeePotCommand.LoadCommands());
    commandArray=commandArray.concat(TalkCommand.LoadCommands());
    commandArray=commandArray.concat(RPSCommand.LoadCommands());
    commandArray.forEach(Command=>{
        Commands.set(Command.Name,Command.Logic);
    });
 },
    BroadCastError:function(message)
    {
        BotChannelMessage(897200312694243378,null,`THERE WAS A FATAL ERROR:${message}`);

    }   
}
client.on("interactionCreate", async (interaction) => {
    var channelId=interaction.channelId;
    if (!interaction.isCommand()) return;
    try {
        let commandFunction: commandExecute=Commands.get(interaction.commandName);
        let commandTandCAgree: commandExecute= Commands.get('checkAgree');
        
        if(commandFunction!=undefined)
        {
            let args ={} as commandArgs;

            for(let x=0;x<commandFunction.Args.length;x++) //TODO remove arguments, just pass down everything that exists and use it when needed...or not, rely just depends. 
            {
                if(commandFunction.Args[x]==="ID")
                {
                    args.UserID=interaction.user.id;
                    args.UIDAvatar=interaction.user.avatar
                    args.UIDName=interaction.user.username
                }
                else if(commandFunction.Args[x]==="Amount")
                {
                    args.amount=interaction.options.getInteger("amount");
                }
                else if(commandFunction.Args[x]==="Amount2")
                {
                    args.amount2=interaction.options.getInteger("rounds");
                }
                else if(commandFunction.Args[x]==="RefID1")
                {
                    let ref=undefined;
                    if(interaction.options.get("user")!=null)
                         ref=interaction.options.get("user").user;
                    else if(interaction.options.get("from")!=null)
                        ref=interaction.options.get("from").user;
                    if(ref!=undefined){
                        args.RefID1= ref.id;
                        args.R1IDAvatar=ref.avatar;
                        args.R1IDName=ref.username
                    } 
                }
                else if(commandFunction.Args[x]==="RefID2")
                {
                    //TODO do a null check here like we did with RefID1
                    args.RefID2=interaction.options.get("to").user.id;
                }
                else if(commandFunction.Args[x]==="Text")
                {
                    let ref=interaction.options.getString("text");
                    if(ref==undefined)
                     ref=interaction.options.getString("choice");
                    args.text=ref;
                }
            };
            let tandCResp =commandTandCAgree.Func(args);
            if(args.UserID==undefined||tandCResp.length==0)
            {
                return  BulkReplyHandler(interaction,commandFunction.Func(args));
            }
            else
                return BulkReplyHandler(interaction,tandCResp);
        }

} catch (e) {
        BotChannelMessage(
            {channelId:channelId},
            null,
            `I'm Sowwy UwU~ <@${
                interaction.user.id
            }> \n> but something happened and I'm brokie... || ${e.message}${
                e.stack ? `\nStackTrace:\n=========\n${e.stack}` : ``
            } ||`
        );
    }
});

//Event and Communication

function TimeOutHandler(options) //Rewrite/Move out of being discord centric, make generic timers that sync up with users over Websocket/WebRTC
{
    console.log("Event FIRING "+options.actionName);
    if(options.actionName.includes('CG-'))
    {
        if(options.actionName=="CG-End")
        {
            for(let x=0;x<GlobalTimers.length;x++)
            {
                if(GlobalTimers[x].Name.includes("CG-"))
                {
                    clearTimeout(GlobalTimers[x].Timer);
                    GlobalTimers.splice(x,1);
                }  
            }  
        }
        else
        {
            GlobalTimers.splice(options.index,1)
            BulkReplyHandler(options.interaction,cardGame.CommandTimerEvent(options.functionCall));
            BulkReplyHandler(options.interaction,CardGameCommand.CGBSHandler(true,true)); //TODO nasty cross code, might not even work
        }
    }
    else if(options.actionName.includes('BS-'))
    {
        if(options.actionName.includes('Time'))
        {
            BulkReplyHandler(options.interaction,CardGameCommand.CGBSHandler(true,true)); //TODO nasty cross code, might not even work
        }
        else
            BulkReplyHandler(options.interaction,BestOf.CommandBestOfEnd());

    }
}

function BulkReplyHandler(interaction,communicationRequests) //Ideally there will only be one response per action and timers will be attached to global events/broadcasts and will remove the need for this function.
{
    for(let x=0;x<communicationRequests.length;x++)
    {
        let embed= null;
        if(communicationRequests[x].embed!=null)
        {
          embed= new MessageEmbed();
                embed.setTitle(communicationRequests[x].embed.title);
                embed.setDescription(communicationRequests[x].embed.text);
                embed.setColor(communicationRequests[x].embed.color);
                embed.setThumbnail(communicationRequests[x].embed.thumbnail);
                if(communicationRequests[x].embed.fields)
                {
                    for(let y=0;y<communicationRequests[x].embed.fields.length;y++){
                        embed.addField(communicationRequests[x].embed.fields[y].title,communicationRequests[x].embed.fields[y].content,communicationRequests[x].embed.fields[y].fieldsAlign);
                    }
                }
        }
        console.log("Current interaciton message number is "+x+" With text value of "+ communicationRequests[x].message);
        console.log(" Or embed value of "+ communicationRequests[x].embed);
        if(communicationRequests[x].reply==true)
        {
            BotReply(
                interaction,
                embed,
                communicationRequests[x].message,
                communicationRequests[x].hidden
            );
        }
        else
        {
            BotChannelMessage(
                interaction,
                embed,
                communicationRequests[x].message
            );
        }
        if(communicationRequests[x].TimerSettings!=null)
        {
            if(communicationRequests[x].TimerSettings.Replace.length!=0&&GlobalTimers.length>0)
            {
                for(let z=0;z<communicationRequests[x].TimerSettings.Replace.length;z++)
                {
                    for(let y=0;y<GlobalTimers.length;y++)
                    {
                        if(communicationRequests[x].TimerSettings.Replace[z]==GlobalTimers[y].Name)
                        {
                            console.log(`REPLACED A CURRENT TIMER  '${GlobalTimers[y].Name}' with: ${communicationRequests[x].TimerSettings.Action}`);
                            clearTimeout(GlobalTimers[y].Timer);
                            GlobalTimers.splice(y,1);
                            break;
                        }
                    }
                }
            }
                GlobalTimers.push(
                    TimerObject(
                        setTimeout(
                            TimeOutHandler, 
                            communicationRequests[x].TimerSettings.Length , 
                            {
                            index:GlobalTimers.length,
                            actionName:communicationRequests[x].TimerSettings.Action,
                            functionCall:communicationRequests[x].TimerSettings.functionCall,
                            interaction:interaction
                            }
                            ),
                        communicationRequests[x].TimerSettings.Action
                        )
                    );
        }

    }
}

function BotChannelMessage(interaction, embed, message) { //Will be replaced with general announcement with Discord and Websocket/WebRTC clients
    if (embed && message == "") {
        client.channels.cache.get(interaction.channelId).send({ embeds: [embed] });
    } else if (embed) {
        client.channels.cache.get(interaction.channelId).send({
            content: message,
            embeds: [embed],
        });
    } else {
        client.channels.cache.get(interaction.channelId).send(message);
    }
}
async function BotReply(interaction, embed, message, ishidden) { 
                const row = new MessageActionRow()
			// .addComponents(
			// 	new MessageButton()
			// 		.setCustomId('primary')
			// 		.setLabel('Primary')
			// 		.setStyle('PRIMARY'),
			// );
    if (embed && message == "") {
         interaction.reply({
            ephemeral: ishidden,
            embeds: [embed]//,
            //components:[row]
        });
    } else if (embed) {
         interaction.reply({
            content: message,
            ephemeral: ishidden,
            embeds: [embed]//,
            //components:[row]
            
        });
    } else {
         interaction.reply({
            content: message,
            ephemeral: ishidden//,
            //components:[row]
        });
    }
    
}
