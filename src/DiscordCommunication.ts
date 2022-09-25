const { MessageEmbed,  MessageActionRow, MessageSelectMenu} = require("discord.js");
import {QwikGeneratedButtons} from './DiscordButtons';


"use strict"
export interface commandObject { Name: string, Logic: { Func: any, Args: Array<string> } };
export interface commandExecute { Func: any, Args: Array<string> };
export interface commandArgs { UserID?: string, RefID1?: string, RefID2?: string, Amount?: number, Amount2?: number, Text?: string, UIDAvatar?: string, R1IDAvatar?: string, UIDName?: string, R1IDName?: string };






module.exports =
{

    Embed: function (setTitle: string, setText: string, setFields: Array<any>, setFieldsAlign: boolean, setColor: string, setThumb: string): object {
        let embed = new MessageEmbed();

        embed.setTitle(setTitle);
        embed.setDescription(setText);
        embed.setColor(setColor);
        if (setFields)
            for (let y = 0; y < setFields.length; y++)
                embed.addField(setFields[y].title, setFields[y].content, setFields[y].setFieldsAlign);
        embed.setThumbnail(setThumb);

        return embed;

    },
    Reply: function (embedObject: object, botMessage: string, isHidden: boolean = false, buttonsObj: QwikGeneratedButtons = null) {

        let object = {
            embed: embedObject,
            message: botMessage,
            hidden: isHidden,
            ButtonsObj: buttonsObj,
            EditReply:false

        }
        return object;

    },
    EditReply: function (embedObject: object, botMessage: string, isHidden: boolean = false, buttonsObj: QwikGeneratedButtons = null) {


        let object = {
            embed: embedObject,
            message: botMessage,
            hidden: isHidden,
            ButtonsObj: buttonsObj,
            EditReply:true

        }
        return object;

    },

}



