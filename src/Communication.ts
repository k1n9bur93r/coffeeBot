const {MessageEmbed,MessageButton,MessageActionRow}=require("discord.js");

"use strict"
export interface ButtonSettings{multiInstances:boolean,timeout:number,name:string,clickOnce:boolean};
interface buttons{id:string,label:string,style:string,type:number,customType:ButtonSettings};

const DefaultButtons:Array<ButtonSettings>=[
    {multiInstances:false,timeout:60000*.25,name:"SingleShort",clickOnce:true},
    {multiInstances:false,timeout:5*60000,name:"SingleLong",clickOnce:true},
    {multiInstances:false,timeout:2*60000,name:"MultiShort",clickOnce:false},
    {multiInstances:false,timeout:5*60000,name:"MultiLong",clickOnce:false},
];

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
    Reply:function(embedObject:object, botMessage:string,isHidden:boolean=false,buttonsObj:object=null): object
    {
        let object={
            winner:0,
            embed:embedObject,
            message:botMessage,
            hidden:isHidden,
            ButtonsObj:buttonsObj
        }
        return object;

    },
    Buttons:function(buttons:Array<buttons>):object//id:string,lable:string,style:string):object
    {
        let ButtonObj={Types:[],Buttons:new MessageActionRow()};
        for(let x=0;x<buttons.length;x++)
        {
            if(buttons[x].type)
                ButtonObj.Types.push(DefaultButtons[buttons[x].type]);
            else if (buttons[x].customType)
                ButtonObj.Types.push(buttons[x].customType);
            else 
                ButtonObj.Types.push(DefaultButtons[0]);

            ButtonObj.Buttons.addComponents(
                new MessageButton()
                .setCustomId(buttons[x].id)
                .setLabel(buttons[x].label)
                .setStyle(buttons[x].style),
            );
        }
        return ButtonObj;
    }
}
export const enum ButtonTypes 
{
    SingleShort=0,
    SingleLong=1,
    MultiShort=2,
    MultiLong=3

}




