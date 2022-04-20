"use strict"

const {Reply,Buttons}= require("../DiscordCommunication");
let rps= require("../RPS");

import {commandObject} from '../DiscordCommunication';
import {commandArgs} from '../DiscordCommunication';
import { ButtonTypes } from '../DiscordCommunication';
import {RPSResponse} from '../RPS'


let verbs = ["crushes", "covers", "cuts"];
let emojis = [":rock:", ":roll_of_paper:", ":scissors:"];
let choices:Array<string> = ["Rock", "Paper", "Scissors"];

module.exports=
{

    LoadCommands:function():Array<commandObject>
    {
        return [
        {Name:"rps" ,Logic:{Func:MakeSelection,Args:["ID","Text"]}}
        ];
    }

}

function MakeSelection(args:commandArgs)
{
let response:RPSResponse=rps.CommandRPS(args.UserID,args.Text);
let replytext:string;
let button;
if(!response.isWinner)
{

    if(response.message.toLowerCase().includes("create"))
    {
        button= new Buttons(
            [
                {
                    id:{Command:"rps",Args:{UserID:"PROVID",Text:"Rock"}},
                    label:"Rock",
                    style:"PRIMARY",
                    type:ButtonTypes.SingleLong   
                },
                {
                    id:{Command:"rps",Args:{UserID:"PROVID",Text:"Paper"}},
                    label:"Paper",
                    style:"PRIMARY",
                    type:ButtonTypes.SingleLong   
                },
                {
                    id:{Command:"rps",Args:{UserID:"PROVID",Text:"Scissors"}},
                    label:"Scissors",
                    style:"PRIMARY",
                    type:ButtonTypes.SingleLong   
                }
            ]    
            );
    replytext=`<@${args.UserID}> is offering a game of **rock, paper, scissors** for **1 coffee**. Do **/rps [choice]** to take the bet, or click one of the buttons below!`;
    }
    else if(response.message.toLowerCase().includes("revoke"))
    {
        replytext=`<@${args.UserID}> revoked their rock, paper, scissors offer.`;
    }
    else if(response.message.toLowerCase().includes("tie"))
    {
        replytext=`<@${response.choices[0].id}> and <@${response.choices[1].id}> tied by both choosing ${emojis[choices.indexOf(response.choices[0].choice)]}.`;
    }
}
else
{
    let winnerIndex= response.choices.findIndex(player=>player.id==response.winnerID);
    let loserIndex=0;
    if(winnerIndex==0) loserIndex=1;
    replytext=`<@${response.winnerID}>'s ${emojis[choices.indexOf(response.choices[winnerIndex].choice)]} ${verbs[choices.indexOf(response.choices[winnerIndex].choice)]} <@${response.loserID}>'s ${emojis[choices.indexOf(response.choices[loserIndex].choice)]}. <@${response.loserID}> paid up 1 :coffee:.`;
}
return Reply(null, replytext,false,button);
}

