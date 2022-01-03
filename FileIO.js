//const { gCloudDB} = require("./config.json"); //service account will go here 
const admin = require('firebase-admin'); 

const playerMap= new Map();
let cloudBuffer= Buffer.from(`${process.env.gCloudDB}`,'base64')
console.log(gCloudDB)

let decodedCloud=cloudBuffer.toString();
console.log(decodedCloud);
cloudBuffer=JSON.parse(decodedCloud);
console.log(cloudBuffer);
admin.initializeApp({credential:admin.credential.cert(cloudBuffer)})
const db= admin.firestore();
let writeActions=0;
let timerStart="";
let timerObject={};
//const Logging=[];
//TODO set config values for how often things are saved to the DB, test the overflow handler insta save 
//TODO figure out how to handle logging in a way that requires only write, no reading to deterime when to add to stuff 
function NewPlayer(newLedgerUser=undefined)
{
    let Player={
        UpdatedData:true,
        Data:{}
    }
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
        newPlayerObject.Ledger.push({ID:newLedgerUser,Amount:0});
    Player.Data=newPlayerObject;    
return Player;
    
}
function NewCacheAction()
{
    writeActions++;
    if(writeActions!=0&&timerStart=="")
    {
        console.log("DB Update Event Created");
        timerStart=Date.now();
        timerObject= setTimeout(BatchUpdateDB,(1000*60*1));
    }
    else if(writeActions>20&&timerStart<(Date.now()+(1000*60*3)))
    {
        clearTimeout(timerObject);
        writeActions=0;
        timeStart="";
        BatchUpdateDB();
    }
    
}
module.exports = {
    Initalize: async function()
    {
        try
        {
            console.log("Fetching Player Information from FireStore DB ");
            let playerData=await db.collection('Players').get();
            console.log("Player Information Fetched, Storing in Hashmap");
            playerData.forEach(document=>{
                playerMap.set(document.id,{UpdatedData:false,Data:document.data()});
            });
            console.log("Player Information Stored in Hash Map");
        }
        catch(e)
        {
            console.log("Failed to load up local DB cache,"+e.logMessage);
        }
    
    },
    
    AddUserCoffee: function (interactionUser, mentionedUser, amount, action) {
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
        //WriteToLog(action, amount, interactionUser, mentionedUser);
    },
    RemoveUserCoffee: function (  
        interactionUser,
        mentionedUser,
        amount,
        action
    ) {
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
           playerMap.get(mentionedUser).Dat.Ledger.push({ID:interactionUser,Amount:(0-amount)})
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
        //WriteToLog(action, amount, interactionUser, mentionedUser);
    },
    GetDebts: async function (userId) {
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
    playerAgreedToTerms: function (userId) {
        ValidateUser(userId);
        if (playerMap.get(userId).Data.TandC!=false) {
            return true;
        }
        return false;
    },
    agreePlayer: async function (userId) {
        ValidateUser(userId);
        playerMap.get(userId).Data.TandC=true;
        playerMap.get(userId).UpdatedData=true;
        NewCacheAction()
    },
    setVenmo:  function (userId, venmoId) {
        playerMap.get(userId).Data.Venmo=venmoId;
        playerMap.get(userId).UpdatedData=true;
        NewCacheAction()

    },
    getUserProfile: async function(userId)
    {
       const returnData = playerMap.get(userId).Data;
        if (returnData==undefined) {
            console.log('No such document!'); //TOD better error handeling here
            return "No Data Found"
          } else {
            console.log('Document data:', returnData);
            return  returnData;
          }
    },
    GetUserCoffeeDebt: function (interactionUser, mentionedUser) {
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
        return totals.sort((a,b)=>(a.Total<b.Total)?1:(b.Total<a.Total)?-1:0);
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
    }
};
function WriteToLog(action, amount, gainedUser, losingUser) {
    try {
        let logMessage = `${action}: ${gainedUser} ${amount} ${losingUser}`;
        let timestamp = new Date().toISOString();
        Logging.push({timestamp:timestamp,message:logMessage});
    } catch (e) {
        //think of some logging error event here
        throw e;
    }
}
function ValidateUser(interactionUser)
{
    if (playerMap.get(interactionUser) == undefined) {
        playerMap.set(interactionUser,NewPlayer());
    }
}
async function  BatchUpdateDB()
{
    console.log("DB Update Event Firing");
    const batch=db.batch();
    //var today = new Date();
    //var date = `${today.getFullYear()}${(today.getMonth()+1)}${today.getDate()}`;
    for(const[key,value] of playerMap.entries())
    {
        if(value.UpdatedData==true)
        {
            const dataOperation= db.collection('Players').doc(key);
            batch.set(dataOperation,value.Data)
        }
    }
    //const updateLog=db.collection('Logging').doc('Logs').get()
    //batch.set(updateLog,Logging)
    try {
        console.log("Running Batch DB Job ");
        await batch.commit();
    }
    catch(e)
    {
        console.log("FAILED TO UPDATE FIRESTORE DB "+e.message);
    }
    writeActions=0;
    timerStart="";
    timerObject={};
    console.log("Batch DB job completed");
}
