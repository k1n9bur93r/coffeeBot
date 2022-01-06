// Require the necessary discord.js classes
const { Client, Intents, MessageEmbed } = require("discord.js");
let cardGame= require("./CardGame");
let response=require("./Response");
let BestOf = require("./BestOf");
let FileIO = require("./FileIO");
//let {discordToken}=require('../config.json')

let curCoinflipRequest = "";

let curRPSRequest = "";
let curRPSChoice:string = "";

let curCoffeePotPlayers = {};
let curCoffeePotSlots = -1;
let maxMultiflipAmount = 2;
let multiflipRequests = {};

let GlobalTimers=[];
function TimerObject(timer,timerName)
{
    return{
        Timer:timer,
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
//client.login(discordToken);
client.login(process.env.discordToken);

// When the client is ready, run this code (only once)
client.once("ready", () => {
    console.log("Ready!");
    FileIO.Initalize();
    response.Initalize();
    client.user.setActivity("/commands", { type: "LISTENING" });
});

client.on("interactionCreate", async (interaction) => {
    var channelId=interaction.channelId;
    if (!interaction.isCommand()) return;
    try {
        if (interaction.commandName === "agree") {
            FileIO.agreePlayer(interaction.user.id)
            BotReply(
                interaction,
                null,
                `<@${interaction.user.id}> has agreed to the terms & conditions!`,
                false
            )
            return;
        }
        else if (!FileIO.playerAgreedToTerms(interaction.user.id)) { //removed negate
            const embed = new MessageEmbed()
            .setTitle("Coffee Economy Terms & Conditions")
            .setDescription(`One must accept accept the following terms & conditions to participate in the :coffee: economy:
            
            :one: I agree a :coffee: is worth $2 towards a food or drink purchase
                
            :two: I agree that I will not bet more than I can afford
            
            :three: I agree that anyone may ask to cashout coffees at any time with proof of a receipt
            
            :four: I agree that if I am unable to payout my coffees upon being requested, I must declare bankruptcy and will be suspended from the :coffee: system for [my net oweage * 4] days
            
            By doing \`/agree\` you accept to these terms & conditions`)
            .setThumbnail(
                "https://lh3.googleusercontent.com/proxy/-aeVwzFtgt_rnoLyJpHjtQSUKRbDtJNLTH8w5bybehJW4ibOJA_PFlnLiSsjdPElbpoyOGCdf8otyNGFvchWfjKjUuUWmZguwe8"
            );
            BotReply(interaction, 
                 embed, 
                ``,
                 false);
            return
        } else if (interaction.commandName === "venmo") {
            let venmoId = interaction.options.getString("venmo");
            FileIO.setVenmo(interaction.user.id, venmoId)
            BotReply(
                interaction,
                null,
                `<@${interaction.user.id}> has set their venmo!`,
                false
            )
            return;
        } else if (interaction.commandName === "multiflip") {
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
            return getProfileString(profiledUser,interaction,`https://cdn.discordapp.com/avatars/${profiledUser.user.id}/${profiledUser.user.avatar}`);
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
            FileIO.AddUserCoffee(
                interaction.user.id,
                mentionedUser.user.id,
                parsedCoffeeAmount,
                "GIVE"
            );

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
                FileIO.GetUserCoffeeDebt(interaction.user.id,mentionedUser.user.id) <
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
            FileIO.RemoveUserCoffee(
                mentionedUser.user.id,
                interaction.user.id,
                parsedCoffeeAmount,
                "REDEEM"
            );

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

                curCoinflipRequest = "";
            }
        } else if (interaction.commandName == "transfer") {
            let transferer = interaction.user.id;
            let fromId = interaction.options.get("from").user.id;
            let toId = interaction.options.get("to").user.id;
            let amount = interaction.options.getNumber("amount");//num

            //check if from user owes less than amount to transferer or that transferer owes less than amount to toId
           if(FileIO.GetUserCoffeeDebt(fromId,transferer)<amount)
            {    // if so, then ephemeral error and return
                BotReply(
                    interaction,
                    null,
                    `<@${fromId}> does not owe you ${amount}`,
                    true
                );
                return;
            }
            if(FileIO.GetUserCoffeeDebt(transferer,toId)<amount)
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
            FileIO.RemoveUserCoffee(fromId, transferer, amount,"TRANSFER");
            FileIO.RemoveUserCoffee(transferer, toId, amount,"TRANSFER");
            //if from = to then coffees cancel out!
            if (fromId != toId) FileIO.AddUserCoffee(fromId, toId, amount,"TRANSFER");


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
                            FileIO.AddUserCoffee(playerId, winner, 1,"COFFEPOT");
                        }
                    }
                }
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
        } else if (interaction.commandName == "21End") {
            if(list.length!=0&&BestOf.CommandBestOfType()=="21"&&!BestOf.CommandBestOfRunning())
            {
                BotReply(interaction,null,"Can't end a game when a 'Best Of' set is running. Just let it play out fam.",false)
            }
            else
            {
                BulkReplyHandler(
                    interaction,
                    cardGame.CommandEndGame(interaction.user.id));
                }
            
        } else if (interaction.commandName == "21") {
            var list=BestOf.CommandBestOfPlayerList()
            if(list.length!=0&&BestOf.CommandBestOfType()=="21"&&!BestOf.CommandBestOfRunning())
            {
                if(list[0]==interaction.user.id)
                {
                    BestOf.CommandBestOfStart();
                     BulkReplyHandler(
                        interaction,
                        cardGame.CommandStartJoinGame(list[0],interaction.options.getInteger("amount"))); //Update to handle a string 
                        for(var x=1;x<list.length;x++)
                        {
                            BulkReplyHandler(
                                interaction,
                                cardGame.CommandStartJoinGame(list[x],interaction.options.getInteger("amount"),false));
                        }
                        BulkReplyHandler(
                            interaction,
                            cardGame.CommandStartJoinGame(interaction.user.id,interaction.options.getInteger("amount"),false));
                }
                else
                {
                    BotReply(interaction, null, "You can't start a game of 21 if there is a 'Best Of' set pending. join up to it now with ./bestjoin !", true);
                    
                }
            }
            else
            {
                BulkReplyHandler(
                    interaction,
                    cardGame.CommandStartJoinGame(interaction.user.id,interaction.options.getInteger("amount"))); //update to handle a string 
            }

           

        } else if (interaction.commandName =="stay") {
            BulkReplyHandler(
                interaction,
                cardGame.CommandStay(interaction.user.id));
            BestOfHandler("21",interaction);
        } else if (interaction.commandName == "hand") {
            BulkReplyHandler(
                interaction,
                cardGame.CommandHand(interaction.user.id));
        } else if (interaction.commandName =="draw") {
            BulkReplyHandler(
                interaction,
                cardGame.CommandDraw(interaction.user.id));
            BestOfHandler("21",interaction);
        } else if (interaction.commandName == "21players"){
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
            let player2Choice:string = interaction.options.getString("choice");
            let player1ChoiceIndex=-1;
            let player2ChoiceIndex=-1;
            let choices = ["Rock", "Paper", "Scissors"];
            let verbs = ["crushes", "covers", "cuts"];
            let emojis = [":rock:", ":roll_of_paper:", ":scissors:"];

            player1ChoiceIndex = choices.indexOf(player1Choice);
            player2ChoiceIndex= choices.indexOf(player2Choice);
            curRPSRequest = "";
            if (player1ChoiceIndex == player2ChoiceIndex) {
                //tie
                BotReply(
                    interaction,
                    null,
                    `<@${player1}> and <@${player2}> tied by both choosing ${emojis[player1ChoiceIndex]}.`,
                    false
                );
            } else if ((player1ChoiceIndex + 1) % 3 != player2ChoiceIndex) {
                //player1 won
                FileIO.AddUserCoffee(player2, player1, 1,"RPS");
                BotReply(
                    interaction,
                    null,
                    `<@${player1}>'s ${emojis[player1ChoiceIndex]} ${verbs[player1ChoiceIndex]} <@${player2}>'s ${emojis[player2ChoiceIndex]}. <@${player2}> paid up 1 :coffee:.`,
                    false
                );
            } else {
                //player2 won

                FileIO.AddUserCoffee(player1, player2, 1,"RPS");
                BotReply(
                    interaction,
                    null,
                    `<@${player2}>'s ${emojis[player2ChoiceIndex]} ${verbs[player2ChoiceIndex]} <@${player1}>'s ${emojis[player1ChoiceIndex]}. <@${player1}> paid up 1 :coffee:.`,
                    false
                );
            }
        } else if (interaction.commandName == "bestjoin"){
            BulkReplyHandler(
                interaction,
                BestOf.CommandAddPlayer(interaction.user.id));
        } else if (interaction.commandName == "bestcreate"){
            BulkReplyHandler(
                interaction,
                BestOf.CommandNewBestOf(interaction.user.id,"21",interaction.options.getInteger("coffs"),interaction.options.getInteger("rounds")));
        } else if (interaction.commandName == "bestplayers"){
            BulkReplyHandler(
                interaction,
                BestOf.CommandBestOfPlayerMessage());
            
        } else if (interaction.commandName=="bestend")
        {
            BulkReplyHandler(
                interaction,
                BestOf.CommandBestOfPlayerMessage());
        }
        
} catch (e) {
        BotChannelMessage(
            {channelId:channelId},
            null,
            `I'm Sowwy UwU~ <@${
                interaction.user.id
            }> \n> but something happened and I'm brokie... || ${e.message}${
                e.stack ? `\nStackTrace:\n=========\n${e.stack}` : ``
            } ||`
        );
    }
});

async function BestOfHandler(GameType,interaction,timeout=false)
{
    if(BestOf.CommandBestOfType()==GameType)
    {
    var pastWinner=cardGame.CommandGetPastWinner();
    if(pastWinner!=0)
        BulkReplyHandler(interaction, BestOf.CommandAddWinner(pastWinner,timeout));
    if(BestOf.CommandBestOfRunning()&&!cardGame.CommandGameRunning())
    {
        var list=BestOf.CommandBestOfPlayerList();
        for(var x=0;x<list.length;x++)
        {
            await BulkReplyHandler(
                interaction,
                cardGame.CommandStartJoinGame(list[x],1,false));
        }
        await BulkReplyHandler(
        interaction,
        cardGame.CommandStartJoinGame(list[0],1,false));
        }
        return true;
    }  
    return false;
}

function TimeOutHandler(options)
{
    console.log("Event FIRING "+options.actionName);
    if(options.actionName.includes('CG-'))
    {
        if(options.actionName=="CG-End")
        {
            for(let x=0;x<GlobalTimers.length;x++)
            {
                if(GlobalTimers[x].Name.includes("CG-"))
                {
                    clearTimeout(GlobalTimers[x].Timer);
                    GlobalTimers.splice(x,1);
                }  
            }  
        }
        else
        {
            GlobalTimers.splice(options.index,1)
            BulkReplyHandler(options.interaction,cardGame.CommandTimerEvent(options.functionCall));
            BestOfHandler("21",options.interaction,true); 
        }
    }
    else if(options.actionName.includes('BS-'))
    {
        if(options.actionName.includes('Time'))
        {
            BestOfHandler("21",options.interaction,true);
        }
        else
            BulkReplyHandler(options.interaction,BestOf.CommandBestOfEnd());

    }
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
                    for(let y=0;y<GlobalTimers.length;y++)
                    {
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
                GlobalTimers.push(
                    TimerObject(
                        setTimeout(
                            TimeOutHandler, 
                            communicationRequests[x].TimerSettings.Length , 
                            {
                            index:GlobalTimers.length,
                            actionName:communicationRequests[x].TimerSettings.Action,
                            functionCall:communicationRequests[x].TimerSettings.functionCall,
                            interaction:interaction
                            }
                            ),
                        communicationRequests[x].TimerSettings.Action
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

function getProfileString(pUser, interaction,avatarUrl) {
    let owedCoffs = "";
    let receivingCoffs = "";
    let pString="";
    let data=FileIO.getUserProfile(pUser.user.id);
    for(let x=0;x<data.Ledger.length;x++)
    {
        let textString=`**${data.Ledger[x].Amount}** <@${data.Ledger[x].ID}>\n`;
        if(data.Ledger[x].Amount<0)
        {
            owedCoffs += textString
        }
        else if(data.Ledger[x].Amount>0)
        {
            receivingCoffs += textString
        }
    }
    if (owedCoffs == "") {
        owedCoffs = "No owed coffs!\n";
    }
    if (receivingCoffs == "") {
        receivingCoffs = "No redeemable coffs!\n";
    }



    pString += `**Owed :coffee:**\n${owedCoffs}\n**Redeemable :coffee:**\n${receivingCoffs}\n**Net :coffee: worth\n${
        data.ReceivingCoffs - data.OwedCoffs
    }**`
    
    if (data.Venmo!='') {
        pString += `\n\n**Venmo 💰**\n${data.Venmo}`
    }
        const profilEmbed = new MessageEmbed()
        .setTitle(
            `${
                pUser.nickname != null
                    ? pUser.nickname
                    : pUser.user.username
            }'s profile`
        )
        .setDescription(pString)
        .setThumbnail(avatarUrl);
    return BotReply(interaction, profilEmbed, "", false);
}

function getCoffeeLedgerString(channel) {
    let coffeeLedger = FileIO.GetPlayerLedger();
    let coffeeLedgerString="";
    for(let x=0;x<coffeeLedger.length;x++)
    {
        coffeeLedgerString += `**${coffeeLedger[x].Amount}** <@${coffeeLedger[x].MainID}> -> <@${coffeeLedger[x].LedgerID}>\n\n`;
    }
    return coffeeLedgerString;
}

function getLeaderboardString(channel) {
    let leaderboard = FileIO.GetPlayerTotals();
    let coffeeLeaderboardString = "";
    for(let x=0;x<leaderboard.length;x++)
    {
        if(x==0)
        {
            coffeeLeaderboardString += `**${leaderboard[x].Total}** <@${leaderboard[x].ID}> :crown:\n\n`; 
        }
        else if(x==leaderboard.length-1)
        {
            coffeeLeaderboardString += `**${leaderboard[x].Total}** <@${leaderboard[x].ID}> :hot_face:\n\n`; 
        }
        else
        {
            coffeeLeaderboardString += `**${leaderboard[x].Total}** <@${leaderboard[x].ID}> \n\n`; 
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
        FileIO.AddUserCoffee(loser, winner, flipValue,"COINFLIP");
    }

    return { coinSide: unique, coinWin: winner, coinLose: loser };
}
