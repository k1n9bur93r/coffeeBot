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

import {commandObject} from './DiscordCommunication';
import {commandArgs} from './DiscordCommunication';
import {commandExecute} from './DiscordCommunication';


 interface DisableButtonsObj{interaction:any,index:number};

 interface SentButtonObj{SameTimeout:boolean,ID:string,Interaction:string,Type:any,Command:any,Timer:any,Row:number}

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
    ProcessExistingButtons(Hash,ID);
    //TODO/DID:
    //1.A button may either disable itself on click, or allow itself to be clicked multiple times 
    //2. If a button has multiple instances tied to the user, and one of those instances is clicked, the other ones should disable themselves (might be better for when a button is first being loaded into the queue rather than when an action is taken) 
    //3. Click counters? 
    //4. Right now there is not much of a difference between the "multiInstance" and "clickOnce" properties of the buttons. Possibly not needed? 

    //Determine all the interactions which have  buttons that currently exist which have a matching ID
    // let MatchingButtons= SentButtons.filter(set=>{
    //     for(let x=0;x<set.IDs.length;x++)
    //         if(set.IDs[x]==interaction.customId)
    //             return true;
    //     return false;
    // });
    // let recalledInstance={};
    // //for all the interactions that were found above check if their included buttons should be deactivated 
    // for(let x=0;x<MatchingButtons.length;x++)
    // {
    //     if(MatchingButtons[x].Timer._timerArgs[0].id!=interaction.id)
    //     {
    //         for(let y=0;y<MatchingButtons[x].Types.length;y++)
    //             {
    //                 if(MatchingButtons[x].Types[y].clickOnce)
    //                     DisablePastButton(MatchingButtons[x].Timer._timerArgs[0]);
    //             }
    //     }
    //     else
    //     {
    //         recalledInstance=MatchingButtons[x].Timer. _timerArgs[0];
    //         // in the future something here for click once 

    //     }
    // }

    let PassedJSON=GetButtonCommand(Hash,ID);
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
    //SentButtons.splice(obj.index,1);
}

function DisableClickedMessageButtons(obj:DisableButtonsObj)
{
    obj.interaction.fetchReply()
    .then(reply=>{
        for(let x=0;x<reply.components[0].components.length;x++)
            reply.components[0].components[x].setDisabled(true);
        obj.interaction.editReply({components:reply.components});
        //SentButtons.splice(obj.index,1);
    });
}

function GetButtonCommand(Hash:string,ID:string)
{
    let foundIndex= SentButtons.get(Hash).findIndex(item=>item.ID==ID);
    if(foundIndex!=-1&&SentButtons.get(Hash)[foundIndex].Type.clickOnce==true)
    {
         DisableButton(Hash,SentButtons.get(Hash)[foundIndex].Row,foundIndex);
    }

    return JSON.parse(SentButtons.get(Hash)[foundIndex].Command);
}

function DisableButton(Hash:string,ActionRow:number,Index:number,SameTimeout=false)
{
    SentButtons.get(Hash)[Index].Interaction.fetchReply()
    .then(reply=>{ 
        for(let x=0;x<reply.components[ActionRow].components.length;x++)
        {
            if(SameTimeout||reply.components[ActionRow].components[x].customId==`${Hash}~~${SentButtons.get(Hash)[Index].ID}`)
                reply.components[ActionRow].components[x].setDisabled(true);
        }
            SentButtons.get(Hash)[Index].Interaction.editReply({components:reply.components});
            SentButtons.get(Hash).splice(Index,1);
    });
}

function ButtonTimeOut(ButtonProperties:any)
{
    console.log("button has died, here is the Hash "+ButtonProperties.Hash+" and the ID "+ButtonProperties.ID);
    let foundIndex= SentButtons.get(ButtonProperties.Hash).findIndex(item=>item.ID==ButtonProperties.ID);
    if(foundIndex!=-1&&SentButtons.get(ButtonProperties.Hash)[foundIndex].Type.clickOnce==true)
    {
        DisableButton(ButtonProperties.Hash,SentButtons.get(ButtonProperties.Hash)[foundIndex].Row,foundIndex,ButtonProperties.SameTimeout);
    }
}

function ProcessExistingButtons(ButtonHash,ButtonGuid=undefined)

{
    if(ButtonGuid==undefined) //if only a hash was supplied, then we are acting on buttons as a whole rather than individual buttons 
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
            DisableButton(ButtonHash,SentButtons.get(ButtonHash)[foundIndex].Row,foundIndex);
       }
    }
}

function SaveButtons(ButtonsObj,interaction)
{
    console.log(ButtonsObj);
    //check if the hash for the button currently exists in the map
    for(let x=0;x<ButtonsObj.Commands.length;x++)
    {
        console.log("element number "+ButtonsObj.Commands[x])
        console.log("Current Hash and ID for the button "+ ButtonsObj.Hashes[x]+" : "+ButtonsObj.GUIDS[x] )
        let newElement: SentButtonObj={SameTimeout:ButtonsObj.SameTimeout,Row: ButtonsObj.Row,Interaction:interaction,ID:ButtonsObj.GUIDS[x],Command:ButtonsObj.Commands[x],Type:ButtonsObj.Types[x],Timer:setTimeout(ButtonTimeOut,ButtonsObj.Types[x].timeout,{Hash:ButtonsObj.Hashes[x],ID:ButtonsObj.GUIDS[x],SameTimeout:ButtonsObj.SameTimeout})}
        if(SentButtons.has(ButtonsObj.Hashes[x]))
        {
          console.log("found matching");
            //somekind of logic here depending on the type of button
            ProcessExistingButtons(ButtonsObj.Hashes[x])
            SentButtons.get(ButtonsObj.Hashes[x]).push(newElement);
            console.log(SentButtons.get(ButtonsObj.Hashes[x]));
        }
        else
        {
            console.log("No matching");
            SentButtons.set(ButtonsObj.Hashes[x],new Array(newElement));   
            console.log(SentButtons.get(ButtonsObj.Hashes[x]));
        }
    }
    
    //if no then add the button to the hash
    //if yes then look at the logic of the button to see what needs to be done to it 


    // let fastestButton=9999999999; // switch to be a proper uninitalized value 
    // let IDs=[];
    // let Types=[];
    // for(let x=0;x<communicationRequests.ButtonsObj.Types.length;x++)
    // {
    //     IDs.push(communicationRequests.ButtonsObj.Buttons.components[x].customId);
    //     Types.push(communicationRequests.ButtonsObj.Types[x]);
    //     let tempSpeed=communicationRequests.ButtonsObj.Types[x].timeout;
    //     if(tempSpeed<fastestButton)
    //         fastestButton=tempSpeed;
    // }
    //     SentButtons.push({IDs:IDs,Types:Types,Timer:setTimeout(DisableClickedMessageButtons,fastestButton,{interaction:interaction,index:SentButtons.length})});
    }

async function BotReply(communicationRequests,interaction) { 
    if(communicationRequests.ButtonsObj)
    {
        console.log("Loading buttons");
        SaveButtons(communicationRequests.ButtonsObj,interaction);
    }
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
