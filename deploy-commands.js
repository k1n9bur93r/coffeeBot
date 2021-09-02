const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config.json');

const commands = [
	new SlashCommandBuilder().setName('ledger').setDescription('Sends updated coffee ledger'),
    new SlashCommandBuilder().setName('leaderboard').setDescription('Sends updated coffee leaderboard'),
    new SlashCommandBuilder().setName('profile').setDescription('Show profile for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to show profile of')
                .setRequired(false)),
	new SlashCommandBuilder().setName('give').setDescription('Give some coffee')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to give coffee to')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('amount')
                .setDescription('Amount to give')
                .setRequired(true)),
	new SlashCommandBuilder().setName('redeem').setDescription('Redeem some coffee')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to redeem coffee from')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('amount')
                .setDescription('Amount to redeem')
                .setRequired(true)),
    new SlashCommandBuilder().setName('coinflip').setDescription('Put out offer to coinflip for 1 coffee'),
    new SlashCommandBuilder().setName('transfer').setDescription('Transfer redeemable coffees to cover owed coffees')
        .addUserOption(option =>
            option.setName('from')
                .setDescription('User to transfer redeemble from')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('to')
                .setDescription('User to transfer redeemable to')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('amount')
                .setDescription('Coffee amount to transfer')
                .setRequired(true)),
    new SlashCommandBuilder().setName('startpot').setDescription('Start a coffee betting pot')
        .addIntegerOption(option =>
            option.setName('amount')
            .setDescription('Amount of people to run the pot at')
            .setRequired(true)),
    new SlashCommandBuilder().setName('joinpot').setDescription('Join a coffee betting pot')
        .addIntegerOption(option =>
            option.setName('number')
            .setDescription('Choose a number between 1 and 1000')
            .setRequired(true)),
    new SlashCommandBuilder().setName('talk').setDescription('Talk to Coffee Bot')
        .addStringOption(option =>
            option.setName('message')
            .setDescription('What you want to say')
            .setRequired(true)),
    new SlashCommandBuilder().setName('nullify').setDescription('Nullify your bidirectional coffees'),
    new SlashCommandBuilder().setName('serverstats').setDescription('Info for the rich and the poor')          
]
    .map(command => command.toJSON());

    
const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log('Successfully registered application commands.');
	} catch (error) {
		console.error(error);
	}
})();