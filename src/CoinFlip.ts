"use strict"

let flipIO = require("./FileIO"); 

export  interface CoinFlipResponse{ message:string,coinSide:string, coinWin:number, coinLose: number,amount:number };
interface FlipRequest {ID:string, amount:number}

let maxRequestAmount = 5; //TODO Testing
let flipRequests = [] as Array<FlipRequest>;


module.exports=
{
     CommandSetRequest:function(Id, requestAmount): Array<CoinFlipResponse>
     {
         let returnMessages=[] as Array<CoinFlipResponse>
         if(requestAmount>maxRequestAmount||requestAmount<0)
         {
             return [{ message:`Invalid request amount "${requestAmount} Min Amount: 0, Max Amount ${maxRequestAmount}" `,coinSide:"", coinWin:0, coinLose: 0,amount:0 }];
         }
         else
         {
             let checkRequestID=flipRequests.findIndex(flip=>flip.ID==Id);
             let checkRequestAmount=flipRequests.findIndex(flip=>flip.amount==requestAmount);
             if(checkRequestID!=-1&&checkRequestAmount==checkRequestID)
             {
                flipRequests.splice(checkRequestID,1);
                return [{ message:`${Id} has revoked their coin flip request of amount ${requestAmount} flips`,coinSide:"", coinWin:0, coinLose: 0,amount:0 }];
             }
             else
             {
                 if(checkRequestAmount==-1)
                 {
                    flipRequests.push({ID:Id,amount:requestAmount})
                    return [{ message:`${Id} has created a coin flip request of amount ${requestAmount} flips`,coinSide:"", coinWin:0, coinLose: 0,amount:0 }];
                 }
                 else
                 {
                    for(let x=0;x<requestAmount;x++)
                        returnMessages.push(Flip(flipRequests[checkRequestAmount].ID,Id));
                    flipRequests.splice(checkRequestAmount,1);
                    return returnMessages;
                 }
             }
         }
     }

}

 function Flip(flipper1, flipper2,initFlipValue:number=1,easterEggs:boolean=true):CoinFlipResponse
  {
    let winner;
    let loser;
    let unique = "";
    let flipValue = initFlipValue;

    if (easterEggs&&Math.random() > 0.99) {
        // easter egg: 1% chance coin lands on side :^)
        unique = "side";
        flipValue*=0;
    }
    if (easterEggs&&Math.random() < 0.01) {
     unique="split";
     flipValue*=2;
    }

    if (Math.random() > 0.5) {
        winner = flipper1;
        loser = flipper2;
    } else {
        winner = flipper2;
        loser = flipper1;
    }

    if (flipValue!=0) 
        flipIO.AddUserCoffee(loser, winner, flipValue,"COINFLIP");

    return { message:"", coinSide: unique, coinWin: winner, coinLose: loser ,amount:flipValue };
}
