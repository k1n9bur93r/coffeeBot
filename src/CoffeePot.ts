"use strict"

let cpFileIO= require("./FileIO");

let curCoffeePotPlayers = [] as Array<CoffeePotPlayers>;
let curCoffeePotSlots = -1;

interface CoffeePotPlayers {id:number, guess:number}
export interface CoffeePotResponse{success:boolean,message:string,isWinner:boolean, winnerId:number,joinedPot:boolean,potValue:number,createdPot:boolean,guesses:CoffeePotPlayers[]}

module.exports=
{
    CommandStartPot:function (amount ) :CoffeePotResponse
{
    let responseData= {} as CoffeePotResponse;
    if (amount < 2) {
        responseData.success=false;
        responseData.message="No enought slots for CoffeePot."
        return responseData;
    }

    // clear pot players
    curCoffeePotPlayers = [];
    // set pot amount
    curCoffeePotSlots = amount;
    responseData.success=true;
    responseData.message=`Created Pot with ${amount} slots`
    return responseData;
}, 
    CommandJoinPot:function (id, amount) :CoffeePotResponse
    {

        let responseData= {} as CoffeePotResponse;
        responseData.guesses=[];
    //check if pot exists (slots == -1 means not pot exists)
    if (curCoffeePotSlots == -1) {
        responseData.success=false;
        responseData.message="Coffee Pot Unavailable to join. Create one first!"
        return responseData;
    }
    //check if number is between 1-1000
    if (amount < 1 || amount > 1000) {

        responseData.success=false;
        responseData.message=` ${amount} is an Invalid Guess. Must be between 1 and 1000 `;
        return responseData;
    }
    //check if already in pot
    if(curCoffeePotPlayers.some(player=>player.id==id))
    {
        responseData.success=false;
        responseData.message=`User ${id} is already exists`;
        return responseData;
    }

    curCoffeePotPlayers.push({id:id,guess:amount});
    responseData.success=true;
    //check if pot now full
    if (curCoffeePotSlots == curCoffeePotPlayers.length) {
        let randomNum = Math.ceil(Math.random() * 1000);
        responseData.potValue=randomNum;

        let newPlayerList: Array<CoffeePotPlayers> = [] 
         curCoffeePotPlayers.forEach(player=>{ 
            newPlayerList.push({id:player.id,guess:Math.abs(randomNum - player.guess)});
         });
        
        newPlayerList=newPlayerList.sort((a,b)=>(a.score>b.score)?1:-1);

        if (newPlayerList[0].guess ==newPlayerList[1].guess) {
            //THERE WAS A TIE!
            responseData.message="";
            responseData.isWinner=false;
            responseData.message="There was a tie!"
        } else {
            responseData.message="";
            responseData.isWinner=true;
            responseData.winnerId=newPlayerList[0].id;
            
        }
        responseData.guesses=responseData.guesses.concat(curCoffeePotPlayers);
        if (responseData.isWinner != false) {
             newPlayerList.forEach(player=> {
                if (player.id != responseData.winnerId) {
                    //playerId owes winner a coffee
                    cpFileIO.AddUserCoffee(player.id, responseData.winnerId, 1,"COFFEPOT");
                }
            });
        }
        //reset slots and players
        curCoffeePotSlots = -1;
        curCoffeePotPlayers = [];
    }
    else
    {
        responseData.guesses=responseData.guesses.concat(curCoffeePotPlayers);
        responseData.success=true;
        responseData.message=` ${id} Joined Coffee Pot`;
    }
    return responseData; 
} ,
    CoffeePotSize:function():number
    {
        return curCoffeePotSlots;
    }
}

