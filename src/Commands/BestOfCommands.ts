"use strict"
let bs = require("../BestOf");

import {commandObject} from './SharedCommandObject';
import {commandArgs} from './SharedCommandObject';
module.exports={

    LoadCommands:function():Array<commandObject>
    {
        return [
        {Name:"bestjoin" ,Logic:{Func:Join,Args:["ID"]}},
        {Name:"bestcreate" ,Logic:{Func:Create,Args:["ID","Amount","Amount2"]}},
        {Name:"bestplayers" ,Logic:{Func:Players,Args:[]}}
        ];
    }
}

function Join(args:commandArgs){

        return bs.CommandAddPlayer(args.UserID);
} 
function Create(args:commandArgs){

        return bs.CommandNewBestOf(args.UserID,"21",args.amount,args.amount2);
} 
function Players(args:commandArgs){
return bs.CommandBestOfPlayerMessage();
    
} 
