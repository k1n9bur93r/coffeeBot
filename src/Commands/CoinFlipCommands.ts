"use strict"

const {Reply,Embed}= require("../DiscordCommunication");
let cf= require("../CoinFlip");
let QwikButtonCreate= require("../DiscordButtons").QwikButtonCreate;
let CoinEvents= require("../BuisnessEvents");

let OmniInit= new CoinEvents.BEvent("OM-Init",[""],.5,OmniTimeOut);
let OmniEnd= new CoinEvents.BEvent("OM-End",["OM-Init"],.01,null);


import {commandObject} from '../DiscordCommunication';
import {commandArgs} from '../DiscordCommunication';
import {CoinFlipResponse} from '../CoinFlip'
import {QwikButtonTypes,QwikButtonConfig,QwikButtonStyles,QwikAttributes,QwikPostProcess}  from '../DiscordButtons';

const QwikButtons = new QwikButtonCreate();

module.exports=
{

    LoadCommands:function():Array<commandObject>
    {
        return [
        {Name:"coinflip" ,Logic:{Func:Flip,Args:["ID","Amount"]}},
        {Name:"niceflip" ,Logic:{Func:NiceFlip,Args:["ID"]}},
        {Name:"multiflip" ,Logic:{Func:Flip,Args:["ID","Amount"]}},
        {Name:"omniflip" ,Logic:{Func:OmniFlipConfirm,Args:["ID"]}},
        {Name:"omniflipaccept",Logic:{Func:OmniFlipAccept,Args:["ID"]}},
        {Name:"omniflipdeny",Logic:{Func:OmniFlipDeny,Args:["ID"]}},
        {Name:"omniflipchance",Logic:{Func:OmniFlipChance,Args:["ID"]}}
        ];
    }

}

function NiceFlip(args:commandArgs)
{
    args.Amount=69;
    return Flip(args);
} 

function Flip(args:commandArgs) 
{
    let responses=[] as Array<CoinFlipResponse>;
    if(args.Amount==undefined)
        responses=responses.concat(cf.CommandSetRequest(args.UserID,1));
    else
        responses=responses.concat(cf.CommandSetRequest(args.UserID,args.Amount));
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
        let OtherPlayer;
        let splitCounter=0;
        let sideCounter=0;
        if(responses[0].coinWin==args.UserID)
            OtherPlayer=responses[0].coinLose;
        else
            OtherPlayer=responses[0].coinWin;
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
                sideCounter++;
            else if(responses[x].coinSide=="split")
                splitCounter++;

        }
        coinflipResultText+=`\n<@${args.UserID}> had ${player2} flip${player2 > 1 ||player2==0 ? "s" : ""} in their favor.`;
        coinflipResultText+=`\n<@${OtherPlayer}> had ${player1} flip${player1 > 1 ||player1==0? "s" : ""} in their favor.`;
        coinflipResultText+=`\n\n${splitCounter} coin${splitCounter > 1||splitCounter==0 ? "s" : ""} split`;
        coinflipResultText+=`\n${sideCounter} coin${sideCounter > 1||sideCounter==0 ? "s" : ""} landed on their side`;

        if(player1!=player2)
        {
            if(player2>player1)
            {
                coinflipResultText+=`\n\n<@${args.UserID}> has won ${player2-player1} :coffee: ${player2-player1 > 1 ? "s" : ""} !`;
            }
            else
            {
                coinflipResultText+=`\n\n<@${OtherPlayer}> has won ${player1-player2} :coffee: ${player1-player2 > 1 ? "s" : ""} !`;
            }
        }
        else
            coinflipResultText+=`\n\nBoth Players tied, no coffess owed!`;
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
        if(args.Amount==undefined)
            responseString=`<@${args.UserID}> has revoked their Coin Flip offer.`
        else
            responseString=`<@${args.UserID}> has revoked their Multi Flip offer.`

        return Reply(null,responseString);
    }
    else if (responses[0].message.toLowerCase().includes("created"))
    {
        let button;
        let responseString:string;
        if(args.Amount==undefined)
        {
             button=QwikButtons.CreateButtonComponent(
                [
                    {
                     command:{Command:"coinflip",Args:{UserID:"PROVID"}},
                     label:"Take Coin Flip ",
                     style:"SUCCESS",
                     type:QwikButtonTypes.SingleLong,
                     postProcess:{ overrideDisableLogic: false, function: DisableFlipButtonAfterClick }     
                    } 
                ]
            );
            responseString=`<@${args.UserID}> is offering a **coin flip coffee bet** for **1 coffee**.  Do **/coinflip** to take the bet, or click the button below!`;
        }
        else
        {
            button=QwikButtons.CreateButtonComponent(
                [
                    {
                     command:{Command:"multiflip",Args:{UserID:"PROVID",Amount:args.Amount}},
                     label:`Take Multi Flip for ${args.Amount} coffs`,
                     style:"SUCCESS",
                     type:QwikButtonTypes.SingleLong,
                     postProcess:{ overrideDisableLogic: false, function: DisableFlipButtonAfterClick }     
                    }
                ]
            );
            responseString=`<@${args.UserID}> is offering **${args.Amount}** coin flips for 1 :coffee: each. Do **/multiflip ${args.Amount}** to take the bet, or click the button below!`;
        }
        return Reply(null,responseString,false,button);

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
    let buttons=QwikButtons.CreateButtonComponent(
        [
            {
                command:{Command:"omniflipaccept",Args:{UserID:args.UserID}},
                label:"I'm Ready",
                style:"SUCCESS", 
                type:QwikButtonTypes.SingleShort  
            },
            {
                command:{Command:"omniflipdeny",Args:{UserID:args.UserID}},
                label:"No I'm Scared",
                style:"DANGER", 
                type:QwikButtonTypes.SingleShort     
            },
            {
                command:{Command:"omniflipchance",Args:{UserID:args.UserID}},
                label:"Choose For Me ",
                style:"PRIMARY"  , 
                type:QwikButtonTypes.SingleShort   
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
    let OtherPlayer;
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


function DisableFlipButtonAfterClick() : QwikAttributes
{

        return{style:QwikButtonStyles.Secondary,disable:true,text:"taken"};

}
