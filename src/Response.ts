"use strict"
const { responseJSON} = require("../config.json");
const language = require("@google-cloud/language");
const fileResponses = require(`../${responseJSON}`);
let  RespFileIO = require("./FileIO");
const {Reply,Embed}= require("./DiscordCommunication");
let {gCloudLang}=require('../config.json')
let langCloudBuffer:object= Buffer.from(`${gCloudLang}`,'base64')
//let langCloudBuffer= Buffer.from(`${process.env.gCloudLang}`,'base64')
let langDecodedCloud=langCloudBuffer.toString();
langCloudBuffer=JSON.parse(langDecodedCloud);

const gCClient = new language.LanguageServiceClient(langCloudBuffer);

const ResponseThumbnail="https://cdn.discordapp.com/avatars/878799768963391568/eddb102f5d15650d0dfc73613a86f5d2.webp?size=128";

module.exports = 
{
Initalize: function()
{
    gCClient.initialize();
},
 CommandTalk: async function(interactionID: number, userMessage: string):Promise<Array<object>>
 {

        let output;
        const document = {
            language: "en",
            type: "PLAIN_TEXT",
            content: userMessage,
        };
        const [result] =  await gCClient.analyzeSentiment({
            document: document,
        });
        const gcReponse = result.documentSentiment;
        let stats = RespFileIO.GetDebts(interactionID);

        await gcReponse;
        //generate response
        output = GenerateResponse(result, fileResponses, stats);

        let embed = Embed(
            "Coffee Bot Says:",
            output,
            null,
            false,
            "DARK_GREEN",
            ResponseThumbnail
        );
        
        return [Reply(embed,`<@${interactionID}> said\n> "*${userMessage}*"`,true)];
    }
}

function GenerateResponse(response, text, coffeeStats) :string
{
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
export{}