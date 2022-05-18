"use strict"

const {DiscordClientInstance} =require ("./DiscordClient"); 
const {BotChannelMessage}=require("./DiscordBroadcast");
let  QwikButtonService = require( './DiscordButtons').QwikButtonService;

let CardGameCommand= require("./Commands/CardGameCommands")
let ProfileCommand =require("./Commands/PlayerInfoCommands")
let BestOfCommand= require("./Commands/BestOfCommands");
let CoinFlipCommand= require("./Commands/CoinFlipCommands")
let ProfileWriteCommand= require("./Commands/ProfileWriteCommands");
let CoffeePotCommand= require("./Commands/CoffeePotCommands");
let RPSCommand= require("./Commands/RPSCommands");
let TalkCommand= require("./Commands/TalkCommands");
let SocialCommand= require("./Commands/SocialCommands");



import {commandObject} from './DiscordCommunication';
import {commandArgs} from './DiscordCommunication';
import {commandExecute} from './DiscordCommunication';

const Commands= new Map();
const ButtonService= new QwikButtonService();
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
        commandArray=commandArray.concat(SocialCommand.LoadCommands());
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
                    args.Amount=interaction.options.getInteger("amount");
                }
                else if(commandFunction.Args[x]==="Amount2")
                {
                    args.Amount2=interaction.options.getInteger("rounds");
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
                    args.Text=ref;
                }
            };
        let needsToAgree;
        if(interaction.commandName!="agree")needsToAgree= VerifyUser(interaction);
        if(needsToAgree) return;
        return BotReply(commandFunction.Func(args),interaction);  
        }

} catch (e) {
        BotChannelMessage(
            `I'm Sowwy UwU~ <@${
                interaction.user.id
            }> \n> but something happened and I'm brokie... || ${e.message}${
                e.stack ? `\nStackTrace:\n=========\n${e.stack}` : ``
            } ||`,
            null,
            "755280645978325003"//process.env.broadcastChannelId
        );
    }
}
function ButtonInteraction(interaction)
{
    let needsToAgree=VerifyUser(interaction); 
    if(needsToAgree) return ;
    return BotReply(ButtonService.PressButton(interaction,Commands),interaction);
}

function VerifyUser(interaction)
{
    let commandTandCAgree: commandExecute= Commands.get('checkAgree');
    let args ={} as commandArgs;
    args.UserID=interaction.user.id;
    let tandCResp =commandTandCAgree.Func(args);
    if(tandCResp)
        return BotReply(tandCResp,interaction);
}

async function BotReply(communicationRequests,interaction) 
{ 
    if(communicationRequests.ButtonsObj)
    {
        ButtonService.ProcessQwikButtons(communicationRequests.ButtonsObj,interaction);
    }
    if (communicationRequests.embed && communicationRequests.message == "") {
        if(communicationRequests.ButtonsObj)
        interaction.reply({
            ephemeral: communicationRequests.hidden,
            embeds: [communicationRequests.embed],
            components: communicationRequests.ButtonsObj.Buttons
        });
        else
         interaction.reply({
            ephemeral: communicationRequests.hidden,
            embeds: [communicationRequests.embed]
        });
    } else if (communicationRequests.embed) {
        if(communicationRequests.ButtonsObj)
        interaction.reply({
            ephemeral: communicationRequests.hidden,
            content: communicationRequests.message,
            components: communicationRequests.ButtonsObj.Buttons,
            embeds: [communicationRequests.embed]
        });
        else
         interaction.reply({
            content: communicationRequests.message,
            ephemeral: communicationRequests.hidden,
            embeds: communicationRequests.embed
            
        });
    } 
    else 
    {
        if(communicationRequests.ButtonsObj)
        interaction.reply({
            ephemeral: communicationRequests.hidden,
            content: communicationRequests.message,
            components: communicationRequests.ButtonsObj.Buttons
        });
        else
         interaction.reply({
            content: communicationRequests.message,
            ephemeral: communicationRequests.hidden
        });
    }
    
}
