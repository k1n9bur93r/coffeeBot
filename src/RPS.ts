"use strict"

let rpsIO= require("./FileIO");


let curRPSChoice:Array<Userchoices> = [];

export interface RPSResponse{success:boolean,message:string ,isWinner:boolean,winnerID:number,loserID:number,choices:Array<Userchoices>};
interface Userchoices {id:number, choice:string};

module.exports={

CommandRPS:function(id, choice)
{
let response ={} as RPSResponse;
response.choices=[] as Array<Userchoices>;
        if (curRPSChoice.length == 0) {

            response.success=true;
            response.isWinner=false;
            response.message="Game Created";
            curRPSChoice.push({id:id,choice:choice});
            response.choices.push({id:id,choice:choice});

            return response;
        }

        if (curRPSChoice[0].id == id) {

            curRPSChoice = [];
            response.isWinner=false;
            response.success=true;
            response.message="Game Revoked";
            
            return response;
        }
        curRPSChoice.push({id:id,choice:choice});
        // if still here then execute rps
        let player1ChoiceIndex=-1;
        let player2ChoiceIndex=-1;
        let choices = ["Rock", "Paper", "Scissors"];

        player1ChoiceIndex = choices.indexOf(curRPSChoice[0].choice);
        player2ChoiceIndex= choices.indexOf(curRPSChoice[1].choice);
        
        if (player1ChoiceIndex == player2ChoiceIndex) 
        {
            response.success=true;
            response.message="Tie";
            response.isWinner =false;
            response.choices=response.choices.concat(curRPSChoice);
            curRPSChoice = [];
            //tie
            return response;// tie 
        } else if ((player1ChoiceIndex + 1) % 3 != player2ChoiceIndex) {
            //player1 won
            rpsIO.AddUserCoffee(curRPSChoice[1].id, curRPSChoice[0].id, 1,"RPS");
            response.success=true;
            response.message="Player 1 Wins";
            response.isWinner =true;
            response.winnerID=curRPSChoice[0].id;
            response.loserID=curRPSChoice[1].id;
            response.choices=response.choices.concat(curRPSChoice);
            curRPSChoice = [];
            return response;  //player 1 wins 
        } else {
            //player2 won

            rpsIO.AddUserCoffee(curRPSChoice[0].id, curRPSChoice[1].id, 1,"RPS");
            response.success=true;
            response.message="Player 2 Wins";
            response.isWinner =true;
            response.loserID=curRPSChoice[0].id;
            response.winnerID=curRPSChoice[1].id;
            response.choices=response.choices.concat(curRPSChoice);
            curRPSChoice = [];
            return response;// player two wins 
        
    
}

}

}