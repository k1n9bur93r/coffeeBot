"use strict"

let cfCom= require("../Communication");
let cf= require("../CoinFlip");

import {commandObject} from './SharedCommandObject';
import {commandArgs} from './SharedCommandObject';
import {CoinFlipResponse} from '../CoinFlip'

module.exports=
{

    LoadCommands:function():Array<commandObject>
    {
        return [
        {Name:"coinflip" ,Logic:{Func:Flip,Args:["ID","Amount"]}},
        {Name:"multiflip" ,Logic:{Func:Flip,Args:["ID","Amount"]}}
        ];
    }

}

function Flip(args:commandArgs) 
{
    let responses=[] as Array<CoinFlipResponse>;
    if(args.amount==undefined)
        responses=responses.concat(cf.CommandSetRequest(args.UserID,1));
    else
        responses=responses.concat(cf.CommandSetRequest(args.UserID,args.amount));
        
    if(responses[0].message=="")
    {
        let title:string;
        let coinflipResultText="";
        if(responses.length>1)
            title="Multi Flip Results";
        else
            title="Coin Flip Results";
        let player1=0;
        let player2=0;
        let OtherPlayer=0;
        for(let x=0;x<responses.length;x++)
        {

            if(responses[x].coinWin.toString()==args.UserID)
            {
            player2+=responses[x].amount;
            }
            else
            {
                OtherPlayer=responses[x].coinWin;
                player1+=responses[x].amount;
            }
            if(responses[x].coinSide=="side")
            {
                coinflipResultText+=`The coinflip landed on its side! It is a tie and no coffees are owed!\n`;
            }
            else if(responses[x].coinSide=="split")
            {
                coinflipResultText+=`The coinflip split in half! Double the winnings for <@${responses[x].coinWin}> !\n`;
            }
            else if(responses[x].coinSide=="")
            {
                coinflipResultText+=`<@${responses[x].coinWin}> won the coinflip! \n`;

            }
        }
        if(player1!=player2)
        {
            if(player2>player1)
            {
                coinflipResultText+=`\n<@${args.UserID}> has won ${player2-player1} :coffee: ${player2-player1 > 1 ? "s" : ""} !`;
            }
            else
            {
                coinflipResultText+=`\n<@${OtherPlayer}> has won ${player1-player2} :coffee: ${player1-player2 > 1 ? "s" : ""} !`;
            }
        }
        else
            coinflipResultText+=`\nBoth Players tied, no coffess owed!`;
        const coinFlipResults = cfCom.Embed(
            title,
            coinflipResultText,
            null,
            false,
            "LUMINOUS_VIVID_PINK",
            "https://justflipacoin.com/img/share-a-coin.png"
            );
        return [cfCom.Request(cfCom.Type.Reply,coinFlipResults,"",cfCom.Type.Visible)];
    }
    else if(responses[0].message.toLowerCase().includes("invalid"))
    {

        return [cfCom.Request(cfCom.Type.Reply,null,responses[0].message,cfCom.Type.Hidden)];
    }
    else if (responses[0].message.toLowerCase().includes("revoke"))
    {
        let responseString:string;
        if(args.amount==undefined)
            responseString=`<@${args.UserID}> has revoked their Coin Flip offer.`
        else
            responseString=`<@${args.UserID}> has revoked their Multi Flip offer.`

        return [cfCom.Request(cfCom.Type.Reply,null,responseString,cfCom.Type.Visible)];
    }
    else if (responses[0].message.toLowerCase().includes("created"))
    {
        let responseString:string;
        if(args.amount==undefined)
            responseString=`<@${args.UserID}> is offering a **coin flip coffee bet** for **1 coffee**.  Do **/coinflip** to take the bet.`;
        else
            responseString=`<@${args.UserID}> is offering **${args.amount}** coin flips for 1 :coffee: each. Do **/multiflip ${args.amount}** to take the bet.`;

        return [cfCom.Request(cfCom.Type.Reply,null,responseString,cfCom.Type.Visible)];

    }


}

