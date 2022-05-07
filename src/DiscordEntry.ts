"use strict"

const {DiscordClientInstance} =require ("./DiscordClient"); 
const {BotChannelMessage}=require("./DiscordBroadcast");
const {ButtonSettings}= require("./DiscordCommunication");


let CardGameCommand= require("./Commands/CardGameCommands")
let ProfileCommand =require("./Commands/PlayerInfoCommands")
let BestOfCommand= require("./Commands/BestOfCommands");
let CoinFlipCommand= require("./Commands/CoinFlipCommands")
let ProfileWriteCommand= require("./Commands/ProfileWriteCommands");
let CoffeePotCommand= require("./Commands/CoffeePotCommands");
let RPSCommand= require("./Commands/RPSCommands");
let TalkCommand= require("./Commands/TalkCommands");
let SocialCommand= require("./Commands/SocialCommands");
let DiscordLogger= require("./logger");

import {commandObject} from './DiscordCommunication';
import {commandArgs} from './DiscordCommunication';
import {commandExecute} from './DiscordCommunication';


 interface DisableButtonsObj{interaction:any,index:number};


let SentButtons= new Array();


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
        commandArray=commandArray.concat(SocialCommand.LoadCommands());
        commandArray.forEach(Command=>{Commands.set(Command.Name,Command.Logic)}); 
    } 
}

    DiscordClientInstance.client.on("interactionCreate", async (interaction) => {HandleInteraction(interaction)});

function HandleInteraction(interaction)
{
    try {
        if(interaction.isCommand())
            CommandInteraction(interaction);
        else if( interaction.isButton())
            ButtonInteraction(interaction);
    } catch (e) {
        BotChannelMessage(
            `I'm Sowwy UwU~ <@${
                interaction.user.id
            }> \n> but something happened and I'm brokie... || ${e.message}${
                e.stack ? `\nStackTrace:\n=========\n${e.stack}` : ``
            } ||`,
            null,
            process.env.broadcastChannelId
        );
    }
}

function CommandInteraction(interaction)
{
   
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


}
function ButtonInteraction(interaction)
{
    let needsToAgree=VerifyUser(interaction);
    if(needsToAgree) return ;
    //TODO/DID:
    //1.A button may either disable itself on click, or allow itself to be clicked multiple times 
    //2. If a button has multiple instances tied to the user, and one of those instances is clicked, the other ones should disable themselves (might be better for when a button is first being loaded into the queue rather than when an action is taken) 
    //3. Click counters? 
    //4. Right now there is not much of a difference between the "multiInstance" and "clickOnce" properties of the buttons. Possibly not needed? 

    //Determine all the interactions which have  buttons that currently exist which have a matching ID
    let MatchingButtons= SentButtons.filter(set=>{
        for(let x=0;x<set.IDs.length;x++)
            if(set.IDs[x]==interaction.customId)
                return true;
        return false;
    });
    let recalledInstance={};
    //for all the interactions that were found above check if their included buttons should be deactivated 
    for(let x=0;x<MatchingButtons.length;x++)
    {
        if(MatchingButtons[x].Timer._timerArgs[0].id!=interaction.id)
        {
            for(let y=0;y<MatchingButtons[x].Types.length;y++)
                {
                    if(MatchingButtons[x].Types[y].clickOnce)
                        DisablePastButton(MatchingButtons[x].Timer._timerArgs[0]);
                }
        }
        else
        {
            recalledInstance=MatchingButtons[x].Timer. _timerArgs[0];
            // in the future something here for click once 

        }
    }

    let PassedJSON=JSON.parse(interaction.customId);
    DiscordLogger.info(`BUTTON CLICK : ${interaction.customId}`);
    let commandFunction: commandExecute=Commands.get(PassedJSON.Command);
    let args ={} as commandArgs;
    args=PassedJSON.Args;
    if(args.UserID&&args.UserID=="PROVID")
        args.UserID=interaction.user.id;
    
    return BotReply(commandFunction.Func(args),interaction);
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

function DisablePastButton(obj:DisableButtonsObj)
{
    obj.interaction.fetchReply()
    .then(reply=>{ 
        for(let x=0;x<reply.components[0].components.length;x++)
            reply.components[0].components[x].setDisabled(true);
        obj.interaction.editReply({components:reply.components});
    });
    SentButtons.splice(obj.index,1);
}

function DisableClickedMessageButtons(obj:DisableButtonsObj)
{
    DiscordLogger.info(`BUTTON EXPIRED`);
    obj.interaction.fetchReply()
    .then(reply=>{
        for(let x=0;x<reply.components[0].components.length;x++)
            reply.components[0].components[x].setDisabled(true);
        obj.interaction.editReply({components:reply.components});
        SentButtons.splice(obj.index,1);
    });
}

function SaveButtons(communicationRequests,interaction)
{
    ////buts are able to exist for their proper length of time 
    //currently all buttons are bound to run out as the fastest button, maybe in the future buttons can have their own options 
    let fastestButton=9999999999; // switch to be a proper uninitalized value 
    let IDs=[];
    let Types=[];
    for(let x=0;x<communicationRequests.ButtonsObj.Types.length;x++)
    {
        IDs.push(communicationRequests.ButtonsObj.Buttons.components[x].customId);
        Types.push(communicationRequests.ButtonsObj.Types[x]);
        let tempSpeed=communicationRequests.ButtonsObj.Types[x].timeout;
        if(tempSpeed<fastestButton)
            fastestButton=tempSpeed;
    }
        SentButtons.push({IDs:IDs,Types:Types,Timer:setTimeout(DisableClickedMessageButtons,fastestButton,{interaction:interaction,index:SentButtons.length})});
    }

async function BotReply(communicationRequests,interaction) { 
    if(communicationRequests.ButtonsObj)
    {
        SaveButtons(communicationRequests,interaction);
    }
//something here that tracks past buttons that were sent, then can do an action to kill off said button



    if (communicationRequests.embed && communicationRequests.message == "") {
        if(communicationRequests.ButtonsObj)
        interaction.reply({
            ephemeral: communicationRequests.hidden,
            embeds: [communicationRequests.embed],
            components: [communicationRequests.ButtonsObj.Buttons]
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
            components: [communicationRequests.ButtonsObj.Buttons],
            embeds: [communicationRequests.embed]
        });
        else
         interaction.reply({
            content: communicationRequests.message,
            ephemeral: communicationRequests.hidden,
            embeds: [communicationRequests.embed]
            
        });
    } else {
        if(communicationRequests.ButtonsObj)
        interaction.reply({
            ephemeral: communicationRequests.hidden,
            content: communicationRequests.message,
            components: [communicationRequests.ButtonsObj.Buttons]
        });
        else
         interaction.reply({
            content: communicationRequests.message,
            ephemeral: communicationRequests.hidden
        });
    }
    
}
