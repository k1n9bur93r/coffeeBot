"use strict"
let  CardFileIO = require("./FileIO");
const {Reply,Embed,Buttons}= require("./DiscordCommunication");
let CardEvents= require("./BuisnessEvents");

let GameStart= new CardEvents.BEvent("CG-Start",["CG-Init","BS-Init"],5,TimerWarning);
let GameEnd= new CardEvents.BEvent("CG-End",["CG-Init","CG-Action","CG-Start,","CG-Warning"],.01,null);
let GameAction= new CardEvents.BEvent("CG-Action",["CG-Start","CG-Action","CG-Warning"],4,TimerWarning); 
let GameEndWarning= new CardEvents.BEvent("CG-Warning",["CG-Start","CG-Action"],1,TimeOutLongWait); 
let GameInit= new CardEvents.BEvent("CG-Init",["BS-Init"],5,TimeOutNoStart);

import {ButtonTypes} from "./DiscordCommunication"

const CardThumbnail="https://ae01.alicdn.com/kf/Hf0a2644ab27443aeaf2b7f811096abf3V/Bicycle-House-Blend-Coffee-Playing-Cards-Cafe-Deck-Poker-Size-USPCC-Custom-Limited-Edition-Magic-Cards.jpg_q50.jpg";

function cardGamePermutation(canDraw=true,canStay=true,winAmount=21,deck=[],minDraw=-1)
{
    return{
    playerDraw:canDraw,
    playerStay:canStay,
    playerDeck:deck,
    playerWinAmount:winAmount,
    playerIndex:-1,
    otherPlayerIndex:-1,
    playerDraws:0,
    PlayerMinDraws:minDraw
    }
}   
 class cardGameObj
{
    PermutationGame=false;
    CardDeck=[11, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10]; 
    PlayerIds=[];
    GameWon=false;
    PastWinner=0;
    PlayerObjects=[];
    Winners=[];
    GameRunning=false;
    StartingPlayer=0;
    PotSize=1;
    TieGame=false;
    TimeStamp="";
    AddPlayer(id: number)
    {
        let index=this.GetPlayerIndex(id);
        if(index!=-1)return false;

        let Object=
        {
        userId:id,
        total: 0,
        cards: [],
        isStayed: false,
        isOver: false,
        totalSoft:0,
        aceCounter:0
        }
        if(this.TieGame!=true)
            this.PlayerIds.push(id)
        this.PlayerObjects.push(Object);
        return true;
    }
    ResetGame()
    {
        this.PlayerIds=[];
        this.GameWon=false;
        this.PlayerObjects=[];
        this.Winners=[];
        this.GameRunning=false;
        this.StartingPlayer=0;
        this.PotSize=1;
        this.TieGame=false;
    }
    DealCard(id:number, winningAmount:number=21,aceValue:number=11, customDeck:Array<number>=[])
    {   
        let index=this.GetPlayerIndex(id);
        if(index==-1)return false;
        let selection;
        if(customDeck.length!=0)
        selection = customDeck[Math.floor(Math.random() * customDeck.length)];
        else
         selection = this.CardDeck[Math.floor(Math.random() * this.CardDeck.length)];
        if(selection==aceValue)
    {
        if((this.PlayerObjects[index].total+aceValue)>winningAmount&&this.PlayerObjects[index].aceCounter==0)
        {
            selection=aceValue-(aceValue-1);
        }
        else if((this.PlayerObjects[index].total+aceValue)>winningAmount&&this.PlayerObjects[index].hasAce>0)
        {
            this.PlayerObjects[index].aceCounter++;
            this.PlayerObjects[index].total-=(aceValue-1);
            for(let x=0;x<this.PlayerObjects[index].cards.length;x++)
            {
                if(this.PlayerObjects[index].cards[x]==aceValue)
                {
                    this.PlayerObjects[index].cards[x]=(aceValue-(aceValue-1));
                    this.PlayerObjects[index].aceCounter--;
                    break;

                }
            }
        }
        else
        {
            this.PlayerObjects[index].aceCounter++;
        }
    }
    this.PlayerObjects[index].cards.push(selection);
    this.PlayerObjects[index].total += selection;
        if(this.PlayerObjects[index].total>winningAmount&&this.PlayerObjects[index].aceCounter==0)
        this.PlayerObjects[index].isOver=true;
        else if(this.PlayerObjects[index].total>winningAmount&&this.PlayerObjects[index].aceCounter>0)
        {
            if(this.PlayerObjects[index].total-(aceValue-1)>winningAmount)
            {
                this.PlayerObjects[index].isOver=true;
            }
            else
            {
                this.PlayerObjects[index].total-=(aceValue-1);
                for(let x=0;x<this.PlayerObjects[index].cards.length;x++)
                {
                    if(this.PlayerObjects[index].cards[x]==aceValue)
                    {
                        this.PlayerObjects[index].cards[x]=(aceValue-(aceValue-1));
                        this.PlayerObjects[index].aceCounter--;
                        break;
                    }
                }
            }
        }
        this.CheckGameEnd();
    }
    CheckGameEnd(specialOverride:boolean=true)
    {
        let highestStay=0;
        //could also add special override here to skip the whole check in general
        for (let x = 0; x <  this.PlayerObjects.length; x++) {
            if ( specialOverride&&(this.PlayerObjects[x].isOver==false  &&  this.PlayerObjects[x].isStayed==false))
                return;
        }
        this.GameWon=true;
        for (let x = 0; x <  this.PlayerObjects.length; x++)
        {
            if ( this.PlayerObjects[x].isStayed)
            {
                if ( this.PlayerObjects[x].total == highestStay)
                {
                    this.TieGame = true;
                    this.Winners.push( this.PlayerObjects[x]);
                }
                else if ( this.PlayerObjects[x].total > highestStay)
                {
                    this.Winners = [];
                    highestStay =  this.PlayerObjects[x].total;
                    currentGame.Winners.push( this.PlayerObjects[x]);
                }
            }
        }
    }
    CheckPlayerIn(index:number)
    {
        let foundIndex=-1;
        if(index>this.PlayerObjects.length)
            foundIndex=this.GetPlayerIndex(index);
        else
            foundIndex=index;
        if(this.PlayerObjects[foundIndex].isOver||this.PlayerObjects[foundIndex].isStayed)
            return false;// return -1
        return true; // return foundIndex;
    }
    GetPlayerIndex(id:number)
    {
        if(id<this.PlayerObjects.length) return id;
        for(let x=0;x<this.PlayerObjects.length;x++)
            if(this.PlayerObjects[x].userId==id)
                return x;
        return -1;

    }
    RemovePlayer()
    {

    }
    StayHand(index:number)
    {
        let foundIndex=-1;
        if(index>this.PlayerObjects.length)
            foundIndex=this.GetPlayerIndex(index);
        else
            foundIndex=index;
        if(this.PlayerObjects[foundIndex].isOver!=true){
            this.PlayerObjects[foundIndex].isStayed=true;
        }
        this.CheckGameEnd();
    }

}
let currentGame=new cardGameObj();


module.exports =
{
    CommandGameRunning: function()
    {
        return currentGame.GameRunning;
    },
    CommandStartJoinGame: function (interactionID: number, amount:number, messageReply:boolean=true):object //TODO: Move dealing of cards/ setting of bools out to a seperate function that handles such things.
    {

        let CommandReply;
        if(!amount)
        amount=1;
        else if(amount>100)
            return  Reply(null,"Can't have a buy in greater than 100!",true); 
        else if (amount && currentGame.StartingPlayer) 
            return Reply(null,`There is already a game you can join with a buy in of ${currentGame.PotSize}.`,true);
        if(currentGame.GameRunning==true)
            return Reply(null,`Sorry, there is a game currently on going!`,true); 
        else if(currentGame.StartingPlayer==interactionID && currentGame.GameRunning==false)
        {
                let fields=[];
                for(let x=0;x<currentGame.PlayerObjects.length;x++)
                    fields.push({title:`Player ${x+1}`,content:`<@${currentGame.PlayerObjects[x].userId}>`,fieldsAlign:true});
                const embed=Embed(
                    "21 Round Starting",
                    `The game of 21 is starting with ${(currentGame.PlayerObjects.length-1)*currentGame.PotSize} coffs on the line! Players see your hand with **/hand** and use **/draw** to draw or **/stay** stay!\n`,
                    fields,
                    true,
                    "DARK_RED",
                    CardThumbnail
                );
                
                if(messageReply)
                CommandReply=Reply(embed,"",); 
                else
                    CardEvents.NewBroadCast("",embed);
                CardEvents.NewTimerEvent(GameStart);
                currentGame.GameRunning=true;
        }
        else 
        {
            if(currentGame.PlayerObjects.length==0)
            {
                let embed;
                currentGame.PotSize=amount;
                currentGame.StartingPlayer=interactionID;
                currentGame.AddPlayer(interactionID);
                currentGame.DealCard(0);
                currentGame.DealCard(0);
                embed=Embed(
                    "21 New Round",
                    `<@${interactionID}> Is starting a round of 21 with a ${currentGame.PotSize} coff buy in, use /21 to join or start the game!`,
                    null,
                    null,
                    "DARK_RED",
                    CardThumbnail
                );

                if(messageReply)
                    CommandReply=Reply(embed,"",false,JoinButton() ); 
                else
                    CardEvents.NewBroadCast("",embed);
                CardEvents.NewTimerEvent(GameInit);
            }
            else
            {
                let result =currentGame.AddPlayer(interactionID);
                if(result==false)
                    return Reply(null,`You are already in this game!` ,true); 
                currentGame.DealCard(interactionID);
                currentGame.DealCard(interactionID);
                if(messageReply)
                    CommandReply=Reply(null,`<@${interactionID}> has joined the game of 21 started by <@${currentGame.StartingPlayer}>!` ); 
                else
                    CardEvents.NewBroadCast(`<@${interactionID}> has joined the game of 21 started by <@${currentGame.StartingPlayer}>!`);

            }

        }
        return CommandReply;
    },

    CommandEndGame: function (interactionID:number):object
    {
        if(interactionID==currentGame.StartingPlayer&&currentGame.GameRunning==false)
        {
            CardEvents.NewTimerEvent(GameEnd);
            currentGame.ResetGame();
            return Reply(null,`${interactionID} Is revoking their game offer`,true); 
        }
        else if(interactionID==currentGame.StartingPlayer&&currentGame.GameRunning==true)
            return Reply(null,`${interactionID} You cannot cancel a game after it has started!` ,true); 
        else
            return Reply(null,`${interactionID} You cannot cancel a game you did not start!`,true); 

    },

    CommandPlayerList: function ():object
    {
        if(currentGame.PlayerObjects.length==0)
            return Reply(null,"No game is pending/currently being played. Type /21 to start one!",true); 
        else
        {
            let fields=[];
            for(let x=0;x<currentGame.PlayerObjects.length;x++)
                fields.push({title:`Player ${x+1}`,content:`<@${currentGame.PlayerObjects[x].userId}>`});
            const embed=Embed(
                "21 Current Players",
                `There are *${(currentGame.PlayerObjects.length-1)*currentGame.PotSize}* coffs on the line`,
                fields,
                true,
                'DARK_RED',
                CardThumbnail
            );
            return Reply(embed,"" ); 
        }
    },

    CommandDraw: function (interactionID:number):object
    {
        let playerIndex = currentGame.GetPlayerIndex(interactionID);
        let CommandReply=ValidateAction(playerIndex);
        if(CommandReply) return CommandReply; 

        currentGame.DealCard(playerIndex);
        CardEvents.NewTimerEvent(GameAction);
        let Buttons=null;
        if(currentGame.PlayerObjects[playerIndex].isOver)
            CardEvents.NewBroadCast(`<@${currentGame.PlayerObjects[playerIndex].userId}> is done with their hand in the current game of 21.`);
        else
            Buttons=HandButtons(interactionID);
        let embed=CreatePlayerHandEmbed(currentGame.PlayerObjects[playerIndex],true);
        CheckWinner();

        return Reply(embed,"",true,Buttons); 
    },

    CommandStay: function (interactionID:number):object
    {
        let playerIndex = currentGame.GetPlayerIndex(interactionID);
        let CommandReply=ValidateAction(playerIndex);
        if(CommandReply) return CommandReply; 
        currentGame.StayHand(playerIndex);
        CardEvents.NewTimerEvent(GameAction);
        CardEvents.NewBroadCast(`<@${currentGame.PlayerObjects[playerIndex].userId}> is done with their hand in the current game of 21.`);
        CheckWinner(); 
        return Reply(null,`You have stayed` ,true);
    },

    CommandHand: function(interactionID:number):object
    {

        let playerIndex = currentGame.GetPlayerIndex(interactionID);
        let CommandReply=ValidateAction(playerIndex);
        if(CommandReply) return CommandReply; 
        return Reply(CreatePlayerHandEmbed( currentGame.PlayerObjects[playerIndex]), "",true,HandButtons(interactionID))
    },

    CommandGetPastWinner:function():number
    {
        if(currentGame.TieGame==false&&currentGame.PlayerObjects.length==0)
            return currentGame.PastWinner;
        return 0;
    }
}

function CreatePlayerHandEmbed (playerObject, newDraw:boolean=false):object
{
      let cardString = ``;
      let embedText = `Still in the game!\n`;
      if (playerObject.isOver)
          embedText = `You went over!\n`;
      if (newDraw)
          embedText = embedText.concat( `:hearts::diamonds:You drew a **${playerObject.cards[playerObject.cards.length - 1]}**:diamonds::hearts:`);
      for (let x = 0; x < playerObject.cards.length; x++)
      {
          cardString = cardString.concat(`*${playerObject.cards[x]}* :black_joker: `);
          if (x + 1 != playerObject.cards.length)
              cardString = cardString.concat(`->`);
      }
      return Embed(
      "Your Hand",
      embedText,
      [{title:"Total: ",content:`*${playerObject.total}*`,fieldsAlign:true},{title:"Cards: ",content: cardString,fieldsAlign:true}],
      true,
      "ORANGE",
      CardThumbnail
      )
}

function TimeOutNoStart():string
{
    let message=`The current 21 Game has been reset,<@${currentGame.StartingPlayer}> has failed to start it....good job.`;
    currentGame.ResetGame();
    return message;
}
function TimeOutLongWait():string
{
    let message="The current game of 21 has gone stale! No one has played an action in over five minutes. Wrapping up the game!";

    for(let x=0;x<currentGame.PlayerObjects.length;x++)
        currentGame.StayHand(x);
    CheckWinner();
    return message; 
}

function TimerWarning()
{
    CardEvents.NewBroadCast("Players of the current 21 Game have 60 seconds left to perform an action before the game goes stale.");
    CardEvents.NewTimerEvent(GameEndWarning);
}

function CheckWinner () //TODO: take the logic that handles ties and move it back into the main card game object
{
let warText;
let warfields=[];
let tempPlayerObject=[]
let isTie=false;
if(currentGame.GameWon==false) return ; 
if(currentGame.Winners.length>1)
{
    currentGame.PastWinner=0;
    isTie=true;
    warText = ` Wow there is a tie between players! \n`
    for(let x=0;x<currentGame.Winners.length;x++)
        warText += `<@${currentGame.Winners[x].userId}> has tied with a total of ${currentGame.Winners[x].total} \n`;
    warText+=`Starting up a new round.\n **Total past results**:\n`;

    currentGame.GameRunning=true;
    tempPlayerObject=currentGame.PlayerObjects;
    currentGame.PlayerObjects=[];
    for(let x=0;x<currentGame.Winners.length;x++)
    {
        currentGame.AddPlayer(currentGame.Winners[x].userId);
        currentGame.DealCard(x);
        currentGame.DealCard(x);
    }
    currentGame.Winners=[];
    currentGame.GameWon=false;
}
else if(currentGame.Winners.length==1)
{
    currentGame.PastWinner=currentGame.Winners[0].userId;
    warText = `<@${currentGame.Winners[0].userId}> has won the game of 21! They won **${(currentGame.PlayerIds.length-1)*currentGame.PotSize}** :coffee:!\n\n`;
        for ( let x=0;x<currentGame.PlayerIds.length;x++)
        {
            tempPlayerObject=currentGame.PlayerObjects;
            if (currentGame.PlayerIds[x] != currentGame.Winners[0].userId)
            {
                CardFileIO.AddUserCoffee(currentGame.PlayerIds[x],currentGame.Winners[0].userId,currentGame.PotSize,"21");
            }
        }
}
else
{
    warText = `No one won...\n\n`;
    tempPlayerObject=currentGame.PlayerObjects;
    currentGame.PlayerObjects=[];
    currentGame.PastWinner=0;
}
tempPlayerObject= tempPlayerObject.sort((a,b)=>(a.total<b.total)? 1 : -1);
for (let x=0;x<tempPlayerObject.length;x++)
{

    let cardText="Cards:";
    let totalText=`Total:`;
    if(tempPlayerObject[x].total>21)
        totalText+=` **Over** ~~**${tempPlayerObject[x].total}**~~`;
    else
        totalText+=`**${tempPlayerObject[x].total}**`;
    for (let y = 0; y < tempPlayerObject[x].cards.length; y++)
    {
        cardText = cardText.concat(`*${tempPlayerObject[x].cards[y]}* :black_joker: `);
        if (y + 1 != tempPlayerObject[x].cards.length)
            cardText = cardText.concat(`->`);

    }
    warfields.push({title:`Player ${x+1}`,content:`<@${tempPlayerObject[x].userId}> - ${totalText} , ${cardText} `,fieldsAlign:false});
}
    let embed= Embed(
        "21 Round Result",
        warText,
        warfields,
        false,
        'DARK_RED',
        CardThumbnail
    );
    if(isTie)
    {
        CardEvents.NewBroadCast(null,embed);
        CardEvents.NewTimerEvent(GameStart);
    }
    else
    {
        CardEvents.NewBroadCast(null,embed);
        CardEvents.NewTimerEvent(GameEnd);
        currentGame.ResetGame();
    }
}

function ValidateAction(playerIndex:number) //this is kinda convoluted and will be updated 
{
  
    if(currentGame.GameRunning==false) 
        return Reply(null,"There is no game currently running!",true); 
    else if(playerIndex==-1)
        return Reply(null,"You are not in this game, wait till the next one",true); 
    else if(!currentGame.CheckPlayerIn(playerIndex))
        return Reply(null,"You cannot make anymore actions this round",true);
    return null;
}

function HandButtons(interactionID)
{
    return Buttons(
        [
            {
                id:{Command:"draw",Args:{UserID:interactionID}},
                label:"Draw",
                style:"PRIMARY",
                type:ButtonTypes.SingleLong   
            },
            {
                id:{Command:"stay",Args:{UserID:interactionID}},
                label:"Stay",
                style:"SUCCESS",
                type:ButtonTypes.SingleLong      
            }
        ]
    );
}

function JoinButton()
{

    return Buttons     (
        [
            {
             id:{Command:"21",Args:{UserID:"PROVID"}},
             label:"Join / Start",
             style:"PRIMARY",  
             type:ButtonTypes.MultiLong 
            }
        ]
    );
}