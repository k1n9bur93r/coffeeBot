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

 interface SentButtonObj{ParentMessage:string,ID:string,Type:any,Command:any,Timer:any,Row:number}
 interface SentMessageObj{ID:string,SameTotalTimeout:boolean,SameRowTimeout:boolean,MasterButton:string,MasterRowButton:string,Interaction:string}


let SentButtons= new Map();
let SentMessages=new Map();

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

function DisableButtonComposite(Interaction:any,IDs:Array<string>,ParentMessage:string)
{

      Interaction.fetchReply()
    .then(reply=>{

            for(let x=0;x<reply.components.length;x++)
            {
                for(let y=0;y<reply.components[x].components.length;y++)
                {
                    if(IDs.includes(reply.components[x].components.CustomId))
                        reply.components[x].components[y].setDisabled(true);
                }
            }
            Interaction.editReply({components:reply.components});
    });
}


function DisableButton(Hash:string,ID:string,ActionRow:number,SameTotalTimeout=false,MasterButton:string=undefined,SameRowTimeout:boolean=undefined,MasterRowButton:string=undefined)
{
    let index=SentButtons.get(Hash).findIndex(item=>item.ID==ID);
    let overrideAllExpire=SentButtons.get(Hash)[index].Type.overrideAllExpire;
    console.log(" same total timeout is true AND ID is the same as master button "+ (SameTotalTimeout==true&&ID==MasterButton));
    console.log(" Same row timeout is true AND ID is the same as row master button "+ (SameRowTimeout==true&&MasterRowButton==ID));
    if(overrideAllExpire||SameTotalTimeout==false||SameTotalTimeout==true&&ID==MasterButton)
    {
    SentButtons.get(Hash)[index].Interaction.fetchReply()
    .then(reply=>{
        let updatedIndex=SentButtons.get(Hash).findIndex(item=>item.ID==ID); 
        if (updatedIndex==-1) return;
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
                console.log(`This is the Hash ${Hash} and the ID ${ID}`);
               
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
    //console.log(SentButtons.get(ButtonProperties.Hash)[foundIndex].Type);
    if(foundIndex!=-1)
    {
        console.log("button has died Here is the  ID "+ButtonProperties.ID+ " and it's row "+SentButtons.get(ButtonProperties.Hash)[foundIndex].Row);
                DisableButton(ButtonProperties.Hash,ButtonProperties.ID,SentButtons.get(ButtonProperties.Hash)[foundIndex].Row,SentButtons.get(ButtonProperties.Hash)[foundIndex].SameTotalTimeout,SentButtons.get(ButtonProperties.Hash)[foundIndex].MasterButton,SentButtons.get(ButtonProperties.Hash)[foundIndex].SameRowTimeout,SentButtons.get(ButtonProperties.Hash)[foundIndex].MasterRowButton);
    }
}

function CheckMultiInstance(ButtonHash,IgnoredButtons:Set<string>)
{  
    if(SentButtons.has(ButtonHash))
    {
        for(let x=0;x<SentButtons.get(ButtonHash).length;x++)
        {
            if(!IgnoredButtons.has(SentButtons.get(ButtonHash)[x].ID))
            {
                //console.log(SentButtons.get(ButtonHash));
                DisableButton(ButtonHash,SentButtons.get(ButtonHash)[x].ID,SentButtons.get(ButtonHash)[x].Row,SentButtons.get(ButtonHash)[x].SameTotalTimeout,SentButtons.get(ButtonHash)[x].MasterButton,SentButtons.get(ButtonHash)[x].SameRowTimeout,SentButtons.get(ButtonHash)[x].MasterRowButton);
            }
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

function SaveButtons(ButtonsObj)
{
    //check if the hash for the button currently exists in the map
    //handling buttons that have same timeouts
    let newMultiInstnace:Set<string>= new Set();
    let counter=1;
    for(let x=0;x<ButtonsObj.GUIDS.length;x++)
    {
        let newElement: SentButtonObj=
        {
            ParentMessage:ButtonsObj.ParentMessage, //BUTTON
            Row: ButtonsObj.ButtonRows.Rows[x], //BUTTON
            ID:ButtonsObj.GUIDS[x], //BUTTON
            Command:ButtonsObj.Commands[x], //BUTTON
            Type:ButtonsObj.Types[x], //BUTTON
            Timer:setTimeout( //BUTTON
                ButtonTimeOut, 
                ButtonsObj.Types[x].timeout,
                    {
                        Hash:ButtonsObj.Hashes[x],
                        ID:ButtonsObj.GUIDS[x],
                    }
                )
        };
        
        //check Multi Instance 
        if(!ButtonsObj.Types[x].multiInstance)
        {
            newMultiInstnace.add(ButtonsObj.GUIDS[x]);
            console.log(counter);
            counter++;
            CheckMultiInstance(ButtonsObj.Hashes[x],newMultiInstnace);
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

function SaveMessage(ButtonsObj,interaction)
{
    let messageObj:SentMessageObj={ID:ButtonsObj.ParentMessage,SameTotalTimeout:ButtonsObj.SameTotalTimeout,SameRowTimeout:ButtonsObj.SameRowTimeout,MasterRowButton:ButtonsObj.MasterRowButton,MasterButton:ButtonsObj.MasterButton,Interaction:interaction};
    SentMessages.set(ButtonsObj.ParentMessage,messageObj);
}

async function BotReply(communicationRequests,interaction) { 
    if(communicationRequests.ButtonsObj)
    {
        SaveButtons(communicationRequests.ButtonsObj);
        SaveMessage(communicationRequests.ButtonsObj,interaction);
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
