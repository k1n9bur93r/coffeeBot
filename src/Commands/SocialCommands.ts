const {Reply,EditReply}= require("../DiscordCommunication");
let social= require("../SocialGames");
let bss= require("../BestOf");

let socialBroadcasts= require("../BuisnessEvents");

let QwikButtonCreate= require("../DiscordButtons").QwikButtonCreate;

import {commandObject} from '../DiscordCommunication';
import {commandArgs} from '../DiscordCommunication';
import {QwikButtonTypes,QwikButtonConfig,QwikButtonStyles,QwikAttributes,QwikPostProcess, QwikGridTypes}  from '../DiscordButtons';


const QwikButtons = new QwikButtonCreate();

let reference;

module.exports={

    LoadCommands:function():Array<commandObject>
    {
        return [
        {Name:"drop",Logic:{Func:Drop,Args:["ID","Amount"]}},
        {Name:"tictactoe",Logic:{Func:TicTacToeInit,Args:["ID"]}},
        {Name:"tictactoeclick",Logic:{Func:TicTacToeClick,Args:["ID"]}},
        ];
    }
}


function Drop(args:commandArgs)
{
let response=social.CommandCoffeeDrop(args.UserID,args.Amount);
if(response.Success==true)
{
return Reply(null,response.Message);
}
else
{
    return Reply(null,response.Message,true);
}

}


function TicTacToeInit(args:commandArgs)
{

    // var list=bss.CommandBestOfPlayerList();
    // if(list.length!=0&&bss.CommandBestOfType()=="tictactoe"&&!bss.CommandBestOfRunning())
    // {
    //       if(list[0]==args.UserID)
    //       {
    //         bss.CommandBestOfStart();
    //         social.CommandTicTacToeInit(list[0]); 
    //         social.CommandTicTacToeInit(list[1]); 
    //         let CurrentPlayer= social.CommandTicTacToeGetCurrentTurnID();
    //         return Reply(null,`A Game of Tic-Tac-Toe: **<@${CurrentPlayer.Message}>'s** turn!`,false,TicTacToeRenderGrid([0,0,0,0,0,0,0,0,0]));
        
    //       }
    //     else
    //     {
    //         let Buttons= QwikButtons.CreateButtonComponent(
    //             [
    //                 {
    //                     command:{Command:"bestjoin",Args:{UserID:"PROVID"}},
    //                     label:"Join!",
    //                     style:QwikButtonStyles.Success,
    //                     type:QwikButtonTypes.MultiLong
    //                 }
    //             ]
    //         );
    //         return Reply(null,"You can't start a game of Tic-Tac-Toe if there is a 'Best Of' set pending. join up to it now with **/bestjoin** or click the button below !",false,Buttons);
    //     }
    //     }

let response = social.CommandTicTacToeInit(args.UserID);
let Message="";
let Buttons;
if(response.Message.includes("REQUEST"))
{
    Message+=`<@${args.UserID}> Want's to play a game of Tic-Tac-Toe for 5 keys! Click the button below or type **/tictactoe** to join!`;
    Buttons=QwikButtons.CreateButtonComponent(
        [{
            command:{Command:"tictactoe",Args:{UserID:"PROVID"}},
            label:"Join!",
            style:QwikButtonStyles.Success,
            type:QwikButtonTypes.SingleLong,
            postProcess:{overrideDisableLogic: true, function: TicTacToeJoinButtonChange}
        }
    ]
    );
    return Reply(null,Message,false,Buttons);
}
else if (response.Message.includes("EXIST"))
{
    return EditReply(null,`A Tic-Tac-Toe game is already in progress!`,false);
}
else if(response.Message.includes("CANCEL"))
{
    Buttons=QwikButtons.CreateButtonComponent(
        [{
            label:"Canceled :(",
            style:QwikButtonStyles.Secondary,
            type:QwikButtonTypes.SingleLong,
            disabled:true
        }
    ]
    );
    return EditReply(null,`Nevermind... <@${args.UserID}> does not want to play **Tic-Tac-Toe** anymore more apparently`,true,Buttons);
}
else if (response.Message.includes("STARTED"))
{
    let CurrentPlayer= social.CommandTicTacToeGetCurrentTurnID();
    return Reply(null,`A Game of Tic-Tac-Toe: **<@${CurrentPlayer.Message}>'s** turn!`,false,TicTacToeRenderGrid([0,0,0,0,0,0,0,0,0]));
}
}

function TicTacToeClick(args:commandArgs)
{
    let clickResponse= social.CommandTicTacToeClick(args.UserID,args.Amount);
    console.log(clickResponse.Message);
    if(clickResponse.Message.includes('EXIST'))
    {
        return Reply(null,"There is no game currenlty being played, not sure how you managed to click this button...start a new game with */tictactoe* !",true);
    }
    else if(clickResponse.Message.includes('NOT'))
    {
        return Reply(null,"It is not currently your turn, or you are not in the game. Hol up!",true);
    }
    else if(clickResponse.Message.includes('BAD'))
    {
        return Reply(null,"This grid has already been selected. Click a blue one!",true);
    }
    else if(clickResponse.Message.includes('CONTINUE'))
    {
        let CurrentPlayer= social.CommandTicTacToeGetCurrentTurnID();
        return EditReply(null,`A Game of Tic-Tac-Toe: **<@${CurrentPlayer.Message}>'s** turn!`,false,TicTacToeRenderGrid(clickResponse.AdditionalInfo.Grid));
    }
    else if(clickResponse.Message.includes('DRAW'))
    {
       // let returnObj=TicTacToeBestOfHandler();
      //  if(!returnObj)
            return EditReply(null,"**The game has ended in a Draw!**",false,TicTacToeRenderGrid(clickResponse.AdditionalInfo.Grid,true));
      //  return returnObj;
    }
    else if(clickResponse.Message.includes('WINNER'))
    {
      //  let returnObj=TicTacToeBestOfHandler(clickResponse.AdditionalInfo.ID);
      //  if(!returnObj)
            return EditReply(null,`***<@${clickResponse.AdditionalInfo.ID}> has won the game!***`,false,TicTacToeRenderGrid(clickResponse.AdditionalInfo.Grid,true,clickResponse.AdditionalInfo.WinGrid));
      //  return returnObj;
        }
    else
    {
        return Reply(null,"Shit!",);
    }

}

function TicTacToeRenderGrid(Grid,disableAll=false,WinningGrid=undefined)
{
    let ButtonArray:Array<QwikButtonConfig>= new Array<QwikButtonConfig>();
    for(let x=0;x<9;x++)
    {
        if(Grid[x]==0)
        {
            ButtonArray.push(            
                {
                command:{Command:"tictactoeclick",Args:{UserID:"PROVID",Amount:x}},
                label:"         ",
                style:QwikButtonStyles.Primary, 
                type:QwikButtonTypes.MultiLongSingle,
                disabled:disableAll
            });
        }
        else if(Grid[x]==1)
        {
            ButtonArray.push(            
                {
                label:"    ❌    ",
                style:QwikButtonStyles.Secondary, 
                type:QwikButtonTypes.MultiLongSingle,
                disabled:true
            });
        }
        else if(Grid[x]==2)
        {
            ButtonArray.push(            
                {
                label:"    ⭕    ",
                style:QwikButtonStyles.Secondary, 
                type:QwikButtonTypes.MultiLongSingle,
                disabled:true
            });
        }
    
    }
    if(WinningGrid)
    {
        for(let x=0;x<WinningGrid.length;x++)
        ButtonArray[WinningGrid[x]].style=QwikButtonStyles.Success;
    }
    return QwikButtons.CreateButtonComponent(ButtonArray,QwikGridTypes.ThreeByThree);
}

function TicTacToeJoinButtonChange(): QwikAttributes
{
        return{style:QwikButtonStyles.Secondary,disable:true,text:`Game Accepted!`};
}

function TicTacToeBestOfHandler(winner:string=undefined)
{
    if(winner&&bss.CommandBestOfRunning()&&bss.CommandBestOfType()=="tictactoe")
        bss.CommandAddWinner(winner);
    
    if(bss.CommandBestOfRunning()&&bss.CommandBestOfType()=="tictactoe")
    {
        if(!winner)
            socialBroadcasts.NewBroadCast("There was a Draw! Starting up a new round...");
        var list=bss.CommandBestOfPlayerList();
        social.CommandTicTacToeInit(list[0]); 
        social.CommandTicTacToeInit(list[1]); 
        let CurrentPlayer= social.CommandTicTacToeGetCurrentTurnID();
        return Reply(null,`A Game of Tic-Tac-Toe: **<@${CurrentPlayer.Message}>'s** turn!`,false,TicTacToeRenderGrid([0,0,0,0,0,0,0,0,0]));
    
    }  
}