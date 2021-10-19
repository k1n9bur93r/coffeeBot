const fileIO= require("./FileIO");
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
        console.log(`What is IsTimeOut????? ${isTimeOut}`);
        var returnobject=[];
        var winObject= set.PlayerWin(winner);
        if(winObject.winner==true)
             returnobject.push(comm.Request(false,null,`<@${winner}> has won the 'Best Of' set!`,false,null));
        else
        {
            if(isTimeOut)
                returnobject.push(comm.Request(false,null,`<@${winner}> has ${winObject.wins} out of ${set.Session.count} `,false,null,comm.Timer(Events.BestTimeOut,.01,0)));
            else
                returnobject.push(comm.Request(false,null,`<@${winner}> has ${winObject.wins} out of ${set.Session.count} `,false,null));
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
            communicationRequests.push(comm.Request(true,null,message,false,null));
        }
        else
        {
            communicationRequests.push(comm.Request(true,null,"There is no 'Best Of' set running.",false,null));   
        }
        return communicationRequests;
    },
    CommandNewBestOf:function(InteractionID,gameType,coffAmount,winsRequired){
        communicationRequests=[];
        if(set.StartingPlayer==0)
        {
            set.CreateBestOf(InteractionID,gameType,coffAmount,winsRequired)
            set.AddPlayer(InteractionID);
            communicationRequests.push(comm.Request(true,null,`<@${InteractionID}> is starting a 'Best Of' ${winsRequired} in ${gameType} for ${coffAmount} :coffee:s `,false,comm.Timer(Events.BestInit,4,0)));
        }
        else
        {
            communicationRequests.push(comm.Request(true,null,`There is already a 'Best Of' set running, see if  you can join it!`,true,null));  
        }
        return communicationRequests;

    },
    CommandAddPlayer:function(InteractionID)
    {
        var returnobject=[];
        if(set.gameRunning==false&&set.StartingPlayer!=0)
        {
            if(set.AddPlayer(InteractionID))
                returnobject.push( comm.Request(true,null,`<@${InteractionID}> has joined the 'Best Of' set!`,false,null));
            else
            {
                returnobject.push( comm.Request(true,null,`You are already in this 'Best Of' set!`,true,null));
            }
        }
        else
        {
            returnobject.push( comm.Request(true,null,`There is no 'Best Of' set to join!`,true,null));
        }
        return returnobject;
    },
    CommandBestOfEnd:function()
    {
        var returnObject=[];
        set.Reset();
        returnObject.push( comm.Request(false,null,`The 'Best Of' Set was never started, for shame! Feel free to try again when people actually want to play...`,true,null));
        return returnObject;
    }
}

