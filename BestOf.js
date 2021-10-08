const fileIO= require("./FileIO");


function communicationObject(isReply, embedObject, botMessage,isHidden,TimerObject)
{
    let object={reply:isReply,
        winner:0,
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

const Events={
    GameStart:"BS-Start",
    GameEnd:"BS-End",
    GameInit:"BS-Init"
}

function BestOfSet(){
    var Session=undefined;
    var StartingPlayer;
    var gameRunning=false;
    this.CreateBestOf=function(initPlayer,gameType,coffAmount,winsRequired)
    {
        StartingPlayer=initPlayer;
        this.Session={
            game:gameType,
            amount:coffAmount,
            count: winsRequired,
            players:[]
        };
        
    }

    this.AddPlayer=function(playerId){
        for(var x=0;x<this.Session.players.length;x++)
        {
            if(this.Session.players[x].id==playerId)
            {
                return communicationObject(true,null,`You are already in this 'Best Of' set!`,true,null);
            }
        }
        var PlayerObject={
            wins:0,
            id:playerId
        };
        this.Session.players.push(PlayerObject);
        return communicationObject(true,null,`<@${playerId}> has joined the 'Best Of' set!`,false,null);
    }

    this.PlayerWin=function(playerId)
    {

        var communicationRequests=[];
        // send some kind of message to chat here 
        for(var x=0;x<this.Session.players.length;x++)
        {
            if(this.Session.players[x].id==playerId)
            {
                this.Session.players[x].wins++;
                communicationRequests.push(communicationObject(false,null,`<@${playerId}> has ${this.Session.players[x].wins} out of ${this.Session.count} `,false,null));
                if(this.Session.players[x].wins>((this.Session.count/2)+1))
                {
                    communicationRequests.push(communicationObject(false,null,`<@${playerId}> has won the 'Best Of' ${this.Session.count} set!`,false,null));
                    this.EndBestOf(this.Session.players[x].id);
                }
                break;
            }
        }
        return communicationRequests;
    }
    this.EndBestOf=function(winnerId)
    {
        //send some kind of message here 
        for(var x=0;x<this.Session.players.length;x++)
        {        
            fileIO.AddUserCoffee(this.Session.players[x].id,winnerId,this.Session.amount,this.Session.game);
        }
        set.Session=undefined;
        set.gameRunning=false;
        set.StartingPlayer=0;
    }
}

let set=new BestOfSet();

module.exports = 
{
    CommandBestOfType:function()
    {
        return set.Session.game;
    },
    CommandBestOfStart:function()
    {
        set.gameRunning=true;
    },
    CommandAddWinner:function(winner)
    {
        return set.PlayerWin(winner);
    },
    CommandBestOfExists:function()
    {
        if(set.Session==undefined)return false;
        else return true;
    },
    CommandBestOfRunning:function(){
    
        if(set.gameRunning==false) return false
        else return true;
    },
    CommandBestOfPlayerList:function(){
        if(set.Session==undefined)return [];
        var players=[];
        for(var x=0;x<set.Session.players.count;x++)
            {
                players.push(set.Session.players[x].id);
            }
            return players;
    },
    CommandBestOfPlayerMessage:function(){
        let communicationRequests=[];
        console.log(set.Session);
        if(set.Session!=undefined)
        {
            var message=`Current Players in 'Best Of' Set: ${set.Session.players.length} \n`;
            for(var x=0;x<set.Session.players.length;x++)
            {
                message=message.concat(`<@${set.Session.players[x].id}>\n`)
            }
            communicationRequests.push(communicationObject(true,null,message,false,null));
        }
        else
        {
            communicationRequests.push(communicationObject(true,null,"There is no 'Best Of' set running.",false,null));   
        }
        return communicationRequests;
    },
    CommandNewBestOf:function(InteractionID,gameType,coffAmount,winsRequired){
        communicationRequests=[];
        if(set.Session==undefined)
        {
            set.CreateBestOf(InteractionID,gameType,coffAmount,winsRequired)
            set.AddPlayer(InteractionID);
            communicationRequests.push(communicationObject(true,null,`<@${InteractionID}> is starting a 'Best Of' ${winsRequired} in ${gameType} for ${coffAmount} :coffee:s `,false,null));
        }
        return communicationRequests;

    },
    CommandAddPlayer:function(InteractionID)
    {
        let communicationRequests=[];
        if(set.Session!=undefined)
        {
            communicationRequests.push(set.AddPlayer(InteractionID));
        }
        return communicationRequests;
    },
    
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