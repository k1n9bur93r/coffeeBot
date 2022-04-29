"use strict"
let pfIO= require("../FileIO");
const {Reply,Embed}= require("../DiscordCommunication");
import {commandObject} from '../DiscordCommunication';
import {commandArgs} from '../DiscordCommunication';

module.exports={

LoadCommands:function():Array<commandObject>
{
    return [
    {Name:"checkAgree" ,Logic:{Func:CheckAgree,Args:["ID",]}},
    {Name:"profile" ,Logic:{Func:Profile,Args:["ID","RefID1"]}},
    {Name:"leaderboard" ,Logic:{Func:Leader,Args:[]}},
    {Name:"ledger" ,Logic:{Func:Ledger,Args:[]}}];
}

}

function Leader(args:commandArgs)
{
    const embed =Embed(
        ":coffee: Leaderboard",
        getLeaderboardString(),
        null,
        false,
        "BLURPLE",
        ""
        );
    return Reply( embed, "");
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
    return getProfileString(selectedUser,selectedAvatar,selectedName);
}

function CheckAgree(args:commandArgs){
    if(!pfIO.playerAgreedToTerms(args.UserID)){ 
    let embedText=`One must accept accept the following terms & conditions to participate in the :coffee: economy:
    
1️⃣ I agree a ☕ is worth $1 towards a food or drink purchase

2️⃣ I understand I cannot participate in coffee bets after being more than 99 coffees in debt

3️⃣ I agree that anyone may ask to cash out ☕ at any time with proof of a receipt

4️⃣ I understand that a person is only obliged to pay out a max of 20 ☕️ per day (with exception), but may elect to pay out more than 20 ☕️ per day at their discretion.

5️⃣ I agree to not attempt defrauding the system and people

6️⃣ I agree that in order to make changes to the coffconomy, a proposal must pass a vote with both #gamba majority AND coff holder majority (where 1 coff = 1 vote)

    By doing \`/agree\` you accept to these terms & conditions`;
    let embed= Embed("Coffee Economy Terms & Conditions",embedText,null,false,"YELLOW","https://lh3.googleusercontent.com/proxy/-aeVwzFtgt_rnoLyJpHjtQSUKRbDtJNLTH8w5bybehJW4ibOJA_PFlnLiSsjdPElbpoyOGCdf8otyNGFvchWfjKjUuUWmZguwe8");
    return Reply(embed,"");
    }
    return null;
} 

function Ledger(args:commandArgs) 
{
    const ledgerEmbed = Embed(
        "Coffee Ledger",
        getCoffeeLedgerString(),
        null,
        false,
        "BLURPLE",
        ""
        );
        return Reply( ledgerEmbed, "");
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
        const profilEmbed = Embed(
            `${name}'s profile`,
            pString,
            null,
            false,
            "BLURPLE",
            `https://cdn.discordapp.com/avatars/${id}/${avatar}`
        )
    return Reply(profilEmbed,"");
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
        if(leaderboard[x].Total==0)continue;
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
    if(coffeeLeaderboardString=="") coffeeLeaderboardString="No one owes anyone anything and no one has anything from anyone. There are no coffees to be made or coffees to be had. The banks are barren. The debt is gone. Wealth does not exist as we are all equal. For this brief moment let us hold hands in what is, and forget about what was. Enjoy the moment, before someone becomes beholden to their fellow man. "
    return coffeeLeaderboardString;
}
