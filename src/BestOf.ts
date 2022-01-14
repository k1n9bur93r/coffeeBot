"use strict"
let  BestFileIO = require("./FileIO");
let BestComm= require("./Communication");

export interface BestOfResponse{gameRunning:boolean,isWinner:boolean,winnerId:number,players:Array<BestOfPlayer>,Sets:number,SetsPlayed:number};
interface BestOfPlayer {id:number,wins:number}
class BestOfSet{

    Session={
        game:"",
        amount:0,
        count: 0,
        players:[]
    }
    StartingPlayer:number=0;
    gameRunning:boolean=false;
    CreateBestOf(initPlayer,gameType,coffAmount,winsRequired)
    {
        this.StartingPlayer=initPlayer;
        this.Session.game=gameType;
        this.Session.amount=coffAmount;
        this.Session.count=winsRequired;        
    }

    AddPlayer(playerId){
        for(var x=0;x<this.Session.players.length;x++){
            if(this.Session.players[x].id==playerId){
                return false;
            }
        }
                
        var PlayerObject:BestOfPlayer={
            wins:0,
            id:playerId
        };
        this.Session.players.push(PlayerObject);
        return true;
    }

    PlayerWin(playerId)
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
    EndBestOf(winnerId)
    {
        for(var x=0;x<this.Session.players.length;x++)
        {   if(this.Session.players[x].id!=winnerId)     
            BestFileIO.AddUserCoffee(this.Session.players[x].id,winnerId,this.Session.amount,this.Session.game);
        }
        this.Reset();
    }
    Reset()
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
    CommandBestOfType:function() :string
    {
            return set.Session.game;
    },
    CommandBestOfStart:function() :void
    {
        set.gameRunning=true;
    },
    CommandAddWinner:function(winner:number,isTimeOut:boolean) :object
    {
        var returnobject=[];
        var winObject= set.PlayerWin(winner);
        if(winObject.winner==true)
             returnobject.push(BestComm.Request(BestComm.Type.Brodcast,null,`<@${winner}> has won the 'Best Of' set!`,BestComm.Type.Visible));
        else
        {
            if(isTimeOut)
                returnobject.push(BestComm.Request(BestComm.Type.Brodcast,null,`<@${winner}> has ${winObject.wins} out of ${set.Session.count} `,BestComm.Type.Visible,BestComm.Timer(BestComm.Type.BestTimeOut,.01,0)));
            else
                returnobject.push(BestComm.Request(BestComm.Type.Brodcast,null,`<@${winner}> has ${winObject.wins} out of ${set.Session.count} `,BestComm.Type.Visible));
        }
        return returnobject;
    },
    CommandBestOfRunning:function() :boolean
    {
        return set.gameRunning;
    },
    CommandBestOfPlayerList:function() :Array<number>
    {
        if(set.Session.players.length==0)return [];
        var players=[];
        for(var x=0;x<set.Session.players.length;x++)
        {
            players.push(set.Session.players[x].id);
        }
        return players;
    },
    CommandBestOfPlayerMessage:function():Array<object>
    {
        let communicationRequests=[];

        if(set.StartingPlayer!=0)
        {
            var message=`Current Players in 'Best Of' Set: ${set.Session.players.length} \n`;
            for(var x=0;x<set.Session.players.length;x++)
            {
                message=message.concat(`<@${set.Session.players[x].id}> Wins: ${set.Session.players[x].wins}\n`)
            }
            communicationRequests.push(BestComm.Request(BestComm.Type.Reply,null,message,BestComm.Type.Visible));
        }
        else
        {
            communicationRequests.push(BestComm.Request(BestComm.Type.Reply,null,"There is no 'Best Of' set running.",BestComm.Type.Hidden));   
        }
        return communicationRequests;
    },
    CommandNewBestOf:function(InteractionID: number,gameType :string,coffAmount :number,winsRequired: number) :Array<object>
    {
        let communicationRequests=[];
        if(set.StartingPlayer==0)
        {
            set.CreateBestOf(InteractionID,gameType,coffAmount,winsRequired)
            set.AddPlayer(InteractionID);
            communicationRequests.push(BestComm.Request(BestComm.Type.Reply,null,`<@${InteractionID}> is starting a 'Best Of' ${winsRequired} in ${gameType} for ${coffAmount} :coffee:s `,BestComm.Type.Visible,BestComm.Timer(BestComm.Type.BestInit,4,0)));
        }
        else
        {
            communicationRequests.push(BestComm.Request(BestComm.Type.Reply,null,`There is already a 'Best Of' set running, see if  you can join it!`,BestComm.Type.Hidden));  
        }
        return communicationRequests;

    },
    CommandAddPlayer:function(InteractionID:number) :Array<object>
    {
        var returnobject=[];
        if(set.gameRunning==false&&set.StartingPlayer!=0)
        {
            if(set.AddPlayer(InteractionID))
                returnobject.push( BestComm.Request(BestComm.Type.Reply,null,`<@${InteractionID}> has joined the 'Best Of' set!`,BestComm.Type.Visible));
            else
            {
                returnobject.push( BestComm.Request(BestComm.Type.Reply,null,`You are already in this 'Best Of' set!`,BestComm.Type.Hidden));
            }
        }
        else
        {
            returnobject.push( BestComm.Request(BestComm.Type.Reply,null,`There is no 'Best Of' set to join!`,BestComm.Type.Hidden));
        }
        return returnobject;
    },
    CommandBestOfEnd:function() :Array<object>
    {
        var returnObject=[];
        set.Reset();
        returnObject.push( BestComm.Request(BestComm.Type.Brodcast,null,`The 'Best Of' Set was never started, for shame! Feel free to try again when people actually want to play...`,BestComm.Type.Visible,null));
        return returnObject;
    }

}

