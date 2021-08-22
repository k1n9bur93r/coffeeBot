const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config.json');

const commands = [
	new SlashCommandBuilder().setName('ledger').setDescription('Sends updated coffee ledger'),
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
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount to give')
                .setRequired(true)),
	new SlashCommandBuilder().setName('redeem').setDescription('Redeem some coffee')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to redeem coffee from')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount to redeem')
                .setRequired(true)),
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