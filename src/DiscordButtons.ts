const {MessageButton, MessageActionRow } = require("discord.js");
const crypto = require('crypto');
import {commandArgs} from "./DiscordCommunication"

export interface QwikCommand { Func: any, Args: Array<string> };

export interface QwikType { multiInstances: boolean, timeout: number, name: string, clickOnce: boolean, overrideAllExpire: boolean, overrideAllClick: boolean };

export interface QwikCommmandOptions { Command: string, Args: commandArgs };

export interface QwikPostProcess { overrideDisableLogic: boolean, function: any };

export interface QwikAttributes { style: QwikButtonStyles, text: string, disable: boolean };

export interface QwikButtonConfig { command: QwikCommmandOptions, label: string, style: string, type: number, customType?: QwikType , postProcess?: QwikPostProcess  };

export interface QwikGeneratedButtons { ParentMessage: string, TimeOutGroups: QwikTimeOut[], Types: QwikType[], Commands: QwikCommmandOptions[], Hashes: string[], GUIDS: string[], PostProcess: QwikPostProcess[], Buttons: typeof MessageActionRow[] };

interface QwikTimeOut { TimerLength: number, Buttons: QwikIDGroup[] }

interface QwikIDGroup { Hash: string, ID: string, MessageID?:string };

interface Qwik{ParentMessage:string,ID:string,Type:any,Command:QwikCommmandOptions,PostProcess:QwikPostProcess};

interface QwikMessage{ID:string,Interaction:any,Timer:any};


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
    TwoByTwo = 0,
    ThreeByThree = 1,
    FourByFour = 2,
    ThreeByTwo = 3

}

 class QwikButtonService
{

    private ActiveQwiks= new Map<string, Qwik[]>(); 
    private ActiveQwikTimeouts= new Map();
    private ActiveQwikMessages=new Map<string, QwikMessage>();


    public PressButton(Interaction:any, Commands:any)
    {
        let IDs:QwikIDGroup= this.GetButtonIdentity(Interaction.customId);
        let StoredCommand:QwikCommmandOptions= this.GetButtonCommand(IDs);
        let CommandAction: QwikCommand=Commands.get(StoredCommand.Command);
        let ButtonCommandArgument:commandArgs;

        ButtonCommandArgument=JSON.parse(JSON.stringify(StoredCommand.Args));
        if(ButtonCommandArgument.UserID&&ButtonCommandArgument.UserID=="PROVID")
        ButtonCommandArgument.UserID=Interaction.user.id;
        this.ProcessButtonInteraction(IDs,Interaction.user.id);
        return CommandAction.Func(ButtonCommandArgument);
    }

    public GetButtonIdentity(ButtonInteractionCustomID:string):QwikIDGroup
    {
        let  getHash=/.+?(?=~~)/;
        let getID=/(?<=\~~).*/;
        let Hash=getHash.exec(ButtonInteractionCustomID)[0];
        let ID=getID.exec(ButtonInteractionCustomID)[0];
        let foundIndex= this.ActiveQwiks.get(Hash).findIndex(item=>item.ID==ID);
        if(foundIndex==-1)
        {

            //some kind of error here
            return;
        }

        return {Hash:Hash,ID:ID,MessageID:this.ActiveQwiks.get(Hash)[foundIndex].ParentMessage};

    }

    public GetButtonCommand(ButtonIdentidy:QwikIDGroup):QwikCommmandOptions
    {

        return this.ActiveQwiks.get(ButtonIdentidy.Hash)[this.ActiveQwiks.get(ButtonIdentidy.Hash).findIndex(item=>item.ID==ButtonIdentidy.ID)].Command;
    }

    public ProcessButtonInteraction(ButtonIdentidy:QwikIDGroup,InteractionUser:string)
    {
        let returnedAttributes:QwikAttributes=undefined;
        let foundIndex= this.ActiveQwiks.get(ButtonIdentidy.Hash).findIndex(item=>item.ID==ButtonIdentidy.ID);
        let savedButtonGUID="";
        if(foundIndex==-1) return; //some kind of logging warning here in the future 
        if(this.ActiveQwiks.get(ButtonIdentidy.Hash)[foundIndex].PostProcess)
        {

            if(this.ActiveQwiks.get(ButtonIdentidy.Hash)[foundIndex].PostProcess.function)
            {
                 returnedAttributes=this.ActiveQwiks.get(ButtonIdentidy.Hash)[foundIndex].PostProcess.function(InteractionUser);
                 savedButtonGUID=ButtonIdentidy.ID;
            }
            if(this.ActiveQwiks.get(ButtonIdentidy.Hash)[foundIndex].PostProcess.overrideDisableLogic)
            {
                this.PostIndividualButtonUpdate(ButtonIdentidy,returnedAttributes);
                return;
            }
 
        }
        console.log(returnedAttributes);
        console.log(savedButtonGUID);
        if(this.ActiveQwiks.get(ButtonIdentidy.Hash)[foundIndex].Type.clickOnce==true||this.ActiveQwiks.get(ButtonIdentidy.Hash)[foundIndex].Type.overrideAllClick==true)
        {

            if(this.ActiveQwiks.get(ButtonIdentidy.Hash)[foundIndex].Type.clickOnce==false||returnedAttributes)
                 savedButtonGUID=ButtonIdentidy.ID;
             this.UpdateMultipleMessageButtons(this.ActiveQwiks.get(ButtonIdentidy.Hash)[foundIndex].ParentMessage,[ButtonIdentidy],{expire:false,click:true,specialButton:{id:savedButtonGUID,updatedAttribute:returnedAttributes}});
        }
    }

    public  PostIndividualButtonUpdate(ButtonIdentidy:QwikIDGroup,attributes:QwikAttributes)
    {
        this.ActiveQwikMessages.get(ButtonIdentidy.MessageID).Interaction.fetchReply()
        .then(reply=>{ 
            for(let x=0;x<reply.components.length;x++)
            {
                for(let y=0;y<reply.components[x].components.length;y++)
                {
                        if(reply.components[x].components[y].customId==`${ButtonIdentidy.Hash}~~${ButtonIdentidy.ID}`)
                            reply.components[x].components[y]=this.UpdateButtonAttribute(reply.components[x].components[y],attributes); 
                }
            }
            this.ActiveQwikMessages.get(ButtonIdentidy.MessageID).Interaction.editReply({components:reply.components});
        });
    }
    public  ProcessQwikButtons(ButtonsObj:QwikGeneratedButtons,MessageInteraction:any)
    {
        //check if the hash for the button currently exists in the map
        //handling buttons that have same timeouts
       
        let newMultiInstnace = new Array<QwikIDGroup>();
        let matchedMultInstanceHashes= new Array<string>();
        for(let x=0;x<ButtonsObj.GUIDS.length;x++)
        {
            let newElement: Qwik=
            {
                ParentMessage:ButtonsObj.ParentMessage, 
                ID:ButtonsObj.GUIDS[x], 
                Command:ButtonsObj.Commands[x], 
                Type:ButtonsObj.Types[x],
                PostProcess:ButtonsObj.PostProcess[x]
            };
            //check Multi Instance 
            if(ButtonsObj.Types[x].multiInstances==false)
            {
                newMultiInstnace.push({MessageID:ButtonsObj.ParentMessage,ID:ButtonsObj.GUIDS[x], Hash:ButtonsObj.Hashes[x]});
                if(matchedMultInstanceHashes.findIndex(item=>item==ButtonsObj.Hashes[x])==-1)
                    matchedMultInstanceHashes.push(ButtonsObj.Hashes[x])
            }
            
            if(this.ActiveQwiks.has(ButtonsObj.Hashes[x]))
            {
                this.ActiveQwiks.get(ButtonsObj.Hashes[x]).push(newElement);
            }
            else
            {
                this.ActiveQwiks.set(ButtonsObj.Hashes[x],new Array(newElement));   
            }
        }
        this.ProcessButtonMultiInstance(matchedMultInstanceHashes,newMultiInstnace);
        for(let x=0;x<ButtonsObj.TimeOutGroups.length;x++)
        {
            if(x==0)
            {
                this.ActiveQwikTimeouts.set(ButtonsObj.ParentMessage,new Array(
                    setTimeout( 
                        this.ButtonTimeOut.bind(this), 
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
                this.ActiveQwikTimeouts.get(ButtonsObj.ParentMessage).push(
                    setTimeout( 
                        this.ButtonTimeOut.bind(this), 
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

    private  UpdateMultipleMessageButtons(MessageID:string,ButtonIdentidies:Array<QwikIDGroup>,overrides:{click:boolean,expire:boolean,specialButton:any}={click:false,expire:false,specialButton:{id:"",updatedAttribute: undefined}}){

        let overrideAll=false;
        if(this.ActiveQwikMessages.has(MessageID))
        {
            if(overrides)
            {
                for(let x=0;x<ButtonIdentidies.length;x++)
                {
                    let index=this.ActiveQwiks.get(ButtonIdentidies[x].Hash).findIndex(item=>item.ID==ButtonIdentidies[x].ID);
                    if(index!=-1)
                    {
                        if(overrides.expire)
                            overrideAll= this.ActiveQwiks.get(ButtonIdentidies[x].Hash)[index].Type.overrideAllExpire;
                        else if(overrides.click)
                            overrideAll= this.ActiveQwiks.get(ButtonIdentidies[x].Hash)[index].Type.overrideAllClick;
                    }
                }
            }
            this.ActiveQwikMessages.get(MessageID).Interaction.fetchReply()
            .then(reply=>{ 
                for(let x=0;x<reply.components.length;x++)
                {
                    for(let y=0;y<reply.components[x].components.length;y++)
                    {
                        let overrideIgnoreIndividual=true;
                        let defaultUpdate:QwikAttributes={style:QwikButtonStyles.NOACTION,disable:true,text:""};
                        let checkExists=ButtonIdentidies.findIndex(item=>{ 

                            if(item.Hash+"~~"+item.ID== reply.components[x].components[y].customId) 
                            {
                                if(item.ID==overrides.specialButton.id&&overrides.specialButton.updatedAttribute==undefined)
                                    overrideIgnoreIndividual=false;
                                else if(item.ID==overrides.specialButton.id&&overrides.specialButton.updatedAttribute)
                                defaultUpdate=overrides.specialButton.updatedAttribute;
                                return true;
                            }
                            else 
                                return false;    
                        });
                        console.log(defaultUpdate);
                        if(overrideIgnoreIndividual && (overrideAll || checkExists!=-1))
                            reply.components[x].components[y]=this.UpdateButtonAttribute(reply.components[x].components[y],defaultUpdate); 
                    }
                }
                this.ActiveQwikMessages.get(MessageID).Interaction.editReply({components:reply.components});
            });
        }
    
    }
    private  ButtonTimeOut(TimedOutSet)
    {
        this.UpdateMultipleMessageButtons(TimedOutSet.MessageID,TimedOutSet.Buttons,{click:false,expire:true,specialButton:{id:"",updatedAttribute:undefined}});
    }
    private  MessageTimeOut(MessageID)
    {
    if(this.ActiveQwikMessages.has(MessageID))
    {
        this.ActiveQwikMessages.delete(MessageID);
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
            if(this.ActiveQwiks.has(ButtonHash[y]))
            {
                for(let x=0;x<this.ActiveQwiks.get(ButtonHash[y]).length;x++)
                {
                    if(!IgnoredButtons.some(item=>item.ID==this.ActiveQwiks.get(ButtonHash[y])[x].ID)){
                        let messageIndex=GroupedMessages.findIndex(item=>item.MessageID ==this.ActiveQwiks.get(ButtonHash[y])[x].ParentMessage);
                        let newArrayElement={Hash:ButtonHash[y],ID:this.ActiveQwiks.get(ButtonHash[y])[x].ID,MessageID:this.ActiveQwiks.get(ButtonHash[y])[x].ParentMessage};
                        if(messageIndex==-1)
                            GroupedMessages.push({MessageID:this.ActiveQwiks.get(ButtonHash[y])[x].ParentMessage,Buttons:[newArrayElement]});
                        else 
                            GroupedMessages[messageIndex].Buttons.push(newArrayElement);
                    }
    
                }
            }
        }
        for(let x=0;x<GroupedMessages.length;x++)
        {
            
            this.UpdateMultipleMessageButtons(GroupedMessages[x].MessageID,GroupedMessages[x].Buttons);
        }
    }
    private  ProcessMessage(ButtonsObj,interaction)
    {
    let messageObj:QwikMessage={ID:ButtonsObj.ParentMessage,Interaction:interaction,
        Timer:setTimeout(
            this.MessageTimeOut.bind(this),
            ButtonsObj.TimeOutGroups[0].TimerLength+10000,
            ButtonsObj.ParentMessage
        )};
    this.ActiveQwikMessages.set(ButtonsObj.ParentMessage,messageObj);
    }

}
 class QwikButtonCreate
{


    private DefaultButtons: Array<QwikType> = [
        { multiInstances: false, timeout: 60000 * .25, name: "SingleShort", clickOnce: true, overrideAllExpire: true, overrideAllClick: true },
        { multiInstances: false, timeout: 5 * 60000, name: "SingleLong", clickOnce: true, overrideAllExpire: true, overrideAllClick: true },
        { multiInstances: false, timeout: 2 * 60000, name: "MultiShort", clickOnce: false, overrideAllExpire: true, overrideAllClick: true },
        { multiInstances: false, timeout: 5 * 60000, name: "MultiLong", clickOnce: false, overrideAllExpire: true, overrideAllClick: true },
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
    public CreateButtonComponent(Buttons: Array<QwikButtonConfig>, ButtonLayout:Array<number>= [5,5,5,5,5]): QwikGeneratedButtons {

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
            let tempHash = crypto.createHash('sha1').update(JSON.stringify(Buttons[x].command)).digest('hex')
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
            ButtonObj.Commands.push(Buttons[x].command);
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
        return ButtonObj;
    }
}


module.exports={QwikButtonCreate,QwikButtonService}
