// Require the necessary discord.js classes
const { Client, Intents, MessageEmbed, Message } = require('discord.js')
const { token, coffeeJSON } = require('./config.json')
const fs = require('fs');
const coffees = require(`./${coffeeJSON}`)

console.log(coffees)

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MEMBERS] })

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!')
    client.user.setActivity('/commands', { type: 'LISTENING' })
})

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	if (interaction.commandName === 'ledger') {
        let coffeeLedger = getCoffeeLedgerString( interaction.channel )
        const ledgerEmbed = new MessageEmbed()
            .setTitle('Coffee Ledger')
            .setDescription(coffeeLedger)
        await interaction.reply( {embeds: [ledgerEmbed]} )

        console.log(ledgerEmbed)
	}

    else if (interaction.commandName == "give") {
        let mentionedUser = getUserFromMention(interaction.options.get("user").user.id, interaction.channel)
        let parsedCoffeeAmount = interaction.options.getInteger("amount")
        if (mentionedUser) {
            if (mentionedUser == undefined) {
                await interaction.reply({ content: "You must @ an existing person", ephemeral: true })
                return
            }
        }
        if (parsedCoffeeAmount) {
            if ( isNaN(parsedCoffeeAmount) || parsedCoffeeAmount < 1) {
                await interaction.reply({content: "Nice try hax0r man", ephemeral: true})
                return
            } 
        }

        if ( coffees[interaction.user.id] == undefined ) {
            coffees[interaction.user.id] = {}
        }
        let curCoffees = 0
        if ( coffees[interaction.user.id][mentionedUser.user.id] ) {
            curCoffees = coffees[interaction.user.id][mentionedUser.user.id]
        }

        coffees[interaction.user.id][mentionedUser.user.id] = curCoffees + parsedCoffeeAmount
        //write new json to file
        fs.writeFile(`${coffeeJSON}`, JSON.stringify(coffees, null, 1), (err) => {
            if (err) throw err;
        });

        let ower = interaction.user.id
        let receiver = mentionedUser.user.id
        let owerMention = `<@${ower}>`
        let receiverMention = `<@${receiver}>`
        await interaction.reply( `${owerMention} gave ${receiverMention} ${parsedCoffeeAmount} coffee${parsedCoffeeAmount>1?"s":""}` )
    }

    else if (interaction.commandName == "redeem") {
        let mentionedUser = getUserFromMention(interaction.options.get("user").user.id, interaction.channel)
        let parsedCoffeeAmount = interaction.options.getInteger("amount")
        if (mentionedUser) {
            if (mentionedUser == undefined) {
                await interaction.reply({ content: "You must @ an existing person", ephemeral: true })
                return
            }
        }
        if (parsedCoffeeAmount) {
            if ( isNaN(parsedCoffeeAmount) || parsedCoffeeAmount < 1) {
                await interaction.reply({content: "Nice try hax0r man", ephemeral: true})
                return
            } 
        }

        if ( coffees[mentionedUser.user.id] == undefined ) {
            coffees[mentionedUser.user.id] = {}
        }
        let curCoffees = 0
        if ( coffees[mentionedUser.user.id][interaction.user.id] ) {
            curCoffees = coffees[mentionedUser.user.id][interaction.user.id]
        }

        let receiver = interaction.user.id
        let ower = mentionedUser.user.id
        let receiverMention = `<@${receiver}>`
        let owerMention = `<@${ower}>`

        if (curCoffees < parsedCoffeeAmount) {
            await interaction.reply({content: `${owerMention} does not owe you ${parsedCoffeeAmount}`, ephemeral: true})
            return
        }

        coffees[mentionedUser.user.id][interaction.user.id] = curCoffees - parsedCoffeeAmount
        //write new json to file
        fs.writeFile(`${coffeeJSON}`, JSON.stringify(coffees, null, 1), (err) => {
            if (err) throw err;
        });

        await interaction.reply( `${receiverMention} redeemed ${parsedCoffeeAmount} coffee${parsedCoffeeAmount>1?"s":""} from ${owerMention}` )
    }

});

client.login(token);

function getUserFromMention(mention, channel) {
    if (!mention) return undefined;

	return channel.members.get(mention);
}

function getCoffeeLedgerString( channel ) {
    let coffeeLedgerString = ""

    for (let ower in coffees) {
        for (let receiver in coffees[ower]) {
            // only write ledger line if both users exist in channel and the amount != 0
            if (channel.members.get(ower) != undefined && channel.members.get(receiver) != undefined && coffees[ower][receiver] != 0) {
                let owerMention = `<@${ower}>`
                let receiverMention = `<@${receiver}>`

                let oweLine = `**${coffees[ower][receiver]}** ${owerMention} -> ${receiverMention}`
                if (coffeeLedgerString != "") {
                    coffeeLedgerString+="\n\n"
                }
                coffeeLedgerString+=oweLine
            }
            else {
                //console.log(`can't find ${ower} or ${receiver} in ${channel}`)
            }
        }
    }
    return coffeeLedgerString
}