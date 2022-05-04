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

import { isMetaProperty } from 'typescript';
import {commandObject} from './DiscordCommunication';
import {commandArgs} from './DiscordCommunication';
import {commandExecute} from './DiscordCommunication';

 interface SentButtonObj{SameTotalTimeout:boolean,ID:string,Interaction:string,Type:any,Command:any,Timer:any,Row:number}

let SentButtons= new Map();



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
    const getHash=/.+?(?=~~)/;
    const getID=/(?<=\~~).*/;
    let Hash=getHash.exec(interaction.customId)[0];
    let ID=getID.exec(interaction.customId)[0];

    let needsToAgree=VerifyUser(interaction);
    if(needsToAgree) return ;

    let foundIndex= SentButtons.get(Hash).findIndex(item=>item.ID==ID);
    let PassedJSON= SentButtons.get(Hash)[foundIndex].Command;
    let commandFunction: commandExecute=Commands.get(PassedJSON.Command);

    let args ={} as commandArgs;

    args=PassedJSON.Args;

    if(args.UserID&&args.UserID=="PROVID")
        args.UserID=interaction.user.id;
    //need to check if multi instance will kill other instances of other buttons (check if multi instance can kill other buttons if added as well)
    //check if click once will need to turn the button off
    //check if overwriteclick will do something to the other buttons 
    ProcessExistingButtons(Hash,ID);    
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


function DisableButton(Hash:string,ID:string,ActionRow:number,SameTotalTimeout=false,MasterButton:string=undefined,SameRowTimeout:boolean=undefined,MasterRowButton:string=undefined)
{
    // check if all buttons expire at the same time,
    //- if they do then check if the button calling is the master button
    //--if it is the master button then disable all other buttons
    //--if it is not then just remove the button from the map
    //-if they don't then go the loop that checks the current row
    //check if all the buttons in the row expire at the same time 
    //- if they do then check if the button calling is the master button
    //--if it is the master button then disable all the row's buttons 
    //--if it is not the master button then just remove the button from the map
    //- if they don't then just disable the current button in the row
    let index=SentButtons.get(Hash).findIndex(item=>item.ID==ID);
    let overrideAllExpire=SentButtons.get(Hash)[index].Type.overrideAllExpire;
    console.log(overrideAllExpire);
    console.log(SameTotalTimeout);
    console.log(SameRowTimeout);
    console.log(SameTotalTimeout==true&&ID==MasterButton);
    console.log(SameRowTimeout==true&&MasterRowButton==ID);
    if(overrideAllExpire||SameTotalTimeout==false||SameTotalTimeout==true&&ID==MasterButton)
    {
    SentButtons.get(Hash)[index].Interaction.fetchReply()
    .then(reply=>{
        let updatedIndex=SentButtons.get(Hash).findIndex(item=>item.ID==ID); 
        if(overrideAllExpire||SameTotalTimeout)
        {
            for(let x=0;x<reply.components.length;x++)
            {
                for(let y=0;y<reply.components[x].components.length;y++)
                {
                    reply.components[x].components[y].setDisabled(true);
                }
            }
            SentButtons.get(Hash)[updatedIndex].Interaction.editReply({components:reply.components});
        }
        else
        {
            if(SameRowTimeout==false||SameRowTimeout==true&&MasterRowButton==ID)
            {
                for(let x=0;x<reply.components[ActionRow].components.length;x++)
                {
                    if(SameRowTimeout||reply.components[ActionRow].components[x].customId==`${Hash}~~${ID}`)
                        reply.components[ActionRow].components[x].setDisabled(true);
                }
                SentButtons.get(Hash)[updatedIndex].Interaction.editReply({components:reply.components});
            }
        }
         SentButtons.get(Hash).splice(updatedIndex,1);
    });
    }
    else
    {
        let updatedIndex=SentButtons.get(Hash).findIndex(item=>item.ID==ID);
        SentButtons.get(Hash).splice(updatedIndex,1);  
    }
}
   
function ButtonTimeOut(ButtonProperties:any)
{
    
    let foundIndex= SentButtons.get(ButtonProperties.Hash).findIndex(item=>item.ID==ButtonProperties.ID);
    console.log(SentButtons.get(ButtonProperties.Hash)[foundIndex].Type);
    if(foundIndex!=-1)
    {
        console.log("button has died Here is the  ID "+ButtonProperties.ID+ " and it's row "+SentButtons.get(ButtonProperties.Hash)[foundIndex].Row);
        DisableButton(ButtonProperties.Hash,ButtonProperties.ID,SentButtons.get(ButtonProperties.Hash)[foundIndex].Row,ButtonProperties.SameTotalTimeout,ButtonProperties.MasterButton,ButtonProperties.SameRowTimeout,ButtonProperties.MasterRowButton);
    }
}

function CheckMultiInstance(ButtonObj,IgnoredButtons:Set<string>)
{
    for(let x=0;x<SentButtons.get(ButtonObj.Hash).length;x++)
    {
        if(!IgnoredButtons.has(SentButtons.get(ButtonObj.Hash)[x].ID))
        {
            DisableButton(SentButtons.get(ButtonObj.Hash)[x].Hash,SentButtons.get(ButtonObj.Hash)[x].ID,SentButtons.get(ButtonObj.Hash)[x].Row);
        }
    }
}

function ProcessExistingButtons(ButtonHash,ButtonGuid=undefined)
{
    if(ButtonGuid==undefined) //if only a hash was supplied, then we are acting on all button of the same type  rather than individual buttons 
    {
        for(let x=0;x<SentButtons.get(ButtonHash).length;x++)
        {
            if(SentButtons.get(ButtonHash)[x].Type.multiInstance==false)
            {
                console.log("This cannot be a multi instance button");
                DisableButton(ButtonHash,SentButtons.get(ButtonHash)[x].Row,x);
            }
        }
    }
    else if(ButtonGuid) //if a GUID was supplied, then we know to check the individual button state
    {
       let foundIndex= SentButtons.get(ButtonHash).findIndex(item=>item.ID==ButtonGuid);
       if(foundIndex!=-1&&SentButtons.get(ButtonHash)[foundIndex].Type.clickOnce==true)
       {
            DisableButton(ButtonHash,ButtonGuid,SentButtons.get(ButtonHash)[foundIndex].Row,SentButtons.get(ButtonHash)[foundIndex].overrideAll);
       }
    }
}

function SaveButtons(ButtonsObj,interaction)
{
    //check if the hash for the button currently exists in the map
    //handling buttons that have same timeouts

    for(let x=0;x<ButtonsObj.GUIDS.length;x++)
    {
        let newElement: SentButtonObj=
        {
            SameTotalTimeout:ButtonsObj.SameTotalTimeout,
            Row: ButtonsObj.ButtonRows.Rows[x],
            Interaction:interaction,
            ID:ButtonsObj.GUIDS[x],
            Command:ButtonsObj.Commands[x],
            Type:ButtonsObj.Types[x],
            Timer:setTimeout(
                ButtonTimeOut,
                ButtonsObj.Types[x].timeout,
                    {
                        Hash:ButtonsObj.Hashes[x],
                        ID:ButtonsObj.GUIDS[x],
                        SameTotalTimeout:ButtonsObj.SameTotalTimeout,
                        MasterButton:ButtonsObj.MasterButton,
                        SameRowTimeout:ButtonsObj.ButtonRows.SameTimeouts[ButtonsObj.ButtonRows.Rows[x]],
                        MasterRowButton:ButtonsObj.ButtonRows.MasterRowButton[ButtonsObj.ButtonRows.Rows[x]]

                    }
                )
        };
        //check Multi Instance 
        if(ButtonsObj.Types[x].multiInstance==false)
        {
            
        }
        
        if(SentButtons.has(ButtonsObj.Hashes[x]))
        {
            ProcessExistingButtons(ButtonsObj.Hashes[x])
            SentButtons.get(ButtonsObj.Hashes[x]).push(newElement);
        }
        else
        {
            SentButtons.set(ButtonsObj.Hashes[x],new Array(newElement));   
        }
    }
}

async function BotReply(communicationRequests,interaction) { 
    if(communicationRequests.ButtonsObj)
    {
        SaveButtons(communicationRequests.ButtonsObj,interaction);
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
    } else {
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
