"use strict"
//maybe have some larger file that contains my object types or something 
let TimerEvent= {Name:"",Replace:[""]};
// Discord Response Types 
// Is Reply, embed, no message, hidden, no timer event
// Is Reply, embed, no message, not hidden, no timer event
// Is Reply, embed, no message, hidden, timer event
// Is Reply, embed, no message, not hidden, timer event
// Is Reply, embed, message, hidden, no timer event
// Is Reply, embed, message, not hidden, no timer event
// Is Reply, embed, message, hidden, timer event
// Is Reply, embed, message, not hidden, timer event
// Is Reply, no embed, message, hidden, no timer event
// Is Reply, no embed, message, not hidden, no timer event
// Is Reply, no embed, message, hidden,  timer event
// Is Reply, no embed, message, not hidden,  timer event

// Is Global, embed, no message, not hidden, no timer event
// Is Global, embed, no message, not hidden, timer event
// Is Global, embed, message, not hidden, no timer event
// Is Global, embed, message, not hidden, timer event
// Is Global, no embed, message, not hidden, no timer event
// Is Global, no embed, message, not hidden,  timer event
module.exports = 
{
    Embed:function(setTitle:string,setText:string,setFields:Array<object>,setFieldsAlign:boolean,setColor:string,setThumb:string) :object
    {
        let psudoEmbed={
            title:setTitle,
            text:setText,
            color:setColor,
            fields:setFields,
            fieldsAlign:setFieldsAlign,
            thumbnail:setThumb    
           }
            return psudoEmbed;

    },
    Request:function(isReply:boolean, embedObject:object, botMessage:string,isHidden:boolean,TimerObject:object): object
    {
        let object={reply:isReply,
            winner:0,
            embed:embedObject,
            message:botMessage,
            hidden:isHidden,
            
            TimerSettings:null
            };
            if(TimerObject)
            {
                object.TimerSettings=TimerObject;
            }
        return object;

    },
    Timer:function(eventName:typeof TimerEvent,timerLength:number,methodNumber:number) :object
    {
        let object={
            Action: eventName.Name,
            Replace: eventName.Replace,
            Length:timerLength*60000,
            functionCall:methodNumber
        }
        return object;
    },
    Type:Object.freeze({
        Reply:true,
        Brodcast:false,
        Hidden:true,
        Visible:false,
        GameStart: {Name:"CG-Start",Replace:["CG-Init","BS-Init"]},
        GameEnd:{Name:"CG-End",Replace:["CG-Init","CG-Action","CG-Start"]},
        GameAction:{Name:"CG-Action",Replace:["CG-Start","CG-Action"]},
        GameInit:{Name:"CG-Init",Replace:["BS-Init"]},
        BestInit:{Name:"BS-Init",Replace:["CG-Init","CG-Start","CG-Action","CG-End"]},
        BestTimeOut:{Name:"BS-Time",Replace:["CG-Init","CG-Start","CG-Action","CG-End"]}
    
    })
}
