
const fileIO= require("./FileIO.js");
const comm= require("./Communication");

const Events={
    GameStart: {Name:"CG-Start",Replace:["CG-Init","BS-Init"]},
    GameEnd:{Name:"CG-End",Replace:["CG-Init","CG-Action","CG-Start"]},
    GameAction:{Name:"CG-Action",Replace:["CG-Start","CG-Action"]},
    GameInit:{Name:"CG-Init",Replace:["BS-Init"]}
}
//TODO
//General Idea for what would need to be acomplished here 
//Based on emoji that are written in at game start, append a permutation object to each player which can define how the game is able to operate 
//Ideas
//1🤑 richest person has their buy in doubled 
//2🤔 users are able to only see the first card they drew, and cant see their total
//3🤪 Randomize card deck for whole group
//4🥰 Winnings are given to the biggest loser 
//25💵 Over all winnings are doubled 
//5🥶 
//6🥺 First person out gets a second chance with a new hand
//7😱 
//8🥱 Last person to stay gets a new hand
//9🤬
//10😳  A random person will have all their actions display publicly 
//11🤡  Jake will always draw a starting hand of 20 and everyone else will have a soft 21
//12👾  All text but numbers will say pew pew pew
//13😺  All text but numbers will say meow meow meow
//23 🏩 All text but numbers will be heart emoji
//14💯 Card Target is set to 100
//15💥
//16💦
//17💣 If a user takes a 4th action they lose 
//18👋
//19👌
//20🙏
//21🦿 
//22🧠 23 is the max hit point
//24🌚
//26 ❓ Random win number for each user, least distance from win determines winner
// 🐢 berate the poorest person in the game 
// 🥳 Only 10s and 11s
// 🍆 Only cards six and 9
// ☠️ If you stay on your starting hand you lose
// 💩 Only cards less than 5 

//easily modifiable things 
///Dealing logic 
    //card deck, can add multiple of cards to change their rarity, can add whole new cards as well
    //can change which card can act as the ace 
    //total required number to win
    //stay possible
    //draw possible
//General randomized logic 
    //playing for different players
    //each player has a differnet deck
    //

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
function cardGame()
{
    this.PermutationGame=false,
    this.CardDeck=[11, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10]; 
    this.PlayerIds=[];
    this.GameWon=false;
    this.PastWinner=0;
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
        aceCounter:0,
        cardGamePermutation: cardGamePermutation(id) //figure out something here on how to handle permutations 
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
    this.DealCard=function(id, winningAmount=21,aceValue=11, customDeck=[])
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
            aceCounter++;
            this.PlayerObjects[index].total-=(aceValue-1);
            for(let x=0;x<this.PlayerObjects[index].cards.length;x++)
            {
                if(this.PlayerObjects[index].cards[x]==aceValue)
                {
                    this.PlayerObjects[index].cards[x]=(aceValue-(aceValue-1));
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
    this.CheckGameEnd=function(specialOverride=true)
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

const thumbnail="https://ae01.alicdn.com/kf/Hf0a2644ab27443aeaf2b7f811096abf3V/Bicycle-House-Blend-Coffee-Playing-Cards-Cafe-Deck-Poker-Size-USPCC-Custom-Limited-Edition-Magic-Cards.jpg_q50.jpg";

module.exports =
{
    CommandGameRunning: function()
    {
        return currentGame.GameRunning;
    },
    CommandStartJoinGame: function (interactionID, amount, messageReply=true)
    {
        let communicationRequests=[];

        let coffAmount = amount;

        //TODO:somewhere around this point we will read in the value as either a number or a set of emoji  
        if(!coffAmount)
            coffAmount=1;
        else if(coffAmount>2)
        {
            return  communicationRequests.push(comm.Request(messageReply,null,"Can't have a buy in great than 5!",comm.Type.Hidden))
        }
        if(currentGame.StartingPlayer==interactionID)
        {
            if(currentGame.GameRunning==false)
            {
                let fields=[];
                for(let x=0;x<currentGame.PlayerObjects.length;x++)
                    fields.push({title:`Player ${x+1}`,content:`<@${currentGame.PlayerObjects[x].userId}>`,fieldsAlign:true});
                const embed=comm.Embed(
                    "21 Round Starting",
                    `The game of 21 is starting with ${(currentGame.PlayerObjects.length-1)*currentGame.PotSize} coffs on the line! Players see your hand with **/hand** and use **/draw** to draw or **/stay** stay!\n`,
                    fields,
                    true,
                    "DARK_RED",
                    thumbnail
                );

                communicationRequests.push(comm.Request(messageReply,embed,"",comm.Type.Visible,comm.Timer(Events.GameStart,2,2)));
                currentGame.GameRunning=true;
            }
            else
            {
                communicationRequests.push(comm.Request(messageReply,null,`Sorry, there is a game currently on going!`,comm.Type.Hidden));
            }
        }
        else if(currentGame.GameRunning==false)
        {

            if(currentGame.PlayerObjects.length==0)
            {
                //TODO: Add the object that deals with ther permutations here 
                let embed;
                currentGame.PotSize=coffAmount;
                currentGame.StartingPlayer=interactionID;
                currentGame.AddPlayer(interactionID);
                currentGame.DealCard(0);
                currentGame.DealCard(0);
                embed=comm.Embed(
                    "21 New Round",
                    `<@${interactionID}> Is starting a round of 21 with a ${currentGame.PotSize} coff buy in, use /21 to join!`,
                    null,
                    null,
                    "DARK_RED",
                    thumbnail
                );

                communicationRequests.push(comm.Request(messageReply,embed,"",comm.Type.Visible,comm.Timer(Events.GameInit,5,1)));

            }
            else
            {
                let result =currentGame.AddPlayer(interactionID);
                if(result==false)
                {
                    communicationRequests.push(comm.Request(messageReply,null,`You are already in this game!`,comm.Type.Hidden));
                    return communicationRequests;
                }
                currentGame.DealCard(interactionID);
                currentGame.DealCard(interactionID);
                communicationRequests.push(comm.Request(messageReply,null,`<@${interactionID}> has joined the game of 21 started by <@${currentGame.StartingPlayer}>!`,comm.Type.Visible));
            }

        }
        else if(currentGame.GameRunning==true)
        {
            communicationRequests.push(comm.Request(messageReply,null,`Sorry, there is a game currently on going!`,comm.Type.Hidden));
        }
        return communicationRequests;
    },

    CommandEndGame: function (interactionID)
    {
        let communicationRequests=[];
        if(interactionID==currentGame.StartingPlayer&&currentGame.GameRunning==false){
            communicationRequests.push(comm.Request(comm.Type.Reply,null,`${interactionID} Is revoking their game offer`,comm.Type.Hidden,comm.Timer(Events.GameEnd,0,0)));
            ResetGameVars();
        }
        else if(interactionID==currentGame.StartingPlayer&&currentGame.GameRunning==true)
            communicationRequests.push(comm.Request(comm.Type.Reply,null,`${interactionID} You cannot cancel a game after it has started!`,comm.Type.Hidden));
        else
            communicationRequests.push(comm.Request(comm.Type.Reply,null,`${interactionID} You cannot cancel a game you did not start!`,comm.Type.Hidden));
        return communicationRequests;
    },

    CommandPlayerList: function ()
    {
        let communicationRequests=[];
        if(currentGame.PlayerObjects.length==0)
        {
            communicationRequests.push(comm.Request(comm.Type.Reply,null,"No game is pending/currently being played. Type /21 to start one!",trucomm.Type.Hiddene));
        }
        else
        {
        let fields=[];
        for(let x=0;x<currentGame.PlayerObjects.length;x++)
            fields.push({title:`Player ${x+1}`,content:`<@${currentGame.PlayerObjects[x].userId}>`});
        const embed=comm.Embed(
            "21 Current Players",
            `There are *${(currentGame.PlayerObjects.length-1)*currentGame.PotSize}* coffs on the line`,
            fields,
            true,
            'DARK_RED',
            thumbnail
        );
        communicationRequests.push(comm.Request(comm.Type.Reply,embed,"",comm.Type.Visible));
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
        communicationRequests.push(comm.Request(comm.Type.Reply,embed,"",true,comm.Timer(Events.GameAction,2,2)));
        if(currentGame.PlayerObjects[playerIndex.index].isOver)
        {
            communicationRequests.push(comm.Request(
                comm.Type.Brodcast,
                null,
                `<@${currentGame.PlayerObjects[playerIndex.index].userId}> is done with their hand in the current game of 21.`,
            ));
        }
        
        return CheckWinner(communicationRequests);
    },

    CommandStay: function (interactionID)
    {
        let playerIndex=ValidateAction(interactionID);
        let communicationRequests=playerIndex.requets;
        if(playerIndex.index==-1) return communicationRequests;
        currentGame.StayHand(playerIndex.index);
        communicationRequests.push(comm.Request(comm.Type.Reply,null,`You have stayed`,comm.Type.Hidden,comm.Timer(Events.GameAction,2,2)));
        communicationRequests.push(comm.Request(
            comm.Type.Brodcast,
            null,
            `<@${currentGame.PlayerObjects[playerIndex.index].userId}> is done with their hand in the current game of 21.`
        ));
        return CheckWinner(communicationRequests);
    },

    CommandHand: function(interactionID)
    {

        let playerIndex=ValidateAction(interactionID);
        let communicationRequests=playerIndex.requets;
        if(playerIndex.index==-1) return communicationRequests;
        const embed = CreatePlayerHandEmbed( currentGame.PlayerObjects[playerIndex.index], false);
        communicationRequests.push(comm.Request( comm.Type.Reply, embed, "", comm.Type.Hidden));
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
    },

    CommandGetPastWinner:function()
    {
        if(currentGame.TieGame==false&&currentGame.PlayerObjects.length==0)
        {
            return currentGame.PastWinner;
        }
        return "";
    }
}

function TimeOutNoStart()
{
    let communicationRequests=[];
    communicationRequests.push(comm.Request(comm.Type.Broadcast,null,`The current 21 Game has been reset,<@${currentGame.StartingPlayer}> has failed to start it....good job.`,comm.Type.Visible));
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
    communicationRequests.push(comm.Request(comm.Type.Broadcast,null,"The current game of 21 has gone stale! No one has played an action in over two minutes. Wrapping up the game!"));
    return CheckWinner(communicationRequests);
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
    return   comm.Embed(
    "Your Hand",
    embedText,
    [{title:"Total: ",content:`*${playerObject.total}*`,fieldsAlign:true},{title:"Cards: ",content: cardString,fieldsAlign:true}],
    true,
    "ORANGE",
    thumbnail
    )
}

function CheckWinner (communicationRequests)
{
let warText;
let warfields=[];
let tempPlayerObject=[]
let isTie=false;
if(currentGame.GameWon==false) return communicationRequests;
if(currentGame.Winners.length>1)
{
    currentGame.PastWinner="";
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
                fileIO.AddUserCoffee(currentGame.PlayerIds[x],currentGame.Winners[0].userId,currentGame.PotSize,"21");
            }
        }
}
else
{
    warText = `No one won...\n\n`;
    tempPlayerObject=currentGame.PlayerObjects;
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
    let embed= comm.Embed(
        "21 Round Result",
        warText,
        warfields,
        false,
        'DARK_RED',
        thumbnail
    );
    if(isTie)
        communicationRequests.push(comm.Request(comm.Type.Broadcast,embed,"",comm.Type.Visible,comm.Timer(Events.GameStart,2,2)));
    else
    {
        communicationRequests.push(comm.Request(comm.Type.Broadcast,embed,"",comm.Type.Visible,comm.Timer(Events.GameEnd,0,0)));
        currentGame.ResetGame();
    }
    
    
    return  communicationRequests;
}

function ValidateAction(interactionID)
{
    let tempIndex=currentGame.GetPlayerIndex(interactionID)
    let returnObject={index:-1,requets:[]};
    if(currentGame.GameRunning==false)
    {
        returnObject.requets.push(comm.Request(comm.Type.Reply,
        null,
        "There is no game currently running!",
        comm.Type.Hidden));

    }
    else if(tempIndex==-1)
    {
        returnObject.requets.push(comm.Request(comm.Type.Reply,
            null,
            "You are not in this game, wait till the next one",
            comm.Type.Hidden));

    }else if(currentGame.CheckPlayerIn(tempIndex))
    {
        returnObject.index=tempIndex;
    }
    else
    {
        returnObject.requets.push(comm.Request(comm.Type.Reply,
            null,
            "You cannot make anymore actions this round",
            comm.Type.Hidden));
        return returnObject;
    }
    return returnObject;

}

function TranslatePermutation(permutationString)
{
    //TODO
    //reads incomeing string to parse out emoji 
    //there is a dictonary that holds key value pairs of each emoji and the effect it will have on creating the permutation rule set
    //returns an object payload that is injected into the card game object. 
}

