"use strict"
let flipIO = require("./FileIO");



export  interface CoinFlipResponse{ message:string,coinSide:string, coinWin:string, coinLose: string,amount:number };
interface FlipRequest {ID:string, amount:number}


let maxRequestAmount = 69; 

let flipRequests = [] as Array<FlipRequest>;


module.exports=
{
     CommandSetRequest:function(Id, requestAmount): Array<CoinFlipResponse>
     {
         let returnMessages=[] as Array<CoinFlipResponse>
         if(requestAmount>maxRequestAmount||requestAmount<0)
         {
             return [{ message:`You cant flip for that much! ${requestAmount} The Min Amount is 0, and  Max Amount is ${maxRequestAmount} `,coinSide:"", coinWin:"0", coinLose: "0",amount:0 }];
         }
         else
         {
             let checkRequestID=flipRequests.findIndex(flip=>flip.ID==Id);
             let checkRequestAmount=flipRequests.findIndex(flip=>flip.amount==requestAmount);
             if(checkRequestID!=-1&&checkRequestAmount==checkRequestID)
             {
                flipRequests.splice(checkRequestID,1);
                return [{ message:`${Id} has revoked their coin flip request of amount ${requestAmount} flips`,coinSide:"", coinWin:"", coinLose: "",amount:0 }];
             }
             else
             {
                 if(checkRequestAmount==-1)
                 {
                    flipRequests.push({ID:Id,amount:requestAmount})
                    return [{ message:`${Id} has created a coin flip request of amount ${requestAmount} flips`,coinSide:"", coinWin:"", coinLose: "",amount:0 }];
                 }
                 else
                 {
                     let TotalWinInitPlayer=0;
                     let TotalWinAnswerPlayer=0;
                    for(let x=0;x<requestAmount;x++){
                    let FlipResponse =Flip(flipRequests[checkRequestAmount].ID,Id)
                        if(FlipResponse.coinWin==flipRequests[checkRequestAmount].ID)
                            TotalWinInitPlayer+=FlipResponse.amount;
                        else
                            TotalWinAnswerPlayer+=FlipResponse.amount;
                        returnMessages.push(FlipResponse);
                    }
                    if(TotalWinInitPlayer-TotalWinAnswerPlayer>0)
                    {
                        flipIO.AddUserCoffee(Id, flipRequests[checkRequestAmount], TotalWinInitPlayer-TotalWinAnswerPlayer,"COINFLIP")
                    }
                    else if(TotalWinAnswerPlayer-TotalWinInitPlayer>0)
                    {
                        flipIO.AddUserCoffee(flipRequests[checkRequestAmount], Id, TotalWinAnswerPlayer-TotalWinInitPlayer,"COINFLIP")
                    }

                    flipRequests.splice(checkRequestAmount,1);
                    return returnMessages;
                 }
             }
         }
     },
     CommandOmniFlip:function(Id):Array<CoinFlipResponse>
     {
        let returnMessages=[] as Array<CoinFlipResponse>
        let checkRequestID=flipRequests.findIndex(flip=>flip.ID==Id);
        let checkRequestAmount=flipRequests.findIndex(flip=>flip.amount==-69);
        if(checkRequestID!=-1&&checkRequestAmount==checkRequestID)
        {
           flipRequests.splice(checkRequestID,1);
           return [{ message:`${Id} has revoked their omniflip request`,coinSide:"", coinWin:"", coinLose: "",amount:0 }];
        }
        else
        {
            if(checkRequestAmount==-1)
            {
               flipRequests.push({ID:Id,amount:-69})
              
               return [{ message:`${Id} has created an OmniFlip request`,coinSide:"", coinWin:"", coinLose: "",amount:0 }];
            }
            else
            {
                let TotalWinInitPlayer=0;
                let TotalWinAnswerPlayer=0;
                for(let y=0;y<100;y++)
                    for(let x=0;x<100;x++){
                        let FlipResponse =Flip(flipRequests[checkRequestAmount].ID,Id)
                        if(FlipResponse.coinWin==flipRequests[checkRequestAmount].ID)
                            TotalWinInitPlayer+=FlipResponse.amount;
                        else
                            TotalWinAnswerPlayer+=FlipResponse.amount;
                        returnMessages.push(FlipResponse);
                    }
                    if(TotalWinInitPlayer-TotalWinAnswerPlayer>0)
                    {
                        flipIO.AddUserCoffee(Id, flipRequests[checkRequestAmount], TotalWinInitPlayer-TotalWinAnswerPlayer,"COINFLIP")
                    }
                    else if(TotalWinAnswerPlayer-TotalWinInitPlayer>0)
                    {
                        flipIO.AddUserCoffee(flipRequests[checkRequestAmount], Id, TotalWinAnswerPlayer-TotalWinInitPlayer,"COINFLIP")
                    }
               flipRequests.splice(checkRequestAmount,1);
               return returnMessages;
            }
        }

     },
     CommandEndOmniRequest:function():string
     {
        let OmniObject=flipRequests.findIndex(flip=>flip.amount==-69);
        let OmniCreator=flipRequests[OmniObject].ID;
        flipRequests.splice(OmniObject,1);
        return OmniCreator;
     }

}

 function Flip(flipper1:string, flipper2:string,initFlipValue:number=1,easterEggs:boolean=true):CoinFlipResponse
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

    return { message:"", coinSide: unique, coinWin: winner, coinLose: loser ,amount:flipValue } as CoinFlipResponse;
}

