const {coffeeJSON,statsJSON,logTXT} = require("./config.json");
const fs = require("fs");
const stats = require(`./${statsJSON}`);
const coffees = require(`./${coffeeJSON}`);
module.exports = 
{
    UpdateGlobalStats: function (options) {
        // Options = {
        //options.circulation :"",
        //options.winnerId: ""
        //options.redeemed:""
        //options.coinflip
        //options.PotGames:""
        //options.PotCoffs:""
        //options.warGames:""
        //options.warCoffs:""
        // }
        if (options.circulation) stats.CoffsInCirculation += options.circulation;
        if (options.winnerId) stats.RecentCoffWinner = options.winnerId;
        if (options.PotCoffs && options.PotCoffs > stats.LargestPotWon) stats.LargestPotWon = options.PotCoffs;
        if (options.redeemed) stats.TotalCoffsRedeemed += options.redeemed;
        if (options.coinflip) stats.TotalCoinFlips++;
        if (options.PotGames) stats.TotalPotGames++;
        if (options.PotCoffs) stats.TotalPotCoffs += options.PotCoffs;
        if (options.warCoffs && options.warCoffs > stats.LargestWarWon) stats.LargestWarWon = options.warCoffs;
        if (options.warCoffs) stats.TotalWarCoffs += options.warCoffs;
        if (options.warGames) stats.TotalWarGames++;
        UpdateFile("s");
    },

    AddUserCoffee: function (interactionUser, mentionedUser, amount, action) {
        ValidateUserCoffee(interactionUser, mentionedUser);
        coffees[interactionUser][mentionedUser] += amount;
        NullifyCoffees(interactionUser);
        NullifyCoffees(mentionedUser);
        WriteToLog(action,amount,interactionUser,mentionedUser);
    },

    RemoveUserCoffee: function (interactionUser, mentionedUser, amount,action) {
        ValidateUserCoffee(interactionUser, mentionedUser);
        coffees[interactionUser][mentionedUser] -= amount;
        NullifyCoffees(interactionUser);
        NullifyCoffees(mentionedUser);
        WriteToLog(action,amount,interactionUser,mentionedUser);
    },
    
    GetUserCoffee: function (interactionUser, mentionedUser) {
        let curCoffees;
        ValidateUserCoffee(interactionUser, mentionedUser);
        curCoffees = coffees[interactionUser][mentionedUser];
        return curCoffees;
    },
     UpdateFile:function (FileObject) {
        if(FileObject=="c")
        fs.writeFile(`${coffeeJSON}`, JSON.stringify(coffees, null, 1), (err) => {
            if (err) throw err;
        });
        else if(FileObject=="s")
        fs.writeFile(`${statsJSON}`, JSON.stringify(stats, null, 1), (err) => {
            if (err) throw err;
        });
    }
}

function NullifyCoffees(userId) {
    let coffeeAmount = 0;
    if (coffees[userId] == undefined) {
        coffees[userId] = {};
    }

    for (let debtId in coffees[userId]) {
        let oweToDebt = coffees[userId][debtId];
        if (coffees[debtId] == undefined) coffees[debtId] = {};
        if (coffees[debtId][userId] == undefined) coffees[debtId][userId] = 0;
        let debtOweToUser = coffees[debtId][userId];
        let minDirectionalOweage = Math.min(oweToDebt, debtOweToUser);

        coffees[userId][debtId] -= minDirectionalOweage;
        coffees[debtId][userId] -= minDirectionalOweage;
        coffeeAmount += minDirectionalOweage;
    }

    //UpdateGlobalStats({circulation:-Math.abs(coffeeAmount)});
    //UpdateFile(statsJSON,stats);

    return coffeeAmount;
}
function WriteToLog (action,amount, gainedUser, losingUser )
{
    try
    {
        let logMessage=`${action}: ${gainedUser} ${amount} ${losingUser}`;
        let logFileStream= fs.createWriteStream(logTXT,{flags:'a'});
        let timestamp= new Date().toISOString();
        timestamp+=` - ${logMessage}\n-------------------------------------------------------\n`;
        logFileStream.write(timestamp);
        logFileStream.end();

    }
    catch(e)
    {
        //think of some logging error event here
        throw(e);
    }
}
function ValidateUserCoffee (interactionUser, mentionedUser) {
    if (coffees[interactionUser] == undefined) {
        coffees[interactionUser] = {};
    }
    if (coffees[mentionedUser] == undefined) {
        coffees[mentionedUser] = {};
    }

    if (coffees[interactionUser][mentionedUser] == undefined) {
        coffees[interactionUser][mentionedUser] = 0;
    }
}
