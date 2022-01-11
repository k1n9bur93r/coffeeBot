"use strict"

let rpsCom= require("../Communication");
let rps= require("../RPS");

import {commandObject} from './SharedCommandObject';
import {commandArgs} from './SharedCommandObject';
import {RPSResponse} from '../RPS'

let verbs = ["crushes", "covers", "cuts"];
let emojis = [":rock:", ":roll_of_paper:", ":scissors:"];

module.exports=
{

    LoadCommands:function():Array<commandObject>
    {
        return [
        {Name:"rps" ,Logic:{Func:MakeSelection,Args:["ID","text"]}}
        ];
    }

}

function MakeSelection(args:commandArgs)
{
let response:RPSResponse=rps.CommandRPS(args.UserID,args.text);

if(!response.isWinner)
{
    let replytext:string;
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
        let indexOfemoji=emojis.findIndex(response.choices[0].choice);
        replytext=`<@${response.choices[0].id}> and <@${response.choices[1].id}> tied by both choosing ${}.`;
    }
}
else
{

}

}

BotReply(
    interaction,
    null,
    `<@${interaction.user.id}> is offering a game of **rock, paper, scissors** for **1 coffee**. Do **/rps [choice]** to take the bet.`,
    false
);

BotReply(
    interaction,
    null,
    `<@${interaction.user.id}> revoked their rock, paper, scissors offer.`,
    false
);

BotReply(
    interaction,
    null,
    `<@${player1}> and <@${player2}> tied by both choosing ${emojis[player1ChoiceIndex]}.`,
    false
);

BotReply(
    interaction,
    null,
    `<@${player1}>'s ${emojis[player1ChoiceIndex]} ${verbs[player1ChoiceIndex]} <@${player2}>'s ${emojis[player2ChoiceIndex]}. <@${player2}> paid up 1 :coffee:.`,
    false
);

BotReply(
    interaction,
    null,
    `<@${player2}>'s ${emojis[player2ChoiceIndex]} ${verbs[player2ChoiceIndex]} <@${player1}>'s ${emojis[player1ChoiceIndex]}. <@${player1}> paid up 1 :coffee:.`,
    false
);