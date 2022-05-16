const {MessageButton, MessageActionRow } = require("discord.js");
const crypto = require('crypto');
import {commandArgs} from "./DiscordCommunication"

export interface QwikCommand { Func: any, Args: Array<string> };

export interface QwikType { multiInstances: boolean, timeout: number, name: string, clickOnce: boolean, overrideAllExpire: boolean, overrideAllClick: boolean };

export interface QwikCommmandOptions { Command: string, Args: commandArgs };

export interface QwikPostProcess { overrideDisableLogic: boolean, function: any };

export interface QwikAttributes { style: QwikButtonStyles, text: string, disable: boolean };

export interface QwikButtons { id: QwikCommmandOptions, label: string, style: string, type: number, customType?: QwikType , postProcess?: QwikPostProcess  };

export interface QwikGeneratedButtons { ParentMessage: string, TimeOutGroups: QwikTimeOut[], Types: QwikType[], Commands: QwikCommmandOptions[], Hashes: string[], GUIDS: string[], PostProcess: QwikPostProcess[], Buttons: typeof MessageActionRow[] };

export interface QwikTimeOut { TimerLength: number, Buttons: QwikIDGroup[] }

export interface QwikIDGroup { Hash: string, ID: string, MessageID?:string };


export const enum QwikButtonTypes {
    SingleShort = 0,
    SingleLong = 1,
    MultiShort = 2,
    MultiLong = 3

}
export const  enum QwikButtonStyles {
    NOACTION = -1,
    Primary = 1,
    Secondary = 2,
    Success = 3,
    Danger = 4,
    Link = 5
}

export const enum QwikGridTypes {
    TwobyTwo = 0,
    ThreebyThree = 1,
    FourbyFour = 2,
    ThreebyTwo = 3

}

export class QwikService
{

    private SentButtonObj:{ParentMessage:string,ID:string,Type:any,Command:any,PostProcess:any}
    private SentMessageObj:{ID:string,Interaction:any,Timer:any}

    private SentButtons= new Map<string,typeof this.SentButtonObj[]>();
    private ButtonGroupTimers= new Map();
    private SentMessages=new Map<string, typeof this.SentMessageObj>();



    public GetButtonIdentity(ButtonInteractionCustomID:string):QwikIDGroup
    {
        let  getHash=/.+?(?=~~)/;
        let getID=/(?<=\~~).*/;
        let Hash=getHash.exec(ButtonInteractionCustomID)[0];
        let ID=getID.exec(ButtonInteractionCustomID)[0];
        let foundIndex= this.SentButtons.get(Hash).findIndex(item=>item.ID==ID);
        if(foundIndex==-1)
        {

            //some kind of error here
            return;
        }

        return {Hash:Hash,ID:ID,MessageID:this.SentButtons.get(Hash)[foundIndex].ParentMessage};

    }

    public GetButtonCommand(ButtonIdentidy:QwikIDGroup):object
    {

        return this.SentButtons.get(ButtonIdentidy.Hash)[this.SentButtons.get(ButtonIdentidy.Hash).findIndex(item=>item.ID==ButtonIdentidy.ID)].Command;
    }

    public ProcessButtonInteraction(ButtonIdentidy:QwikIDGroup,InteractionUser:string)
    {
        let foundIndex= this.SentButtons.get(ButtonIdentidy.Hash).findIndex(item=>item.ID==ButtonIdentidy.ID);
        if(foundIndex==-1) return; //some kind of logging warning here in the future 
        if(this.SentButtons.get(ButtonIdentidy.Hash)[foundIndex].PostProcess)
        {
            let returnedAttributes:QwikAttributes
            if(this.SentButtons.get(ButtonIdentidy.Hash)[foundIndex].PostProcess.function)
            {
                 returnedAttributes=this.SentButtons.get(ButtonIdentidy.Hash)[foundIndex].PostProcess.function(InteractionUser);
                 this.PostIndividualButtonUpdate(ButtonIdentidy,returnedAttributes);
            }
            if(this.SentButtons.get(ButtonIdentidy.Hash)[foundIndex].PostProcess.overrideDisableLogic)
             return;
 
        }
        if(this.SentButtons.get(ButtonIdentidy.Hash)[foundIndex].Type.clickOnce==true||this.SentButtons.get(ButtonIdentidy.Hash)[foundIndex].Type.overrideAllClick==true)
        {
            let savedButtonGUID="";
            if(this.SentButtons.get(ButtonIdentidy.Hash)[foundIndex].Type.clickOnce==false)
                 savedButtonGUID=ButtonIdentidy.ID;
             console.log(savedButtonGUID);
             this.DisableMultipleMessageButtons(this.SentButtons.get(ButtonIdentidy.Hash)[foundIndex].ParentMessage,[ButtonIdentidy],{expire:false,click:true,ignoredButton:savedButtonGUID});
        }
    }

    public  PostIndividualButtonUpdate(ButtonIdentidy:QwikIDGroup,attributes:QwikAttributes)
    {
        this.SentMessages.get(ButtonIdentidy.MessageID).Interaction.fetchReply()
        .then(reply=>{ 
            for(let x=0;x<reply.components.length;x++)
            {
                for(let y=0;y<reply.components[x].components.length;y++)
                {
                        if(reply.components[x].components[y].customId==`${ButtonIdentidy.Hash}~~${ButtonIdentidy.ID}`)
                            reply.components[x].components[y]=this.UpdateButtonAttribute(reply.components[x].components[y],attributes); 
                }
            }
            this.SentMessages.get(ButtonIdentidy.MessageID).Interaction.editReply({components:reply.components});
        });
    }
    public  ProcessButtons(ButtonsObj:QwikGeneratedButtons,MessageInteraction:any)
    {
        //check if the hash for the button currently exists in the map
        //handling buttons that have same timeouts
       
        let newMultiInstnace = new Array<QwikIDGroup>();
        let matchedMultInstanceHashes= new Array<string>();
        for(let x=0;x<ButtonsObj.GUIDS.length;x++)
        {
            let newElement: typeof this.SentButtonObj=
            {
                ParentMessage:ButtonsObj.ParentMessage, 
                ID:ButtonsObj.GUIDS[x], 
                Command:ButtonsObj.Commands[x], 
                Type:ButtonsObj.Types[x],
                PostProcess:ButtonsObj.PostProcess[x]
            };
            console.log(newElement.PostProcess);
            //check Multi Instance 
            if(ButtonsObj.Types[x].multiInstances==false)
            {
                console.log(`Looked at the following button type, and it NOT multiInstance ${ButtonsObj.Types[x].name}`)
                newMultiInstnace.push({MessageID:ButtonsObj.ParentMessage,ID:ButtonsObj.GUIDS[x], Hash:ButtonsObj.Hashes[x]});
                if(matchedMultInstanceHashes.findIndex(item=>item==ButtonsObj.Hashes[x])==-1)
                    matchedMultInstanceHashes.push(ButtonsObj.Hashes[x])
            }
            
            if(this.SentButtons.has(ButtonsObj.Hashes[x]))
            {
                this.SentButtons.get(ButtonsObj.Hashes[x]).push(newElement);
            }
            else
            {
                this.SentButtons.set(ButtonsObj.Hashes[x],new Array(newElement));   
            }
        }
        this.ProcessButtonMultiInstance(matchedMultInstanceHashes,newMultiInstnace);
        for(let x=0;x<ButtonsObj.TimeOutGroups.length;x++)
        {
            if(x==0)
            {
                this.ButtonGroupTimers.set(ButtonsObj.ParentMessage,new Array(
                    setTimeout( 
                        this.ButtonTimeOut, 
                        ButtonsObj.TimeOutGroups[x].TimerLength,
                        {
                            MessageID:ButtonsObj.ParentMessage,
                            Buttons:ButtonsObj.TimeOutGroups[x].Buttons
                        }
                        )
                    )
                );  
                
            }
            else
            {
                this.ButtonGroupTimers.get(ButtonsObj.ParentMessage).push(
                    setTimeout( 
                        this.ButtonTimeOut, 
                        ButtonsObj.TimeOutGroups[x].TimerLength,
                        {
                            MessageID:ButtonsObj.ParentMessage,
                            Buttons:ButtonsObj.TimeOutGroups[x].Buttons
                        }
                        )
                    );
            }
        }
        this.ProcessMessage(ButtonsObj,MessageInteraction)
    }

    private UpdateButtonAttribute(buttonRef:any,attributes:QwikAttributes={style:QwikButtonStyles.NOACTION,text:"",disable:true})
    {   
        if(attributes.text!="")
        {
            buttonRef.setLabel(attributes.text);
        }
        if(attributes.style!=QwikButtonStyles.NOACTION)
        {
            buttonRef.setStyle(attributes.style);
        }
        
        buttonRef.setDisabled(attributes.disable);
        return buttonRef;
    }

    private  DisableMultipleMessageButtons(MessageID:string,ButtonIdentidies:Array<QwikIDGroup>,overrides:{click:boolean,expire:boolean,ignoredButton:string}={click:false,expire:false,ignoredButton:""}){

        let overrideAll=false;
        if(this.SentMessages.has(MessageID))
        {
            if(overrides)
            {
                for(let x=0;x<ButtonIdentidies.length;x++)
                {
                    let index=this.SentButtons.get(ButtonIdentidies[x].Hash).findIndex(item=>item.ID==ButtonIdentidies[x].ID);
                    if(index!=-1)
                    {
                        if(overrides.expire)
                            overrideAll= this.SentButtons.get(ButtonIdentidies[x].Hash)[index].Type.overrideAllExpire;
                        else if(overrides.click)
                            overrideAll= this.SentButtons.get(ButtonIdentidies[x].Hash)[index].Type.overrideAllClick;
                    }
                }
            }
            this.SentMessages.get(MessageID).Interaction.fetchReply()
            .then(reply=>{ 
                for(let x=0;x<reply.components.length;x++)
                {
                    for(let y=0;y<reply.components[x].components.length;y++)
                    {
                        let overrideIgnoreIndividual=true;
                        let checkExists=ButtonIdentidies.findIndex(item=>{ 
    
                            if(item.Hash+"~~"+item.ID== reply.components[x].components[y].customId) {
                                if(item.ID==overrides.ignoredButton)
                                    overrideIgnoreIndividual=false;
                                return true;
                            }
                            else 
                                return false;    
                        });
                        if(overrideIgnoreIndividual && (overrideAll || checkExists!=-1))
                            reply.components[x].components[y]=this.UpdateButtonAttribute(reply.components[x].components[y]); 
                    }
                }
                this.SentMessages.get(MessageID).Interaction.editReply({components:reply.components});
            });
        }
    
    }
    private  ButtonTimeOut(TimedOutSet)
    {
        this.DisableMultipleMessageButtons(TimedOutSet.MessageID,TimedOutSet.Buttons,{click:false,expire:true,ignoredButton:""});
    }
    private  MessageTimeOut(MessageID)
    {
    if(this.SentMessages.has(MessageID))
    {
        this.SentMessages.delete(MessageID);
    }
    else
    {
        console.log("Temp statement replace with logging later");
        //message reference does not exist for some reason, log it 
    }
    }
    private ProcessButtonMultiInstance(ButtonHash:Array<string>,IgnoredButtons:Array<QwikIDGroup>) //checked
    {  
        let GroupedButtons:QwikIDGroup;
        let GroupedAction: {MessageID:string,Buttons:typeof GroupedButtons[]};
        let GroupedMessages= new Array<typeof GroupedAction>();
        
       for(let y=0;y<ButtonHash.length;y++)
        {
            if(this.SentButtons.has(ButtonHash[y]))
            {
                for(let x=0;x<this.SentButtons.get(ButtonHash[y]).length;x++)
                {
                    if(!IgnoredButtons.some(item=>item.ID==this.SentButtons.get(ButtonHash[y])[x].ID)){
                        let messageIndex=GroupedMessages.findIndex(item=>item.MessageID ==this.SentButtons.get(ButtonHash[y])[x].ParentMessage);
                        let newArrayElement={Hash:ButtonHash[y],ID:this.SentButtons.get(ButtonHash[y])[x].ID,MessageID:this.SentButtons.get(ButtonHash[y])[x].ParentMessage};
                        console.log(messageIndex);
                        if(messageIndex==-1)
                            GroupedMessages.push({MessageID:this.SentButtons.get(ButtonHash[y])[x].ParentMessage,Buttons:[newArrayElement]});
                        else 
                            GroupedMessages[messageIndex].Buttons.push(newArrayElement);
                    }
    
                }
            }
        }
        for(let x=0;x<GroupedMessages.length;x++)
        {
            
            this.DisableMultipleMessageButtons(GroupedMessages[x].MessageID,GroupedMessages[x].Buttons);
        }
    }
    private  ProcessMessage(ButtonsObj,interaction)
    {
    console.log(`The longest timer is ${ButtonsObj.TimeOutGroups[0].TimerLength}`)
    let messageObj: typeof this.SentMessageObj={ID:ButtonsObj.ParentMessage,Interaction:interaction,
        Timer:setTimeout(
            this.MessageTimeOut,
            ButtonsObj.TimeOutGroups[0].TimerLength+10000,
            ButtonsObj.ParentMessage
        )};
    this.SentMessages.set(ButtonsObj.ParentMessage,messageObj);
    }

}
export class QwikCreate
{


    private DefaultButtons: Array<QwikType> = [
        { multiInstances: false, timeout: 60000 * .25, name: "SingleShort", clickOnce: true, overrideAllExpire: true, overrideAllClick: true },
        { multiInstances: false, timeout: 5 * 60000, name: "SingleLong", clickOnce: true, overrideAllExpire: true, overrideAllClick: true },
        { multiInstances: false, timeout: 2 * 60000, name: "MultiShort", clickOnce: false, overrideAllExpire: true, overrideAllClick: true },
        { multiInstances: false, timeout: 5 * 60000, name: "MultiLong", clickOnce: false, overrideAllExpire: true, overrideAllClick: true },
        { multiInstances: true, timeout: .25 * 60000, name: "Stack1", clickOnce: false, overrideAllExpire: false, overrideAllClick: true }
    ];    
    
    private DefaultGrids: Array<Array<number>> = [
       [2,2],
       [3,3],
       [4,4],
       [3,2],
    
    ];   

        /** 
     Supply an array of ButtonConfig and optional ButtonLayout to define a Reply's attached buttons
    *@param {Array<ButtonConfig>} Buttons
    *@param {Array<number>} ButtonLayout
    *@returns {ReplyButtonComponent} ReplyButtonComponent
    */
    public CreateButtonComponent(Buttons: Array<QwikButtons>, ButtonLayout:Array<number>= [5,5,5,5,5]): QwikGeneratedButtons {

        let maxButtons = ButtonLayout.reduce((a,b)=>a+b);
        let TimeOutGroups: QwikTimeOut[] = new Array<QwikTimeOut>();
        let messageGuid = crypto.randomBytes(16).toString("hex");



        let rowCount = 0;
        if (Buttons.length > maxButtons)
            throw new Error(`A Button Grid with the shape of ${JSON.stringify(ButtonLayout)} cannot have more than ${maxButtons} buttons.`);

        rowCount = ButtonLayout.length;

        let ButtonObj: QwikGeneratedButtons = { ParentMessage: messageGuid, TimeOutGroups: [], Types: [], Commands: [], Hashes: [], GUIDS: [], PostProcess: [], Buttons: [new MessageActionRow()] };
        let ButtonRowTracker=0;
        let LocalButtonRow=0;
        for (let x = 0; x < Buttons.length; x++) {

            let tempGuid = crypto.randomBytes(16).toString("hex");
            let tempHash = crypto.createHash('sha1').update(JSON.stringify(Buttons[x].id)).digest('hex')
            let rowPlacement: number;

            //Button Type characteristics 
            if (Buttons[x].type) {
                ButtonObj.Types.push(this.DefaultButtons[Buttons[x].type]);
            }
            else if (Buttons[x].customType) {
                ButtonObj.Types.push(Buttons[x].customType);
            }
            else {
                ButtonObj.Types.push(this.DefaultButtons[0]);
            }
            if (ButtonObj.Types[x].timeout == -1) ButtonObj.Types[x].timeout = 15 * 60000;
            //Button Row Placement
            if(LocalButtonRow<ButtonLayout[ButtonRowTracker])
            {
                rowPlacement=ButtonRowTracker;
                LocalButtonRow++;
            }
            else
            {
                ButtonRowTracker++;
                ButtonObj.Buttons.push(new MessageActionRow());
                rowPlacement=ButtonRowTracker;
                LocalButtonRow=1;
            }
            //rowPlacement = x / ButtonGrid.RowLength | 0;
            ButtonObj.Commands.push(Buttons[x].id);
            ButtonObj.Hashes.push(tempHash);
            ButtonObj.GUIDS.push(tempGuid);
            if (Buttons[x].postProcess != undefined)
                ButtonObj.PostProcess.push(Buttons[x].postProcess)
            ButtonObj.Buttons[rowPlacement].addComponents(
                new MessageButton()
                    .setCustomId(`${tempHash}~~${tempGuid}`)
                    .setLabel(Buttons[x].label)
                    .setStyle(Buttons[x].style),
            );

            //button timeout grouping

            let buttonGroupIndex = TimeOutGroups.findIndex(item => item.TimerLength == ButtonObj.Types[ButtonObj.Types.length - 1].timeout);
            let buttonArrayElement: QwikIDGroup = { Hash: tempHash, ID: tempGuid };
            if (buttonGroupIndex != -1) {
                TimeOutGroups[buttonGroupIndex].Buttons.push(buttonArrayElement);
            }
            else {
                TimeOutGroups.push({ TimerLength: ButtonObj.Types[x].timeout, Buttons: [buttonArrayElement] });
            }
        }
        TimeOutGroups = TimeOutGroups.sort((a, b) => (a.TimerLength < b.TimerLength) ? 1 : -1);
        for (let x = 1; x < TimeOutGroups.length; x++) {
            if (TimeOutGroups[x - 1].TimerLength - TimeOutGroups[x].TimerLength <= 2000) {
                if (!(TimeOutGroups[x - 1].TimerLength >= 15 * 60000))
                    TimeOutGroups[x - 1].TimerLength += 2000;
                else if (!(TimeOutGroups[x].TimerLength <= 8000))
                    TimeOutGroups[x].TimerLength -= 2000;
            }
        }
        ButtonObj.TimeOutGroups = TimeOutGroups;
        console.log(ButtonObj.Buttons);
        return ButtonObj;
    }
}
