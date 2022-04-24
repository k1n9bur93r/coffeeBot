"use strict"
let pfWIO= require("../FileIO");
const {Reply}= require("../DiscordCommunication");
import {commandObject} from '../DiscordCommunication';
import {commandArgs} from '../DiscordCommunication';

module.exports={

    LoadCommands:function():Array<commandObject>
    {
        return [
        {Name:"venmo" ,Logic:{Func:Venmo,Args:["ID","Text"]}},
        {Name:"agree" ,Logic:{Func:Agree,Args:["ID"]}},
        {Name:"give" ,Logic:{Func:Give,Args:["ID","RefID1","Amount"]}},
        {Name:"redeem" ,Logic:{Func:Redeem,Args:["ID","RefID1","Amount"]}},
        {Name:"transfer" ,Logic:{Func:Transfer,Args:["ID","RefID1","RefID2","Amount"]}},
        {Name:"autobalance" ,Logic:{Func:AutoBalance,Args:["ID"]}}
        ];
    }
}

function Venmo(args:commandArgs) {
    pfWIO.setVenmo(args.UserID, args.Text)
    return Reply(null,`<@${args.UserID}> has set their venmo!`);
    
} 
function Give(args:commandArgs){
    var returnList=VeriftyCoffTransaction(args);
    if(returnList) 
        return returnList;
    pfWIO.AddUserCoffee(args.UserID ,args.RefID1,args.Amount,"GIVE");
    return Reply(null,`<@${args.UserID}> gave <@${args.RefID1}> ${args.Amount} coffee${args.Amount > 1 ? "s" : ""}`);
} 
function Redeem(args:commandArgs) {
    var returnList=VeriftyCoffTransaction(args);
    if(returnList) 
        return returnList;
    if (pfWIO.GetUserCoffeeDebt(args.UserID,args.RefID1) <args.Amount) 
        return Reply(null,`<@${args.RefID1}> does not owe you ${args.Amount}`,true);
    pfWIO.RemoveUserCoffee(args.RefID1,args.UserID,args.Amount,"REDEEM");
    return Reply(null,`<@${args.UserID}> redeemed ${args.Amount} coffee${args.Amount > 1 ? "s" : ""} from <@${args.RefID1}>`);
} 
function Transfer(args:commandArgs) {
    
    let results=pfWIO.GetPlayerTransfer(args.RefID2,args.UserID,args.RefID1,args.Amount);
    if(results.Sucess==false)
    {
        return Reply(null,results.Message,true);
    }
    else
    {
        return Reply(null,results.Message);
    }
} 
function Agree(args:commandArgs) {
    pfWIO.agreePlayer(args.UserID)
    return Reply(null,`<@${args.UserID}> has agreed to the terms & conditions!`);
}
function VeriftyCoffTransaction(args:commandArgs)
{
    if (args.RefID1) {
        if (args.RefID1 == undefined) 
            return Reply(null,`You must @ an existing person`,true);
    }
    if (args.UserID == args.RefID1) 
        return Reply(null,`You cannot interact with yourself lul`,true);
    
    if (isNaN(args.Amount) || args.Amount <= 0) 
        return Reply(null,`Nice try hax0r man`);
    
}
function AutoBalance(args:commandArgs)
{
    let response= pfWIO.SetPlayerAutoBalance(args.UserID);
    if(response)
        return Reply(null,"Balanced!",true);
    else
        return Reply(null,"There was an error, failed to Balance.",true);
}


