"use strict"
let cg= require("../CardGame");
let bscg= require("../BestOf");
const {Reply}= require("../DiscordCommunication");
import {commandObject} from '../DiscordCommunication';
import {commandArgs} from '../DiscordCommunication';


module.exports={
    LoadCommands:function() :Array<commandObject>
    {
        return [
            {Name:"21" ,Logic:{Func:New,Args:["ID","Amount"]}},
            {Name:"stay" ,Logic:{Func:Stay,Args:["ID"]}},
            {Name:"hand" ,Logic:{Func:Hand,Args:["ID"]}},
            {Name:"draw",Logic:{Func:Draw,Args:["ID"]}},
         ];
     
    },
    CGBSHandler: function(timeout,isGameRunning){
        return CGBestOfHandler(timeout, isGameRunning);
    } 
}
    function New(args:commandArgs)
    {
        args.Amount=2;
        var list=bscg.CommandBestOfPlayerList();
    if(list.length!=0&&bscg.CommandBestOfType()=="21"&&!bscg.CommandBestOfRunning())
    {
          if(list[0]==args.UserID)
          {
            bscg.CommandBestOfStart();
            cg.CommandStartJoinGame(list[0],args.Amount,false); 
             for(var x=1;x<list.length;x++)
             {
                 cg.CommandStartJoinGame(list[x],args.Amount,false); 
             }
             return cg.CommandStartJoinGame(args.UserID,args.Amount); 
          }
        else
            return Reply(null,"You can't start a game of 21 if there is a 'Best Of' set pending. join up to it now with ./bestjoin !");
    }
    else
        return cg.CommandStartJoinGame(args.UserID,args.Amount); 
    }
    function Stay(args:commandArgs)
    {
        let CommandReply= cg.CommandStay(args.UserID);
        
        CGBestOfHandler();
        return CommandReply;
    }
    function Draw(args:commandArgs)
    {
        let CommandReply=cg.CommandDraw(args.UserID);
        CGBestOfHandler();
        return CommandReply;
    }
    function Hand(args:commandArgs)
    {
        return cg.CommandHand(args.UserID);
    }

    function CGBestOfHandler(timeout=false,isGameRunning:boolean=true)
    {
        var pastWinner=cg.CommandGetPastWinner();
        if(bscg.CommandBestOfRunning()==isGameRunning&&pastWinner!=0&&bscg.CommandBestOfType()=="21")
            bscg.CommandAddWinner(pastWinner,timeout);
        if(bscg.CommandBestOfRunning()&&!cg.CommandGameRunning())
        {
            var list=bscg.CommandBestOfPlayerList();
            for(var x=0;x<list.length;x++)
            {
                cg.CommandStartJoinGame(list[x],1,false);
            }
            cg.CommandStartJoinGame(list[0],1,false);
            
        }  
    }




