"use strict"

let tResponse= require("../Response");

import {commandObject} from '../DiscordCommunication';
import {commandArgs} from '../DiscordCommunication';

module.exports=
{
    LoadCommands:function() :Array<commandObject>
    {
        tResponse.Initalize();
        return [
            {Name:"talk" ,Logic:{Func:Talk,Args:["ID"]}}
         ];
     
    }
}

async function Talk(args:commandArgs)
{
         return await tResponse.CommandTalk(args.UserID,args.Text);
        
}