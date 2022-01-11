"use strict"

let tResponse= require("../Response");

import {commandObject} from './SharedCommandObject';
import {commandArgs} from './SharedCommandObject';

module.exports=
{
    LoadCommands:function() :Array<commandObject>
    {
        return [
            {Name:"talk" ,Logic:{Func:Talk,Args:["ID"]}}
         ];
     
    }
}

async function Talk(args:commandArgs)
{
         return await [tResponse.CommandTalk(args.UserID,args.text)];
        
}