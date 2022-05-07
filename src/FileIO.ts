"use strict"
const admin = require('firebase-admin'); 
const playerMap = new Map();
let {gCloudDB} = require("../config.json");
let cloudBuffer:object= Buffer.from(`${gCloudDB}`,'base64')
//let cloudBuffer:object= Buffer.from(`${process.env.gCloudDB}`,'base64')
let decodedCloud :string=cloudBuffer.toString();
cloudBuffer=JSON.parse(decodedCloud);
admin.initializeApp({credential:admin.credential.cert(cloudBuffer)})

const db= admin.firestore();
let writeActions: number=0;
let timerStart: number=0;
let timerObject: ReturnType<typeof setTimeout>;

let FileIOLogger=require(`./logger`);
//TODO set config values for how often things are saved to the DB, test the overflow handler insta save 



module.exports = {
    Initalize: async function()
    {
        try
        {
            console.log("Fetching Player Information from FireStore DB ");
            let playerData=await db.collection('Players').get();
            console.log("Player Information Fetched, Storing in Hashmap");
            playerData.forEach(document=>{
                playerMap.set(document.id,PlayerObject(document.data()));
            });
            console.log("Player Information Stored in Hash Map");
        }
        catch(e)
        {
            console.log("Failed to load up local DB cache,"+e.logMessage);
        }
    
    },
    AddUserCoffee: function (interactionUser: number, mentionedUser: number, amount:number, action:string) :void
     {
        ValidateUser(interactionUser);
        ValidateUser(mentionedUser);

        if( !playerMap.get(interactionUser).Data.Ledger.some(item=>item.ID===mentionedUser))
        {
            playerMap.get(interactionUser).Data.Ledger.push({ID:mentionedUser,Amount:(0-amount)})
        }
        else
        {
            playerMap.get(interactionUser).Data.Ledger.find(item=>item.ID===mentionedUser).Amount-=amount;
        }
        playerMap.get(interactionUser).Data.OwedCoffs+=amount;
        
        if( !playerMap.get(mentionedUser).Data.Ledger.some(item=>item.ID===interactionUser))
        {
            playerMap.get(mentionedUser).Data.Ledger.push({ID:interactionUser,Amount:amount})
        }
        else
        {
            playerMap.get(mentionedUser).Data.Ledger.find(item=>item.ID===interactionUser).Amount+=amount;
        }
        playerMap.get(mentionedUser).Data.ReceivingCoffs+=amount;
        playerMap.get(mentionedUser).UpdatedData=true;
        playerMap.get(interactionUser).UpdatedData=true;
        NewCacheAction()
        WriteToLog(action, amount, interactionUser, mentionedUser);
    },
    RemoveUserCoffee: function (interactionUser: number,mentionedUser: number,amount: number,action: string) :void 
    {
        ValidateUser(interactionUser);
        ValidateUser(mentionedUser);
        if( !playerMap.get(interactionUser).Data.Ledger.some(item=>item.ID===mentionedUser))
        {
            playerMap.get(interactionUser).Data.Ledger.push({ID:mentionedUser,Amount:amount})
        }
        else
        {
            playerMap.get(interactionUser).Data.Ledger.find(item=>item.ID==mentionedUser).Amount+=amount;
        }
       playerMap.get(interactionUser).Data.OwedCoffs-=amount;
       if( !playerMap.get(mentionedUser).Data.Ledger.some(item=>item.ID===interactionUser))
       {
           playerMap.get(mentionedUser).Data.Ledger.push({ID:interactionUser,Amount:(0-amount)})
       }
       else
       {
           playerMap.get(mentionedUser).Data.Ledger.find(item=>item.ID==interactionUser).Amount-=amount;
       }
        playerMap.get(mentionedUser).Data.ReceivingCoffs-=amount;
        if(action=="REDEEM")
            playerMap.get(interactionUser).TotalRedeemed+=amount;
        playerMap.get(mentionedUser).UpdatedData=true;
        playerMap.get(interactionUser).UpdatedData=true;
        NewCacheAction()
        WriteToLog(action, amount, interactionUser, mentionedUser);
    },
    GetDebts: function (userId :number) :object
    {
        let debts = {
            owedAmount: 0,
            receivedAmount: 0,
            uniqueOwe: 0,
            uniqueHold: 0,
            totalAmount: 0,
        };
        const returnData=playerMap.get(userId).Data;
        if (returnData!=undefined) 
        {
            debts.owedAmount=returnData.OwedCoffs;
            debts.receivedAmount=returnData.ReceivingCoffs;
            debts.totalAmount=debts.owedAmount-debts.receivedAmount;
            for(let x=0;x<returnData.Ledger.length;x++)
            {

                if(returnData.Ledger[x].Amount<0)
                {
                    debts.uniqueOwe++;
                }
                else if(returnData.Ledger[x].Amount>0)
                {
                    debts.uniqueHold++;
                }
            }
        }
        return debts;
    },
    playerAgreedToTerms: function (userId: number) :boolean
     {
        ValidateUser(userId);
        return playerMap.get(userId).Data.TandC;
    },
    agreePlayer:  function (userId: number) :void
     {
        ValidateUser(userId);
        playerMap.get(userId).Data.TandC=true;
        playerMap.get(userId).UpdatedData=true;
        NewCacheAction()
    },
    setVenmo:  function (userId :number, venmoId: string) :void
    {
        playerMap.get(userId).Data.Venmo=venmoId;
        playerMap.get(userId).UpdatedData=true;
        NewCacheAction()

    },
    getUserProfile:  function(userId: number) :object
    {
       const returnData = playerMap.get(userId);
        if (returnData==undefined) {
            console.log('No such document!'); //TOD better error handeling here
            ValidateUser(userId);
            return playerMap.get(userId).Data;
          } else
          
            return  returnData.Data;
          
    },
    GetUserCoffeeDebt: function (interactionUser: number, mentionedUser :number) {
        if( !playerMap.get(interactionUser).Data.Ledger.some(item=>item.ID===mentionedUser))
        {
            return 0;
        }
        else
        {
            return playerMap.get(interactionUser).Data.Ledger.find(item=>item.ID===mentionedUser).Amount;
        }
    },
    GetPlayerTotals:function()
    {
        let totals=[];
        for(const[key,value] of playerMap.entries())
        {
            totals.push({ID:key,Total:(value.Data.ReceivingCoffs-value.Data.OwedCoffs)})
        }
        totals.sort((a,b)=>(a.Total<b.Total)?1:(b.Total<a.Total)?-1:0);
        for(let x=0;x<totals.length;x++)
        {
            if(totals[x].ID==undefined||totals[x].Total==undefined)
                totals.splice(x,1);
        }
        return totals;
    },
    GetPlayerLedger:function()
    {
        let totals=[];
        for(const[key,value] of playerMap.entries())
        {
            
            value.Data.Ledger.forEach(item=>{
                if(item.Amount<0)
                totals.push({MainID:key,LedgerID:item.ID,Amount:(0-item.Amount)})
            });
        }
        return totals;
    },
    GetBalancedRemoval:function(interactionUser,amount)
    {

        let removalActions={CanDrop:false,Removals:[]};
    let TempLedger;
    let amountLeftToSubtract=amount;
    TempLedger= playerMap.get(interactionUser).Data.Ledger;
    TempLedger=TempLedger.sort((a,b)=>(a.Amount<b.Amount)?1:-1);
    for(let x=0;x<TempLedger.length;x++)
    {
        let amountToSubtract=0;
        if(amountLeftToSubtract==0)
        {
            removalActions.CanDrop=true;
            break;
        }
        if(TempLedger[x].Amount>0)
        {
            if(TempLedger[x].Amount>amountLeftToSubtract)
            {
                amountToSubtract=amountLeftToSubtract;
                amountLeftToSubtract=0;
            }
            else
            {
                amountLeftToSubtract=amountLeftToSubtract-TempLedger[x].Amount;
                amountToSubtract=TempLedger[x].Amount;
            }
            removalActions.Removals.push({RefID1:TempLedger[x].ID,Amount:amountToSubtract})
        }
        else
            break;
    }
    return removalActions;
    },
    GetPlayerTransfer:function(RefID2:number,UserID:number,RefID1:number,Amount:number)
    {
        if (RefID2 == UserID || RefID1 == UserID) 
        return {Success:false,Message:"Cannot transfer to or from yourself!"}
    if(this.GetUserCoffeeDebt(UserID,RefID1)<Amount)
        return {Success:false,Message:`<@${RefID1}> does not owe you ${Amount}`};

    if(this.GetUserCoffeeDebt(RefID2,UserID)<Amount)
        return {Success:false,Message:`You do not owe <@${RefID2}> ${Amount}`};

    if (Amount < 0) 
        return {Success:false,Message:"Cannot transfer negative amount!"};

    this.RemoveUserCoffee(RefID1, UserID, Amount,"TRANSFER");
    this.RemoveUserCoffee(UserID, RefID2, Amount,"TRANSFER");

    //if from = to then coffees cancel out!
    if (RefID1 != RefID2) 
    this.AddUserCoffee(RefID1, RefID2, Amount,"TRANSFER");

    return {Success:true,Message:`<@${UserID}> is transfering ${Amount} from <@${RefID1}> to <@${RefID2}>.`};
    },
    SetPlayerAutoBalance(userId:number)
    {
        let Account= playerMap.get(userId).Data.Ledger.sort((a,b)=>(a.Amount<b.Amount)?1:-1);
        let backNumber=(Account.length-1);
        let frontNumber= 0
        let frontAmount=0;
        let backAmount=Account[backNumber].Amount;
        for(frontNumber;frontNumber<Account.length;frontNumber++)
        {
            frontAmount=Account[frontNumber].Amount;
             while(true)
             {
                let transferAmount=0;
                if(frontAmount<=0)
                    break;
                else if(backAmount==0)
                {
                    backNumber--;
                    if(backNumber<0)
                        return true;
                    backAmount=Account[backNumber].Amount;
                }

                if(backAmount>=0) return true;

                if(frontAmount>=(-backAmount))
                {
                    transferAmount=(backAmount*-1);
                    frontAmount=frontAmount+backAmount;
                    backAmount=0;
                    
                }
                else if(frontAmount<(-backAmount))
                {
                    transferAmount=frontAmount;
                    backAmount=backAmount+frontAmount;
                    frontAmount=0;
                } 
                this.GetPlayerTransfer(Account[backNumber].ID,userId,Account[frontNumber].ID,transferAmount);
             }
        }
        return true;
    } 

};

function PlayerObject(Data:Object=undefined)
{
    let Player={
        UpdatedData:false, 
        UserType: "DISCORD",
        ResponseObjects:{},
        Data:{}
    };
    if(Data!=undefined)
    {
        Player.Data=Data;
    }
    return Player;
}

function NewPlayer(newLedgerUser:number=undefined) :object
{
    let Player=PlayerObject();
    Player.UpdatedData=true;
    let newPlayerObject={
        Name:"",
        OwedCoffs:0,
        ReceivingCoffs:0,
        TandC:false,
        TotalRedeemed:0,
        Venmo:"",
        Ledger:[]
    };
    if(newLedgerUser!=undefined)
    {
        newPlayerObject.Ledger.push({ID:newLedgerUser,Amount:0});
    }
    Player.Data=newPlayerObject;    
return Player;
    
}
function NewCacheAction() :void
 {
    writeActions++;
    if(writeActions!=0&&timerStart==0)
    {
        console.log("DB Update Event Created");
        timerStart=Date.now();
        timerObject= setTimeout(BatchUpdateDB,(1000*60*2)); 
    }
    else if(writeActions>20&&timerStart<(Date.now()+(1000*60*1)))
    {
        console.log("SAVING DATA AHEAD OF TIME DUE TO HIGH ACTIVITY")
        clearTimeout(timerObject);
        writeActions=0;
        timerStart=0;
        BatchUpdateDB();
    }
    
}

function ValidateUser(interactionUser :number) :void
{
    if (playerMap.get(interactionUser) == undefined) {
        console.log("Non existant user!")
        playerMap.set(interactionUser,NewPlayer(interactionUser));
    }
}
async function  BatchUpdateDB() :Promise<void>
{
    let wasNullKey=false;
    console.log("DB Update Event Firing");
    const batch=db.batch();
    try {
        // for(const[key,value] of playerMap.entries())
        // {
        //     console.log("Current update key "+key+" followed by a value");
        //     console.log(value)
        //     if((key!=""&&key!=undefined&&key!=null)&&value.UpdatedData==true)
        //     {
        //         const dataOperation= db.collection('Players').doc(key);
        //         batch.set(dataOperation,value.Data)
        //     }
        //     else
        //     {
        //         //error flag
        //         wasNullKey=true;
        //     }
        // }

        // console.log("Running Batch DB Job ");
        // await batch.commit();
    }
    catch(e)
    {
        console.log("FAILED TO UPDATE FIRESTORE DB "+e.message);
    }
    writeActions=0;
    timerStart=0;
    timerObject=undefined;
    console.log("Batch DB job completed");
    //TODO FIX WHEN THERE IS A PROPER ERROR/ EVENT HANDLER 

}


function WriteToLog(action, amount, gainedUser, losingUser) {
    FileIOLogger.info(`IO: ${action} for ${amount} to ${gainedUser} from ${losingUser}`)
}
