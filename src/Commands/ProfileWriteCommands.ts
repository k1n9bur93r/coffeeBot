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

    if (args.RefID2 == args.UserID || args.RefID1 == args.UserID) 
        return Reply(null, "Cannot transfer to or from yourself!",true);
    if(pfWIO.GetUserCoffeeDebt(args.UserID,args.RefID1)<args.Amount)
        return Reply(null,`<@${args.RefID1}> does not owe you ${args.Amount}`,true);

    if(pfWIO.GetUserCoffeeDebt(args.RefID2,args.UserID)<args.Amount)
        return Reply(null,`You do not owe <@${args.RefID2}> ${args.Amount}`,true);

    if (args.Amount < 0) 
        return Reply(null,"Cannot transfer negative amount!",true);

    pfWIO.RemoveUserCoffee(args.RefID1, args.UserID, args.Amount,"TRANSFER");
    pfWIO.RemoveUserCoffee(args.UserID, args.RefID2, args.Amount,"TRANSFER");

    //if from = to then coffees cancel out!
    if (args.RefID1 != args.RefID2) 
        pfWIO.AddUserCoffee(args.RefID1, args.RefID2, args.Amount,"TRANSFER");

    return Reply(null, `<@${args.UserID}> is transfering ${args.Amount} from <@${args.RefID1}> to <@${args.RefID2}>.`);
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
