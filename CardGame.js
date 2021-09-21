 
const fileIO= require("./FileIO");

function communicationObject(isReply, embedObject, botMessage,isHidden,TimerObject)
{
    let object={reply:isReply,
        embed:embedObject,
        message:botMessage,
        hidden:isHidden,
        TimerSettings:null
        };
        if(TimerObject)
        {
            object.TimerSettings=TimerObject;
        }
    return object;
    
}
function TimerSettings(eventName,timerLength,methodNumber)
{
    console.log("I am the methodNumber: "+methodNumber);
    let replaceAction=[];
    if(eventName==Events.GameEnd)
    {
        replaceAction.push(Events.GameStart);
        replaceAction.push(Events.GameInit);
        replaceAction.push(Events.GameAction)
    }
    else if(eventName==Events.GameStart)
    {
        replaceAction.push(Events.GameInit);

    }
    else if(eventName==Events.GameAction)
    {
        replaceAction.push(Events.GameStart);
        replaceAction.push(Events.GameAction);
    }
    

    let object={
        Action: eventName,
        Replace: replaceAction,
        Length:timerLength*60000,
        functionCall:methodNumber
    }
    return object

}
const Events={
    GameStart:"CG-Start",
    GameEnd:"CG-End",
    GameAction:"CG-Action",
    GameInit:"CG-Init"
}

function cardGame()
{
    this.CardDeck=[11, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10];
    this.PlayerIds=[];
    this.GameWon=false;
    this.PlayerObjects=[];
    this.Winners=[];
    this.GameRunning=false;
    this.StartingPlayer=0;
    this.PotSize=1;
    this.TieGame=false;
    this.TimeStamp=""; 
    this.TimerLength=
    this.AddPlayer=function(id)
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
    this.ResetGame=function()
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
    this.DealCard=function(id)
    {
        let index=this.GetPlayerIndex(id);
        if(index==-1)return false;
        let selection = this.CardDeck[Math.floor(Math.random() * this.CardDeck.length)];
        if(selection==11)
    {
        if((this.PlayerObjects[index].total+11)>21&&this.PlayerObjects[index].aceCounter==0)
        {
            selection=1;
        }
        else if((this.PlayerObjects[index].total+11)>21&&this.PlayerObjects[index].hasAce>0)
        {
            aceCounter++;
            this.PlayerObjects[index].total-=10;
            for(let x=0;x<this.PlayerObjects[index].cards.length;x++)
            {
                if(this.PlayerObjects[index].cards[x]==11)
                {
                    this.PlayerObjects[index].cards[x]=1;
                    aceCounter--;
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
        if(this.PlayerObjects[index].total>21&&this.PlayerObjects[index].aceCounter==0)
        this.PlayerObjects[index].isOver=true;
        else if(this.PlayerObjects[index].total>21&&this.PlayerObjects[index].aceCounter>0)
        {
            if(this.PlayerObjects[index].total-10>21)
            {
                this.PlayerObjects[index].isOver=true;
            }
            else
            {
                this.PlayerObjects[index].total-=10;
                for(let x=0;x<this.PlayerObjects[index].cards.length;x++)
                {
                    if(this.PlayerObjects[index].cards[x]==11)
                    {
                        this.PlayerObjects[index].cards[x]=1;
                        this.PlayerObjects[index].aceCounter--;
                        break;
                    }
                }
            }
        }
        this.CheckGameEnd();
    }
    this.CheckGameEnd=function()
    {
        let highestStay=0;
        for (let x = 0; x <  this.PlayerObjects.length; x++) {
            if ( this.PlayerObjects[x].isOver==false  &&  this.PlayerObjects[x].isStayed==false)
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
                    this.Winners.push( this.PlayerObjects[x].userId);
                } 
                else if ( this.PlayerObjects[x].total > highestStay) 
                {
                    this.Winners = [];
                    highestStay =  this.PlayerObjects[x].total;
                    currentGame.Winners.push( this.PlayerObjects[x].userId);
                }
            }
        }
    }
    this.CheckPlayerIn=function(index)
    {
        let foundIndex=-1;
        if(index>this.PlayerObjects.length)
            foundIndex=this.GetPlayerIndex(index);
        else
            foundIndex=index;
        if(this.PlayerObjects[foundIndex].isOver||this.PlayerObjects[foundIndex].isStayed)
            return false;
        return true;
    }
    this.GetPlayerIndex=function(id)
    {
        if(id<this.PlayerObjects.length) return id;
        for(let x=0;x<this.PlayerObjects.length;x++)
            if(this.PlayerObjects[x].userId==id)
                return x;
        return -1;
        
    }
    this.RemovePlayer=function()
    {

    }
    this.StayHand=function(index)
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
let currentGame=new cardGame();

module.exports = 
{

    CommandStartJoinGame: function (interactionID, amount)
    {
        let communicationRequests=[]
        let coffAmount = amount;
            
        if(!coffAmount)
            coffAmount=1;
        else if(coffAmount>5)
        {
            return  communicationRequests.push(communicationObject(true,null,"Can't have a buy in great than 5!",true))
        }
        if(currentGame.StartingPlayer==interactionID)
        {
            if(currentGame.GameRunning==false)
            {
                let fields=[];
                for(let x=0;x<currentGame.PlayerObjects.length;x++)
                    fields.push({title:`Player ${x+1}`,content:`<@${currentGame.PlayerObjects[x].userId}>`,fieldsAlign:true});
                const embed=CreateEmbed(
                    "21 Round Starting",
                    `The game of 21 is starting with ${(currentGame.PlayerObjects.length-1)*currentGame.PotSize} coffs on the line! Players see your hand with **/hand** and use **/draw** to draw or **/stay** stay!\n`,
                    fields,
                    true,
                    "DARK_RED"
                );
                
                communicationRequests.push(communicationObject(true,embed,"",false,TimerSettings(Events.GameStart,4,2)));
                currentGame.GameRunning=true;
            }
            else
            {
                communicationRequests.push(communicationObject(true,null,`Sorry, there is a game currently on going!`,true));
            }
        }    
        else if(currentGame.GameRunning==false)
        {
           
            if(currentGame.PlayerObjects.length==0)
            {
                let embed;
                currentGame.PotSize=coffAmount;
                currentGame.StartingPlayer=interactionID;
                currentGame.AddPlayer(interactionID);
                currentGame.DealCard(0);
                currentGame.DealCard(0);
                embed=CreateEmbed(
                    "21 New Round",
                    `<@${interactionID}> Is starting a round of 21 with a ${currentGame.PotSize} coff buy in, use /21 to join!`,
                    null,
                    null,
                    "DARK_RED"
                );
                
                communicationRequests.push(communicationObject(true,embed,"",false,TimerSettings(Events.GameInit,5,1)));

            }
            else
            {
                let result =currentGame.AddPlayer(interactionID);
                if(result==false)
                {
                    communicationRequests.push(communicationObject(true,null,`You are already in this game!`,true));
                    return communicationRequests;
                }
                currentGame.DealCard(interactionID);
                currentGame.DealCard(interactionID);
                communicationRequests.push(communicationObject(true,null,`<@${interactionID}> has joined the game of 21 started by <@${currentGame.StartingPlayer}>!`,false));
            }
           
        }
        else if(currentGame.GameRunning==true)
        {
            communicationRequests.push(communicationObject(true,null,`Sorry, there is a game currently on going!`,true));
        }
        return communicationRequests;
    },

    CommandEndGame: function (interactionID)
    {
        let communicationRequests=[];
        if(interactionID==currentGame.StartingPlayer&&currentGame.GameRunning==false){
            communicationRequests.push(communicationObject(true,null,`${interactionID} Is revoking their game offer`,true,TimerSettings(Events.GameEnd,0,0)));
            ResetGameVars();
        }
        else if(interactionID==currentGame.StartingPlayer&&currentGame.GameRunning==true)
            communicationRequests.push(communicationObject(true,null,`${interactionID} You cannot cancel a game after it has started!`,true));
        else
            communicationRequests.push(communicationObject(true,null,`${interactionID} You cannot cancel a game you did not start!`,true));
        return communicationRequests;
    }, 

    CommandPlayerList: function ()
    {
        let communicationRequests=[];
        if(currentGame.PlayerObjects.length==0)
        {
            communicationRequests.push(communicationObject(true,null,"No game is pending/currently being played. Type /21 to start one!",true));
        }
        else
        {
        let fields=[];
        for(let x=0;x<currentGame.PlayerObjects.length;x++)
            fields.push({title:`Player ${x+1}`,content:`<@${currentGame.PlayerObjects[x].userId}>`});
        const embed=CreateEmbed(
            "21 Current Players",
            `There are *${(currentGame.PlayerObjects.length-1)*currentGame.PotSize}* coffs on the line`,
            fields,
            true,
            'DARK_RED'
        );
        communicationRequests.push(communicationObject(true,embed,"",false));
        }
        return communicationRequests;
    },

    CommandDraw: function (interactionID)
    {   
        let playerIndex=ValidateAction(interactionID);
        let communicationRequests=playerIndex.requets;
        if(playerIndex.index==-1) return communicationRequests;
        currentGame.DealCard(playerIndex.index);
        const embed =CreatePlayerHandEmbed(currentGame.PlayerObjects[playerIndex.index],true);
        communicationRequests.push(communicationObject(true,embed,"",true,TimerSettings(Events.GameAction,2,2)));
        if(currentGame.PlayerObjects[playerIndex.index].isOver)
        {
            communicationRequests.push(communicationObject( 
                false,
                null,
                `<@${currentGame.PlayerObjects[playerIndex.index].userId}> is done with their hand in the current game of 21.`,
            ));  
        }
        let response= CheckWinner();
        if (response==undefined) return communicationRequests;
        communicationRequests.push(response);
        return communicationRequests
    },

    CommandStay: function (interactionID)
    {
        let playerIndex=ValidateAction(interactionID);
        let communicationRequests=playerIndex.requets;
        if(playerIndex.index==-1) return communicationRequests;
        currentGame.StayHand(playerIndex.index);   
        communicationRequests.push(communicationObject(true,null,`You have stayed`,true,TimerSettings(Events.GameAction,2,2)));
        communicationRequests.push(communicationObject(
            false,
            null,
            `<@${currentGame.PlayerObjects[playerIndex.index].userId}> is done with their hand in the current game of 21.`
        ));  
        let response= CheckWinner();
        if (response==undefined) return communicationRequests;
        communicationRequests.push(response);
        return communicationRequests
    },

    CommandHand: function(interactionID)
    {
        
        let playerIndex=ValidateAction(interactionID);
        let communicationRequests=playerIndex.requets;
        if(playerIndex.index==-1) return communicationRequests;
        const embed = CreatePlayerHandEmbed( currentGame.PlayerObjects[playerIndex.index], false);
        communicationRequests.push(communicationObject( true, embed, "", true));
        return communicationRequests;
    },

    CommandTimerEvent:function(eventID)
    {
        let communicationRequests=[];
        if(eventID==1)
        {
            communicationRequests= TimeOutNoStart();
        }
        else if(eventID==2)
        {
            communicationRequests= TimeOutLongWait();
        }
        return communicationRequests;
    }
}

function TimeOutNoStart()
{
    let communicationRequests=[];
    communicationRequests.push(communicationObject(false,null,`The current 21 Game has been reset,<@${currentGame.StartingPlayer}> has failed to start it....good job.`,false));
    currentGame.ResetGame();
    return communicationRequests;
}
function TimeOutLongWait()
{
    let communicationRequests=[];
    for(let x=0;x<currentGame.PlayerObjects.length;x++)
    {
        currentGame.StayHand(x);
    }
    communicationRequests.push(communicationObject(false,null,"The current game of 21 has gone stale! No one has played an action in over two minutes. Wrapping up the game!"));
    let response= CheckWinner();
    if (response!=undefined) 
        communicationRequests.push(response);
    currentGame.ResetGame();
    return communicationRequests;
}

 function CreatePlayerHandEmbed (playerObject, newDraw) {
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
    return   CreateEmbed(
    "Your Hand",
    embedText,
    [{title:"Total: ",content:`*${playerObject.total}*`,fieldsAlign:true},{title:"Cards: ",content: cardString,fieldsAlign:true}],
    true,
    "ORANGE"
    )
}

function CheckWinner ()
{
let warText;
let warfields=[];
if(currentGame.GameWon==false) return;
if( currentGame.Winners.length>1)
{
    warText = ` Wow there is a tie between players! `
    for(let x=0;x<currentGame.Winners.length;x++)
        warfields.push({title:`Winner ${x+1}`,content:`<@${currentGame.PlayerObjects[x].userId}> - ${currentGame.PlayerObjects[x].total} `});     
    warText=warText.concat(`Starting up a new round.\n Past round's results\n`);
    warText=warText.concat(` Play again with /hand and /action`);
    currentGame.PlayerObjects=[];
    for(let x=0;x<currentGame.Winners.length;x++)
    {
        currentGame.AddPlayer(currentGame.Winners[x]);
        currentGame.DealCard(x);
        currentGame.DealCard(x);
    }  
}   
else if(currentGame.Winners.length==1)
{
    warText = `<@${currentGame.Winners[0]}> has won the game of 21! They won **${(currentGame.PlayerIds.length-1)*currentGame.PotSize}** :coffee:!\n\n`;
        for ( let x=0;x<currentGame.PlayerIds.length;x++) 
        {
            
            if (currentGame.PlayerIds[x] != currentGame.Winners[0]) 
            {
                fileIO.AddUserCoffee(currentGame.PlayerIds[x],currentGame.Winners[0],currentGame.PotSize,"21");
            }
        }

        fileIO.UpdateFile("c");
}
else
{
    warText = `No one won...\n\n`; 
}
currentGame.PlayerObjects= currentGame.PlayerObjects.sort((a,b)=>(a.total<b.total)? 1 : -1);
for (let x=0;x<currentGame.PlayerObjects.length;x++) 
{
   
    let cardText="Cards:";
    let totalText=`Total:`;
    if(currentGame.PlayerObjects[x].total>21)
        totalText+=` **Over** ~~**${currentGame.PlayerObjects[x].total}**~~`; 
    else
        totalText+=`**${currentGame.PlayerObjects[x].total}**`;
    for (let y = 0; y < currentGame.PlayerObjects[x].cards.length; y++) 
    {
        cardText = cardText.concat(`*${currentGame.PlayerObjects[x].cards[y]}* :black_joker: `);
        if (y + 1 != currentGame.PlayerObjects[x].cards.length) 
            cardText = cardText.concat(`->`);
              
    }
    warfields.push({title:`Player ${x+1}`,content:`<@${currentGame.PlayerObjects[x].userId}> - ${totalText} , ${cardText} `,fieldsAlign:false});
}
    let embed= CreateEmbed(
        "21 Round Result",
        warText,
        warfields,
        false,
        'DARK_RED'
    );                        
    currentGame.ResetGame();
    let object ;
    if(currentGame.Winners<2)
        object=communicationObject(false,embed,"",false,TimerSettings(Events.GameEnd,0,0));
    else
        object=communicationObject(false,embed,"");
    return object
}

function CreateEmbed(setTitle,setText,setFields,setFieldsAlign,setColor)
{
    let psudoEmbed={
     title:setTitle,
     text:setText,
     color:setColor,
     fields:setFields,
     fieldsAlign:setFieldsAlign,
     thumbnail:"https://ae01.alicdn.com/kf/Hf0a2644ab27443aeaf2b7f811096abf3V/Bicycle-House-Blend-Coffee-Playing-Cards-Cafe-Deck-Poker-Size-USPCC-Custom-Limited-Edition-Magic-Cards.jpg_q50.jpg"
    }
     return psudoEmbed;
}

function ValidateAction(interactionID)
{
    let tempIndex=currentGame.GetPlayerIndex(interactionID)
    let returnObject={index:-1,requets:[]};
    if(currentGame.GameRunning==false) 
    { 
        returnObject.requets.push(communicationObject(true,
        null,
        "There is no game currently running!",
        true));
        
    }
    else if(tempIndex==-1)
    {
        returnObject.requets.push(communicationObject(true,
            null,
            "You are not in this game, wait till the next one",
            true));
        
    }else if(currentGame.CheckPlayerIn(tempIndex))
    {
        returnObject.index=tempIndex;
    }
    else
    {
        returnObject.requets.push(communicationObject(true,
            null,
            "You cannot make anymore actions this round",
            true));
        return returnObject; 
    }
    return returnObject;

}
