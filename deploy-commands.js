const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { discordClientId, discordGuildId, discordToken } = require("./config.json");


const commands = [
    // new SlashCommandBuilder()
    // .setName("agree")
    // .setDescription("Agree to terms & conditions"),
    new SlashCommandBuilder()
    .setName("autobalance")
    .setDescription("Automatically balance out your debts"),
    // new SlashCommandBuilder()
    // .setName("venmo")
    // .setDescription("Add venmo to profile")
    // .addStringOption((option) =>
    //     option
    //         .setName("text")
    //         .setDescription("Your venmo username")
    //         .setRequired(true)
    // ), 
    new SlashCommandBuilder()

        .setName("ledger")
        .setDescription("Sends updated key ledger"),
    new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Sends updated key leaderboard"),
    new SlashCommandBuilder()
        .setName("profile")
        .setDescription("Show profile for a user")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("User to show profile of")
                .setRequired(false)
        ),
    new SlashCommandBuilder()
        .setName("give")
        .setDescription("Give some coffee")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("User to give coffee to")
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("amount")
                .setDescription("Amount to give")
                .setRequired(true)
        ),
    // new SlashCommandBuilder()
    //     .setName("redeem")
    //     .setDescription("Redeem some keys")
    //     .addUserOption((option) =>
    //         option
    //             .setName("user")
    //             .setDescription("User to redeem keys from")
    //             .setRequired(true)
    //     )
    //     .addIntegerOption((option) =>
    //         option
    //             .setName("amount")
    //             .setDescription("Amount to redeem")
    //             .setRequired(true)
    //     ),
    new SlashCommandBuilder()
        .setName("coinflip")
        .setDescription("Coinflip for 1 coffee"),
    // new SlashCommandBuilder()
    //     .setName("niceflip")
    //     .setDescription("Coinflip for 69 coffees"),
    // new SlashCommandBuilder()
    //     .setName("omniflip")
    //     .setDescription("Coinflip an Omni amount of times"),
    // new SlashCommandBuilder()
    //     .setName("multiflip")
    //     .setDescription("Put out offer for multiple coinflips!")
    //     .addIntegerOption((option) =>
    //         option
    //             .setName("amount")
    //             .setDescription("Amount of coinflips to make")
    //             .setRequired(true)
    //     ),
    new SlashCommandBuilder()
        .setName("transfer")
        .setDescription("Transfer redeemable coffees to cover owed coffees")
        .addUserOption((option) =>
            option
                .setName("from")
                .setDescription("User to transfer redeemble from")
                .setRequired(true)
        )
        .addUserOption((option) =>
            option
                .setName("to")
                .setDescription("User to transfer redeemable to")
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("amount")
                .setDescription("Coffee amount to transfer")
                .setRequired(true)
        ),
    // new SlashCommandBuilder()
    //     .setName("startpot")
    //     .setDescription("Start a coffee betting pot")
    //     .addIntegerOption((option) =>
    //         option
    //             .setName("amount")
    //             .setDescription("Amount of people to run the pot at")
    //             .setRequired(true)
    //     ),
    // new SlashCommandBuilder()
    //     .setName("joinpot")
    //     .setDescription("Join a coffee betting pot")
    //     .addIntegerOption((option) =>
    //         option
    //             .setName("amount")
    //             .setDescription("Choose a number between 1 and 1000")
    //             .setRequired(true)
    //     ),
    new SlashCommandBuilder()
        .setName("21")
        .setDescription("Start or join a new game of 21!")
        .addIntegerOption((option) =>
        option
           .setName("amount")
           .setDescription("Set the buy in amount if starting a new game")
           .setRequired(false)
    ),
    new SlashCommandBuilder()
        .setName("hand")
        .setDescription("See your current hand"),
    new SlashCommandBuilder()
        .setName("draw")
        .setDescription("Add a new card to your hand"),
    new SlashCommandBuilder()
        .setName("stay")
        .setDescription("Finish your hand"),

    new SlashCommandBuilder()
        .setName("rps")
        .setDescription(
            "RPS for 1 coffee"
        )
        .addStringOption((option) =>
            option
                .setName("choice")
                .setDescription("Rock, paper, or scissors")
                .setRequired(true)
                .addChoice("Rock", "Rock")
                .addChoice("Paper", "Paper")
                .addChoice("Scissors", "Scissors")

        ),
        // new SlashCommandBuilder()
        // .setName("bestcreate")
        // .setDescription("Create a new 'Best Of' Set for a game")
        // .addStringOption((option) =>
        // option
        //     .setName("choice")
        //     .setDescription("game you want to play")
        //     .setRequired(true)
        //     .addChoice("21", "21")
        //     .addChoice("Tic-Tac-Toe", "tictactoe")
        // )
        // .addIntegerOption((option) =>
        // option
        //     .setName("rounds")
        //     .setDescription("Best Of how many games?")
        //     .setRequired(true)
        // )
        // .addIntegerOption((option) =>
        // option
        //     .setName("amount")
        //     .setDescription("How many coffees does the winner get")
        //     .setRequired(true)
        // ),
        // new SlashCommandBuilder()
        // .setName("bestjoin")
        // .setDescription("Join a Best Of set"),
        // new SlashCommandBuilder()
        // .setName("bestplayers")
        // .setDescription("Current players in a Best Of set"),
        new SlashCommandBuilder()
        .setName("drop")
        .setDescription("Drop Coffs for others to pick up!")
        .addIntegerOption((option) =>
        option
            .setName("amount")
            .setDescription("Pick up drop coffs, or set the amount you want to drop")
            .setRequired(false)
    ),
    new SlashCommandBuilder()
    .setName("tictactoe")
    .setDescription("Start a game of Tic-Tac-Toe!"),
].map((command) => command.toJSON());

const rest = new REST({ version: "9" }).setToken(discordToken);

(async () => {
    try {
        await rest.put(Routes.applicationGuildCommands(discordClientId,discordGuildId), {
            body: commands,
        });

        console.log("Successfully registered application commands.");
    } catch (error) {
        console.error(error);
    }
})();

