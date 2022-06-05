"use strict"
let socialIO = require("./FileIO");
let SocialEvents= require("./BuisnessEvents");

export  interface SocialResponse{ Success:boolean,Message:string,AdditionalInfo?:object};
interface SocialRequest {Type:SocialGames,ID:string, Amount:number,RequestData:any}
interface TicTacToeGame {OtherID:"",XTurn:boolean,GameOver:false,Winner:"",Grid:Array<number>,GameMoves:number,PrevTurnSuccess:boolean}


let maxRequestAmount = 69; 

let requests = [] as Array<SocialRequest>;

enum SocialGames
{
    Drop=0,
    TicTacToe=1
}


module.exports=
{
    CommandCoffeeDrop:function(interactionUser,amount) : SocialResponse
    {
        //see if there is a request to respond to
        for(let x=0;x<requests.length;x++)
        {
            if(requests[x].Type==SocialGames.Drop)
            {
                if(requests[x].ID==interactionUser)
                {
                    SocialEvents.NewBroadCast(`<@${interactionUser}> Picked up the coffs they dropped`);
                    requests.splice(x,1);
                    return {Success:false,Message:"Ohhh feeling not so generous all of a sudden???"};
                }
                socialIO.AddUserCoffee(requests[x].ID,interactionUser,requests[x].Amount,"DROP");
                for(let y=0;y<requests[x].RequestData.Removals.length;y++)
                {
                   let item= socialIO.GetPlayerTransfer(interactionUser,requests[x].ID,requests[x].RequestData.Removals[y].RefID1,requests[x].RequestData.Removals[y].Amount);
                }

                let message=`<@${interactionUser}> has picked up  **${requests[x].Amount}** :coffee: ${requests[x].Amount > 1 ? "s" : ""} that <@${requests[x].ID}> dropped  `;
                requests.splice(x,1);
                return {Success:true,Message:message};
            }
        }
        //there is no request, create one
        if(amount==undefined||amount<=0)
            return {Success:false,Message:"You need to specify how many coffees you want to drop "};
        let removalAmount;
        removalAmount=socialIO.GetBalancedRemoval(interactionUser,amount)
        if(removalAmount.CanDrop)
        {
            requests.push({Type:SocialGames.Drop,ID:interactionUser,Amount:amount,RequestData:removalAmount});
            return  {Success:true,Message:`<@${interactionUser}> has dropped **${amount}** :coffee: ${amount > 1 ? "s" : ""} on the ground! Use */drop* to pick it up!`};
        }
        else
        return {Success:false,Message:"You can not drop more coffs than you are owed"};

    },
    CommandTicTacToeInit:function(interactionUser):SocialResponse
    {
        //For Tic Tac Toe the initating player is always X, and the second player is always O 
        let findIndex=requests.findIndex(item=>item.Type==SocialGames.TicTacToe);
        if(findIndex!=-1 &&interactionUser!= requests[findIndex].ID)
        {
            requests[findIndex].RequestData.OtherID=interactionUser;
            return {Success:true,Message:"Game STARTED # first"};
        }
        else if(findIndex!=-1 &&interactionUser== requests[findIndex].ID)
        {
            requests.splice(findIndex,1);
            return {Success:true,Message:"CANCEL"};
        }
        else if(findIndex!=-1 && requests[findIndex].RequestData)
        {
            return {Success:true,Message:"EXIST"};
        }
        else 
        {
            let startingPlayer= Math.random() > 0.5 ? true:false;
            
            let Game:TicTacToeGame={OtherID:"",XTurn:startingPlayer,GameOver:false,Winner:"",Grid:[0,0,0,0,0,0,0,0,0],GameMoves:0,PrevTurnSuccess:false};
            requests.push({Type:SocialGames.TicTacToe,ID:interactionUser,Amount:10,RequestData:Game});

            return {Success:true,Message:`New REQUEST Made starting with X ${startingPlayer} `};
        }
    },
    CommandTicTacToeClick:function(interactionUser,SelectedGrid): SocialResponse
    {
            //X is 1
            //O is 2
        let winner: {Win:boolean,WinGrid:Array<number>};
        let findIndex:number=requests.findIndex(item=>item.Type==SocialGames.TicTacToe);
        if(findIndex==-1)
        {
            return {Success:false,Message:`EXIST` }
        }
        requests[findIndex].RequestData.PrevTurnSuccess=false;
        if(requests[findIndex].RequestData.XTurn&&interactionUser==requests[findIndex].ID)
        {
            if(requests[findIndex].RequestData.Grid[SelectedGrid]!=0)
            {
                return {Success:false,Message:`BAD selection ${interactionUser}`}
            }
            requests[findIndex].RequestData.Grid[SelectedGrid]=1;
        }
        else if (!requests[findIndex].RequestData.XTurn&&interactionUser==requests[findIndex].RequestData.OtherID)
        {
            if(requests[findIndex].RequestData.Grid[SelectedGrid]!=0)
            {
                return {Success:false,Message:`BAD selection ${interactionUser}`}
            }

            requests[findIndex].RequestData.Grid[SelectedGrid]=2;
        }
        else 
        {
            return {Success:false,Message:`NOT Your turn ${interactionUser}`}
        }


        winner=this.CommandTicTacToeCheckWinner(findIndex);
        requests[findIndex].RequestData.XTurn=!requests[findIndex].RequestData.XTurn; 
        requests[findIndex].RequestData.PrevTurnSuccess=true;
        requests[findIndex].RequestData.GameMoves++;
        if(winner.Win)
        {
            let LoserId= interactionUser==requests[findIndex].ID? requests[findIndex].RequestData.OtherID:requests[findIndex].ID;
            let SaveGrid=requests[findIndex].RequestData.Grid;
            socialIO.AddUserCoffee(LoserId,interactionUser,10,"TICTACTOE");
            requests.splice(findIndex,1);
            
            return {Success:true,Message:`WINNER `,AdditionalInfo:{ID:interactionUser,Grid:SaveGrid,WinGrid:winner.WinGrid}}
        }
        else if (requests[findIndex].RequestData.GameMoves==9)
        {
            return {Success:true,Message:`DRAW ${interactionUser}`,AdditionalInfo:{Grid:requests[findIndex].RequestData.Grid}}
        }
        else 
        {
            return {Success:true,Message:`CONTINUE`,AdditionalInfo:{Grid:requests[findIndex].RequestData.Grid}}
        } 

    },
    CommandTicTacToeGridButtonChange:function():SocialResponse
    {
        let findIndex=requests.findIndex(item=>item.Type==SocialGames.TicTacToe);
        if(requests[findIndex].RequestData.PrevTurnSuccess)
            return {Success:true,Message:`${!(requests[findIndex].RequestData.XTurn)}`};
        else
        return {Success:true,Message:`NO CHANGE`};
    },
    CommandTicTacToeGetCurrentTurnID:function():SocialResponse
    {
        let findIndex=requests.findIndex(item=>item.Type==SocialGames.TicTacToe);
        if(requests[findIndex].RequestData.XTurn)
        {
            return {Success:true,Message:requests[findIndex].ID};
        }
        else
        {
            return {Success:true,Message:requests[findIndex].RequestData.OtherID};
        }
        
        
    },
    CommandTicTacTowGetGrid:function():SocialResponse
    {
        let findIndex=requests.findIndex(item=>item.Type==SocialGames.TicTacToe);
        return{Success:true,Message:requests[findIndex].RequestData.Grid};
    },
     CommandTicTacToeCheckWinner:function(RequestItemIndex=undefined): {Win:boolean,WinGrid:Array<number>}
{

    if(!RequestItemIndex)
        RequestItemIndex=requests.findIndex(item=>item.Type==SocialGames.TicTacToe);
    //X is 1
    //O is 2

    //Grid
    // 0 1 2
    // 3 4 5
    // 6 7 8
    let y=0;
    let Winner={Win:false,WinGrid:[]};
    console.log(requests[RequestItemIndex].RequestData.Grid)
    for(let x=0;x<9;x+=3)
    {
        //Row
        if(CheckIndexs(x,x+1,x+2,RequestItemIndex))
        {
            Winner.Win=true;
            Winner.WinGrid=[x,x+1,x+2];
            return Winner;
        }
            
        else if(CheckIndexs(y,3+y,6+y,RequestItemIndex))
        {
            Winner.Win=true;
            Winner.WinGrid=[y,3+y,6+y];
            return Winner;
        }
        y++;    
    }
    if(CheckIndexs(0,4,8,RequestItemIndex))
    {
        Winner.Win=true;
        Winner.WinGrid=[0,4,8];
        return Winner;
    }
    if(CheckIndexs(2,4,6,RequestItemIndex))
    {
        Winner.Win=true;
        Winner.WinGrid=[2,4,6];
        return Winner;
    }

    return Winner;
}

}

function CheckIndexs(one,two,three,ArrayIndex)
{
    let GridPos1:number=requests[ArrayIndex].RequestData.Grid[one];
    let GridPos2:number=requests[ArrayIndex].RequestData.Grid[two];
    let GridPos3:number=requests[ArrayIndex].RequestData.Grid[three];
    if(GridPos1==0||GridPos2==0||GridPos3==0) return false;
    if (GridPos1==GridPos2&&GridPos1==GridPos3&&GridPos2==GridPos3)
    return true;
    else return false;
}
   