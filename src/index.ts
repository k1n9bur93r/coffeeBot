// Require the necessary discord.js classes
let initServerGroup:= process.env.serverGroup;
let FileIO = require("./FileIO");
let Discord= require("./DiscordEntry");
//let API=require("./ApiEntry");
let IndexLogger = require("./logger");
FileIO.Initalize(initServerGroup);
Discord.Initalize();
//API.Initalize(); //not needed for now 
IndexLogger("Ready!");

// Need to do fast TODO: 
// Track the channel ID of the og request that was made so any broadcasts related to the request happen in the same channel

//Down the line TODO
// Do some kind or larger refactor of the card game object so stuff is more seperated 
// Do the above but for BestOf
// See if it is possible to create some sort of generic "Game" object that can act as a standard way to output results 



