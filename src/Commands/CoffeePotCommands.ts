"use strict"

const {Reply,Embed}= require("../Communication");
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
            return Reply(null,`There is not Coffe Pot round currently running, make one with /startpot!`,true);
        else if(responseObject.message.toLowerCase().includes("invalid"))
            return Reply(null,`Your choice ${args.amount} was not between 1 and 1000`,true);
        else if(responseObject.message.toLowerCase().includes("exists"))
            return Reply(null,`You are already in this Coffee Pot round!`,true);
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
                

            let embed=Embed("Coffee Pot Results",coffeePotText,fields,true,"WHITE","https://www.krupsusa.com/medias/?context=bWFzdGVyfGltYWdlc3wxNDQ4OTJ8aW1hZ2UvanBlZ3xpbWFnZXMvaDk5L2hiMS8xMzg3MTUxMjk0NDY3MC5iaW58NzZkZDc3MGJhYmQzMjAwYjc4NmJjN2NjOGMxN2UwZmNkODQ2ZjMwZWE0YzM4OWY4MDFmOTFkZWUxYWVkMzU5Zg");

            return Reply(embed,` `);    
        }
        else
        {
            if(responseObject.message.toLowerCase().includes("joined")) //this data should exist as a broadcast
            
                return Reply(null,`<@${args.UserID}> joined the pot! Slots remaining: **${cp.CoffeePotSize() - responseObject.guesses.length}**`);
            
            else if(responseObject.message.toLowerCase().includes("tie"))
            {
                let coffeePotText="There was a TIE! No coffees owed!";
                let fields=[];
                let playerCounter=1;
                responseObject.guesses.forEach(guess => {
                    fields.push({title:`Player ${playerCounter}`,content:`<@${guess.id}>'s Guess ${guess.guess} `,fieldsAlign:false});
                    playerCounter++;
                });
                    
                let embed=Embed("Coffee Pot Results",coffeePotText,fields,true,"WHITE","https://www.krupsusa.com/medias/?context=bWFzdGVyfGltYWdlc3wxNDQ4OTJ8aW1hZ2UvanBlZ3xpbWFnZXMvaDk5L2hiMS8xMzg3MTUxMjk0NDY3MC5iaW58NzZkZDc3MGJhYmQzMjAwYjc4NmJjN2NjOGMxN2UwZmNkODQ2ZjMwZWE0YzM4OWY4MDFmOTFkZWUxYWVkMzU5Zg");
            return Reply(embed,``,true);    
            }
        }
        return Reply(`LOGIC HOLE`);   
    }
}
function StartPot(args:commandArgs)
{
    let responseObject:CoffeePotResponse= cp.CommandStartPot(args.amount);
    if(!responseObject.success)
        return Reply(null,"Coffee Pot must have at least two spots!",true);
    else
    {
        let coffeePotText =
        `<@${args.UserID}> is starting a :coffee: pot with ***${args.amount}*** spots!\n\n` +
        `**How it works:**\n` +
        `• Players may wager 1 :coffee: by doing ***/joinpot [# between 1 and 1000]***\n` +
        `• Once **${args.amount}** players join the pot, then a random number is selected\n` +
        `• The closest guesser to the number takes all the :coffee: in the pot`;
        let embed=Embed("Coffee Pot",coffeePotText,null,false,"WHITE","https://www.krupsusa.com/medias/?context=bWFzdGVyfGltYWdlc3wxNDQ4OTJ8aW1hZ2UvanBlZ3xpbWFnZXMvaDk5L2hiMS8xMzg3MTUxMjk0NDY3MC5iaW58NzZkZDc3MGJhYmQzMjAwYjc4NmJjN2NjOGMxN2UwZmNkODQ2ZjMwZWE0YzM4OWY4MDFmOTFkZWUxYWVkMzU5Zg");
        return Reply(embed,"");
    }
}
