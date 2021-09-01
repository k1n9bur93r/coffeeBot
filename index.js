// Require the necessary discord.js classes
const { Client, Intents, MessageEmbed, Message } = require("discord.js");
const { token, coffeeJSON,responseJSON, gCloudJSON } = require("./config.json");
const fs = require("fs");
const coffees = require(`./${coffeeJSON}`);
const gCloud = require(`./${gCloudJSON}`);
const language = require('@google-cloud/language');
const fileResponses = require(`./${responseJSON}`);
const gCloudOptions={
    projectId:gCloud.project_id,
    email:gCloud.client_email,
    credentials:{
        client_email:gCloud.client_email,
        private_key:gCloud.private_key
     }
};
const gCClient= new language.LanguageServiceClient(gCloudOptions);

let curCoinflipRequest = "";
let curCoffeePotPlayers = {};
let curCoffeePotSlots = -1;

// Create a new client instance
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MEMBERS,
    ],
});

// When the client is ready, run this code (only once)
client.once("ready", () => {
    console.log("Ready!");
    gCClient.initialize();
    client.user.setActivity("/commands", { type: "LISTENING" });
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
try{
    if (interaction.commandName === "ledger") {
        let coffeeLedger = getCoffeeLedgerString(interaction.channel);
        const ledgerEmbed = new MessageEmbed()
            .setTitle("Coffee Ledger")
            .setDescription(coffeeLedger);
            BotReply(interaction,ledgerEmbed,"",false);
    } else if (interaction.commandName == "profile") {
        let profiledUser = interaction.options.get("user");
        if (profiledUser == undefined) {
            profiledUser = interaction.member;
        }

        console.log(profiledUser);

        let avatarUrl = `https://cdn.discordapp.com/avatars/${profiledUser.user.id}/${profiledUser.user.avatar}`;
        let profileString = getProfileString(
            profiledUser.user.id,
            interaction.channel
        );
        const profilEmbed = new MessageEmbed()
            .setTitle(
                `${
                    profiledUser.nickname != null
                        ? profiledUser.nickname
                        : profiledUser.user.username
                }'s profile`
            )
            .setDescription(profileString)
            .setThumbnail(avatarUrl);
            BotReply(interaction,profilEmbed,"",false);
    } else if (interaction.commandName == "give") {

        let mentionedUser = getUserFromMention(
            interaction.options.get("user").user.id,
            interaction.channel
        );
        let parsedCoffeeAmount = interaction.options.getNumber("amount");

        if (mentionedUser) {
            if (mentionedUser == undefined) {
                BotReply(interaction,null,`You must @ an existing person`,true);
                return;
            }
        }
        if (mentionedUser.user.id == interaction.user.id) {
            BotReply(interaction,null,`You cannot give yourself coffees lul`,true);
            return;
        }
        if (isNaN(parsedCoffeeAmount) || parsedCoffeeAmount <= 0) {
            BotReply(interaction,null,`Nice try hax0r man`,true);
            return;
        }

        AddUserCoffee(interaction.user.id,mentionedUser.user.id,parsedCoffeeAmount)
        NullifyCoffees(mentionedUser.user.id);
        NullifyCoffees(interaction.user.id);
        UpdateFile(coffeeJSON,coffees);

        BotReply(interaction,null,`<@${interaction.user.id}> gave <@${mentionedUser.user.id}> ${parsedCoffeeAmount} coffee${ parsedCoffeeAmount > 1 ? "s" : ""}`,false);
    } else if (interaction.commandName == "redeem") {
        let mentionedUser = getUserFromMention(
            interaction.options.get("user").user.id,
            interaction.channel
        );

        let parsedCoffeeAmount = interaction.options.getNumber("amount");

        if (mentionedUser) {
            if (mentionedUser == undefined) {
                BotReply(interaction,null,`You must @ an existing person`,true);
                return;
            }
        }
        if (parsedCoffeeAmount) {
            if (isNaN(parsedCoffeeAmount) || parsedCoffeeAmount <= 0) {
                BotReply(interaction,null,`Nice try hax0r man`,true);
                return;
            }
        }

        if (GetUserCoffee(mentionedUser.user.id,interaction.user.id) < parsedCoffeeAmount) {
            BotReply(interaction,null,`<@${mentionedUser.user.id}> does not owe you ${parsedCoffeeAmount}`,true);
            return;
        }

        RemoveUserCoffee(mentionedUser.user.id,interaction.user.id,parsedCoffeeAmount)
        NullifyCoffees(mentionedUser.user.id);
        NullifyCoffees(interaction.user.id);
        UpdateFile(coffeeJSON,coffees);
        BotReply(interaction,null,`<@${interaction.user.id}> redeemed ${parsedCoffeeAmount} coffee${parsedCoffeeAmount > 1 ? "s" : ""} from <@${mentionedUser.user.id}>`,false);
    } else if (interaction.commandName == "coinflip") {
        if (curCoinflipRequest == "") {
            curCoinflipRequest = interaction.user.id;
            BotReply(interaction,null,`<@${interaction.user.id}> is offering a **coin flip coffee bet** for **1 coffee**.  Do **/coinflip** to take the bet.`,false);
        } else if (curCoinflipRequest == interaction.user.id) {
            curCoinflipRequest = "";
            BotReply(interaction,null,`<@${interaction.user.id}> revoked their coin flip offer.`,false);
        } else if (interaction.commandName == "coinflip") {
            let coinFlipper1 = curCoinflipRequest;
            let coinFlipper2 = interaction.user.id;
            let winner;
            let loser;

            if (Math.random() > 0.99) {
                // easter egg: 1% chance coin lands on side :^)
                curCoinflipRequest = "";
                BotReply(interaction,null,`The coinflip landed on its side! It is a tie and no coffees are owed!`,false);
                return;
            }

            if (Math.random() > 0.5) {
                winner = coinFlipper1;
                loser = coinFlipper2;
            } else {
                winner = coinFlipper2;
                loser = coinFlipper1;
            }

            AddUserCoffee(loser,winner,1);
            NullifyCoffees(loser);
            NullifyCoffees(winner);
            UpdateFile(coffeeJSON,coffees);
            curCoinflipRequest = "";
            BotReply(interaction,null,`<@${winner}> won the coinflip! <@${loser}> paid up 1 coffee.`,false);

        }
    } else if (interaction.commandName == "transfer") {
        let transferer = interaction.user.id;
        let fromId = interaction.options.get("from").user.id;
        let toId = interaction.options.get("to").user.id;
        let amount = interaction.options.getNumber("amount");

        //check if from user owes less than amount to transferer or that transferer owes less than amount to toId
        if (coffees[fromId][transferer] < amount) {
            // if so, then ephemeral error and return
            BotReply(interaction,null,`<@${fromId}> does not owe you ${amount}`,true);
            return;
        }
        if (coffees[transferer][toId] < amount) {
            BotReply(interaction,null,`You do not owe <@${toId}> ${amount}`,true);
            return;
        }
        if (amount < 0) {
            BotReply(interaction,null,"Cannot transfer negative amount!",true);
            return;
        }
        if (toId == transferer || fromId == transferer) {
            BotReply(interaction,null,"Cannot transfer to or from yourself!",true);
            return;
        }

        RemoveUserCoffee(fromId,transferer,amount);
        RemoveUserCoffee(transferer,fromId,amount);
        AddUserCoffee(fromId,toId,amount);

        NullifyCoffees(fromId);
        NullifyCoffees(toId);
        UpdateFile(coffeeJSON,coffees);
        BotReply(interaction,null,"<@${transferer}> is transfering ${amount} from <@${fromId}> to <@${toId}>.",false);

    } else if (interaction.commandName == "startpot") {
        let spotsAmount = interaction.options.getInteger("amount");

        if (spotsAmount < 2) {
            BotReply(interaction,null,"Must have atleast 2 spots",true);
            return;
        }

        // clear pot players
        curCoffeePotPlayers = {};
        // set pot amount
        curCoffeePotSlots = spotsAmount;

        let coffeePotText =
            `<@${interaction.user.id}> is starting a :coffee: pot with ***${spotsAmount}*** spots!\n\n` +
            `**How it works:**\n` +
            `• Players may wager 1 :coffee: by doing ***/joinpot [# between 1 and 1000]***\n` +
            `• Once **${spotsAmount}** players join the pot, then a random number is selected\n` +
            `• The closest guesser to the number takes all the :coffee: in the pot`;

        const embed = new MessageEmbed()
            .setTitle("Coffee Pot")
            .setDescription(coffeePotText)
            .setThumbnail(
                "https://www.krupsusa.com/medias/?context=bWFzdGVyfGltYWdlc3wxNDQ4OTJ8aW1hZ2UvanBlZ3xpbWFnZXMvaDk5L2hiMS8xMzg3MTUxMjk0NDY3MC5iaW58NzZkZDc3MGJhYmQzMjAwYjc4NmJjN2NjOGMxN2UwZmNkODQ2ZjMwZWE0YzM4OWY4MDFmOTFkZWUxYWVkMzU5Zg"
            );
        BotReply(interaction,embed,"",false);    

    } else if (interaction.commandName == "joinpot") {
        let joinerId = interaction.user.id;
        let guessNumber = interaction.options.getNumber("number");
        //check if pot exists (slots == -1 means not pot exists)
        if (curCoffeePotSlots == -1) {
            BotReply(interaction,null,"No pot currently exists. Create one with **/startpot**!",true);
            return;
        }
        //check if number is between 1-1000
        if (guessNumber < 1 || guessNumber > 1000) {
            BotReply(interaction,null,"Your number must be between 1 and 1000!",true);
            return;
        }
        //check if already in pot
        if (joinerId in curCoffeePotPlayers) {
            BotReply(interaction,null,"You are already in the pot!",true);
            return;
        }

        curCoffeePotPlayers[joinerId] = guessNumber;

        //check if pot now full
        if (curCoffeePotSlots == Object.keys(curCoffeePotPlayers).length) {
            let randomNum = Math.ceil(Math.random() * 1000);
            let coffeePotText = `The chosen number was **${randomNum}**!\n\n`;

            let newPlayerList = {}; //this list will hold diff from num
            for (let playerId in curCoffeePotPlayers) {
                newPlayerList[playerId] = Math.abs(
                    randomNum - curCoffeePotPlayers[playerId]
                );
            }

            let sortedPlayerIds = getSortedKeys(newPlayerList);
            let winner = "";

            if (
                curCoffeePotPlayers[sortedPlayerIds[0]] ==
                curCoffeePotPlayers[sortedPlayerIds[1]]
            ) {
                //THERE WAS A TIE!
                coffeePotText += `There was a tie! No :coffee: is owed!`;
            } else {
                winner = sortedPlayerIds[0];
                coffeePotText += `<@${winner}> won **${
                    curCoffeePotSlots - 1
                }** :coffee:!`;
            }

            // show guesses
            coffeePotText += `\n\n`;
            coffeePotText += `Guesses:\n`;
            for (let userId in curCoffeePotPlayers) {
                coffeePotText += `<@${userId}> **${curCoffeePotPlayers[userId]}**\n`;
            }

            //reset slots and players
            curCoffeePotSlots = -1;
            curCoffeePotPlayers = {};

            if (winner != "") {
                for (let playerId of sortedPlayerIds) {
                    if (playerId != winner) {
                        //playerId owes winner a coffee
                        AddUserCoffee(playerId,winner,1);
                    }
                }
            }

            UpdateFile(coffeeJSON,coffees);

            const embed = new MessageEmbed()
                .setTitle("Coffee Pot Results")
                .setDescription(coffeePotText)
                .setThumbnail(
                    "https://www.krupsusa.com/medias/?context=bWFzdGVyfGltYWdlc3wxNDQ4OTJ8aW1hZ2UvanBlZ3xpbWFnZXMvaDk5L2hiMS8xMzg3MTUxMjk0NDY3MC5iaW58NzZkZDc3MGJhYmQzMjAwYjc4NmJjN2NjOGMxN2UwZmNkODQ2ZjMwZWE0YzM4OWY4MDFmOTFkZWUxYWVkMzU5Zg"
                );

            BotReply(interaction,embed,"",false)

            return;
        }
        BotReply(interaction,null,`<@${interaction.user.id}> joined the pot! Slots remaining: **${curCoffeePotSlots - Object.keys(curCoffeePotPlayers).length}**`,false)
    } else if (interaction.commandName == "leaderboard") {

        const embed = new MessageEmbed()
        .setTitle(":coffee: Leaderboard")
        .setDescription(getLeaderboardString(interaction.channel))
        BotReply(interaction,embed,"",false);

    } else if(interaction.commandName== "talk"){

        //command user data
        let profiledUser = interaction.options.get("user");
        if (profiledUser == undefined) {
            profiledUser = interaction.member;
        }
        let userMessage= interaction.options.getString("message");
        let output;
        //request object
        const document= {
            language:'en',
            type:'PLAIN_TEXT',
            content: userMessage
        }
        const [result] = await gCClient.analyzeSentiment({document: document});
        const gcReponse = result.documentSentiment;
        console.log(gcReponse);
        let stats = getDebts(profiledUser.user.id);
        console.log(stats);

        await gcReponse;
        //generate response
        output=GenerateResponse(result,fileResponses,stats);
        //output

        const msgEmbed = new MessageEmbed()
        .setDescription(`${output}`)
        .setThumbnail("https://cdn.discordapp.com/avatars/878799768963391568/eddb102f5d15650d0dfc73613a86f5d2.webp?size=128")
        .setAuthor(`Coffee Bot`);

        BotReply(interaction,msgEmbed,`<@${interaction.user.id}> said\n> "*${userMessage}*"`,false)

        return;
    }else if (interaction.commandName == "nullify") {
        let coffeeAmount=NullifyCoffees(interaction.member.id)
        UpdateFile(coffeeJSON,coffees);
        BotReply(interaction,null,`<@${interaction.user.id}> nullified ${coffeeAmount} :coffee:`,false);
    }

}
catch(e)
{
    BotReply(interaction,null,`I'm Sowwy UwU~ <@${interaction.user.id}> \n> but something happened and I'm brokie... ||<@${e.message}> ||`,false)
}
});

client.login(token);

function NullifyCoffees(userId)
{
    let coffeeAmount = 0
    if (coffees[userId] == undefined) {
        coffees[userId] = {}
    }

    for (let debtId in coffees[userId]) {
        let oweToDebt = coffees[userId][debtId]
        if (coffees[debtId] == undefined)
            coffees[debtId] = {}
        if (coffees[debtId][userId] == undefined)
            coffees[debtId][userId] = 0
        let debtOweToUser = coffees[debtId][userId]
        let minDirectionalOweage = Math.min(oweToDebt,debtOweToUser)

        coffees[userId][debtId] -= minDirectionalOweage
        coffees[debtId][userId] -= minDirectionalOweage
        coffeeAmount += minDirectionalOweage
    }
return coffeeAmount;
}
async function BotReply(interaction,profilEmbed,message,hidden)
{
    if(profilEmbed&&message=="")
    {
        await interaction.reply({ 
            ephemeral: hidden,
            embeds: [profilEmbed] });
    }
    else if(profilEmbed)
    {
        await interaction.reply({ 
            content:message,
            ephemeral: hidden,
            embeds: [profilEmbed] });
    }
   else {
        await interaction.reply({
            content:message,
            ephemeral: hidden,
        });
    }
}

function AddUserCoffee(interactionUser,mentionedUser,amount)
{
    ValidateUserCoffee(interactionUser,mentionedUser);
    coffees[interactionUser][mentionedUser]+=amount;
}

function ValidateUserCoffee(interactionUser,mentionedUser)
{
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
function RemoveUserCoffee(interactionUser,mentionedUser, amount)
{
    ValidateUserCoffee(interactionUser,mentionedUser);  
    coffees[interactionUser][mentionedUser] -= amount;
}

function GetUserCoffee(interactionUser, mentionedUser)
{
    let curCoffees;
    ValidateUserCoffee(interactionUser,mentionedUser);
    curCoffees = coffees[interactionUser][mentionedUser];
    return curCoffees
}

function UpdateFile(FileName,FileObject)
{
    fs.writeFile(
        `${FileName}`,
        JSON.stringify(FileObject, null, 1),
        (err) => {
            if (err) throw err;
        }
    );
}

function getSortedKeys(obj) {
    var keys = Object.keys(obj);
    return keys.sort(function (a, b) {
        return obj[a] - obj[b];
    });
}

function getSortedKeysLeaderboardStyle(obj) {
    var keys = Object.keys(obj);
    return keys.sort(function (a, b) {
        return obj[b] - obj[a];
    });
}

function getUserFromMention(mention, channel) {
    if (!mention) return undefined;

    return channel.members.get(mention);
}

function getProfileString(userId, channel) {
    let owedCoffs = "";
    let owedAmount = 0;
    let receivingCoffs = "";
    let receivedAmount = 0;

    for (let ower in coffees) {
        for (let receiver in coffees[ower]) {
            // only write profile line if both users exist in channel and the amount != 0
            if (
                channel.members.get(ower) != undefined &&
                channel.members.get(receiver) != undefined &&
                coffees[ower][receiver] != 0
            ) {
                let owerMention = `<@${ower}>`;
                let receiverMention = `<@${receiver}>`;
                if (ower == userId) {
                    owedCoffs += `**${coffees[ower][receiver]}** ${receiverMention}\n`;
                    owedAmount += coffees[ower][receiver];
                } else if (receiver == userId) {
                    receivingCoffs += `**${coffees[ower][receiver]}** ${owerMention}\n`;
                    receivedAmount += coffees[ower][receiver];
                }
            }
        }
    }

    if (owedCoffs == "") {
        owedCoffs = "No owed coffs!\n";
    }
    if (receivingCoffs == "") {
        receivingCoffs = "No redeemable coffs!\n";
    }

    return `**Owed :coffee::**\n${owedCoffs}\n**Redeemable :coffee::**\n${receivingCoffs}\n**Net :coffee: worth:\n${
        receivedAmount - owedAmount
    }**`;
}

function getCoffeeLedgerString(channel) {
    let coffeeLedgerString = "";

    for (let ower in coffees) {
        for (let receiver in coffees[ower]) {
            // only write ledger line if both users exist in channel and the amount != 0
            if (
                channel.members.get(ower) != undefined &&
                channel.members.get(receiver) != undefined &&
                coffees[ower][receiver] != 0
            ) {
                let owerMention = `<@${ower}>`;
                let receiverMention = `<@${receiver}>`;

                let oweLine = `**${coffees[ower][receiver]}** ${owerMention} -> ${receiverMention}`;
                if (coffeeLedgerString != "") {
                    coffeeLedgerString += "\n\n";
                }
                coffeeLedgerString += oweLine;
            }
        }
    }
    return coffeeLedgerString;
}

function getLeaderboardString(channel) {
    let coffeeReceivers = {};
    for (let ower in coffees) {
        for (let receiver in coffees[ower]) {
            if (
                channel.members.get(ower) != undefined &&
                channel.members.get(receiver) != undefined &&
                coffees[ower][receiver] != 0
            ) {
                if (receiver in coffeeReceivers == false) {
                    coffeeReceivers[receiver] = 0;
                }
                if (ower in coffeeReceivers == false) {
                    coffeeReceivers[ower] = 0;
                }
                coffeeReceivers[receiver] += coffees[ower][receiver];
                coffeeReceivers[ower] -= coffees[ower][receiver];
            }
        }
    }

    let coffeeLeaderboardString = "";
    
    let sortedPlayers = getSortedKeysLeaderboardStyle(coffeeReceivers);
    for (let player of sortedPlayers) {

        if (player == sortedPlayers[0] && coffeeReceivers[sortedPlayers[0]] != coffeeReceivers[sortedPlayers[1]] ) {
            coffeeLeaderboardString += `**${coffeeReceivers[player]}** <@${player}> :crown:\n\n`
        }
        else if (player == sortedPlayers[sortedPlayers.length-1] && coffeeReceivers[sortedPlayers[sortedPlayers.length-1]] != coffeeReceivers[sortedPlayers[sortedPlayers.length-2]])
        {
            coffeeLeaderboardString += `**${coffeeReceivers[player]}** <@${player}> :hot_face:\n\n`
        }
        else {
            coffeeLeaderboardString += `**${coffeeReceivers[player]}** <@${player}>\n\n`
        }
    }

    return coffeeLeaderboardString;
}

function GenerateResponse(response, text,coffeeStats)
{
     let numGen=Math.floor(Math.random() * 2);
     var list1;
     var list2;
     var list3;
     var list4;
     var output="Wow did you just like, break out of my response tree???";
     var part1;
     var part2;
     var part3;
     var part4;
     if(numGen==0)
     {

           if((coffeeStats.totalAmount<0 &&coffeeStats.uniqueOwe>coffeeStats.uniqueHold)||(coffeeStats.totalAmount>=0 &&coffeeStats.uniqueOwe<coffeeStats.uniqueHold)||(coffeeStats.totalAmount>0 &&coffeeStats.uniqueOwe>coffeeStats.uniqueHold)||(coffeeStats.totalAmount<0 &&coffeeStats.uniqueOwe<coffeeStats.uniqueHold))
           {
               if(coffeeStats.totalAmount<0 &&coffeeStats.uniqueOwe>coffeeStats.uniqueHold)
               {
                if(response.documentSentiment.score>=0.0)
                {
                    list1= Math.floor(Math.random() * (text.CoffeeNumbersH.Debt.length));
                    list2= Math.floor(Math.random() * (text.CoffeeNumbersH.OweMany.length));
                    part1=text.CoffeeNumbersH.Debt[list1];
                    part2=text.CoffeeNumbersH.OweFew[list2];
                }
                else
                {
                    list1= Math.floor(Math.random() * (text.CoffeeNumbersM.Debt.length));
                    list2= Math.floor(Math.random() * (text.CoffeeNumbersM.OweMany.length));
                    part1=text.CoffeeNumbersM.Debt[list1];
                    part2=text.CoffeeNumbersM.OweFew[list2];
                }
               }
               else if(coffeeStats.totalAmount>=0 &&coffeeStats.uniqueOwe<coffeeStats.uniqueHold)
               {
                if(response.documentSentiment.score>=0.0)
                {
                    list1= Math.floor(Math.random() * (text.CoffeeNumbersH.Profit.length));
                    list2= Math.floor(Math.random() * (text.CoffeeNumbersH.OweFew.length));
                    part1=text.CoffeeNumbersH.Profit[list1];
                    part2=text.CoffeeNumbersH.OweMany[list2];
                }
                else
                {
                    list1= Math.floor(Math.random() * (text.CoffeeNumbersM.Profit.length));
                    list2= Math.floor(Math.random() * (text.CoffeeNumbersM.OweFew.length));
                    part1=text.CoffeeNumbersM.Profit[list1];
                    part2=text.CoffeeNumbersM.OweMany[list2];  
                }
               }
               else if(coffeeStats.totalAmount>0 &&coffeeStats.uniqueOwe>coffeeStats.uniqueHold)
               {
                if(response.documentSentiment.score>=0.0)
                {
                    list1= Math.floor(Math.random() * (text.CoffeeNumbersH.Profit.length));
                    list2= Math.floor(Math.random() * (text.CoffeeNumbersH.OweMany.length));
                    part1=text.CoffeeNumbersH.Profit[list1];
                    part2=text.CoffeeNumbersH.OweFew[list2];
                }
                else
                {
                    list1= Math.floor(Math.random() * (text.CoffeeNumbersM.Profit.length));
                    list2= Math.floor(Math.random() * (text.CoffeeNumbersM.OweMany.length));
                    part1=text.CoffeeNumbersM.Profit[list1];
                    part2=text.CoffeeNumbersM.OweFew[list2];
                }
               }
               else if((coffeeStats.totalAmount<0 &&coffeeStats.uniqueOwe<coffeeStats.uniqueHold))
               {
                if(response.documentSentiment.score>=0.0)
                {
                    list1= Math.floor(Math.random() * (text.CoffeeNumbersH.Debt.length));
                    list2= Math.floor(Math.random() * (text.CoffeeNumbersH.OweFew.length));
                    part1=text.CoffeeNumbersH.Debt[list1];
                    part2=text.CoffeeNumbersH.OweMany[list2];
                }
                else
                {
                    list1= Math.floor(Math.random() * (text.CoffeeNumbersM.Debt.length));
                    list2= Math.floor(Math.random() * (text.CoffeeNumbersM.OweFew.length));
                    part1=text.CoffeeNumbersM.Debt[list1];
                    part2=text.CoffeeNumbersM.OweMany[list2];
                }
               }

                list3= Math.floor(Math.random() * (text.Structs.StructsP.length));
                part3=text.Structs.StructsP[list3];

                if(response.documentSentiment.score>=0.0)
                {
                numGen=Math.floor(Math.random()*2);
                if(numGen==0)
                {
                    list4=Math.floor(Math.random() * (text.WordBank.VH.length));
                    part4=text.WordBank.VH[list4];
                }
                else
                {
                    list4=Math.floor(Math.random() * (text.WordBank.H.length));
                    part4=text.WordBank.H[list4];
                }
                }
                else
                {
                    numGen=Math.floor(Math.random()*2);
                if(numGen==0)
                {
                    list4=Math.floor(Math.random() * (text.WordBank.VM.length));
                    part4=text.WordBank.VM[list4];
                }
                else
                {
                    list4=Math.floor(Math.random() * (text.WordBank.M.length));
                    part4=text.WordBank.M[list4];
                }
                }

                output= part3.replace('@',part4).replace('$',part1).replace('#',part2);
           }
           else{
           numGen=Math.floor(Math.random()*2);
           
           if(numGen==0)
           {
            if (coffeeStats.totalAmount<0)
            {
                if(response.documentSentiment.score>=0.0)
                {
                    list1= Math.floor(Math.random() * (text.CoffeeNumbersH.Debt.length));
                    part1=text.CoffeeNumbersH.Debt[list1];
                }
                else
                {
                    list1= Math.floor(Math.random() * (text.CoffeeNumbersM.Debt.length));
                    part1=text.CoffeeNumbersM.Debt[list1];
                }
            }
            else if (coffeeStats.totalAmount>=0)
            {
                if(response.documentSentiment.score>=0.0)
                {
                    list1= Math.floor(Math.random() * (text.CoffeeNumbersH.Profit.length));
                    output=text.CoffeeNumbersH.Profit[list1];
                }
                else
                {
                    list1= Math.floor(Math.random() * (text.CoffeeNumbersM.Profit.length));
                    output=text.CoffeeNumbersM.Profit[list1];
                }
            }
           }
           else
           {
            if (coffeeStats.uniqueHold<coffeeStats.uniqueOwe)
           {
            if(response.documentSentiment.score>=0.0)
            {
                list1= Math.floor(Math.random() * (text.CoffeeNumbersH.OweFew.length));
                output=text.CoffeeNumbersH.OweFew[list1];
            }
            else
            {
                list1= Math.floor(Math.random() * (text.CoffeeNumbersM.OweFew.length));
                output=text.CoffeeNumbersM.OweFew[list1];
            }
           }
           else if (coffeeStats.uniqueHold>coffeeStats.uniqueOwe)
           {
            if(response.documentSentiment.score>=0.0)
            {
                list1= Math.floor(Math.random() * (text.CoffeeNumbersH.OweMany.length));
                output=text.CoffeeNumbersH.OweMany[list1];
            }
            else
            {
                list1= Math.floor(Math.random() * (text.CoffeeNumbersM.OweMany.length));
                output=text.CoffeeNumbersM.OweMany[list1];
            }
           }
           }
        }
    }       
     else if(numGen==1)
     {
        if(response.documentSentiment.score>=0.4)
        {
            list1= Math.floor(Math.random() * (text.Structs.StructsVH.length));
            output=text.Structs.StructsVH[list1];
        } 
        else if (response.documentSentiment.score>=0.2)
        {
            list1= Math.floor(Math.random() * (text.Structs.StructsH.length));
            output=text.Structs.StructsH[list1];
        }
        else if (response.documentSentiment.score>0.1 )
        {
            list1= Math.floor(Math.random() * (text.Structs.StructsN.length));
            output=text.Structs.StructsN[list1];
        }
        else if (response.documentSentiment.score> 0.0 )
        {
            list1= Math.floor(Math.random() * (text.Structs.StructsM.length));
            output=text.Structs.StructsM[list1];
        }
        else 
        {
            list1= Math.floor(Math.random() * (text.Structs.StructsVM.length));
            output=text.Structs.StructsVM[list1];
        }
     }
     else
     {
        if(response.documentSentiment.score>=0.4)
        {
            list1= Math.floor(Math.random() * (text.WorkBank.VH.length));
            output=text.WorkBank.VH[list1];
        } 
        else if (response.documentSentiment.score>=0.2)
        {
            list1= Math.floor(Math.random() * (text.WorkBank.H.length));
            output=text.WorkBank.H[list1];
        }
        else if (response.documentSentiment.score> 0.0 )
        {
            list1= Math.floor(Math.random() * (text.WorkBank.N.length));
            output=text.WorkBank.N[list1];
        }
        else if (response.documentSentiment.score>0.-1 )
        {
            list1= Math.floor(Math.random() * (text.WorkBank.M.length));
            output=text.WorkBank.M[list1];
        }
        else 
        {
            list1= Math.floor(Math.random() * (text.WorkBank.VM.length));
            output=text.WorkBank.VM[list1];
        }
     }
     return output;
}

function getDebts(userId)
{
    let debts={  
     owedAmount: 0,
     receivedAmount: 0,
     uniqueOwe:0,
     uniqueHold:0,
     totalAmount:0
    }
    for (let ower in coffees) {
        for (let receiver in coffees[ower]) {
            if (
                coffees[ower][receiver] != 0
            ) {
                if (ower == userId) {
                    debts.owedAmount += coffees[ower][receiver];
                    debts.uniqueOwe++;
                } else if (receiver == userId) {
                    debts.receivedAmount += coffees[ower][receiver];
                    debts.uniqueHold++;
                }
            }
        }
    }
    debts.totalAmount=debts.receivedAmount - debts.owedAmount;
    return debts;
}
