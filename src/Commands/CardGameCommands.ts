"use strict"
let cg= require("../CardGame");
let bscg= require("../BestOf");
let cgCom= require("../Communication");
import {commandObject} from './SharedCommandObject';
import {commandArgs} from './SharedCommandObject';
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
        var returnList=[];
        var list=bscg.CommandBestOfPlayerList();
    if(list.length!=0&&bscg.CommandBestOfType()=="21"&&!bscg.CommandBestOfRunning())
        {
          if(list[0]==args.UserID)
         {
              bscg.CommandBestOfStart();
              cg.CommandStartJoinGame(list[0],args.amount); //returns array //Update to handle a string 
             for(var x=1;x<list.length;x++)
             {
                 returnList=returnList.concat(cg.CommandStartJoinGame(list[x],args.amount,false)); //returns array
             }
             returnList=returnList.concat(cg.CommandStartJoinGame(args.UserID,args.amount,false)); //returns array
             return returnList;
            }
        else
            {
               
            return [cgCom.Request(cgCom.Type.Reply,null,"You can't start a game of 21 if there is a 'Best Of' set pending. join up to it now with ./bestjoin !",cgCom.Type.Visible)];
                
        }
    }
    else
    {
            return cg.CommandStartJoinGame(args.UserID,args.amount); //update to handle a string 
    }

    }
    function Stay(args:commandArgs)
    {
        var returnList=[];
        returnList=returnList.concat(cg.CommandStay(args.UserID));
        returnList=returnList.concat(CGBestOfHandler());
        return returnList;
    }
    function Draw(args:commandArgs)
    {
        var returnList=[];
        returnList=returnList.concat(cg.CommandDraw(args.UserID));
        returnList=returnList.concat(CGBestOfHandler());
        return returnList;
    }
    function Hand(args:commandArgs)
    {
        return cg.CommandHand(args.UserID);
    }


    function CGBestOfHandler(timeout=false,isGameRunning:boolean=true)
    {
        var returnList=[];
        var pastWinner=cg.CommandGetPastWinner();
        if(bscg.CommandBestOfRunning()==isGameRunning&&pastWinner!=0&&bscg.CommandBestOfType()=="21")
            returnList=returnList.concat(bscg.CommandAddWinner(pastWinner,timeout));
        if(bscg.CommandBestOfRunning()&&!cg.CommandGameRunning())
        {
            var list=bscg.CommandBestOfPlayerList();
            for(var x=0;x<list.length;x++)
            {
                returnList=returnList.concat(cg.CommandStartJoinGame(list[x],1,false));
            }
            returnList=returnList.concat(cg.CommandStartJoinGame(list[0],1,false));
            
        }  
        return returnList;
    }