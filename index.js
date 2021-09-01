// Require the necessary discord.js classes
const { Client, Intents, MessageEmbed, Message } = require("discord.js");
const { token, coffeeJSON,responseJSON, gCloudJSON } = require("./config.json");
const fs = require("fs");
const { request } = require("http");
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

    if (interaction.commandName === "ledger") {
        let coffeeLedger = getCoffeeLedgerString(interaction.channel);
        const ledgerEmbed = new MessageEmbed()
            .setTitle("Coffee Ledger")
            .setDescription(coffeeLedger);
        await interaction.reply({ embeds: [ledgerEmbed] });
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
        await interaction.reply({ embeds: [profilEmbed] });
    } else if (interaction.commandName == "give") {
        let mentionedUser = getUserFromMention(
            interaction.options.get("user").user.id,
            interaction.channel
        );
        let parsedCoffeeAmount = interaction.options.getNumber("amount");
        if (mentionedUser) {
            if (mentionedUser == undefined) {
                await interaction.reply({
                    content: "You must @ an existing person",
                    ephemeral: true,
                });
                return;
            }
        }
        if (mentionedUser.user.id == interaction.user.id) {
            await interaction.reply({
                content: "You cannot give yourself coffees lul",
                ephemeral: true,
            });
            return;
        }
        if (isNaN(parsedCoffeeAmount) || parsedCoffeeAmount <= 0) {
            await interaction.reply({
                content: "Nice try hax0r man",
                ephemeral: true,
            });
            return;
        }

        if (coffees[interaction.user.id] == undefined) {
            coffees[interaction.user.id] = {};
        }
        let curCoffees = 0;
        if (coffees[interaction.user.id][mentionedUser.user.id]) {
            curCoffees = coffees[interaction.user.id][mentionedUser.user.id];
        }

        coffees[interaction.user.id][mentionedUser.user.id] =
            curCoffees + parsedCoffeeAmount;
        //write new json to file
        fs.writeFile(
            `${coffeeJSON}`,
            JSON.stringify(coffees, null, 1),
            (err) => {
                if (err) throw err;
            }
        );

        let ower = interaction.user.id;
        let receiver = mentionedUser.user.id;
        let owerMention = `<@${ower}>`;
        let receiverMention = `<@${receiver}>`;
        await interaction.reply(
            `${owerMention} gave ${receiverMention} ${parsedCoffeeAmount} coffee${
                parsedCoffeeAmount > 1 ? "s" : ""
            }`
        );
    } else if (interaction.commandName == "redeem") {
        let mentionedUser = getUserFromMention(
            interaction.options.get("user").user.id,
            interaction.channel
        );
        let parsedCoffeeAmount = interaction.options.getNumber("amount");
        if (mentionedUser) {
            if (mentionedUser == undefined) {
                await interaction.reply({
                    content: "You must @ an existing person",
                    ephemeral: true,
                });
                return;
            }
        }
        if (parsedCoffeeAmount) {
            if (isNaN(parsedCoffeeAmount) || parsedCoffeeAmount <= 0) {
                await interaction.reply({
                    content: "Nice try hax0r man",
                    ephemeral: true,
                });
                return;
            }
        }

        if (coffees[mentionedUser.user.id] == undefined) {
            coffees[mentionedUser.user.id] = {};
        }
        let curCoffees = 0;
        if (coffees[mentionedUser.user.id][interaction.user.id]) {
            curCoffees = coffees[mentionedUser.user.id][interaction.user.id];
        }

        let receiver = interaction.user.id;
        let ower = mentionedUser.user.id;
        let receiverMention = `<@${receiver}>`;
        let owerMention = `<@${ower}>`;

        if (curCoffees < parsedCoffeeAmount) {
            await interaction.reply({
                content: `${owerMention} does not owe you ${parsedCoffeeAmount}`,
                ephemeral: true,
            });
            return;
        }

        coffees[mentionedUser.user.id][interaction.user.id] =
            curCoffees - parsedCoffeeAmount;
        //write new json to file
        fs.writeFile(
            `${coffeeJSON}`,
            JSON.stringify(coffees, null, 1),
            (err) => {
                if (err) throw err;
            }
        );

        await interaction.reply(
            `${receiverMention} redeemed ${parsedCoffeeAmount} coffee${
                parsedCoffeeAmount > 1 ? "s" : ""
            } from ${owerMention}`
        );
    } else if (interaction.commandName == "coinflip") {
        if (curCoinflipRequest == "") {
            curCoinflipRequest = interaction.user.id;
            await interaction.reply(
                `<@${interaction.user.id}> is offering a **coin flip coffee bet** for **1 coffee**.  Do **/coinflip** to take the bet.`
            );
        } else if (curCoinflipRequest == interaction.user.id) {
            curCoinflipRequest = "";
            await interaction.reply(
                `<@${interaction.user.id}> revoked their coin flip offer.`
            );
        } else if (interaction.commandName == "coinflip") {
            let coinFlipper1 = curCoinflipRequest;
            let coinFlipper2 = interaction.user.id;
            let winner;
            let loser;

            if (Math.random() > 0.99) {
                // easter egg: 1% chance coin lands on side :^)
                curCoinflipRequest = "";
                await interaction.reply(
                    `The coinflip landed on its side! It is a tie and no coffees are owed!`
                );
                return;
            }

            if (Math.random() > 0.5) {
                winner = coinFlipper1;
                loser = coinFlipper2;
            } else {
                winner = coinFlipper2;
                loser = coinFlipper1;
            }

            let curCoffees = 0;
            if (coffees[loser])
                curCoffees = coffees[loser][winner]
                    ? coffees[loser][winner]
                    : 0;
            else {
                coffees[loser] = {};
            }

            coffees[loser][winner] = curCoffees + 1;
            //write new json to file
            fs.writeFile(
                `${coffeeJSON}`,
                JSON.stringify(coffees, null, 1),
                (err) => {
                    if (err) throw err;
                }
            );

            curCoinflipRequest = "";
            await interaction.reply(
                `<@${winner}> won the coinflip! <@${loser}> paid up 1 coffee.`
            );
        }
    } else if (interaction.commandName == "transfer") {
        let transferer = interaction.user.id;
        let fromId = interaction.options.get("from").user.id;
        let toId = interaction.options.get("to").user.id;
        let amount = interaction.options.getNumber("amount");

        //check if from user owes less than amount to transferer or that transferer owes less than amount to toId
        if (coffees[fromId][transferer] < amount) {
            // if so, then ephemeral error and return
            await interaction.reply({
                content: `<@${fromId}> does not owe you ${amount}`,
                ephemeral: true,
            });
            return;
        }
        if (coffees[transferer][toId] < amount) {
            await interaction.reply({
                content: `You do not owe <@${toId}> ${amount}`,
                ephemeral: true,
            });
            return;
        }
        if (coffees[fromId][toId] == undefined) {
            coffees[fromId][toId] = 0;
        }
        if (amount < 0) {
            await interaction.reply({
                content: `Cannot transfer negative amount!`,
                ephemeral: true,
            });
            return;
        }
        if (toId == transferer || fromId == transferer) {
            await interaction.reply({
                content: `Cannot transfer to or from yourself!`,
                ephemeral: true,
            });
            return;
        }

        coffees[fromId][transferer] -= amount;
        coffees[transferer][toId] -= amount;

        if (fromId != toId) coffees[fromId][toId] += amount;

        //write new json to file
        fs.writeFile(
            `${coffeeJSON}`,
            JSON.stringify(coffees, null, 1),
            (err) => {
                if (err) throw err;
            }
        );

        await interaction.reply(
            `<@${transferer}> is transfering ${amount} from <@${fromId}> to <@${toId}>.`
        );
    } else if (interaction.commandName == "startpot") {
        let spotsAmount = interaction.options.getInteger("amount");

        if (spotsAmount < 2) {
            await interaction.reply({
                content: `Must have atleast 2 spots`,
                ephemeral: true,
            });
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
        await interaction.reply({ embeds: [embed] });
    } else if (interaction.commandName == "joinpot") {
        let joinerId = interaction.user.id;
        let guessNumber = interaction.options.getInteger("number");
        //check if pot exists (slots == -1 means not pot exists)
        if (curCoffeePotSlots == -1) {
            await interaction.reply({
                content: `No pot currently exists. Create one with **/startpot**!`,
                ephemeral: true,
            });
            return;
        }
        //check if number is between 1-1000
        if (guessNumber < 1 || guessNumber > 1000) {
            await interaction.reply({
                content: `Your number must be between 1 and 1000!`,
                ephemeral: true,
            });
            return;
        }
        //check if already in pot
        if (joinerId in curCoffeePotPlayers) {
            await interaction.reply({
                content: `You are already in the pot!`,
                ephemeral: true,
            });
            return;
        }

        curCoffeePotPlayers[joinerId] = guessNumber;

        //check if pot now full
        if (curCoffeePotSlots == Object.keys(curCoffeePotPlayers).length) {
            let randomNum = Math.ceil(Math.random() * 1000);
            let coffeePotText = `The chosen number was **${randomNum}**!\n\n`;

            // calculate winner
            let distances = [];

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
                        if (coffees[playerId] == undefined) {
                            coffees[playerId] = {};
                        }
                        let curCoffees = 0;
                        if (coffees[playerId][winner] == undefined) {
                            coffees[playerId][winner] = 0;
                        }
                        coffees[playerId][winner] += 1;
                    }
                }
            }

            fs.writeFile(
                `${coffeeJSON}`,
                JSON.stringify(coffees, null, 1),
                (err) => {
                    if (err) throw err;
                }
            );

            const embed = new MessageEmbed()
                .setTitle("Coffee Pot Results")
                .setDescription(coffeePotText)
                .setThumbnail(
                    "https://www.krupsusa.com/medias/?context=bWFzdGVyfGltYWdlc3wxNDQ4OTJ8aW1hZ2UvanBlZ3xpbWFnZXMvaDk5L2hiMS8xMzg3MTUxMjk0NDY3MC5iaW58NzZkZDc3MGJhYmQzMjAwYjc4NmJjN2NjOGMxN2UwZmNkODQ2ZjMwZWE0YzM4OWY4MDFmOTFkZWUxYWVkMzU5Zg"
                );
            await interaction.reply({ embeds: [embed] });

            return;
        }

        await interaction.reply(
            `<@${interaction.user.id}> joined the pot! Slots remaining: **${
                curCoffeePotSlots - Object.keys(curCoffeePotPlayers).length
            }**`
        );
    } else if (interaction.commandName == "leaderboard") {
        const embed = new MessageEmbed()
        .setTitle(":coffee: Leaderboard")
        .setDescription(getLeaderboardString(interaction.channel))

        await interaction.reply({ embeds: [embed] });
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
        let stats = getDebts(profiledUser.user.id,interaction.channel);
        console.log(stats);

        await gcReponse;
        //generate response
        output=GenerateResponse(result,fileResponses,stats);
        //output
        const msgEmbed = new MessageEmbed()
        .setDescription(`${output}`)
        .setThumbnail("https://cdn.discordapp.com/avatars/878799768963391568/eddb102f5d15650d0dfc73613a86f5d2.webp?size=128")
        .setAuthor(`Coffee Bot`);
        await interaction.reply({
            content:`<@${interaction.user.id}> said\n> "*${userMessage}*"`,
            embeds: [msgEmbed]
        });
        return;
    } else if (interaction.commandName == "nullify") {
        let userId = interaction.member.id
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

        
        fs.writeFile(
            `${coffeeJSON}`,
            JSON.stringify(coffees, null, 1),
            (err) => {
                if (err) throw err;
            }
        );

        await interaction.reply({
            content:`<@${interaction.user.id}> nullified ${coffeeAmount} :coffee:`,
        });


    }
});

client.login(token);

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
     var output;
     var part1;
     var part2;
     var part3;
     var part4;
     if(numGen==0)
     {

           if((coffeeStats.totalAmount<0 &&coffeeStats.uniqueOwe>coffeeStats.uniqueHold)||(coffeeStats.totalAmount>0 &&coffeeStats.uniqueOwe<coffeeStats.uniqueHold)||(coffeeStats.totalAmount>0 &&coffeeStats.uniqueOwe>coffeeStats.uniqueHold)||(coffeeStats.totalAmount<0 &&coffeeStats.uniqueOwe<coffeeStats.uniqueHold))
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
               else if(coffeeStats.totalAmount>0 &&coffeeStats.uniqueOwe<coffeeStats.uniqueHold)
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
                    list1= Math.floor(Math.random() * (text.CoffeeNumbersH.Profit.length));
                    part1=text.CoffeeNumbersH.Profit[list1];
                }
                else
                {
                    list1= Math.floor(Math.random() * (text.CoffeeNumbersM.Profit.length));
                    part1=text.CoffeeNumbersM.Profit[list1];
                }
            }
            else if (coffeeStats.totalAmount>0)
            {
                if(response.documentSentiment.score>=0.0)
                {
                    list1= Math.floor(Math.random() * (text.CoffeeNumbersH.Debt.length));
                    output=text.CoffeeNumbersH.Debt[list1];
                }
                else
                {
                    list1= Math.floor(Math.random() * (text.CoffeeNumbersM.Debt.length));
                    output=text.CoffeeNumbersM.Debt[list1];
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

function getDebts(userId, channel)
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
