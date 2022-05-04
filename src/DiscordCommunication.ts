const {MessageEmbed,MessageButton,MessageActionRow}=require("discord.js");
const crypto=require('crypto');


"use strict"
export interface commandObject {Name:string,Logic:{Func:any,Args:Array<string>}};
export interface commandExecute {Func:any,Args:Array<string>};
export interface commandArgs {UserID:string,RefID1:string,RefID2:string,Amount:number,Amount2:number,Text:string,UIDAvatar:string,R1IDAvatar:string,UIDName:string,R1IDName:string};
export interface ButtonSettings{multiInstances:boolean,timeout:number,name:string,clickOnce:boolean,overrideAllExpire:boolean,overrideAllClick:boolean,row:number};
export interface ButtonRowSettings{rowLength:number,rowCount:number,}
export interface ButtonCommmandOptions{Command:string,Args:commandArgs};
export const enum ButtonTypes 
{
    SingleShort=0,
    SingleLong=1,
    MultiShort=2,
    MultiLong=3,
    Stack1=4,
    Stack2=5,
    Stack3=6

}
interface buttons{id:ButtonCommmandOptions,label:string,style:string,type:number,customType:ButtonSettings};

const DefaultButtons:Array<ButtonSettings>=[
    {multiInstances:false,timeout:60000*.25,name:"SingleShort",clickOnce:true,overrideAllExpire:true,overrideAllClick:true,row:0},
    {multiInstances:false,timeout:5*60000,name:"SingleLong",clickOnce:true,overrideAllExpire:true,overrideAllClick:true,row:0},
    {multiInstances:false,timeout:2*60000,name:"MultiShort",clickOnce:false,overrideAllExpire:true,overrideAllClick:true,row:0},
    {multiInstances:false,timeout:5*60000,name:"MultiLong",clickOnce:false,overrideAllExpire:true,overrideAllClick:true,row:0},
    {multiInstances:false,timeout:.25*60000,name:"Stack1",clickOnce:false,overrideAllExpire:false,overrideAllClick:true,row:0},
    {multiInstances:false,timeout:2*60000,name:"Stack2",clickOnce:false,overrideAllExpire:false,overrideAllClick:true,row:1},
    {multiInstances:false,timeout:1*60000,name:"Stack3",clickOnce:false,overrideAllExpire:false,overrideAllClick:true,row:2},
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
    Buttons:function(buttons:Array<buttons>,buttonRow:ButtonRowSettings=undefined):object
    {
        //TODO: a lot of things here still need to be figured out
        // what happens if people only supply a row length rather than a row count 
        //what happens if the buttons do not have an attached row value to them, do we just add them to the existing array one by one 
        //what do we do if the button has a row attached to it and that row is then filled beyond its carrying point 
        //add in more erros 
        //make it so that in other files the arguments for the methods are typed and give intelisense 

        let actionRows=new Array<typeof MessageActionRow>();
        let sameRowTimeOutTracker= new Array();
        let sameRowPastButtonType= new Array();
        let sameRowPastButtonGUID= new Array();
        let rowCount=buttons.length/5|1;
        if(buttons.length>25)
            throw new Error("A Message cannot have more than 25 buttons. 5 Buttons across 5 Rows");
        if(buttonRow!=undefined)
        {
            if(buttons.length>buttonRow.rowCount*buttonRow.rowLength)
                throw new Error(`This message has more buttons than it's configured rows can handle. Rows: ${buttonRow.rowCount} Buttons per Row: ${buttonRow.rowLength} Supplied Buttons: ${buttons.length}`);
            rowCount=buttonRow.rowCount;

        }
        for(let x=0;x<rowCount;x++)
        {
            actionRows.push(new MessageActionRow());
            sameRowTimeOutTracker.push(true);
            sameRowPastButtonType.push(undefined);
            sameRowPastButtonGUID.push(undefined);
            
        }
        let PastButton:ButtonSettings=undefined;
        let ButtonObj={SameTotalTimeout:true,MasterButton:"",ButtonRows:{SameTimeouts:[],Rows:[],MasterRowButton:[]},Types:[],Commands:[],Hashes:[],GUIDS:[],Buttons:actionRows};
        for(let x=0;x<buttons.length;x++)
        {

            let tempGuid=crypto.randomBytes(16).toString("hex");
            let tempHash=crypto.createHash('sha1').update(JSON.stringify(buttons[x].id)).digest('hex')
            let rowPlacement:number;

            if(PastButton==undefined)
                PastButton=DefaultButtons[buttons[x].type]
            else if(PastButton.timeout!=DefaultButtons[buttons[x].type].timeout)
            {
                ButtonObj.SameTotalTimeout=false;
            }

            if(buttons[x].type)
            {
                ButtonObj.Types.push(DefaultButtons[buttons[x].type]);
                rowPlacement=DefaultButtons[buttons[x].type].row;
            }
            else if (buttons[x].customType)
            {
                ButtonObj.Types.push(buttons[x].customType);
                rowPlacement=buttons[x].customType.row;
            }
            else 
            {
                ButtonObj.Types.push(DefaultButtons[0]);
                rowPlacement=DefaultButtons[0].row;
            }
            if(buttonRow==undefined)
            {
                rowPlacement=x/5|0;
            }

            if(sameRowPastButtonType[rowPlacement]==undefined)
            {
                sameRowPastButtonType[rowPlacement]= ButtonObj.Types[x];  
                sameRowPastButtonGUID[rowPlacement]= tempGuid;
            }
            else if(sameRowPastButtonType[rowPlacement]!=ButtonObj.Types[x])
            {
            sameRowTimeOutTracker[rowPlacement]=false;
            //adjust times 
            }

            ButtonObj.Commands.push(buttons[x].id);
            ButtonObj.Hashes.push(tempHash);
            ButtonObj.GUIDS.push(tempGuid);
            ButtonObj.ButtonRows.Rows.push(rowPlacement);
            ButtonObj.Buttons[rowPlacement].addComponents(
                new MessageButton()
                .setCustomId(`${tempHash}~~${tempGuid}`)
                .setLabel(buttons[x].label)
                .setStyle(buttons[x].style),
            );
        }
        for(let x=0;x<sameRowTimeOutTracker.length;x++)
        {
            console.log(sameRowTimeOutTracker[x]);
            if(sameRowTimeOutTracker[x])
                ButtonObj.ButtonRows.MasterRowButton[x]=sameRowPastButtonGUID[x];
            console.log(ButtonObj.ButtonRows.MasterRowButton[x]);
            ButtonObj.ButtonRows.SameTimeouts[x]=sameRowTimeOutTracker[x];
        }
        console.log(ButtonObj.SameTotalTimeout);
        if(ButtonObj.SameTotalTimeout)
            ButtonObj.MasterButton=ButtonObj.GUIDS[0];
        return ButtonObj;
    }
}


