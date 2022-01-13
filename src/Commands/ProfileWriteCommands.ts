"use strict"
let pfWIO= require("../FileIO");
let pfWCom= require("../Communication");
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
    return [pfWCom.Request(pfWCom.Type.Reply,null,`<@${args.UserID}> has set their venmo!`,pfWCom.Type.Visible)];
    
} 
function Give(args:commandArgs){
    var returnList=VeriftyCoffTransaction(args);
    if(returnList.length!=0) 
        return returnList;
    pfWIO.AddUserCoffee(args.UserID ,args.RefID1,args.amount,"GIVE");
    return [pfWCom.Request(pfWCom.Type.Reply,null,`<@${args.UserID}> gave <@${args.RefID1}> ${args.amount} coffee${args.amount > 1 ? "s" : ""}`,pfWCom.Type.Visible)];
} 
function Redeem(args:commandArgs) {
    var returnList=VeriftyCoffTransaction(args);
    if(returnList.length!=0) 
        return returnList;
    if (pfWIO.GetUserCoffeeDebt(args.UserID,args.RefID1) <args.amount) 
        return [pfWCom.Request(pfWCom.Type.Reply,null,`<@${args.RefID1}> does not owe you ${args.amount}`,pfWCom.Type.Hidden)];
    pfWIO.RemoveUserCoffee(args.RefID1,args.UserID,args.amount,"REDEEM");
    return [pfWCom.Request(pfWCom.Type.Reply,null,`<@${args.UserID}> redeemed ${args.amount} coffee${args.amount > 1 ? "s" : ""} from <@${args.RefID1}>`,pfWCom.Type.Visible)];
} 
function Transfer(args:commandArgs) {

    console.log(`user RefID one ${args.RefID1} user RedID two ${args.RefID2} calling user ${args.UserID}`);
    if (args.RefID2 == args.UserID || args.RefID1 == args.UserID) 
        return [pfWCom.Request(pfWCom.Type.Reply,null, "Cannot transfer to or from yourself!",pfWCom.Type.Hidden)];
    if(pfWIO.GetUserCoffeeDebt(args.UserID,args.RefID1)<args.amount)
        return [pfWCom.Request(pfWCom.Type.Reply,null,`<@${args.RefID1}> does not owe you ${args.amount}`,pfWCom.Type.Hidden)];

    if(pfWIO.GetUserCoffeeDebt(args.RefID2,args.UserID)<args.amount)
        return [pfWCom.Request(pfWCom.Type.Reply,null,`You do not owe <@${args.RefID2}> ${args.amount}`,pfWCom.Type.Hidden)];

    if (args.amount < 0) 
        return [pfWCom.Request(pfWCom.Type.Reply,null,"Cannot transfer negative amount!",pfWCom.Type.Hidden)];

    console.log("This is the amount in the value thing "+args.amount)
    pfWIO.RemoveUserCoffee(args.RefID1, args.UserID, args.amount,"TRANSFER");
    pfWIO.RemoveUserCoffee(args.UserID, args.RefID2, args.amount,"TRANSFER");

    //if from = to then coffees cancel out!
    if (args.RefID1 != args.RefID2) 
        pfWIO.AddUserCoffee(args.RefID1, args.RefID2, args.amount,"TRANSFER");

    return [pfWCom.Request(pfWCom.Type.Reply,null, `<@${args.UserID}> is transfering ${args.amount} from <@${args.RefID1}> to <@${args.RefID2}>.`,pfWCom.Type.Visible)];
} 
function Agree(args:commandArgs) {
    pfWIO.agreePlayer(args.UserID)
    return [pfWCom.Request(pfWCom.Type.Reply,null,`<@${args.UserID}> has agreed to the terms & conditions!`,pfWCom.Type.Visible)];
}
function VeriftyCoffTransaction(args:commandArgs)
{
    console.log(args.amount);
    if (args.RefID1) {
        if (args.RefID1 == undefined) {
            return [pfWCom.Request(pfWCom.Type.Reply,null,`You must @ an existing person`,pfWCom.Type.Hidden)];
        }
    }
    if (args.UserID == args.RefID1) {

        return [pfWCom.Request(pfWCom.Type.Reply,null,`You cannot interact with yourself lul`,pfWCom.Type.Hidden)];
    }
    if (isNaN(args.amount) || args.amount <= 0) {
        return [pfWCom.Request(pfWCom.Type.Reply,null,`Nice try hax0r man`,pfWCom.Type.Visible)];
    }
return [];
}
