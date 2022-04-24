const {Reply,Buttons}= require("../DiscordCommunication");
let social= require("../SocialGames");

import {commandObject} from '../DiscordCommunication';
import {commandArgs} from '../DiscordCommunication';
import { ButtonTypes } from '../DiscordCommunication';

module.exports={

    LoadCommands:function():Array<commandObject>
    {
        return [
        {Name:"drop",Logic:{Func:Drop,Args:["ID","Amount"]}}
        ];
    }
}


function Drop(args:commandArgs)
{
let response=social.CommandCoffeeDrop(args.UserID,args.Amount);
if(response.Success==true)
{
return Reply(null,response.Message);
}
else
{
    return Reply(null,response.Message,true);
}

}