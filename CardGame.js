
const fileIO= require("./FileIO");

function communicationObject(isReply, embedObject, botMessage,isHidden)
{
    return{
    reply:isReply,
    embed:embedObject,
    message:botMessage,
    hidden:isHidden
    }
}

function warPlayerObject(options) {
    if (!options.isTie) warTotalPlayersIds.push(options.userId);
    return {
        userId: options.userId,
        total: 0,
        cards: [],
        isStayed: false,
        isOver: false,
        totalSoft:0,
        aceCounter:0

    };
}
let warTotalPlayersIds = [];
let warCurPlayers = [];
let warGameRunning = false;
let warStartingPlayer = 0;
let warUserPotAmt=1;

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
            communicationRequests.push(communicationObject(true,null,"Can't have a buy in great than 5!",true));
            return communicationRequests;
        }
        if(warStartingPlayer==interactionID)
        {
            if(!warGameRunning)
            {
                let fields=[];
                for(let x=0;x<warCurPlayers.length;x++)
                    fields.push({title:`Player ${x+1}`,content:`<@${warCurPlayers[x].userId}>`});
                const embed=CreateEmbed(
                    "21 Round Starting",
                    `The game of 21 is starting with ${(warCurPlayers.length-1)*warUserPotAmt} coffs on the line! Players see your hand with **/hand** and use **/draw** to draw or **/stay** stay!\n`,
                    fields,
                    true,
                    "DARK_RED"
                );
                communicationRequests.push(communicationObject(true,embed,"",false));
                warGameRunning=true;
            }
            else
            {
                communicationRequests.push(communicationObject(true,null,`Sorry, there is a game currently on going!`));
            }
        }    
        else if(!warGameRunning)
        {
            let embed;
            if(warCurPlayers.length==0)
            {
                warUserPotAmt=coffAmount;

                embed=CreateEmbed(
                    "21 New Round",
                    `<@${interactionID}> Is starting a round of 21 with a ${warUserPotAmt} coff buy in, use /21 to join!`,
                    null,
                    null,
                    "DARK_RED"
                );

                communicationRequests.push(communicationObject(false,embed,""));
                warStartingPlayer=interactionID;
                warCurPlayers.push(warPlayerObject({userId:warStartingPlayer}));
                warCurPlayers[0]=DealCard(warCurPlayers[0]);
                warCurPlayers[0]=DealCard(warCurPlayers[0]);
                embed = CreatePlayerHandEmbed(warCurPlayers[0], false);
                communicationRequests.push(communicationObject(true,embed,"",true));    

            }
            else
            {
                communicationRequests.push(communicationObject(false,null,`<@${interactionID}> has joined the game of 21 started by <@${warStartingPlayer}>!`));
                warCurPlayers.push(warPlayerObject({userId:interactionID,isTie:false}));
                warCurPlayers[warCurPlayers.length-1]=DealCard(warCurPlayers[warCurPlayers.length-1]);
                warCurPlayers[warCurPlayers.length-1]=DealCard(warCurPlayers[warCurPlayers.length-1]);
                embed = CreatePlayerHandEmbed(warCurPlayers[warCurPlayers.length-1], false);
                communicationRequests.push(communicationObject(true,embed,"",true));    
            }
           
        }
        else if(warGameRunning)
        {
            communicationRequests.push(communicationObject(true,null,`Sorry, there is a game currently on going!`,true));
        }
        return communicationRequests;
    },

    CommandEndGame: function (interactionID)
    {
        let communicationRequests=[];
        if(interactionID==warStartingPlayer&&warGameRunning==false){
            communicationRequests.push(communicationObject(true,null,`${interactionID} Is revoking their game offer`,true));
            ResetGameVars();
        }
        else if(interactionID==warStartingPlayer&&warGameRunning==true)
            communicationRequests.push(communicationObject(true,null,`${interactionID} You cannot cancel a game after it has started!`,true));
        else
            communicationRequests.push(communicationObject(true,null,`${interactionID} You cannot cancel a game you did not start!`,true));
        return communicationRequests;
    }, 

    CommandPlayerList: function (interactionID)
    {
        let isRunnig=ValidateAction(interactionID);
        let communicationRequests=isRunnig.requets;
        if(isRunnig.index==0)return communicationRequests;
        let fields=[];
        for(let x=0;x<warCurPlayers.length;x++)
            fields.push({title:`Player ${x+1}`,content:`<@${warCurPlayers[x].userId}>`});
        const embed=CreateEmbed(
            "21 Current Players",
            `There are *${(warCurPlayers.length-1)*warUserPotAmt}* coffs on the line`,
            fields,
            true,
            'DARK_RED'
        );
        communicationRequests.push(communicationObject(true,embed,"",false));
        return communicationRequests;
    },

    CommandDraw: function (interactionID)
    {   
        let playerIndex=ValidateAction(interactionID);
        let communicationRequests=playerIndex.requets;
        if(playerIndex.index==0) return communicationRequests;
        warCurPlayers[playerIndex.index]=DealCard( warCurPlayers[playerIndex.index]);
        const embed =CreatePlayerHandEmbed(warCurPlayers[playerIndex.index],true);
        communicationRequests.push(communicationObject(true,embed,"",true));
        if(warCurPlayers[playerIndex.index].isOver)
        {
            communicationRequests.push(communicationObject( 
                false,
                null,
                `<@${warCurPlayers[playerIndex.index].userId}> is done with their hand in the current game of 21.`
            ));  
            communicationRequests= CheckWinner(communicationRequests);
        }
        return communicationRequests;
    },

    CommnadStay: function (interactionID)
    {
       
        let playerIndex=ValidateAction(interactionID);
        let communicationRequests=playerIndex.requets;
        if(playerIndex.index==0) return communicationRequests;
        warCurPlayers[playerIndex.index].isStayed=true;   
        communicationRequests.push(communicationObject(true,null,`You have stayed`,true));
        communicationRequests.push(communicationObject(
            false,
            null,
            `<@${warCurPlayers[playerIndex.index].userId}> is done with their hand in the current game of 21.`
        ));  
        communicationRequests= CheckWinner(communicationRequests);
        return communicationRequests;
    },

    CommandHand: function(interactionID)
    {
        
        let playerIndex=ValidateAction(interactionID)
        let communicationRequests=playerIndex.requets;
        if(playerIndex.index==0) return;
        const embed = CreatePlayerHandEmbed(warCurPlayers[playerIndex.index], false);
        communicationRequests.push(communicationObject( true, embed, "", true));
        return communicationRequests;
    }
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
    [{title:"Total: ",content:`*${playerObject.total}*`},{title:"Cards: ",content: cardString}],
    true,
    "ORANGE"
    )
}

function DealCard (warPlayerObject) {
    let deck = [11, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10];
    let selection = deck[Math.floor(Math.random() * deck.length)];
    if(selection==11)
{
    if((warPlayerObject.total+11)>21&&warPlayerObject.aceCounter==0)
    {
        selection=1;
    }
    else if((warPlayerObject.total+11)>21&&warPlayerObject.hasAce>0)
    {
        aceCounter++;
        warPlayerObject.total-=10;
        for(let x=0;x<warPlayerObject.cards.length;x++)
        {
            if(warPlayerObject.cards[x]==11)
            {
                warPlayerObject.cards[x]=1;
                aceCounter--;
                break;

            }
        }
    }
    else
    {
        warPlayerObject.aceCounter++;
    }
}
    warPlayerObject.cards.push(selection);
    warPlayerObject.total += selection;
    if(warPlayerObject.total>21&&warPlayerObject.aceCounter==0)
    warPlayerObject.isOver=true;
    else if(warPlayerObject.total>21&&warPlayerObject.aceCounter>0)
    {
        if(warPlayerObject.total-10>21)
        {
            warPlayerObject.isOver=true;
        }
        else
        {
            warPlayerObject.total-=10;
            for(let x=0;x<warPlayerObject.cards.length;x++)
            {
                if(warPlayerObject.cards[x]==11)
                {
                    warPlayerObject.cards[x]=1;
                    warPlayerObject.aceCounter--;
                    break;
                }
            }
        }
    }
    return warPlayerObject;
}

function CheckWinner (communicationRequests)
{
let warText;
let highestStay = 0;
let winningPlayers = [];

for (let x = 0; x < warCurPlayers.length; x++) 
    if (warCurPlayers[x].isOver==false  && warCurPlayers[x].isStayed==false)
        return;
    
for (let x = 0; x < warCurPlayers.length; x++) 
{
    if (warCurPlayers[x].isStayed) 
    {
        if (warCurPlayers[x].total == highestStay) 
        {
            isTie = true;
            winningPlayers.push(warCurPlayers[x].userId);
        } 
        else if (warCurPlayers[x].total > highestStay) 
        {
            winningPlayers = [];
            highestStay = warCurPlayers[x].total;
            winningPlayers.push(warCurPlayers[x].userId);
        }
    }
}

if(winner.length>1)
{
    warText = ` Wow there is a tie between players! `
    for(let x=0;x<winner.length;x++)
        fields.push({title:`Winner ${x+1}`,content:`<@${warCurPlayers[x].userId}> - ${totalText} , ${cardText} `});     
    warText=warText.concat(`Starting up a new round.\n Past round's results\n`);
    warText=warText.concat(` Play again with /hand and /action`);
    warCurPlayers=[];
    for(let x=0;x<winner.length;x++)
    {
        warCurPlayers.push(warPlayerObject({userId:winner[x],isTie:true}));
        warCurPlayers[x]=DealCard(warCurPlayers[x]);
        warCurPlayers[x]=DealCard(warCurPlayers[x]);
    }  
}   
else if(winner.length==1)
{
    warText = `<@${winner[0]}> has won the game of 21! They won **${(warTotalPlayersIds.length-1)*warUserPotAmt}** :coffee:!\n\n`;
        for ( let x=0;x<warTotalPlayersIds.length;x++) 
        {
            
            if (warTotalPlayersIds[x] != winner[0]) 
            {
                WriteToLog(`21: ${winner[0]}  +1  from ${warTotalPlayersIds[x]} `,false);
                fileIO.AddUserCoffee(warTotalPlayersIds[x],winner[0],warUserPotAmt);
            }
        }

        fileIO.UpdateFile("c");

    //UpdateGlobalStats({warGames:1,circulation:warTotalPlayersIds.length-1,warCoffs:warTotalPlayersIds.length,winnerId:winner[0]});
    //UpdateFile(statsJSON,stats);
}
else
{
    warText = `No one won...\n\n`;
    //UpdateGlobalStats({warGames:1,warCoffs:warTotalPlayersIds.length});
    //UpdateFile(statsJSON,stats);    
}
warCurPlayers= warCurPlayers.sort((a,b)=>(a.total<b.total)? 1 : -1);
for (let x=0;x<warCurPlayers.length;x++) 
{
    let fields=[];
    let cardText="Cards:";
    let totalText=`Total:`;
    if(warCurPlayers[x].total>21)
        totalText+=` **Over** ~~**${warCurPlayers[x].total}**~~`; 
    else
        totalText+=`**${warCurPlayers[x].total}**`;
    for (let y = 0; y < warCurPlayers[x].cards.length; y++) 
    {
        cardText = cardText.concat(`*${warCurPlayers[x].cards[y]}* :black_joker: `);
        if (y + 1 != warCurPlayers[x].cards.length) 
            cardText = cardText.concat(`->`);
              
    }
    fields.push({title:`Player ${x+1}`,content:`<@${warCurPlayers[x].userId}> - ${totalText} , ${cardText} `});
}
    let embed= CreateEmbed(
        "21 Round Result",
        warText,
        fields,
        false,
        'DARK_RED'
    );
    communicationRequests.push(communicationObject(false,embed,""));                        
    ResetGameVars();
    return communicationRequests;
}

function CreateEmbed(title,text,fields,fieldsAlign,color)
{
    //fields.title the name of the field
    //fields.content what the field will say
    //fieldsAlign 
    let embed= new MessageEmbed()
     .setTitle(title)
     .setColor(color)
     .setThumbnail(
         "https://ae01.alicdn.com/kf/Hf0a2644ab27443aeaf2b7f811096abf3V/Bicycle-House-Blend-Coffee-Playing-Cards-Cafe-Deck-Poker-Size-USPCC-Custom-Limited-Edition-Magic-Cards.jpg_q50.jpg"
     );
     if(text)
     embed.setDescription(text);
     if(fields)
     {
         for(let x=0;x<fields.length;x++)
         {
             embed.addField(fields[x].title,fields[x].content,fieldsAlign);
         }
     }
     return embed;
}

function ValidateAction(interactionID)
{

    let returnObject={index:0,requets:[]};
    if(!warGameRunning) 
    { 
        returnObject.requets.push(communicationObject(true,
        null,
        "There is no game currently running!",
        true));
        return returnObject;
    }
    for(let x=0;x<warCurPlayers.length;x++)
    {
        if(warCurPlayers[x].userId==interactionID)
        {
            if(warCurPlayers[x].isStayed==true||warCurPlayers[x].isOver==true)
            {
                returnObject.requets.push(communicationObject(true,
                    null,
                    "You cannot make anymore actions this round",
                    true));
                return returnObject; 
            }
            returnObject.index=x;
            canPlay=true;
            break;
        }
    }
    if(!canPlay)
    {
        returnObject.requets.push(communicationObject(true,
            null,
            "You are not in this game, wait till the next one",
            true));
        return returnObject;
    }
    return returnObject;

}

function ResetGameVars()
{
    warTotalPlayersIds=[];
    warCurPlayers=[];
    warGameRunning=false;
    warFirstHandDelt=false;
    warStartingPlayer=0; 
    warUserPotAmt=1; 
}