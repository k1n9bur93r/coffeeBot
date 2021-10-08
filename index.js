// Require the necessary discord.js classes
const { Client, Intents, MessageEmbed } = require("discord.js");
const { token} = require("./config.json");
const cardGame= require("./CardGame");
const fileIO= require("./fileIO");
const bestOf= require("./BestOf");
const response=require("./Response.js");

let curCoinflipRequest = "";

let curRPSRequest = "";
let curRPSChoice = "";

let curCoffeePotPlayers = {};
let curCoffeePotSlots = -1;
let maxMultiflipAmount = 5;
let multiflipRequests = {};

let GlobalTimers=[];
function TimerObject(timer,timerName,callbackMethod)
{
    return{
        Timer:timer,
        functionCall:callbackMethod,
        Name:timerName
    }
}

// Create a new client instance
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MEMBERS,
    ],
});

client.login(token);

// When the client is ready, run this code (only once)
client.once("ready", () => {
    console.log("Ready!");
    response.Initalize();
    client.user.setActivity("/commands", { type: "LISTENING" });
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    try {
        if (interaction.commandName === "multiflip") {
            let flipAmount = interaction.options.getInteger("amount");

            if (flipAmount < 1) {
                BotReply(interaction, null, `Amount must be positive!`, true);
                return;
            }
            if (flipAmount > maxMultiflipAmount) {
                BotReply(
                    interaction,
                    null,
                    `The current multiflip cap is ${maxMultiflipAmount}!`,
                    true
                );
                return;
            }
            if (
                flipAmount in multiflipRequests &&
                multiflipRequests[flipAmount] == interaction.user.id
            ) {
                //user revoked
                delete multiflipRequests[flipAmount];
                BotReply(
                    interaction,
                    null,
                    `<@${interaction.user.id}> revoked their multiflip offer.`,
                    false
                );
                return;
            }

            if (flipAmount in multiflipRequests == false) {
                //add flip request
                multiflipRequests[flipAmount] = interaction.user.id;
                BotReply(
                    interaction,
                    null,
                    `<@${interaction.user.id}> is offering **${flipAmount}** coin flips for 1 :coffee: each. Do **/multiflip ${flipAmount}** to take the bet.`,
                    false
                );
                return;
            }

            if (flipAmount in multiflipRequests) {
                // do flips with person
                let player1 = interaction.user.id;
                let player2 = multiflipRequests[flipAmount];
                delete multiflipRequests[flipAmount];

                let player1wins = 0;
                let player2wins = 0;
                let responseText = ``;
                for (let x = 0; x < flipAmount; x++) {
                    let result = Coinflip(player1, player2);
                    if (result.coinSide == "side") {
                        responseText =
                            responseText += `**The coin landed on its side!**\n`;
                    } else {
                        if (result.coinWin == player1) {
                            player1wins++;
                        } else {
                            player2wins++;
                        }
                        responseText += `<@${result.coinWin}> Won!\n`;
                    }
                }

                responseText += `\n`;

                if (player1wins == player2wins) {
                    responseText += `Both players tied in flips! No :coffee: owed.`;
                } else if (player1wins > player2wins) {
                    responseText += `<@${player1}> won **${
                        player1wins - player2wins
                    }** :coffee: from <@${player2}>!`;
                } else {
                    responseText += `<@${player2}> won **${
                        player2wins - player1wins
                    }** :coffee: from <@${player1}>!`;
                }

                const embed = new MessageEmbed()
                    .setTitle("Multiflip Results")
                    .setDescription(responseText)
                    .setThumbnail(
                        "https://justflipacoin.com/img/share-a-coin.png"
                    );
                BotReply(interaction, 
                         embed, 
                         "",
                         false);
                return;
            }

            BotReply(
                interaction,
                null,
                "this shouldn't happen! @ austin and call him a dumdum",
                true
            );
        } else if (interaction.commandName === "ledger") {
            let coffeeLedger = getCoffeeLedgerString(interaction.channel);
            const ledgerEmbed = new MessageEmbed()
                .setTitle("Coffee Ledger")
                .setDescription(coffeeLedger);
            BotReply(interaction, ledgerEmbed, "", false);
        } else if (interaction.commandName == "profile") {
            let profiledUser = interaction.options.get("user");
            if (profiledUser == undefined) {
                profiledUser = interaction.member;
            }

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
            BotReply(interaction, profilEmbed, "", false);
        } else if (interaction.commandName == "give") {
            let mentionedUser = getUserFromMention(
                interaction.options.get("user").user.id,
                interaction.channel
            );
            let parsedCoffeeAmount = interaction.options.getInteger("amount");//num

            if (mentionedUser) {
                if (mentionedUser == undefined) {
                    BotReply(
                        interaction,
                        null,
                        `You must @ an existing person`,
                        true
                    );
                    return;
                }
            }
            if (mentionedUser.user.id == interaction.user.id) {
                BotReply(
                    interaction,
                    null,
                    `You cannot give yourself coffees lul`,
                    true
                );
                return;
            }
            if (isNaN(parsedCoffeeAmount) || parsedCoffeeAmount <= 0) {
                BotReply(interaction, null, `Nice try hax0r man`, true);
                return;
            }
            fileIO.AddUserCoffee(
                interaction.user.id,
                mentionedUser.user.id,
                parsedCoffeeAmount,
                "GIVE"
            );
            fileIO.UpdateFile("c");

            //lStats({circulation:parsedCoffeeAmount});
            //fileIO.UpdateFile(statsJSON,stats);

            BotReply(
                interaction,
                null,
                `<@${interaction.user.id}> gave <@${
                    mentionedUser.user.id
                }> ${parsedCoffeeAmount} coffee${
                    parsedCoffeeAmount > 1 ? "s" : ""
                }`,
                false
            );
        } else if (interaction.commandName == "redeem") {
            let mentionedUser = getUserFromMention(
                interaction.options.get("user").user.id,
                interaction.channel
            );

            let parsedCoffeeAmount = interaction.options.getInteger("amount");//num

            if (mentionedUser) {
                if (mentionedUser == undefined) {
                    BotReply(
                        interaction,
                        null,
                        `You must @ an existing person`,
                        true
                    );
                    return;
                }
            }
            if (parsedCoffeeAmount) {
                if (isNaN(parsedCoffeeAmount) || parsedCoffeeAmount <= 0) {
                    BotReply(interaction, null, `Nice try hax0r man`, true);
                    return;
                }
            }

            if (
                fileIO.GetUserCoffeeDebt(mentionedUser.user.id, interaction.user.id) <
                parsedCoffeeAmount
            ) {
                BotReply(
                    interaction,
                    null,
                    `<@${mentionedUser.user.id}> does not owe you ${parsedCoffeeAmount}`,
                    true
                );
                return;
            }
            fileIO.RemoveUserCoffee(
                mentionedUser.user.id,
                interaction.user.id,
                parsedCoffeeAmount,
                "REDEEM"
            );
            fileIO.UpdateFile("c");

            //UpdateGlobalStats({redeemed:parsedCoffeeAmount,circulation:-Math.abs(parsedCoffeeAmount)});
            //fileIO.UpdateFile(statsJSON,stats);

            BotReply(
                interaction,
                null,
                `<@${
                    interaction.user.id
                }> redeemed ${parsedCoffeeAmount} coffee${
                    parsedCoffeeAmount > 1 ? "s" : ""
                } from <@${mentionedUser.user.id}>`,
                false
            );
        } else if (interaction.commandName == "coinflip") {
            if (curCoinflipRequest == "") {
                curCoinflipRequest = interaction.user.id;
                BotReply(
                    interaction,
                    null,
                    `<@${interaction.user.id}> is offering a **coin flip coffee bet** for **1 coffee**.  Do **/coinflip** to take the bet.`,
                    false
                );
            } else if (curCoinflipRequest == interaction.user.id) {
                curCoinflipRequest = "";
                BotReply(
                    interaction,
                    null,
                    `<@${interaction.user.id}> revoked their coin flip offer.`,
                    false
                );
            } else if (interaction.commandName == "coinflip") {
                let result = Coinflip(curCoinflipRequest, interaction.user.id);
                if (result.coinSide == "side")
                    BotReply(
                        interaction,
                        null,
                        `The coinflip landed on its side! It is a tie and no coffees are owed!`,
                        false
                    );
                //else if(result.coinSide=="split")
                //    BotReply(interaction,null,`The coin split in two and both halves were flipped. <@${result.coinWin}> won those coinflips! <@${result.coinLose}> paid up 2 coffees.`,false);
                else
                    BotReply(
                        interaction,
                        null,
                        `<@${result.coinWin}> won the coinflip! <@${result.coinLose}> paid up 1 coffee.`,
                        false
                    );
                //UpdateGlobalStats({coinflip:1,circulation:1,winnerId:winner});
                //fileIO.UpdateFile(statsJSON,stats);

                fileIO.UpdateFile("c");
                curCoinflipRequest = "";
            }
        } else if (interaction.commandName == "transfer") {
            let transferer = interaction.user.id;
            let fromId = interaction.options.get("from").user.id;
            let toId = interaction.options.get("to").user.id;
            let amount = interaction.options.getInteger("amount");//num

            //check if from user owes less than amount to transferer or that transferer owes less than amount to toId
           if(fileIO.GetUserCoffeeDebt(fromId,transferer)<amount)
            {    // if so, then ephemeral error and return
                BotReply(
                    interaction,
                    null,
                    `<@${fromId}> does not owe you ${amount}`,
                    true
                );
                return;
            }
            if(fileIO.GetUserCoffeeDebt(transferer,toId)<amount)
            {
                BotReply(
                    interaction,
                    null,
                    `You do not owe <@${toId}> ${amount}`,
                    true
                );
                return;
            }
            if (amount < 0) {
                BotReply(
                    interaction,
                    null,
                    "Cannot transfer negative amount!",
                    true
                );
                return;
            }
            if (toId == transferer || fromId == transferer) {
                BotReply(
                    interaction,
                    null,
                    "Cannot transfer to or from yourself!",
                    true
                );
                return;
            }
            fileIO.RemoveUserCoffee(fromId, transferer, amount,"TRANSFER");
            fileIO.RemoveUserCoffee(transferer, toId, amount,"TRANSFER");
            //if from = to then coffees cancel out!
            if (fromId != toId) fileIO.AddUserCoffee(fromId, toId, amount,"TRANSFER");

            fileIO.UpdateFile("c");

            //UpdateGlobalStats({PotGames:1,PotCoffs:curCoffeePotSlots+1,winnerId:winner});
            //fileIO.UpdateFile(statsJSON,stats);

            BotReply(
                interaction,
                null,
                `<@${transferer}> is transfering ${amount} from <@${fromId}> to <@${toId}>.`,
                false
            );
        } else if (interaction.commandName == "startpot") {
            let spotsAmount = interaction.options.getInteger("amount");

            if (spotsAmount < 2) {
                BotReply(interaction, null, "Must have atleast 2 spots", true);
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
            BotReply(interaction, embed, "", false);
        } else if (interaction.commandName == "joinpot") {
            let joinerId = interaction.user.id;
            let guessNumber = interaction.options.getInteger("number");
            //check if pot exists (slots == -1 means not pot exists)
            if (curCoffeePotSlots == -1) {
                BotReply(
                    interaction,
                    null,
                    "No pot currently exists. Create one with **/startpot**!",
                    true
                );
                return;
            }
            //check if number is between 1-1000
            if (guessNumber < 1 || guessNumber > 1000) {
                BotReply(
                    interaction,
                    null,
                    "Your number must be between 1 and 1000!",
                    true
                );
                return;
            }
            //check if already in pot
            if (joinerId in curCoffeePotPlayers) {
                BotReply(
                    interaction,
                    null,
                    "You are already in the pot!",
                    true
                );
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
                if (winner != "") {
                    for (let playerId of sortedPlayerIds) {
                        if (playerId != winner) {
                            //playerId owes winner a coffee
                            fileIO.AddUserCoffee(playerId, winner, 1,"COFFEPOT");
                        }
                    }
                }
                fileIO.UpdateFile("c");

                //UpdateGlobalStats({PotGames:1,circulation:curCoffeePotSlots-1,PotCoffs:curCoffeePotSlots,winnerId:winner});
                //fileIO.UpdateFile(statsJSON,stats);

                //reset slots and players
                curCoffeePotSlots = -1;
                curCoffeePotPlayers = {};

                const embed = new MessageEmbed()
                    .setTitle("Coffee Pot Results")
                    .setDescription(coffeePotText)
                    .setThumbnail(
                        "https://www.krupsusa.com/medias/?context=bWFzdGVyfGltYWdlc3wxNDQ4OTJ8aW1hZ2UvanBlZ3xpbWFnZXMvaDk5L2hiMS8xMzg3MTUxMjk0NDY3MC5iaW58NzZkZDc3MGJhYmQzMjAwYjc4NmJjN2NjOGMxN2UwZmNkODQ2ZjMwZWE0YzM4OWY4MDFmOTFkZWUxYWVkMzU5Zg"
                    );

                BotReply(interaction, embed, "", false);

                return;
            }
            BotReply(
                interaction,
                null,
                `<@${interaction.user.id}> joined the pot! Slots remaining: **${
                    curCoffeePotSlots - Object.keys(curCoffeePotPlayers).length
                }**`,
                false
            );
        } else if (interaction.commandName == "leaderboard") {
            const embed = new MessageEmbed()
                .setTitle(":coffee: Leaderboard")
                .setDescription(getLeaderboardString(interaction.channel));
            BotReply(interaction, embed, "", false);
        } else if (interaction.commandName == "talk") {
            let responseObject=await response.CommandTalk(interaction.user.id,interaction.options.getString("message"))
            BulkReplyHandler(interaction,responseObject);
        } else if (interaction.commandName == "serverstats") {
            let embedText = `Total Coffees in Circulation: *${stats.CoffsInCirculation}*\nTotal Coffees Redeemed: *${stats.TotalCoffsRedeemed}*\n Recent Bet Winner: *<@${stats.RecentCoffWinner}>*\nLargest Coffee Pot Win: *${stats.LargestPotWon}*\nTotal Coffees Bet In Pots: *${stats.TotalPotCoffs}*\nTotal Coffee Pots: *${stats.TotalPotGames}*\nTotal Coin Flips: *${stats.TotalCoinFlips}*\nTotal Coffees Bet In Wars: *${stats.TotalWarCoffs}*\nTotal Games of War: *${stats.TotalWarGames}*\n Highest War Game Pot: *${stats.LargestWarWon}*\n`;
            const embed = new MessageEmbed()
                .setTitle("**C O F F E E  S T A T Z**")
                .setDescription(embedText)
                .setThumbnail(
                    "https://ipcdn.freshop.com/resize?url=https://images.freshop.com/1564405684703359252/a899a14345410c863a4bfd4541974f69_large.png&width=256&type=webp&quality=80"
                );

            BotReply(interaction, embed, "", false);
        } else if (interaction.commandName == "21End") {
            BulkReplyHandler(
                interaction,
                cardGame.CommandEndGame(interaction.user.id));
        } else if (interaction.commandName == "21") {
            BulkReplyHandler(
                interaction,
                cardGame.CommandStartJoinGame(interaction.user.id,interaction.options.getInteger("amount")));
        } else if (interaction.commandName =="stay") {
            BulkReplyHandler(
                interaction,
                cardGame.CommandStay(interaction.user.id));
        } else if (interaction.commandName == "hand") {
            BulkReplyHandler(
                interaction,
                cardGame.CommandHand(interaction.user.id));
        } else if (interaction.commandName =="draw") {
            BulkReplyHandler(
                interaction,
                cardGame.CommandDraw(interaction.user.id));
        } else if (interaction.commandName == "players"){
            BulkReplyHandler(
                interaction,
                cardGame.CommandPlayerList(interaction.user.id));
        } else if (interaction.commandName == "rps") {
            if (curRPSRequest == "") {
                curRPSRequest = interaction.user.id;
                curRPSChoice = interaction.options.getString("choice");
                BotReply(
                    interaction,
                    null,
                    `<@${interaction.user.id}> is offering a game of **rock, paper, scissors** for **1 coffee**. Do **/rps [choice]** to take the bet.`,
                    false
                );
                return;
            }

            if (curRPSRequest == interaction.user.id) {
                BotReply(
                    interaction,
                    null,
                    `<@${interaction.user.id}> revoked their rock, paper, scissors offer.`,
                    false
                );
                curRPSRequest = "";
                return;
            }

            // if still here then execute rps
            let player1 = curRPSRequest;
            let player2 = interaction.user.id;
            let player1Choice = curRPSChoice;
            let player2Choice = interaction.options.getString("choice");

            let choices = ["Rock", "Paper", "Scissors"];
            let verbs = ["crushes", "covers", "cuts"];
            let emojis = [":rock:", ":roll_of_paper:", ":scissors:"];

            player1Choice = choices.indexOf(player1Choice);
            player2Choice = choices.indexOf(player2Choice);
            curRPSRequest = "";
            if (player1Choice == player2Choice) {
                //tie
                BotReply(
                    interaction,
                    null,
                    `<@${player1}> and <@${player2}> tied by both choosing ${emojis[player1Choice]}.`,
                    false
                );
            } else if ((player1Choice + 1) % 3 != player2Choice) {
                //player1 won
                fileIO.AddUserCoffee(player2, player1, 1,"RPS");
                fileIO.UpdateFile("c");
                BotReply(
                    interaction,
                    null,
                    `<@${player1}>'s ${emojis[player1Choice]} ${verbs[player1Choice]} <@${player2}>'s ${emojis[player2Choice]}. <@${player2}> paid up 1 :coffee:.`,
                    false
                );
            } else {
                //player2 won

                fileIO.AddUserCoffee(player1, player2, 1,"RPS");
                fileIO.UpdateFile("c");
                BotReply(
                    interaction,
                    null,
                    `<@${player2}>'s ${emojis[player2Choice]} ${verbs[player2Choice]} <@${player1}>'s ${emojis[player1Choice]}. <@${player1}> paid up 1 :coffee:.`,
                    false
                );
            }
        } else if (interaction.commandName == "bestjoin"){
            BulkReplyHandler(
                interaction,
                bestOf.CommandAddPlayer(interaction.user.id));
        }else if (interaction.commandName == "bestcreate"){
            BulkReplyHandler(
                interaction,
                bestOf.CommandNewBestOf(interaction.user.id,interaction.options.getString("game"),interaction.options.getInteger("coffs"),interaction.options.getInteger("rounds")));
        }else if (interaction.commandName == "bestplayers"){
            BulkReplyHandler(
                interaction,
                bestOf.CommandBestOfPlayerMessage());
            
        }
} catch (e) {
        BotReply(
            interaction,
            null,
            `I'm Sowwy UwU~ <@${
                interaction.user.id
            }> \n> but something happened and I'm brokie... || ${e.message}${
                e.stack ? `\nStackTrace:\n=========\n${e.stack}` : ``
            } ||`,
            false
        );
    }
});

function TimeOutHandler(options)
{
    if(options.actionName.includes('CG-'))
    {
        if(options.actionName=="CG-End"||options.actionName=="CG-Init")
        {
            if(options.actionName=="CG-Init")
            {
                BulkReplyHandler(options.interaction,cardGame.CommandTimerEvent(GlobalTimers[options.index].functionCall))

            }
            for(let x=0;x<GlobalTimers.length;x++)
            {
                if(GlobalTimers[x].Name.includes("CG-"))
                {
                    clearTimeout(GlobalTimers[x].Timer);
                    GlobalTimers.splice(x,1);// I don't think this will break things now, but this might mess with the indexing of the array when looping
                }
            }
        }
        else
        {
            BulkReplyHandler(options.interaction,cardGame.CommandTimerEvent(GlobalTimers[options.index].functionCall))
        }
    }
    GlobalTimers.splice(options.index,1);
}

function BulkReplyHandler(interaction,communicationRequests)
{
    for(let x=0;x<communicationRequests.length;x++)
    {
        let embed= null;
        if(communicationRequests[x].embed!=null)
        {
          embed= new MessageEmbed();
                embed.setTitle(communicationRequests[x].embed.title);
                embed.setDescription(communicationRequests[x].embed.text);
                embed.setColor(communicationRequests[x].embed.color);
                embed.setThumbnail(communicationRequests[x].embed.thumbnail);
                if(communicationRequests[x].embed.fields)
                {
                    for(let y=0;y<communicationRequests[x].embed.fields.length;y++){
                        embed.addField(communicationRequests[x].embed.fields[y].title,communicationRequests[x].embed.fields[y].content,communicationRequests[x].embed.fields[y].fieldsAlign);
                    }
                }
        }
        if(communicationRequests[x].reply==true)
        {
            BotReply(
                interaction,
                embed,
                communicationRequests[x].message,
                communicationRequests[x].hidden
            );
        }
        else
        {
            BotChannelMessage(
                interaction,
                embed,
                communicationRequests[x].message
            );
        }
        if(communicationRequests[x].TimerSettings!=null)
        {
            if(communicationRequests[x].TimerSettings.Replace.length!=0&&GlobalTimers.length>0)
            {
                for(let z=0;z<communicationRequests[x].TimerSettings.Replace.length;z++)
                {
                    console.log("Name of the replace I am checking "+communicationRequests[x].TimerSettings.Replace[z]);
                    for(let y=0;y<GlobalTimers.length;y++)
                    {
                        console.log(`Currently looking to replace timer: ${communicationRequests[x].TimerSettings.Replace[z]} Currently looking at : ${GlobalTimers[y].Name}`);
                        if(communicationRequests[x].TimerSettings.Replace[z]==GlobalTimers[y].Name)
                        {
                            console.log(`REPLACED A CURRENT TIMER  '${GlobalTimers[y].Name}' with: ${communicationRequests[x].TimerSettings.Action}`);
                            clearTimeout(GlobalTimers[y].Timer);
                            GlobalTimers.splice(y,1);
                            break;
                        }
                    }
                }
            }
                console.log("ADDED A NEW TIMER: "+communicationRequests[x].TimerSettings.Action);
                GlobalTimers.push(
                    TimerObject(
                        setTimeout(
                            TimeOutHandler, 
                            communicationRequests[x].TimerSettings.Length , 
                            {
                            index:GlobalTimers.length,
                            actionName:communicationRequests[x].TimerSettings.Action,interaction:interaction
                            }
                            ),
                        communicationRequests[x].TimerSettings.Action,
                        communicationRequests[x].TimerSettings.functionCall
                        )
                    );
        }

    }
}

function BotChannelMessage(interaction, embed, message) {
    if (embed && message == "") {
        client.channels.cache.get(interaction.channelId).send({ embeds: [embed] });
    } else if (embed) {
        client.channels.cache.get(interaction.channelId).send({
            content: message,
            embeds: [embed],
        });
    } else {
        client.channels.cache.get(interaction.channelId).send(message);
    }
}
async function BotReply(interaction, embed, message, ishidden) {
    if (embed && message == "") {
        await interaction.reply({
            ephemeral: ishidden,
            embeds: [embed],
        });
    } else if (embed) {
        await interaction.reply({
            content: message,
            ephemeral: ishidden,
            embeds: [embed],
        });
    } else {
        await interaction.reply({
            content: message,
            ephemeral: ishidden,
        });
    }
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

    for (let ower in fileIO.coffees()) {
        for (let receiver in fileIO.coffees()[ower]) {
            // only write profile line if both users exist in channel and the amount != 0
            let coffeeDebt=fileIO.GetUserCoffeeDebt(ower,receiver);
            if (
                channel.members.get(ower) != undefined &&
                channel.members.get(receiver) != undefined &&
                coffeeDebt != 0
            ) {
                let owerMention = `<@${ower}>`;
                let receiverMention = `<@${receiver}>`;
                if (ower == userId) {
                    owedCoffs += `**${coffeeDebt}** ${receiverMention}\n`;
                    owedAmount += coffeeDebt;
                } else if (receiver == userId) {
                    receivingCoffs += `**${coffeeDebt}** ${owerMention}\n`;
                    receivedAmount += coffeeDebt;
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

    for (let ower in fileIO.coffees()) {
        for (let receiver in fileIO.coffees()[ower]) {
            let coffeeDebt=fileIO.GetUserCoffeeDebt(ower,receiver);
            // only write ledger line if both users exist in channel and the amount != 0
            if (
                channel.members.get(ower) != undefined &&
                channel.members.get(receiver) != undefined &&
                coffeeDebt != 0
            ) {
                let owerMention = `<@${ower}>`;
                let receiverMention = `<@${receiver}>`;

                let oweLine = `**${coffeeDebt}** ${owerMention} -> ${receiverMention}`;
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
    for (let ower in fileIO.coffees()) {
        for (let receiver in fileIO.coffees()[ower]) {
            let coffeeDebt=fileIO.GetUserCoffeeDebt(ower,receiver);
            if (
                channel.members.get(ower) != undefined &&
                channel.members.get(receiver) != undefined &&
                coffeeDebt!= 0
            ) {
                if (receiver in coffeeReceivers == false) {
                    coffeeReceivers[receiver] = 0;
                }
                if (ower in coffeeReceivers == false) {
                    coffeeReceivers[ower] = 0;
                }
                coffeeReceivers[receiver] += coffeeDebt;
                coffeeReceivers[ower] -= coffeeDebt;
            }
        }
    }

    let coffeeLeaderboardString = "";

    let sortedPlayers = getSortedKeysLeaderboardStyle(coffeeReceivers);
    for (let player of sortedPlayers) {
        if (
            player == sortedPlayers[0] &&
            coffeeReceivers[sortedPlayers[0]] !=
                coffeeReceivers[sortedPlayers[1]]
        ) {
            coffeeLeaderboardString += `**${coffeeReceivers[player]}** <@${player}> :crown:\n\n`;
        } else if (
            player == sortedPlayers[sortedPlayers.length - 1] &&
            coffeeReceivers[sortedPlayers[sortedPlayers.length - 1]] !=
                coffeeReceivers[sortedPlayers[sortedPlayers.length - 2]]
        ) {
            coffeeLeaderboardString += `**${coffeeReceivers[player]}** <@${player}> :hot_face:\n\n`;
        }else if(player=="887002671947595836")
        {
            coffeeLeaderboardString += `**${coffeeReceivers[player]}** <@${player}> :hamburger:\n\n`;

        } 
        else {
            coffeeLeaderboardString += `**${coffeeReceivers[player]}** <@${player}>\n\n`;
        }
    }

    return coffeeLeaderboardString;
}

function Coinflip(flipper1, flipper2) {
    let coinFlipper1 = flipper1;
    let coinFlipper2 = flipper2;
    let winner;
    let loser;
    let unique = "";
    let flipValue = 1;

    if (Math.random() > 0.99) {
        // easter egg: 1% chance coin lands on side :^)
        unique = "side";
        flipValue = 0;
    }
    // if (Math.random() < 0.01) {
    //  unique="split";
    //  flipValue=2;
    // }

    if (Math.random() > 0.5) {
        winner = coinFlipper1;
        loser = coinFlipper2;
    } else {
        winner = coinFlipper2;
        loser = coinFlipper1;
    }

    if (unique != "side") {
        fileIO.AddUserCoffee(loser, winner, flipValue,"COINFLIP");
        fileIO.UpdateFile("c");
    }

    return { coinSide: unique, coinWin: winner, coinLose: loser };
}
