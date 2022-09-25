"use strict"
let  BestFileIO = require("./FileIO");
const {Reply}= require("./DiscordCommunication");
let BestEvents= require("./BuisnessEvents");
let QwikButtonCreate= require("./DiscordButtons").QwikButtonCreate;
import {QwikButtonTypes,QwikButtonConfig,QwikButtonStyles,QwikAttributes,QwikPostProcess, QwikGridTypes}  from './DiscordButtons';



let BestInit= new BestEvents.BEvent("BS-Init",["CG-Init","CG-Start","CG-Action","CG-End"],5,BestOfEnd);
let BestTimeOut= new BestEvents.BEvent("BS-Time",["CG-Init","CG-Start","CG-Action","CG-End"],.01);
const QwikButtons = new QwikButtonCreate();

export interface BestOfResponse{gameRunning:boolean,isWinner:boolean,winnerId:number,players:Array<BestOfPlayer>,Sets:number,SetsPlayed:number};
interface BestOfPlayer {id:number,wins:number}
interface BestofGames{name:string,maxPlayers:number,startingCommand:string,}
const enum ConfigedGames{
twentyone=0,
tictactoe=1
}

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
    CommandAddWinner:function(winner:number,isTimeOut:boolean=false) 
    {
        var winObject= set.PlayerWin(winner);
        if(winObject.winner==true)
            BestEvents.NewBroadCast(`<@${winner}> has won the 'Best Of' set!`);
        else
        {
            if(isTimeOut)
                BestEvents.NewTimerEvent(BestTimeOut);

            BestEvents.NewBroadCast(`<@${winner}> has ${winObject.wins} out of ${set.Session.count}`);
        }
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
    CommandBestOfPlayerMessage:function():object
    {
        if(set.StartingPlayer!=0)
        {
            var message=`Current Players in 'Best Of' Set: ${set.Session.players.length} \n`;
            for(var x=0;x<set.Session.players.length;x++)
            {
                message=message.concat(`<@${set.Session.players[x].id}> Wins: ${set.Session.players[x].wins}\n`)
            }
            return Reply(null,message);
        }
        else
            return Reply(null,"There is no 'Best Of' set running.",false);   
    },
    CommandNewBestOf:function(InteractionID: number,gameType :string,coffAmount :number,winsRequired: number) :object
    {
        if(set.StartingPlayer==0)
        {
            let Buttons= QwikButtons.CreateButtonComponent(
                [
                    {
                        command:{Command:"bestjoin",Args:{UserID:"PROVID"}},
                        label:"Join!",
                        style:QwikButtonStyles.Success,
                        type:QwikButtonTypes.MultiLong
                    }
                ]
            );
            set.CreateBestOf(InteractionID,gameType,coffAmount,winsRequired)
            set.AddPlayer(InteractionID);
            BestEvents.NewTimerEvent(BestInit);
            return Reply(null,`<@${InteractionID}> is starting a 'Best Of' ${winsRequired} in ${gameType} for ${coffAmount} :key:s `,false,Buttons);
        }
        else
            return Reply(null,`There is already a 'Best Of' set running, see if  you can join it!`,false);  

    },
    CommandAddPlayer:function(InteractionID:number) :object
    {
        if(set.gameRunning==false&&set.StartingPlayer!=0)
        {
            if(set.AddPlayer(InteractionID))
                return Reply(null,`<@${InteractionID}> has joined the 'Best Of' set!`);
            else
                return Reply(null,`You are already in this 'Best Of' set!`,false);
        }
        else
            return Reply(null,`There is no 'Best Of' set to join!`,false);
    },

}    
function BestOfEnd()
{
    set.Reset();
    BestEvents.NewBroadCast(`The 'Best Of' Set was never started, for shame! Feel free to try again when people actually want to play...`);
}

