"use strict"

const {DiscordClientInstance} =require ("./DiscordClient"); 
const {BotChannelMessage}=require("./DiscordBroadcast");

let CardGameCommand= require("./Commands/CardGameCommands")
let ProfileCommand =require("./Commands/PlayerInfoCommands")
let BestOfCommand= require("./Commands/BestOfCommands");
let CoinFlipCommand= require("./Commands/CoinFlipCommands")
let ProfileWriteCommand= require("./Commands/ProfileWriteCommands");
let CoffeePotCommand= require("./Commands/CoffeePotCommands");
let RPSCommand= require("./Commands/RPSCommands");
let TalkCommand= require("./Commands/TalkCommands");

import {commandObject} from './Commands/SharedCommandObject';
import {commandArgs} from './Commands/SharedCommandObject';
import {commandExecute} from './Commands/SharedCommandObject';


let SentButtons= new Array();

interface DisableButtonsObj{interaction:any,index:number,customId:string};

const Commands= new Map();
module.exports = 
{
    Initalize: function()
    {
        let commandArray:Array<commandObject>=[];

        commandArray=commandArray.concat(CardGameCommand.LoadCommands());
        commandArray=commandArray.concat(ProfileCommand.LoadCommands());
        commandArray=commandArray.concat(BestOfCommand.LoadCommands());
        commandArray=commandArray.concat(ProfileWriteCommand.LoadCommands());
        commandArray=commandArray.concat(CoinFlipCommand.LoadCommands());
        commandArray=commandArray.concat(CoffeePotCommand.LoadCommands());
        commandArray=commandArray.concat(TalkCommand.LoadCommands());
        commandArray=commandArray.concat(RPSCommand.LoadCommands());
        commandArray.forEach(Command=>{Commands.set(Command.Name,Command.Logic)}); 
    } 
}

    DiscordClientInstance.client.on("interactionCreate", async (interaction) => {HandleInteraction(interaction)});

function HandleInteraction(interaction)
{

    if(interaction.isCommand())
        CommandInteraction(interaction);
    else if( interaction.isButton())
        ButtonInteraction(interaction);
}

function CommandInteraction(interaction)
{
    try {
        let commandFunction: commandExecute=Commands.get(interaction.commandName);
        let commandTandCAgree: commandExecute= Commands.get('checkAgree');
        
        if(commandFunction!=undefined)
        {
            let args ={} as commandArgs;

            for(let x=0;x<commandFunction.Args.length;x++) //TODO remove arguments, just pass down everything that exists and use it when needed...or not, just depends. 
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
            if(interaction.commandName=="agree"||(args.UserID==undefined||!tandCResp))
                return BotReply(commandFunction.Func(args),interaction);
            else
                return BotReply(tandCResp,interaction);
        }

} catch (e) {
        BotChannelMessage(
            `I'm Sowwy UwU~ <@${
                interaction.user.id
            }> \n> but something happened and I'm brokie... || ${e.message}${
                e.stack ? `\nStackTrace:\n=========\n${e.stack}` : ``
            } ||`,
            null,
            process.env.broadcastChannelId//BaseChannelID
        );
    }
}
function ButtonInteraction(interaction)
{
    let MatchingButtons= SentButtons.filter(set=>set.customId=interaction.customId);

    for(let x=0;x<MatchingButtons.length;x++)
    {
        DisablePastButtons(MatchingButtons[x].Timer._timerArgs[0]);
    }
    let args ={} as commandArgs;
    const getCommand=/.+?(?=~~)/;
    const getValue=/(?<=\~~).*/;
    let command=getCommand.exec(interaction.customId)[0];
    let commandFunction: commandExecute=Commands.get(command);
    let value=getValue.exec(interaction.customId)[0];
    //temporary just for omniflip, will be expaned later
    args.UserID=value;
    
    return BotReply(commandFunction.Func(args),interaction);
}

function DisablePastButtons(obj:DisableButtonsObj)
{
    obj.interaction.fetchReply()
    .then(reply=>{
        for(let x=0;x<reply.components[0].components.length;x++)
            reply.components[0].components[x].setDisabled(true);
            obj.interaction.editReply({components:reply.components});
    });
    SentButtons.splice(obj.index,1);
}



async function BotReply(communicationRequests,interaction) { 
    if(communicationRequests.actionRow)
    {
        SentButtons.push({Timer:setTimeout(DisablePastButtons,15000,{interaction:interaction,index:SentButtons.length,customId:communicationRequests.actionRow.components[0].customId})});
    }
//something here that tracks past buttons that were sent, then can do an action to kill off said button

    if (communicationRequests.embed && communicationRequests.message == "") {
        if(communicationRequests.actionRow)
        interaction.reply({
            ephemeral: communicationRequests.hidden,
            embeds: [communicationRequests.embed],
            components: [communicationRequests.actionRow]
        });
        else
         interaction.reply({
            ephemeral: communicationRequests.hidden,
            embeds: [communicationRequests.embed]
        });
    } else if (communicationRequests.embed) {
        if(communicationRequests.actionRow)
        interaction.reply({
            ephemeral: communicationRequests.hidden,
            content: communicationRequests.message,
            components: [communicationRequests.actionRow],
            embeds: [communicationRequests.embed]
        });
        else
         interaction.reply({
            content: communicationRequests.message,
            ephemeral: communicationRequests.hidden,
            embeds: [communicationRequests.embed]
            
        });
    } else {
        if(communicationRequests.actionRow)
        interaction.reply({
            ephemeral: communicationRequests.hidden,
            content: communicationRequests.message,
            components: [communicationRequests.actionRow]
        });
        else
         interaction.reply({
            content: communicationRequests.message,
            ephemeral: communicationRequests.hidden
        });
    }
    
}
