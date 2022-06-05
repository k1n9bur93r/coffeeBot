"use strict"
let bs = require("../BestOf");

import {commandObject} from '../DiscordCommunication';
import {commandArgs} from '../DiscordCommunication';
module.exports={

    LoadCommands:function():Array<commandObject>
    {
        return [
        {Name:"bestjoin" ,Logic:{Func:Join,Args:["ID"]}},
        {Name:"bestcreate" ,Logic:{Func:Create,Args:["ID","Amount","Amount2","Text"]}},
        {Name:"bestplayers" ,Logic:{Func:Players,Args:[]}}
        ];
    }
}

function Join(args:commandArgs){
        return bs.CommandAddPlayer(args.UserID);
} 
function Create(args:commandArgs){
        return bs.CommandNewBestOf(args.UserID,args.Text,args.Amount,args.Amount2);
} 
function Players(args:commandArgs){
    return bs.CommandBestOfPlayerMessage();
} 
