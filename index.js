// Require the necessary discord.js classes
const { Client, Intents, MessageEmbed, Message } = require("discord.js");
const { token, coffeeJSON } = require("./config.json");
const fs = require("fs");
const coffees = require(`./${coffeeJSON}`);

let curCoinflipRequest = "";

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
        } else if ((interaction.commandName == "coinflip")) {
            let coinFlipper1 = curCoinflipRequest;
            let coinFlipper2 = interaction.user.id;
            let winner;
            let loser;

            if (Math.random() > .99) {
                // easter egg: 1% chance coin lands on side :^)
                curCoinflipRequest = ""
                await interaction.reply(`The coinflip landed on its side! It is a tie and no coffees are owed!`);
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
        let transferer = interaction.user.id
        let fromId = interaction.options.get("from").user.id
        let toId = interaction.options.get("to").user.id
        let amount = interaction.options.getNumber("amount")

        //check if from user owes less than amount to transferer or that transferer owes less than amount to toId
        if (coffees[fromId][transferer] < amount) {
            // if so, then ephemeral error and return
            await interaction.reply({
                content: `<@${fromId}> does not owe you ${amount}`,
                ephemeral: true,
            });
            return
        }
        if (coffees[transferer][toId] < amount) {
            await interaction.reply({
                content: `You do not owe <@${toId}> ${amount}`,
                ephemeral: true,
            });
            return
        }
        if (coffees[fromId][toId] == undefined) {
            coffees[fromId][toId] = 0
        } 
        if (amount < 0) {
            await interaction.reply({
                content: `Cannot transfer negative amount!`,
                ephemeral: true,
            });
            return
        }
        if (toId == transferer || fromId == transferer) {
            await interaction.reply({
                content: `Cannot transfer to or from yourself!`,
                ephemeral: true,
            });
            return
        }

        coffees[fromId][transferer] -= amount
        coffees[transferer][toId] -= amount
        coffees[fromId][toId] += amount

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
    }
});

client.login(token);

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
