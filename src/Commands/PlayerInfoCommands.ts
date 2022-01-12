"use strict"
let pfIO= require("../FileIO");
let pfCom= require("../Communication");
import {commandObject} from './SharedCommandObject';
import {commandArgs} from './SharedCommandObject';

module.exports={

LoadCommands:function():Array<commandObject>
{
    return [
    {Name:"checkAgree" ,Logic:{Func:CheckAgree,Args:["ID",]}},
    {Name:"profile" ,Logic:{Func:Profile,Args:["ID","RefID1"]}},
    {Name:"leaderboard" ,Logic:{Func:Leader,Args:[]}},
    {Name:"ledger" ,Logic:{Func:Ledger,Args:[]}}
    ];
}

}

function Leader(args:commandArgs)
{
    const embed = pfCom.Embed(
        ":coffee: Leaderboard",
        getLeaderboardString(),
        null,
        false,
        "BLURPLE",
        ""
        );
    return [pfCom.Request(pfCom.Type.Reply, embed, "", pfCom.Type.Visible)];
} 

function Profile(args:commandArgs)
{
    let selectedUser="";
    let selectedAvatar=""
    let selectedName=""
if(args.RefID1!=undefined)
{
    selectedUser=args.RefID1;
    selectedAvatar=args.R1IDAvatar;
    selectedName=args.R1IDName;
}
else
{
    selectedUser=args.UserID;
    selectedAvatar=args.UIDAvatar;
    selectedName=args.UIDName;

}
    return [getProfileString(selectedUser,selectedAvatar,selectedName)];
}

function CheckAgree(args:commandArgs){
    if(pfIO.playerAgreedToTerms(args.UserID)){ 
    let embedText=`One must accept accept the following terms & conditions to participate in the :coffee: economy:
    
    :one: I agree a :coffee: is worth $2 towards a food or drink purchase
        
    :two: I agree that I will not bet more than I can afford
    
    :three: I agree that anyone may ask to cashout coffees at any time with proof of a receipt
    
    :four: I agree that if I am unable to payout my coffees upon being requested, I must declare bankruptcy and will be suspended from the :coffee: system for [my net oweage * 4] days
    
    By doing \`/agree\` you accept to these terms & conditions`;
    let embed= pfCom.Embed("Coffee Economy Terms & Conditions",embedText,null,false,"YELLOW","https://lh3.googleusercontent.com/proxy/-aeVwzFtgt_rnoLyJpHjtQSUKRbDtJNLTH8w5bybehJW4ibOJA_PFlnLiSsjdPElbpoyOGCdf8otyNGFvchWfjKjUuUWmZguwe8");
    return [pfCom.Request(pfCom.Type.Reply,embed,"",pfCom.Type.Visible)];
    }
    else
    return [];
} 

function Ledger(args:commandArgs) 
{

    const ledgerEmbed = pfCom.Embed(
        "Coffee Ledger",
        getCoffeeLedgerString(),
        null,
        false,
        "BLURPLE",
        ""
        );

        return [pfCom.Request(pfCom.Type.Reply, ledgerEmbed, "", pfCom.Type.Visible)];
} 

function getProfileString(id,avatar,name) {
    let owedCoffs = "";
    let receivingCoffs = "";
    let pString="";
    let data=pfIO.getUserProfile(id);
    for(let x=0;x<data.Ledger.length;x++)
    {
        let textString=`**${data.Ledger[x].Amount}** <@${data.Ledger[x].ID}>\n`;
        if(data.Ledger[x].Amount<0)
        {
            owedCoffs += textString
        }
        else if(data.Ledger[x].Amount>0)
        {
            receivingCoffs += textString
        }
    }
    if (owedCoffs == "") {
        owedCoffs = "No owed coffs!\n";
    }
    if (receivingCoffs == "") {
        receivingCoffs = "No redeemable coffs!\n";
    }
    pString += `**Owed :coffee:**\n${owedCoffs}\n**Redeemable :coffee:**\n${receivingCoffs}\n**Net :coffee: worth\n${
        data.ReceivingCoffs - data.OwedCoffs
    }**`
    
    if (data.Venmo!='') {
        pString += `\n\n**Venmo 💰**\n${data.Venmo}`
    }
        const profilEmbed = new pfCom.Embed(
            `${name}'s profile`,
            pString,
            null,
            false,
            "BLURPLE",
            `https://cdn.discordapp.com/avatars/${id}/${avatar}`
        )
    return pfCom.Request(pfCom.Type.Reply,profilEmbed,"",pfCom.Type.Visible);
}

function getCoffeeLedgerString() {
    let coffeeLedger = pfIO.GetPlayerLedger();
    let coffeeLedgerString="";
    for(let x=0;x<coffeeLedger.length;x++)
    {
        coffeeLedgerString += `**${coffeeLedger[x].Amount}** <@${coffeeLedger[x].MainID}> -> <@${coffeeLedger[x].LedgerID}>\n\n`;
    }
    return coffeeLedgerString;
}

function getLeaderboardString() {
    let leaderboard = pfIO.GetPlayerTotals();
    let coffeeLeaderboardString = "";
    for(let x=0;x<leaderboard.length;x++)
    {
        if(x==0)
        {
            coffeeLeaderboardString += `**${leaderboard[x].Total}** <@${leaderboard[x].ID}> :crown:\n\n`; 
        }
        else if(x==leaderboard.length-1)
        {
            coffeeLeaderboardString += `**${leaderboard[x].Total}** <@${leaderboard[x].ID}> :hot_face:\n\n`; 
        }
        else
        {
            coffeeLeaderboardString += `**${leaderboard[x].Total}** <@${leaderboard[x].ID}> \n\n`; 
        }
    }
    return coffeeLeaderboardString;
}