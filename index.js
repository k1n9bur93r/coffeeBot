// Require the necessary discord.js classes
const { Client, Intents, MessageEmbed, Message } = require("discord.js");
const {
    token,
    coffeeJSON,
    responseJSON,
    gCloudJSON,
    statsJSON,
} = require("./config.json");

const fs = require("fs");
const coffees = require(`./${coffeeJSON}`);
const gCloud = require(`./${gCloudJSON}`);
const language = require("@google-cloud/language");
const fileResponses = require(`./${responseJSON}`);
const stats = require(`./${statsJSON}`);
const gCloudOptions = {
    projectId: gCloud.project_id,
    email: gCloud.client_email,
    credentials: {
        client_email: gCloud.client_email,
        private_key: gCloud.private_key,
    },
};
const gCClient = new language.LanguageServiceClient(gCloudOptions);

let curCoinflipRequest = "";

let curRPSRequest = "";
let curRPSChoice = "";

let curCoffeePotPlayers = {};
let curCoffeePotSlots = -1;
let maxMultiflipAmount = 5;
let multiflipRequests = {};

function warPlayerObject(options) {
    if (!options.isTie) warTotalPlayersIds.push(options.userId);
    return {
        userId: options.userId,
        total: 0,
        cards: [],
        isStayed: false,
        isOver: false,
        totalSoft:0,
        aceCounter:0

    };
}
let warTotalPlayersIds = [];
let warCurPlayers = [];
let warGameRunning = false;
let warStartingPlayer = 0;

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
            let parsedCoffeeAmount = interaction.options.getNumber("amount");

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

            AddUserCoffee(
                interaction.user.id,
                mentionedUser.user.id,
                parsedCoffeeAmount
            );
            NullifyCoffees(mentionedUser.user.id);
            NullifyCoffees(interaction.user.id);
            UpdateFile(coffeeJSON, coffees);

            //lStats({circulation:parsedCoffeeAmount});
            //UpdateFile(statsJSON,stats);

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

            let parsedCoffeeAmount = interaction.options.getNumber("amount");

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
                GetUserCoffee(mentionedUser.user.id, interaction.user.id) <
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

            RemoveUserCoffee(
                mentionedUser.user.id,
                interaction.user.id,
                parsedCoffeeAmount
            );
            NullifyCoffees(mentionedUser.user.id);
            NullifyCoffees(interaction.user.id);
            UpdateFile(coffeeJSON, coffees);

            //UpdateGlobalStats({redeemed:parsedCoffeeAmount,circulation:-Math.abs(parsedCoffeeAmount)});
            //UpdateFile(statsJSON,stats);

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
                //UpdateFile(statsJSON,stats);

                UpdateFile(coffeeJSON, coffees);
                curCoinflipRequest = "";
            }
        } else if (interaction.commandName == "transfer") {
            let transferer = interaction.user.id;
            let fromId = interaction.options.get("from").user.id;
            let toId = interaction.options.get("to").user.id;
            let amount = interaction.options.getNumber("amount");

            //check if from user owes less than amount to transferer or that transferer owes less than amount to toId
            if (coffees[fromId][transferer] < amount) {
                // if so, then ephemeral error and return
                BotReply(
                    interaction,
                    null,
                    `<@${fromId}> does not owe you ${amount}`,
                    true
                );
                return;
            }
            if (coffees[transferer][toId] < amount) {
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

            RemoveUserCoffee(fromId, transferer, amount);
            RemoveUserCoffee(transferer, toId, amount);
            //if from = to then coffees cancel out!
            if (fromId != toId) AddUserCoffee(fromId, toId, amount);

            NullifyCoffees(fromId);
            NullifyCoffees(toId);
            UpdateFile(coffeeJSON, coffees);

            //UpdateGlobalStats({PotGames:1,PotCoffs:curCoffeePotSlots+1,winnerId:winner});
            //UpdateFile(statsJSON,stats);

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
                            AddUserCoffee(playerId, winner, 1);
                            NullifyCoffees(playerId);
                        }
                    }
                }
                NullifyCoffees(winner);
                UpdateFile(coffeeJSON, coffees);

                //UpdateGlobalStats({PotGames:1,circulation:curCoffeePotSlots-1,PotCoffs:curCoffeePotSlots,winnerId:winner});
                //UpdateFile(statsJSON,stats);

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
            //command user data
            let profiledUser = interaction.options.get("user");
            if (profiledUser == undefined) {
                profiledUser = interaction.member;
            }
            let userMessage = interaction.options.getString("message");
            let output;
            //request object
            const document = {
                language: "en",
                type: "PLAIN_TEXT",
                content: userMessage,
            };
            const [result] = await gCClient.analyzeSentiment({
                document: document,
            });
            const gcReponse = result.documentSentiment;
            let stats = getDebts(profiledUser.user.id);

            await gcReponse;
            //generate response
            output = GenerateResponse(result, fileResponses, stats);
            //output

            const msgEmbed = new MessageEmbed()
                .setDescription(`${output}`)
                .setThumbnail(
                    "https://cdn.discordapp.com/avatars/878799768963391568/eddb102f5d15650d0dfc73613a86f5d2.webp?size=128"
                )
                .setAuthor(`Coffee Bot`);

            BotReply(
                interaction,
                msgEmbed,
                `<@${interaction.user.id}> said\n> "*${userMessage}*"`,
                false
            );

            return;
        } else if (interaction.commandName == "nullify") {
            let coffeeAmount = NullifyCoffees(interaction.member.id);
            UpdateFile(coffeeJSON, coffees);
            BotReply(
                interaction,
                null,
                `<@${interaction.user.id}> nullified ${coffeeAmount} :coffee:`,
                false
            );
        } else if (interaction.commandName == "serverstats") {
            let embedText = `Total Coffees in Circulation: *${stats.CoffsInCirculation}*\nTotal Coffees Redeemed: *${stats.TotalCoffsRedeemed}*\n Recent Bet Winner: *<@${stats.RecentCoffWinner}>*\nLargest Coffee Pot Win: *${stats.LargestPotWon}*\nTotal Coffees Bet In Pots: *${stats.TotalPotCoffs}*\nTotal Coffee Pots: *${stats.TotalPotGames}*\nTotal Coin Flips: *${stats.TotalCoinFlips}*\nTotal Coffees Bet In Wars: *${stats.TotalWarCoffs}*\nTotal Games of War: *${stats.TotalWarGames}*\n Highest War Game Pot: *${stats.LargestWarWon}*\n`;
            const embed = new MessageEmbed()
                .setTitle("**C O F F E E  S T A T Z**")
                .setDescription(embedText)
                .setThumbnail(
                    "https://ipcdn.freshop.com/resize?url=https://images.freshop.com/1564405684703359252/a899a14345410c863a4bfd4541974f69_large.png&width=256&type=webp&quality=80"
                );

            BotReply(interaction, embed, "", false);
        } else if (interaction.commandName == "21") {

            if(warStartingPlayer==interaction.user.id)
            {
               
                if(!warGameRunning)
                {
                    let startText=`The game of 21 is starting! Players see your hand with **/hand** and use **/draw** to draw or **/stay** stay!\n`;
                    
                    for(let x=0;x<warCurPlayers.length;x++)
                    {
                        warCurPlayers[x]=DealCard(warCurPlayers[x]);
                        warCurPlayers[x]=DealCard(warCurPlayers[x]);
                        startText += `<@${warCurPlayers[x].userId}> \n`;
                    }
                    BotReply(interaction,
                        null,
                        startText,
                        false);
                    warGameRunning=true;
                }
                else
                {
                    BotReply(interaction,
                        null,
                        `Are you trying to cancel this game?`,
                        true);
                }
            }    
            else if(!warGameRunning)
            {
                if(warCurPlayers.length==0)
                {
    
                    BotReply(interaction,
                        null,
                        `<@${interaction.user.id}> Is starting a round of 21, use /21 to join!`
                        ,false);

                    warStartingPlayer=interaction.user.id;
                    warCurPlayers.push(warPlayerObject({userId:interaction.user.id}));
                }
                else
                {
                    for(let x=0;x<warCurPlayers.length;x++)
                    {
                        if(warCurPlayers[x].userId==interaction.user.id)
                        {
    
                            BotReply(interaction,
                                null,
                                "You are already in this round!",
                                true);
                            return; 
                        }              
                    }
                    BotReply(interaction,null,`<@${interaction.user.id}> has joined the game of 21 started by <@${warStartingPlayer}>!`,false)
                    warCurPlayers.push(warPlayerObject({userId:interaction.user.id,isTie:false}));
                }
               
            }
            else if(warGameRunning)
            {
                BotReply(interaction,null,`Sorry, there is a game currently on going!`,true)
            }
        } else if (interaction.commandName=="stay") {
            if(!warGameRunning) 
            { BotReply(interaction,
                null,
                "There is no game currently running!",
                true);
                return;
            }
            let channelID=interaction.channelId;
            let canPlay=false;
            let playerIndex=0;
        
            for(let x=0;x<warCurPlayers.length;x++)
            {
                if(warCurPlayers[x].userId==interaction.user.id){
                    if(warCurPlayers[x].isStayed==true||warCurPlayers[x].isOver==true)
                    {
                        BotReply(interaction,
                            null,
                            "You cannot make anymore actions this round",
                            true);
                        return; 
                    }
                    playerIndex=x;
                    canPlay=true;
                    break;
                }
            }
            if(!canPlay)
            {
                BotReply(interaction,
                    null,
                    "You are not in this game, wait till the next one",
                    true);
                return;
            }
            warCurPlayers[playerIndex].isStayed=true;   
            BotReply(interaction,null,`You have stayed`,true);
            BotChannelMessage(channelID,
                null,
                `<@${warCurPlayers[playerIndex].userId}> is done with their hand in the current game of 21.`,
                false);  
            TotalCheckWinner(channelID);
        
        } else if (interaction.commandName== "hand") {
            if (!warGameRunning) {
                BotReply(interaction, null, "Game has not yet started ", true);
                return;
            }
            for (let x = 0; x < warCurPlayers.length; x++) {
                if (warCurPlayers[x].userId == interaction.user.id) {
                    const embed = NotifyPlayerOfHand(warCurPlayers[x], false);
                    BotReply(interaction, embed, "", true);
                    return;
                }
            }
            BotReply(
                interaction,
                null,
                "You are not in the current game",
                true
            );
        } else if (interaction.commandName=="draw") {
            if(!warGameRunning) 
            { BotReply(interaction,
                null,
                "There is no game currently running!",
                true);
                return;
            }
            let channelID=interaction.channelId;
            let canPlay=false;
            let playerIndex=0;
        
            for(let x=0;x<warCurPlayers.length;x++)
            {
                if(warCurPlayers[x].userId==interaction.user.id){
                    if(warCurPlayers[x].isStayed==true||warCurPlayers[x].isOver==true)
                    {
                        BotReply(interaction,
                            null,
                            "You cannot make anymore actions this round",
                            true);
                        return; 
                    }
                    playerIndex=x;
                    canPlay=true;
                    break;
                }
            }
            if(!canPlay)
            {
                BotReply(interaction,
                    null,
                    "You are not in this game, wait till the next one",
                    true);
                return;
            }
            warCurPlayers[playerIndex]=DealCard( warCurPlayers[playerIndex]);
            const embed =NotifyPlayerOfHand(warCurPlayers[playerIndex],true);
            BotReply(interaction,embed,"",true);
            if(warCurPlayers[playerIndex].isOver)
            {
                BotChannelMessage(channelID,
                    null,
                    `<@${warCurPlayers[playerIndex].userId}> is done with their hand in the current game of 21.`,
                    false);  
                TotalCheckWinner(channelID);
            }

        }else if (interaction.commandName == "21playes"){
            let text;
            for(let x=0;x<warCurPlayers.length;x++)
            {
                text=text.concat(`<@${warCurPlayers[x].userId}>\n`);
            }
            BotReply(interaction,
                null,
                text,
                false);

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
                AddUserCoffee(player2, player1, 1);
                BotReply(
                    interaction,
                    null,
                    `<@${player1}>'s ${emojis[player1Choice]} ${verbs[player1Choice]} <@${player2}>'s ${emojis[player2Choice]}. <@${player2}> paid up 1 :coffee:.`,
                    false
                );
            } else {
                //player2 won
                AddUserCoffee(player1, player2, 1);
                BotReply(
                    interaction,
                    null,
                    `<@${player2}>'s ${emojis[player2Choice]} ${verbs[player2Choice]} <@${player1}>'s ${emojis[player1Choice]}. <@${player1}> paid up 1 :coffee:.`,
                    false
                );
            }
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

client.login(token);

function TotalCheckWinner(channelID)
{
    let warText;
    if(gameState=CheckWarDone())
    {

        let winner=CheckWarWinner();
        if(winner.length>1)
        {
            let warText = ` Wow there is a tie between players! `
            for(let x=0;x<winner.length;x++)
            {
                warText=warText.concat(` <@${winner[x]}> `)
            }
            warText=warText.concat(`Starting up a new round.\n Past round's results\n`);
            warText += `Hands:\n`;
            for (let x=0;x<warCurPlayers.length;x++) 
            {
                warText += `<@${warCurPlayers[x].userId}> : **${warCurPlayers[x].total}**\n`;
            }
            warText=warText.concat(` Play again with /hand and /action`);
            BotChannelMessage(channelID,null,warText,false)

            warCurPlayers=[];
            for(let x=0;x<winner.length;x++)
            {
                warCurPlayers.push(warPlayerObject({userId:winner[x],isTie:true}));
                warCurPlayers[x]=DealCard(warCurPlayers[x]);
                warCurPlayers[x]=DealCard(warCurPlayers[x]);
            }
            return;
        }   
        else if(winner.length==1)
        {
            for ( let x=0;x<warTotalPlayersIds.length;x++) 
            {
                
                if (warTotalPlayersIds[x] != winner[0]) {
                    AddUserCoffee(warTotalPlayersIds[x],winner[0],1);
                    NullifyCoffees(warTotalPlayersIds[x]);
                }
            }


         NullifyCoffees(winner[0]);
         UpdateFile(coffeeJSON,coffees);

        //UpdateGlobalStats({warGames:1,circulation:warTotalPlayersIds.length-1,warCoffs:warTotalPlayersIds.length,winnerId:winner[0]});
         //UpdateFile(statsJSON,stats);

        // show guesses
         warText = `<@${winner[0]}> has won the game of 21! Congrats to them. Everyone else, pays up one :coffee:!\n\n`;

         
        }
        else
        {
              //UpdateGlobalStats({warGames:1,warCoffs:warTotalPlayersIds.length});
            //UpdateFile(statsJSON,stats);
            warText = `No one won...\n\n`;
        }

        warText += `Hands:\n`;
        for (let x=0;x<warCurPlayers.length;x++) {
            warText =warText.concat( `<@${warCurPlayers[x].userId}> - **${warCurPlayers[x].total}** :  `);
            for (let y = 0; y < warCurPlayers[x].cards.length; y++) {
                warText = warText.concat(
                    `*${warCurPlayers[x].cards[y]}* :black_joker: `
                );
                if (y + 1 != warCurPlayers[x].cards.length) {
                    warText = warText.concat(`->`);
                }
            }
            warText=warText.concat('\n');
        }
          
            BotChannelMessage(channelID,null,warText,false);
        
        warTotalPlayersIds=[];
        warCurPlayers=[];
        warGameRunning=false;
        warFirstHandDelt=false;
        warStartingPlayer=0;  
    }
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
        AddUserCoffee(loser, winner, flipValue);
        NullifyCoffees(loser);
        NullifyCoffees(winner);
        UpdateFile(coffeeJSON, coffees);
    }

    return { coinSide: unique, coinWin: winner, coinLose: loser };
}

function CheckWarWinner() {
    let highestStay = 0;
    let winningPlayers = [];
    for (let x = 0; x < warCurPlayers.length; x++) {
        if (warCurPlayers[x].isStayed) {
            if (warCurPlayers[x].total == highestStay) {
                isTie = true;
                winningPlayers.push(warCurPlayers[x].userId);
            } else if (warCurPlayers[x].total > highestStay) {
                winningPlayers = [];
                highestStay = warCurPlayers[x].total;
                winningPlayers.push(warCurPlayers[x].userId);
            }
        }
    }
    return winningPlayers;
}

function CheckWarDone() {
    for (let x = 0; x < warCurPlayers.length; x++) {
        if (!warCurPlayers[x].isOver && !warCurPlayers[x].isStayed)
            return false;
    }
    return true;
}

function NotifyPlayerOfHand(playerObject, newDraw) {
    let cardString = ``;
    let embedText = `**${playerObject.total}**. Still in the game!\n`;
    if (playerObject.isOver)
        embedText = `** ${playerObject.total}**. You went over!\n`;
    let drawText;
    if (newDraw) {
        drawText = ` :clubs::hearts::spades::diamonds:*You drew a ${
            playerObject.cards[playerObject.cards.length - 1]
        }*:diamonds::spades::hearts::clubs: \n\n*Your cards*   `;
        embedText = embedText.concat(drawText);
    }
    for (let x = 0; x < playerObject.cards.length; x++) {
        cardString = cardString.concat(
            `**${playerObject.cards[x]}** :black_joker: `
        );
        if (x + 1 != playerObject.cards.length) {
            cardString = cardString.concat(`->`);
        }
    }
    embedText = embedText.concat(cardString);
    return new MessageEmbed()
        .setTitle("Your Hand")
        .setDescription(embedText)
        .setThumbnail(
            "https://ae01.alicdn.com/kf/Hf0a2644ab27443aeaf2b7f811096abf3V/Bicycle-House-Blend-Coffee-Playing-Cards-Cafe-Deck-Poker-Size-USPCC-Custom-Limited-Edition-Magic-Cards.jpg_q50.jpg"
        );
}

function DealCard(warPlayerObject) {
    let deck = [11, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10];
    let selection = deck[Math.floor(Math.random() * deck.length)];
    if(selection==11)
{
    if((warPlayerObject.total+11)>21&&warPlayerObject.aceCounter==0)
    {
        selection=1;
    }
    else if((warPlayerObject.total+11)>21&&warPlayerObject.hasAce>0)
    {
        aceCounter++;
        warPlayerObject.total-=10;
        for(let x=0;x<warPlayerObject.cards.length;x++)
        {
            if(warPlayerObject.cards[x]==11)
            {
                console.log("I am in here 1!");
                warPlayerObject.cards[x]=1;
                aceCounter--;
                break;

            }
        }
    }
    else
    {
        warPlayerObject.aceCounter++;
    }
}
    warPlayerObject.cards.push(selection);
    warPlayerObject.total += selection;
    if(warPlayerObject.total>21&&warPlayerObject.aceCounter==0)
    warPlayerObject.isOver=true;
    else if(warPlayerObject.total>21&&warPlayerObject.aceCounter>0)
    {
        if(warPlayerObject.total-10>21)
        {
            warPlayerObject.isOver=true;
        }
        else
        {
            warPlayerObject.total-=10;
            for(let x=0;x<warPlayerObject.cards.length;x++)
            {
                if(warPlayerObject.cards[x]==11)
                {
                    console.log("I am in here 2!");
                    warPlayerObject.cards[x]=1;
                    warPlayerObject.aceCounter--;
                    break;
                }
            }
        }
    }
    return warPlayerObject;
}

function UpdateGlobalStats(options) {
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
    if (options.PotCoffs && options.PotCoffs > stats.LargestPotWon)
        stats.LargestPotWon = options.PotCoffs;
    if (options.redeemed) stats.TotalCoffsRedeemed += options.redeemed;
    if (options.coinflip) stats.TotalCoinFlips++;
    if (options.PotGames) stats.TotalPotGames++;
    if (options.PotCoffs) stats.TotalPotCoffs += options.PotCoffs;
    if (options.warCoffs && options.warCoffs > stats.LargestWarWon)
        stats.LargestWarWon = options.warCoffs;
    if (options.warCoffs) stats.TotalWarCoffs += options.warCoffs;
    if (options.warGames) stats.TotalWarGames++;
}

function UpdateUserStats() {}

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
function BotChannelMessage(channelID, embed, message) {
    if (embed && message == "") {
        client.channels.cache.get(channelID).send({ embeds: [embed] });
    } else if (embed) {
        client.channels.cache.get(channelID).send({
            content: message,
            embeds: [embed],
        });
    } else {
        client.channels.cache.get(channelID).send(message);
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

function AddUserCoffee(interactionUser, mentionedUser, amount) {
    ValidateUserCoffee(interactionUser, mentionedUser);
    coffees[interactionUser][mentionedUser] += amount;
}

function ValidateUserCoffee(interactionUser, mentionedUser) {
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
function RemoveUserCoffee(interactionUser, mentionedUser, amount) {
    ValidateUserCoffee(interactionUser, mentionedUser);
    coffees[interactionUser][mentionedUser] -= amount;
}

function GetUserCoffee(interactionUser, mentionedUser) {
    let curCoffees;
    ValidateUserCoffee(interactionUser, mentionedUser);
    curCoffees = coffees[interactionUser][mentionedUser];
    return curCoffees;
}

function UpdateFile(FileName, FileObject) {
    fs.writeFile(`${FileName}`, JSON.stringify(FileObject, null, 1), (err) => {
        if (err) throw err;
    });
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
        } else {
            coffeeLeaderboardString += `**${coffeeReceivers[player]}** <@${player}>\n\n`;
        }
    }

    return coffeeLeaderboardString;
}

function GenerateResponse(response, text, coffeeStats) {
    let numGen = Math.floor(Math.random() * 2);
    var list1;
    var list2;
    var list3;
    var list4;
    var output = "Wow did you just like, break out of my response tree???";
    var part1;
    var part2;
    var part3;
    var part4;
    if (numGen == 0) {
        if (
            (coffeeStats.totalAmount < 0 &&
                coffeeStats.uniqueOwe > coffeeStats.uniqueHold) ||
            (coffeeStats.totalAmount >= 0 &&
                coffeeStats.uniqueOwe < coffeeStats.uniqueHold) ||
            (coffeeStats.totalAmount > 0 &&
                coffeeStats.uniqueOwe > coffeeStats.uniqueHold) ||
            (coffeeStats.totalAmount < 0 &&
                coffeeStats.uniqueOwe < coffeeStats.uniqueHold)
        ) {
            if (
                coffeeStats.totalAmount < 0 &&
                coffeeStats.uniqueOwe > coffeeStats.uniqueHold
            ) {
                if (response.documentSentiment.score >= 0.0) {
                    list1 = Math.floor(
                        Math.random() * text.CoffeeNumbersH.Debt.length
                    );
                    list2 = Math.floor(
                        Math.random() * text.CoffeeNumbersH.OweMany.length
                    );
                    part1 = text.CoffeeNumbersH.Debt[list1];
                    part2 = text.CoffeeNumbersH.OweFew[list2];
                } else {
                    list1 = Math.floor(
                        Math.random() * text.CoffeeNumbersM.Debt.length
                    );
                    list2 = Math.floor(
                        Math.random() * text.CoffeeNumbersM.OweMany.length
                    );
                    part1 = text.CoffeeNumbersM.Debt[list1];
                    part2 = text.CoffeeNumbersM.OweFew[list2];
                }
            } else if (
                coffeeStats.totalAmount >= 0 &&
                coffeeStats.uniqueOwe < coffeeStats.uniqueHold
            ) {
                if (response.documentSentiment.score >= 0.0) {
                    list1 = Math.floor(
                        Math.random() * text.CoffeeNumbersH.Profit.length
                    );
                    list2 = Math.floor(
                        Math.random() * text.CoffeeNumbersH.OweFew.length
                    );
                    part1 = text.CoffeeNumbersH.Profit[list1];
                    part2 = text.CoffeeNumbersH.OweMany[list2];
                } else {
                    list1 = Math.floor(
                        Math.random() * text.CoffeeNumbersM.Profit.length
                    );
                    list2 = Math.floor(
                        Math.random() * text.CoffeeNumbersM.OweFew.length
                    );
                    part1 = text.CoffeeNumbersM.Profit[list1];
                    part2 = text.CoffeeNumbersM.OweMany[list2];
                }
            } else if (
                coffeeStats.totalAmount > 0 &&
                coffeeStats.uniqueOwe > coffeeStats.uniqueHold
            ) {
                if (response.documentSentiment.score >= 0.0) {
                    list1 = Math.floor(
                        Math.random() * text.CoffeeNumbersH.Profit.length
                    );
                    list2 = Math.floor(
                        Math.random() * text.CoffeeNumbersH.OweMany.length
                    );
                    part1 = text.CoffeeNumbersH.Profit[list1];
                    part2 = text.CoffeeNumbersH.OweFew[list2];
                } else {
                    list1 = Math.floor(
                        Math.random() * text.CoffeeNumbersM.Profit.length
                    );
                    list2 = Math.floor(
                        Math.random() * text.CoffeeNumbersM.OweMany.length
                    );
                    part1 = text.CoffeeNumbersM.Profit[list1];
                    part2 = text.CoffeeNumbersM.OweFew[list2];
                }
            } else if (
                coffeeStats.totalAmount < 0 &&
                coffeeStats.uniqueOwe < coffeeStats.uniqueHold
            ) {
                if (response.documentSentiment.score >= 0.0) {
                    list1 = Math.floor(
                        Math.random() * text.CoffeeNumbersH.Debt.length
                    );
                    list2 = Math.floor(
                        Math.random() * text.CoffeeNumbersH.OweFew.length
                    );
                    part1 = text.CoffeeNumbersH.Debt[list1];
                    part2 = text.CoffeeNumbersH.OweMany[list2];
                } else {
                    list1 = Math.floor(
                        Math.random() * text.CoffeeNumbersM.Debt.length
                    );
                    list2 = Math.floor(
                        Math.random() * text.CoffeeNumbersM.OweFew.length
                    );
                    part1 = text.CoffeeNumbersM.Debt[list1];
                    part2 = text.CoffeeNumbersM.OweMany[list2];
                }
            }

            list3 = Math.floor(Math.random() * text.Structs.StructsP.length);
            part3 = text.Structs.StructsP[list3];

            if (response.documentSentiment.score >= 0.0) {
                numGen = Math.floor(Math.random() * 2);
                if (numGen == 0) {
                    list4 = Math.floor(Math.random() * text.WordBank.VH.length);
                    part4 = text.WordBank.VH[list4];
                } else {
                    list4 = Math.floor(Math.random() * text.WordBank.H.length);
                    part4 = text.WordBank.H[list4];
                }
            } else {
                numGen = Math.floor(Math.random() * 2);
                if (numGen == 0) {
                    list4 = Math.floor(Math.random() * text.WordBank.VM.length);
                    part4 = text.WordBank.VM[list4];
                } else {
                    list4 = Math.floor(Math.random() * text.WordBank.M.length);
                    part4 = text.WordBank.M[list4];
                }
            }

            output = part3
                .replace("@", part4)
                .replace("$", part1)
                .replace("#", part2);
        } else {
            numGen = Math.floor(Math.random() * 2);

            if (numGen == 0) {
                if (coffeeStats.totalAmount < 0) {
                    if (response.documentSentiment.score >= 0.0) {
                        list1 = Math.floor(
                            Math.random() * text.CoffeeNumbersH.Debt.length
                        );
                        part1 = text.CoffeeNumbersH.Debt[list1];
                    } else {
                        list1 = Math.floor(
                            Math.random() * text.CoffeeNumbersM.Debt.length
                        );
                        part1 = text.CoffeeNumbersM.Debt[list1];
                    }
                } else if (coffeeStats.totalAmount >= 0) {
                    if (response.documentSentiment.score >= 0.0) {
                        list1 = Math.floor(
                            Math.random() * text.CoffeeNumbersH.Profit.length
                        );
                        output = text.CoffeeNumbersH.Profit[list1];
                    } else {
                        list1 = Math.floor(
                            Math.random() * text.CoffeeNumbersM.Profit.length
                        );
                        output = text.CoffeeNumbersM.Profit[list1];
                    }
                }
            } else {
                if (coffeeStats.uniqueHold < coffeeStats.uniqueOwe) {
                    if (response.documentSentiment.score >= 0.0) {
                        list1 = Math.floor(
                            Math.random() * text.CoffeeNumbersH.OweFew.length
                        );
                        output = text.CoffeeNumbersH.OweFew[list1];
                    } else {
                        list1 = Math.floor(
                            Math.random() * text.CoffeeNumbersM.OweFew.length
                        );
                        output = text.CoffeeNumbersM.OweFew[list1];
                    }
                } else if (coffeeStats.uniqueHold > coffeeStats.uniqueOwe) {
                    if (response.documentSentiment.score >= 0.0) {
                        list1 = Math.floor(
                            Math.random() * text.CoffeeNumbersH.OweMany.length
                        );
                        output = text.CoffeeNumbersH.OweMany[list1];
                    } else {
                        list1 = Math.floor(
                            Math.random() * text.CoffeeNumbersM.OweMany.length
                        );
                        output = text.CoffeeNumbersM.OweMany[list1];
                    }
                }
            }
        }
    } else if (numGen == 1) {
        if (response.documentSentiment.score >= 0.4) {
            list1 = Math.floor(Math.random() * text.Structs.StructsVH.length);
            output = text.Structs.StructsVH[list1];
        } else if (response.documentSentiment.score >= 0.2) {
            list1 = Math.floor(Math.random() * text.Structs.StructsH.length);
            output = text.Structs.StructsH[list1];
        } else if (response.documentSentiment.score > 0.1) {
            list1 = Math.floor(Math.random() * text.Structs.StructsN.length);
            output = text.Structs.StructsN[list1];
        } else if (response.documentSentiment.score > 0.0) {
            list1 = Math.floor(Math.random() * text.Structs.StructsM.length);
            output = text.Structs.StructsM[list1];
        } else {
            list1 = Math.floor(Math.random() * text.Structs.StructsVM.length);
            output = text.Structs.StructsVM[list1];
        }
    } else {
        if (response.documentSentiment.score >= 0.4) {
            list1 = Math.floor(Math.random() * text.WorkBank.VH.length);
            output = text.WorkBank.VH[list1];
        } else if (response.documentSentiment.score >= 0.2) {
            list1 = Math.floor(Math.random() * text.WorkBank.H.length);
            output = text.WorkBank.H[list1];
        } else if (response.documentSentiment.score > 0.0) {
            list1 = Math.floor(Math.random() * text.WorkBank.N.length);
            output = text.WorkBank.N[list1];
        } else if (response.documentSentiment.score > 0 - 1) {
            list1 = Math.floor(Math.random() * text.WorkBank.M.length);
            output = text.WorkBank.M[list1];
        } else {
            list1 = Math.floor(Math.random() * text.WorkBank.VM.length);
            output = text.WorkBank.VM[list1];
        }
    }
    return output;
}

function getDebts(userId) {
    let debts = {
        owedAmount: 0,
        receivedAmount: 0,
        uniqueOwe: 0,
        uniqueHold: 0,
        totalAmount: 0,
    };
    for (let ower in coffees) {
        for (let receiver in coffees[ower]) {
            if (coffees[ower][receiver] != 0) {
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
    debts.totalAmount = debts.receivedAmount - debts.owedAmount;
    return debts;
}