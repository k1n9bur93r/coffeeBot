const {MessageEmbed,MessageButton,MessageActionRow}=require("discord.js");

"use strict"

interface buttons{id:string,label:string,style:string};
module.exports = 
{

    Embed:function(setTitle:string,setText:string,setFields:Array<any>,setFieldsAlign:boolean,setColor:string,setThumb:string) :object
    {
        let embed=new MessageEmbed();
        
            embed.setTitle(setTitle);
            embed.setDescription(setText);
            embed.setColor(setColor);
            if(setFields)
                for(let y=0;y<setFields.length;y++)
                    embed.addField(setFields[y].title,setFields[y].content,setFields[y].setFieldsAlign);  
            embed.setThumbnail(setThumb);    

            return embed;

    },
    Reply:function(embedObject:object, botMessage:string,isHidden:boolean=false,actionRow:object=null): object
    {
        let object={
            winner:0,
            embed:embedObject,
            message:botMessage,
            hidden:isHidden,
            actionRow:actionRow
        }
        return object;

    },
    Buttons:function(buttons:Array<buttons>):object//id:string,lable:string,style:string):object
    {
        
        const row = new MessageActionRow();
        for(let x=0;x<buttons.length;x++)
        {
            row.addComponents(
                new MessageButton()
                .setCustomId(buttons[x].id)
                .setLabel(buttons[x].label)
                .setStyle(buttons[x].style),
            );
        }

        return row;
    }
}
