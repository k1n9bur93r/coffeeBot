module.exports = 
{
    Embed:function(setTitle,setText,setFields,setFieldsAlign,setColor,setThumb){
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
    Request:function(isReply, embedObject, botMessage,isHidden,TimerObject){
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
    Timer:function(eventName,timerLength,methodNumber){
        let object={
            Action: eventName.Name,
            Replace: eventName.Replace,
            Length:timerLength*60000,
            functionCall:methodNumber
        }
        return object;
    },
    Type:Object.freeze({Reply:true,Brodcast:false,Hidden:true,Visible:false})
}
