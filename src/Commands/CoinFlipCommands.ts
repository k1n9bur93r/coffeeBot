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
        for(let x=0;x<responses.length;x++)
        {
            if(responses[x].coinSide=="side")
            {
                coinflipResultText+=`The coinflip landed on its side! It is a tie and no coffees are owed!\n`;
            }
            else if(responses[x].coinSide=="split")
            {
                coinflipResultText+=`The coinflip split in half! Double the winnings!\n`;
            }
            else if(responses[x].coinSide=="")
            {
                coinflipResultText+=`<@${responses[x].coinWin}> won the coinflip! <@${responses[x].coinLose}> paid up ${responses[x].amount} coffee.\n`;
            }
        }
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

