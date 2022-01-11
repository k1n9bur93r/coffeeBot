"use strict"

let cpCom= require("../Communication");
let cp=require("../CoffeePot");

import {commandObject} from './SharedCommandObject';
import {commandArgs} from './SharedCommandObject';
import {CoffeePotResponse} from '../CoffeePot';

module.exports=
{
    LoadCommands:function():Array<commandObject>
    {
        return [
        {Name:"joinpot" ,Logic:{Func:JoinPot,Args:["ID","Amount"]}},
        {Name:"startpot" ,Logic:{Func:StartPot,Args:["ID","Amount"]}}
        ];
    }
}

function JoinPot(args:commandArgs)
{
let responseObject:CoffeePotResponse=cp.CommandJoinPot(args.UserID,args.amount);

if(!responseObject.success)
    {
        if(responseObject.message.toLowerCase().includes("unavailable"))
            return [cpCom.Request(cpCom.Type.Reply,null,`There is not Coffe Pot round currently running, make one with /startpot!`,cpCom.Type.Hidden)];
        else if(responseObject.message.toLowerCase().includes("invalid"))
            return [cpCom.Request(cpCom.Type.Reply,null,`Your choice ${args.amount} was not between 1 and 1000`,cpCom.Type.Hidden)];
        else if(responseObject.message.toLowerCase().includes("exists"))
            return [cpCom.Request(cpCom.Type.Reply,null,`You are already in this Coffee Pot round!`,cpCom.Type.Hidden)];
    }
    else
    {
        if(responseObject.isWinner==true)
        {
            let coffeePotText=`<@${responseObject.winnerId}> has won ${responseObject.guesses.length-1} Coff ${responseObject.guesses.length-1 > 1 ? "s" : ""}!\n The Coffee Pot value was *${responseObject.potValue}*`;
            let fields=[];
            let playerCounter=1;
            responseObject.guesses.forEach(guess => {
                fields.push({title:`Player ${playerCounter}`,content:`<@${guess.id}>'s Guess ${guess.guess} `,fieldsAlign:false});
                playerCounter++;
            });
                

            let embed=cpCom.Embed("Coffee Pot Results",coffeePotText,fields,true,"WHITE","https://www.krupsusa.com/medias/?context=bWFzdGVyfGltYWdlc3wxNDQ4OTJ8aW1hZ2UvanBlZ3xpbWFnZXMvaDk5L2hiMS8xMzg3MTUxMjk0NDY3MC5iaW58NzZkZDc3MGJhYmQzMjAwYjc4NmJjN2NjOGMxN2UwZmNkODQ2ZjMwZWE0YzM4OWY4MDFmOTFkZWUxYWVkMzU5Zg");

            return [cpCom.Request(cpCom.Type.Reply,embed,` `,cpCom.Type.Visible)];    
        }
        else
        {
            if(responseObject.message.toLowerCase().includes("joined")) //this data should exist as a broadcast
            
                return [cpCom.Request(cpCom.Type.Reply,null,`<@${args.UserID}> joined the pot! Slots remaining: **${cp.CoffeePotSize() - responseObject.guesses.length}**`,cpCom.Type.Visible)];
            
            else if(responseObject.message.toLowerCase().includes("tie"))
            {
                let coffeePotText="There was a TIE! No coffees owed!";
                let fields=[];
                let playerCounter=1;
                responseObject.guesses.forEach(guess => {
                    fields.push({title:`Player ${playerCounter}`,content:`<@${guess.id}>'s Guess ${guess.guess} `,fieldsAlign:false});
                    playerCounter++;
                });
                    
                let embed=cpCom.Embed("Coffee Pot Results",coffeePotText,fields,true,"WHITE","https://www.krupsusa.com/medias/?context=bWFzdGVyfGltYWdlc3wxNDQ4OTJ8aW1hZ2UvanBlZ3xpbWFnZXMvaDk5L2hiMS8xMzg3MTUxMjk0NDY3MC5iaW58NzZkZDc3MGJhYmQzMjAwYjc4NmJjN2NjOGMxN2UwZmNkODQ2ZjMwZWE0YzM4OWY4MDFmOTFkZWUxYWVkMzU5Zg");
            return [cpCom.Request(cpCom.Type.Reply,embed,``,cpCom.Type.Hidden)];    
            }
        }
        return [cpCom.Request(cpCom.Type.Reply,`LOGIC HOLE`,cpCom.Type.Visible)];   
    }
}
function StartPot(args:commandArgs)
{
    let responseObject:CoffeePotResponse= cp.CommandStartPot(args.amount);
    if(!responseObject.success)
        return [cpCom.Request(cpCom.Type.Reply,null,"Coffee Pot must have at least two spots!",cpCom.Type.Hidden)];
    else
    {
        let coffeePotText =
        `<@${args.UserID}> is starting a :coffee: pot with ***${args.amount}*** spots!\n\n` +
        `**How it works:**\n` +
        `• Players may wager 1 :coffee: by doing ***/joinpot [# between 1 and 1000]***\n` +
        `• Once **${args.amount}** players join the pot, then a random number is selected\n` +
        `• The closest guesser to the number takes all the :coffee: in the pot`;
        let embed=cpCom.Embed("Coffee Pot",coffeePotText,null,false,"WHITE","https://www.krupsusa.com/medias/?context=bWFzdGVyfGltYWdlc3wxNDQ4OTJ8aW1hZ2UvanBlZ3xpbWFnZXMvaDk5L2hiMS8xMzg3MTUxMjk0NDY3MC5iaW58NzZkZDc3MGJhYmQzMjAwYjc4NmJjN2NjOGMxN2UwZmNkODQ2ZjMwZWE0YzM4OWY4MDFmOTFkZWUxYWVkMzU5Zg");
        return [cpCom.Request(cpCom.Type.Reply,embed,"",cpCom.Type.Visible)];
    }
}
