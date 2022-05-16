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



import {ButtonIDPair, commandObject} from './DiscordCommunication';
import {commandArgs} from './DiscordCommunication';
import {commandExecute} from './DiscordCommunication';
import {ButtonStyles} from './DiscordCommunication'
import {ButtonAttributes} from './DiscordCommunication'
import {ButtonProcessed} from './DiscordButtons'

 interface SentButtonObj{ParentMessage:string,ID:string,Type:any,Command:any,PostProcess:any}
 interface SentMessageObj{ID:string,Interaction:string,Timer:any}
 interface MultiInstanceButtons{MessageID:string,ButtonID:string};




let SentButtons= new Map();
let ButtonGroupTimers= new Map();
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
    const getHash=/.+?(?=~~)/; //coverd
    const getID=/(?<=\~~).*/; //coverd
    let Hash=getHash.exec(interaction.customId)[0]; //coverd
    let ID=getID.exec(interaction.customId)[0]; //coverd


    let needsToAgree=VerifyUser(interaction); 
    if(needsToAgree) return ;

    let foundIndex= SentButtons.get(Hash).findIndex(item=>item.ID==ID); //coverd
    let PassedJSON= SentButtons.get(Hash)[foundIndex].Command; //coverd
    let commandFunction: commandExecute=Commands.get(PassedJSON.Command);

    let args:commandArgs;

    args=JSON.parse(JSON.stringify(PassedJSON.Args));
    if(args.UserID&&args.UserID=="PROVID")
        args.UserID=interaction.user.id;
    ProcessExistingButtons({Hash:Hash,ID:ID},interaction.user.id);    //coverd
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
//covered
function DisableMultipleMessageButtons(MessageID:string,ButtonIDs:Array<ButtonIDPair>,overrides:{click:boolean,expire:boolean,ignoredButton:string}={click:false,expire:false,ignoredButton:""}){

    let overrideAll=false;
    if(SentMessages.has(MessageID))
    {
        if(overrides)
        {
            for(let x=0;x<ButtonIDs.length;x++)
            {
                let index=SentButtons.get(ButtonIDs[x].Hash).findIndex(item=>item.ID==ButtonIDs[x].ID);
                if(index!=-1)
                {
                    if(overrides.expire)
                        overrideAll= SentButtons.get(ButtonIDs[x].Hash)[index].Type.overrideAllExpire;
                    else if(overrides.click)
                        overrideAll= SentButtons.get(ButtonIDs[x].Hash)[index].Type.overrideAllClick;
                }
            }
        }
        SentMessages.get(MessageID).Interaction.fetchReply()
        .then(reply=>{ 
            for(let x=0;x<reply.components.length;x++)
            {
                for(let y=0;y<reply.components[x].components.length;y++)
                {
                    let overrideIgnoreIndividual=true;
                    let checkExists=ButtonIDs.findIndex(item=>{ 

                        if(item.Hash+"~~"+item.ID== reply.components[x].components[y].customId) {
                            if(item.ID==overrides.ignoredButton)
                                overrideIgnoreIndividual=false;
                            return true;
                        }
                        else 
                            return false;    
                    });
                    if(overrideIgnoreIndividual && (overrideAll || checkExists!=-1))
                        reply.components[x].components[y]=UpdateButtonAttribute(reply.components[x].components[y]); 
                }
            }
            SentMessages.get(MessageID).Interaction.editReply({components:reply.components});
        });
    }

}

//coverd
function UpdateIndividualMessageButton(MessageID:string,Button:ButtonIDPair,attributes:ButtonAttributes)
{
    SentMessages.get(MessageID).Interaction.fetchReply()
    .then(reply=>{ 
        for(let x=0;x<reply.components.length;x++)
        {
            for(let y=0;y<reply.components[x].components.length;y++)
            {
                    if(reply.components[x].components[y].customId==`${Button.Hash}~~${Button.ID}`)
                        reply.components[x].components[y]=UpdateButtonAttribute(reply.components[x].components[y],attributes); 
            }
        }
        SentMessages.get(MessageID).Interaction.editReply({components:reply.components});
    });
}
//covered
function UpdateButtonAttribute(buttonRef:any,attributes:ButtonAttributes={style:ButtonStyles.NOACTION,text:"",disable:true})
{   
    if(attributes.text!="")
    {
        buttonRef.setLabel(attributes.text);
    }
    if(attributes.style!=ButtonStyles.NOACTION)
    {
        buttonRef.setStyle(attributes.style);
    }
    
    buttonRef.setDisabled(attributes.disable);
    return buttonRef;
}
//covered
function ButtonTimeOut(TimedOutSet)
{
    DisableMultipleMessageButtons(TimedOutSet.MessageID,TimedOutSet.Buttons,{click:false,expire:true,ignoredButton:""});
}
//covered
function MessageTimeOut(MessageID)
{
if(SentMessages.has(MessageID))
{
    SentMessages.delete(MessageID);
}
else
{
    console.log("Temp statement replace with logging later");
    //message reference does not exist for some reason, log it 
}
}
function CheckMultiInstance(ButtonHash:Array<string>,IgnoredButtons:Array<MultiInstanceButtons>) //checked
{  
    let GroupedButtons:ButtonIDPair;
    let GroupedAction: {MessageID:string,Buttons:typeof GroupedButtons[]};
    let GroupedMessages= new Array<typeof GroupedAction>();
    
   for(let y=0;y<ButtonHash.length;y++)
    {
        if(SentButtons.has(ButtonHash[y]))
        {
            for(let x=0;x<SentButtons.get(ButtonHash[y]).length;x++)
            {
                if(!IgnoredButtons.some(item=>item.ButtonID==SentButtons.get(ButtonHash[y])[x].ID)){
                    let messageIndex=GroupedMessages.findIndex(item=>item.MessageID ==SentButtons.get(ButtonHash[y])[x].ParentMessage);
                    let newArrayElement={Hash:ButtonHash[y],ID:SentButtons.get(ButtonHash[y])[x].ID};
                    console.log(messageIndex);
                    
                    if(messageIndex==-1)
                        GroupedMessages.push({MessageID:SentButtons.get(ButtonHash[y])[x].ParentMessage,Buttons:[newArrayElement]});
                    else 
                        GroupedMessages[messageIndex].Buttons.push(newArrayElement);
                }

            }
        }
    }
    for(let x=0;x<GroupedMessages.length;x++)
    {
        
        DisableMultipleMessageButtons(GroupedMessages[x].MessageID,GroupedMessages[x].Buttons);
    }
}
function ProcessExistingButtons(Button:ButtonIDPair,ClickingUser) //checked
{

       let foundIndex= SentButtons.get(Button.Hash).findIndex(item=>item.ID==Button.ID);
       if(foundIndex==-1) return; //some kind of logging warning here in the future 
       if(SentButtons.get(Button.Hash)[foundIndex].PostProcess)
       {
           let returnedAttributes:ButtonAttributes
           if(SentButtons.get(Button.Hash)[foundIndex].PostProcess.function)
           {
                returnedAttributes=SentButtons.get(Button.Hash)[foundIndex].PostProcess.function(ClickingUser);
                UpdateIndividualMessageButton(SentButtons.get(Button.Hash)[foundIndex].ParentMessage,Button,returnedAttributes);
           }
           if(SentButtons.get(Button.Hash)[foundIndex].PostProcess.overrideDisableLogic)
            return;

       }
       if(SentButtons.get(Button.Hash)[foundIndex].Type.clickOnce==true||SentButtons.get(Button.Hash)[foundIndex].Type.overrideAllClick==true)
       {
           let savedButtonGUID="";
           if(SentButtons.get(Button.Hash)[foundIndex].Type.clickOnce==false)
                savedButtonGUID=Button.ID;
            console.log(savedButtonGUID);
            DisableMultipleMessageButtons(SentButtons.get(Button.Hash)[foundIndex].ParentMessage,[Button],{expire:false,click:true,ignoredButton:savedButtonGUID});
       }

}
function SaveButtons(ButtonsObj:ButtonProcessed)
{
    //check if the hash for the button currently exists in the map
    //handling buttons that have same timeouts
   
    let newMultiInstnace = new Array<MultiInstanceButtons>();
    let matchedMultInstanceHashes= new Array<string>();
    for(let x=0;x<ButtonsObj.GUIDS.length;x++)
    {
        let newElement: SentButtonObj=
        {
            ParentMessage:ButtonsObj.ParentMessage, 
            ID:ButtonsObj.GUIDS[x], 
            Command:ButtonsObj.Commands[x], 
            Type:ButtonsObj.Types[x],
            PostProcess:ButtonsObj.PostProcess[x]
        };
        console.log(newElement.PostProcess);
        //check Multi Instance 
        if(ButtonsObj.Types[x].multiInstances==false)
        {
            console.log(`Looked at the following button type, and it NOT multiInstance ${ButtonsObj.Types[x].name}`)
            newMultiInstnace.push({MessageID:ButtonsObj.ParentMessage,ButtonID:ButtonsObj.GUIDS[x]});
            if(matchedMultInstanceHashes.findIndex(item=>item==ButtonsObj.Hashes[x])==-1)
                matchedMultInstanceHashes.push(ButtonsObj.Hashes[x])
        }
        
        if(SentButtons.has(ButtonsObj.Hashes[x]))
        {
            SentButtons.get(ButtonsObj.Hashes[x]).push(newElement);
        }
        else
        {
            SentButtons.set(ButtonsObj.Hashes[x],new Array(newElement));   
        }
    }
    CheckMultiInstance(matchedMultInstanceHashes,newMultiInstnace);
    for(let x=0;x<ButtonsObj.TimeOutGroups.length;x++)
    {
        if(x==0)
        {
            ButtonGroupTimers.set(ButtonsObj.ParentMessage,new Array(
                setTimeout( 
                    ButtonTimeOut, 
                    ButtonsObj.TimeOutGroups[x].TimerLength,
                    {
                        MessageID:ButtonsObj.ParentMessage,
                        Buttons:ButtonsObj.TimeOutGroups[x].Buttons
                    }
                    )
                )
            );  
            
        }
        else
        {
            ButtonGroupTimers.get(ButtonsObj.ParentMessage).push(
                setTimeout( 
                    ButtonTimeOut, 
                    ButtonsObj.TimeOutGroups[x].TimerLength,
                    {
                        MessageID:ButtonsObj.ParentMessage,
                        Buttons:ButtonsObj.TimeOutGroups[x].Buttons
                    }
                    )
                );
        }
    }
}
function SaveMessage(ButtonsObj,interaction)
{
    console.log(`The longest timer is ${ButtonsObj.TimeOutGroups[0].TimerLength}`)
    let messageObj:SentMessageObj={ID:ButtonsObj.ParentMessage,Interaction:interaction,
        Timer:setTimeout(
            MessageTimeOut,
            ButtonsObj.TimeOutGroups[0].TimerLength+10000,
            ButtonsObj.ParentMessage
        )};
    SentMessages.set(ButtonsObj.ParentMessage,messageObj);
}

async function BotReply(communicationRequests,interaction) 
{ 
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
