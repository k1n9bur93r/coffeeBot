"use strict"

let rpsCom= require("../Communication");
let rps= require("../RPS");

import {commandObject} from './SharedCommandObject';
import {commandArgs} from './SharedCommandObject';
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
let response:RPSResponse=rps.CommandRPS(args.UserID,args.text);
console.log(response);
let replytext:string;
if(!response.isWinner)
{
    if(response.message.toLowerCase().includes("create"))
    {
    replytext=`<@${args.UserID}> is offering a game of **rock, paper, scissors** for **1 coffee**. Do **/rps [choice]** to take the bet.`;
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
return [rpsCom.Request(rpsCom.Type.Reply,null, replytext, rpsCom.Type.Visible)];
}

