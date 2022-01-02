const fileIO= require("./FileIO.js");
const comm= require("./Communication");




const Events={
    BestInit:{Name:"BS-Init",Replace:["CG-Init","CG-Start","CG-Action","CG-End"]},
    BestTimeOut:{Name:"BS-Time",Replace:["CG-Init","CG-Start","CG-Action","CG-End"]}
}

function BestOfSet(){
    this.Session={
        game:"",
        amount:0,
        count: 0,
        players:[]
    }
    this.StartingPlayer=0;
    this.gameRunning=false;
    this.CreateBestOf=function(initPlayer,gameType,coffAmount,winsRequired)
    {
        this.StartingPlayer=initPlayer;
        this.Session.game=gameType;
        this.Session.amount=coffAmount;
        this.Session.count=winsRequired;        
    }

    this.AddPlayer=function(playerId){
        for(var x=0;x<this.Session.players.length;x++){
            if(this.Session.players[x].id==playerId){
                return false;
            }
        }
                
        var PlayerObject={
            wins:0,
            id:playerId
        };
        this.Session.players.push(PlayerObject);
        return true;
    }

    this.PlayerWin=function(playerId)
    {
        for(var x=0;x<this.Session.players.length;x++)
        {
            if(this.Session.players[x].id==playerId)
            {
                this.Session.players[x].wins++; 
                if(this.Session.players[x].wins>=(((this.Session.count/2)+1)| 0))
                {
                    var wins=this.Session.players[x].wins;
                    this.EndBestOf(this.Session.players[x].id);
                    return {winner:true,wins:wins};
                }
                return {winner:false,wins:this.Session.players[x].wins};
            }
        }
        return {winner:false,wins:0}
    }
    this.EndBestOf=function(winnerId)
    {
        for(var x=0;x<this.Session.players.length;x++)
        {   if(this.Session.players[x].id!=winnerId)     
                fileIO.AddUserCoffee(this.Session.players[x].id,winnerId,this.Session.amount,this.Session.game);
        }
        this.Reset();
    }
    this.Reset=function()
    {
        this.Session={
            game:"",
            amount:0,
            count: 0,
            players:[]
        }
        set.gameRunning=false;
        set.StartingPlayer=0;
    }
}

let set= new BestOfSet();

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
    CommandAddWinner:function(winner,isTimeOut)
    {
        var returnobject=[];
        var winObject= set.PlayerWin(winner);
        if(winObject.winner==true)
             returnobject.push(comm.Request(comm.Type.Brodcast,null,`<@${winner}> has won the 'Best Of' set!`,comm.Type.Visible));
        else
        {
            if(isTimeOut)
                returnobject.push(comm.Request(comm.Type.Brodcast,null,`<@${winner}> has ${winObject.wins} out of ${set.Session.count} `,comm.Type.Visible,comm.Timer(Events.BestTimeOut,.01,0)));
            else
                returnobject.push(comm.Request(comm.Type.Brodcast,null,`<@${winner}> has ${winObject.wins} out of ${set.Session.count} `,comm.Type.Visible));
        }
        return returnobject;
    },
    CommandBestOfRunning:function(){
        return set.gameRunning;
    },
    CommandBestOfPlayerList:function(){
        if(set.Session.players.length==0)return [];
        var players=[];
        for(var x=0;x<set.Session.players.length;x++)
        {
            players.push(set.Session.players[x].id);
        }
        return players;
    },
    CommandBestOfPlayerMessage:function(){
        let communicationRequests=[];

        if(set.StartingPlayer!=0)
        {
            var message=`Current Players in 'Best Of' Set: ${set.Session.players.length} \n`;
            for(var x=0;x<set.Session.players.length;x++)
            {
                message=message.concat(`<@${set.Session.players[x].id}> Wins: ${set.Session.players[x].wins}\n`)
            }
            communicationRequests.push(comm.Request(comm.Type.Reply,null,message,comm.Type.Visible));
        }
        else
        {
            communicationRequests.push(comm.Request(comm.Type.Reply,null,"There is no 'Best Of' set running.",comm.Type.Hidden));   
        }
        return communicationRequests;
    },
    CommandNewBestOf:function(InteractionID,gameType,coffAmount,winsRequired){
        communicationRequests=[];
        if(set.StartingPlayer==0)
        {
            set.CreateBestOf(InteractionID,gameType,coffAmount,winsRequired)
            set.AddPlayer(InteractionID);
            communicationRequests.push(comm.Request(comm.Type.Reply,null,`<@${InteractionID}> is starting a 'Best Of' ${winsRequired} in ${gameType} for ${coffAmount} :coffee:s `,comm.Type.Visible,comm.Timer(Events.BestInit,4,0)));
        }
        else
        {
            communicationRequests.push(comm.Request(comm.Type.Reply,null,`There is already a 'Best Of' set running, see if  you can join it!`,comm.Type.Visible));  
        }
        return communicationRequests;

    },
    CommandAddPlayer:function(InteractionID)
    {
        var returnobject=[];
        if(set.gameRunning==false&&set.StartingPlayer!=0)
        {
            if(set.AddPlayer(InteractionID))
                returnobject.push( comm.Request(comm.Type.Reply,null,`<@${InteractionID}> has joined the 'Best Of' set!`,comm.Type.Visible));
            else
            {
                returnobject.push( comm.Request(comm.Type.Reply,null,`You are already in this 'Best Of' set!`,comm.Type.Hidden));
            }
        }
        else
        {
            returnobject.push( comm.Request(comm.Type.Reply,null,`There is no 'Best Of' set to join!`,comm.Type.Hidden));
        }
        return returnobject;
    },
    CommandBestOfEnd:function(InteractionID)
    {
        var returnObject=[];
        if(set.Session.players.length!=0&&set.gameRunning==false &&InteractionID==set.Session.StartingPlayer==InteractionID)
        {
            set.Reset();
            returnObject.push( comm.Request(comm.Type.Reply,null,`The 'Best Of' Set was never started, for shame! Feel free to try again when people actually want to play...`,comm.Type.Visible,null));
        }
        else
        {
            returnObject.push( comm.Request(comm.Type.Reply,null,`The 'Best Of' Set was never started, for shame! Feel free to try again when people actually want to play...`,comm.Type.Hidden,null));
        }
        return returnObject;
    }
}

