"use strict"

const {Reply,Embed,Buttons}= require("../Communication");
let cf= require("../CoinFlip");

let CoinEvents= require("../BuisnessEvents");

let OmniInit= new CoinEvents.BEvent("OM-Init",[""],.5,OmniTimeOut);
let OmniEnd= new CoinEvents.BEvent("OM-End",["OM-Init"],.01,null);


import {commandObject} from './SharedCommandObject';
import {commandArgs} from './SharedCommandObject';
import {CoinFlipResponse} from '../CoinFlip'

module.exports=
{

    LoadCommands:function():Array<commandObject>
    {
        return [
        {Name:"coinflip" ,Logic:{Func:Flip,Args:["ID","Amount"]}},
        {Name:"multiflip" ,Logic:{Func:Flip,Args:["ID","Amount"]}},
        {Name:"omniflip" ,Logic:{Func:OmniFlipConfirm,Args:["ID"]}},
        {Name:"omniflipaccept",Logic:{Func:OmniFlipAccept,Args:["ID"]}},
        {Name:"omniflipdeny",Logic:{Func:OmniFlipDeny,Args:["ID"]}},
        {Name:"omniflipchance",Logic:{Func:OmniFlipChance,Args:["ID"]}}
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
        const coinFlipResults = Embed(
            title,
            coinflipResultText,
            null,
            false,
            "LUMINOUS_VIVID_PINK",
            "https://justflipacoin.com/img/share-a-coin.png"
            );
        return Reply(coinFlipResults,"");
    }
    else if(responses[0].message.toLowerCase().includes("cant"))
    {

        return Reply(null,responses[0].message,true);
    }
    else if (responses[0].message.toLowerCase().includes("revoke"))
    {
        let responseString:string;
        if(args.amount==undefined)
            responseString=`<@${args.UserID}> has revoked their Coin Flip offer.`
        else
            responseString=`<@${args.UserID}> has revoked their Multi Flip offer.`

        return Reply(null,responseString);
    }
    else if (responses[0].message.toLowerCase().includes("created"))
    {
        let responseString:string;
        if(args.amount==undefined)
            responseString=`<@${args.UserID}> is offering a **coin flip coffee bet** for **1 coffee**.  Do **/coinflip** to take the bet.`;
        else
            responseString=`<@${args.UserID}> is offering **${args.amount}** coin flips for 1 :coffee: each. Do **/multiflip ${args.amount}** to take the bet.`;
        return Reply(null,responseString);

    }
    else
        return Reply(null,responses[0].message, true);
    


}
function OmniFlipConfirm(args:commandArgs)
{
    const embed = Embed(
        "OMNIFLIP",
        "An OmniFlip is worth 100 multiflip 100s",
        null,
        false,
        "DARK_AQUA",
        "https://media1.popsugar-assets.com/files/thumbor/akF5W-FXSyszxgQZD--zBUaX9-g/fit-in/2048xorig/filters:format_auto-!!-:strip_icc-!!-/2012/09/39/3/192/1922195/81485b01898e48d8_404794e6026211e2af9022000a1c9e2c_7/i/Ying-Yang.jpeg"
        );

    let buttons=Buttons(
        [
            {
             id:`omniflipaccept~~${args.UserID}`,
             label:"I'm Ready",
             style:"SUCCESS",   
            },
            {
                id:`omniflipdeny~~${args.UserID}`,
                label:"No I'm Scared",
                style:"DANGER",   
            },
            {
                id:`omniflipchance~~${args.UserID}`,
                label:"Choose For Me ",
                style:"PRIMARY",   
            }
        ]
    );
    return Reply(embed,"",true,buttons);
    

}
function OmniFlipAccept(args:commandArgs)
{
    let responses=[] as Array<CoinFlipResponse>;

    responses=responses.concat(cf.CommandOmniFlip(args.UserID));

if(responses[0].message=="")
{
    CoinEvents.NewTimerEvent(OmniEnd);
    let title= "Omni Flip Results"
    let coinflipResultText="";

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
    const coinFlipResults = Embed(
        title,
        coinflipResultText,
        null,
        false,
        "LUMINOUS_VIVID_PINK",
        "https://media1.popsugar-assets.com/files/thumbor/akF5W-FXSyszxgQZD--zBUaX9-g/fit-in/2048xorig/filters:format_auto-!!-:strip_icc-!!-/2012/09/39/3/192/1922195/81485b01898e48d8_404794e6026211e2af9022000a1c9e2c_7/i/Ying-Yang.jpeg"
        );
    return Reply(coinFlipResults,"");
}
else if(responses[0].message.toLowerCase().includes("invalid"))
    return Reply(null,responses[0].message,true);
else if (responses[0].message.toLowerCase().includes("revoke"))
{
    CoinEvents.NewTimerEvent(OmniEnd);
    return Reply(null,`<@${args.UserID}> has revoked their Omni Flip offer.`);
}
else if (responses[0].message.toLowerCase().includes("created"))
{
    CoinEvents.NewTimerEvent(OmniInit);
    return Reply(null,`<@${args.UserID}> is offering an **OmniFlip** Do **/omniflip** to take the bet.`);
}
else
    return Reply(null,responses[0].message, true);
}
function OmniFlipDeny(args:commandArgs)
{
    const embed = Embed(
        "OMNIFLIP",
        "I don't respect BITCHES",
        null,
        false,
        "DARK_AQUA",
        "https://media1.popsugar-assets.com/files/thumbor/akF5W-FXSyszxgQZD--zBUaX9-g/fit-in/2048xorig/filters:format_auto-!!-:strip_icc-!!-/2012/09/39/3/192/1922195/81485b01898e48d8_404794e6026211e2af9022000a1c9e2c_7/i/Ying-Yang.jpeg"
        );

    return Reply(embed,"");
}

function OmniFlipChance(args:commandArgs)
{

if(Math.random() < 0.5)
   return OmniFlipAccept(args);
else
   return OmniFlipDeny(args);
}


function OmniTimeOut()
{
    let OmniCreator=cf.CommandEndOmniRequest();
    CoinEvents.NewBroadCast(`Nobody has taken up <@${OmniCreator}>'s Omniflip, grow a pair people!`);

}
