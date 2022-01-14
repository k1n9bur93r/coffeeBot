

let DiscordEvent = require("./DiscordEntry");
let APIEvent = require("./APIEntry");
"use strict"

export class Event
{
    private _Name:string;
    private _Replace=[] as Array<string>;
    private _Time: number;
    private _CallBack:any;
    private _Argument:string;
    
    constructor(Name:string, Replace: Array<string>,minutes:number,callback:any,arg:string)
    {
        this._Name=Name;
        this._Replace=Replace;
        this._Time=minutes*60000;
        this._CallBack=callback;
        this._Argument=arg;

    }

    public get Name(){return this._Name;}
    public get Replace(){return this._Replace;}
    public get Minutes(){return this._Time;}
    public get CallBack(){return this._CallBack;}
    public get Argument(){return this._Argument;}

}

export class EventType
{
    //move the following to both the Card game function and other. 
    //esure that any routing logic is either moved to the buisness functions or rolled into some generic place for both DISCORD and APIS
    static readonly GameStart= new Event("CG-Start",["CG-Init","BS-Init"]);
    static readonly GameEnd= new Event("CG-End",["CG-Init","CG-Action","CG-Start"]);
    static readonly GameAction= new Event("CG-Action",["CG-Start","CG-Action"]); 
    static readonly GameInit= new Event("CG-Init",["BS-Init"]);
    static readonly BestInit= new Event("BS-Init",["CG-Init","CG-Start","CG-Action","CG-End"]);
    static readonly BestTimeOut= new Event("BS-Time",["CG-Init","CG-Start","CG-Action","CG-End"]);
}

interface TimerObject{Timer:ReturnType<typeof setTimeout>,Name:string}

const TimerLists = new Map();


module.exports=
{
NewTimerEvent:function(EventGroup:string,IndividualEvent:Event)
{
    //look through TimerLists Map
    //if EventGroup key exists and has events, then run logic to add to event group
    //if there is no key, or the key's array is empty just add the event to the group

        if(TimerLists.get(IndividualEvent.Name)!=undefined&&TimerLists.get(EventGroup).length>0)
        {
            for(let z=0;z<IndividualEvent.Replace.length;z++)
            {
                for(let y=0;y<TimerLists.get(EventGroup).length;y++)
                {
                    if(IndividualEvent.Replace[z]==TimerLists.get(EventGroup)[y].Name)
                    {
                        console.log(`REPLACED A CURRENT TIMER  '${TimerLists.get(EventGroup)[y].Name}' with: ${IndividualEvent.Name}`);
                        clearTimeout(TimerLists.get(EventGroup)[y].Timer);
                        TimerLists.get(EventGroup).splice(y,1);
                        break;
                    }
                }
            }
        }
        if(TimerLists.get(EventGroup)==undefined)
        {
            TimerLists.set(EventGroup,new Array<TimerObject>())
        }
        TimerLists.get(EventGroup).push({Timer:setTimeout(IndividualEvent.CallBack, IndividualEvent.Minutes,IndividualEvent.Argument),Name: IndividualEvent.Name} );
    


},
NewBroadCastEvent:function() //some kind of object that describes the broadcast
{

//something here that is able to route the boradcast to the correct pipes, will accept discord embed simulant objects, with JSON representation for back up

}
}

