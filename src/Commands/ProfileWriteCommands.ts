"use strict"
let pfWIO= require("../FileIO");
const {Reply}= require("../Communication");
import {commandObject} from './SharedCommandObject';
import {commandArgs} from './SharedCommandObject';

module.exports={

    LoadCommands:function():Array<commandObject>
    {
        return [
        {Name:"venmo" ,Logic:{Func:Venmo,Args:["ID","Text"]}},
        {Name:"agree" ,Logic:{Func:Agree,Args:["ID"]}},
        {Name:"give" ,Logic:{Func:Give,Args:["ID","RefID1","Amount"]}},
        {Name:"redeem" ,Logic:{Func:Redeem,Args:["ID","RefID1","Amount"]}},
        {Name:"transfer" ,Logic:{Func:Transfer,Args:["ID","RefID1","RefID2","Amount"]}},
        ];
    }
}

function Venmo(args:commandArgs) {
    pfWIO.setVenmo(args.UserID, args.text)
    return Reply(null,`<@${args.UserID}> has set their venmo!`);
    
} 
function Give(args:commandArgs){
    var returnList=VeriftyCoffTransaction(args);
    if(returnList) 
        return returnList;
    pfWIO.AddUserCoffee(args.UserID ,args.RefID1,args.amount,"GIVE");
    return Reply(null,`<@${args.UserID}> gave <@${args.RefID1}> ${args.amount} coffee${args.amount > 1 ? "s" : ""}`);
} 
function Redeem(args:commandArgs) {
    var returnList=VeriftyCoffTransaction(args);
    if(returnList) 
        return returnList;
    if (pfWIO.GetUserCoffeeDebt(args.UserID,args.RefID1) <args.amount) 
        return Reply(null,`<@${args.RefID1}> does not owe you ${args.amount}`,true);
    pfWIO.RemoveUserCoffee(args.RefID1,args.UserID,args.amount,"REDEEM");
    return Reply(null,`<@${args.UserID}> redeemed ${args.amount} coffee${args.amount > 1 ? "s" : ""} from <@${args.RefID1}>`);
} 
function Transfer(args:commandArgs) {

    if (args.RefID2 == args.UserID || args.RefID1 == args.UserID) 
        return Reply(null, "Cannot transfer to or from yourself!",true);
    if(pfWIO.GetUserCoffeeDebt(args.UserID,args.RefID1)<args.amount)
        return Reply(null,`<@${args.RefID1}> does not owe you ${args.amount}`,true);

    if(pfWIO.GetUserCoffeeDebt(args.RefID2,args.UserID)<args.amount)
        return Reply(null,`You do not owe <@${args.RefID2}> ${args.amount}`,true);

    if (args.amount < 0) 
        return Reply(null,"Cannot transfer negative amount!",true);

    pfWIO.RemoveUserCoffee(args.RefID1, args.UserID, args.amount,"TRANSFER");
    pfWIO.RemoveUserCoffee(args.UserID, args.RefID2, args.amount,"TRANSFER");

    //if from = to then coffees cancel out!
    if (args.RefID1 != args.RefID2) 
        pfWIO.AddUserCoffee(args.RefID1, args.RefID2, args.amount,"TRANSFER");

    return Reply(null, `<@${args.UserID}> is transfering ${args.amount} from <@${args.RefID1}> to <@${args.RefID2}>.`);
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
    
    if (isNaN(args.amount) || args.amount <= 0) 
        return Reply(null,`Nice try hax0r man`);
    
}
