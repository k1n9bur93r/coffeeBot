

let DiscordEvent = require("./DiscordBroadcast");

let APIEvent = require("./ApiEntry");
"use strict"


interface TimerObject{Timer:ReturnType<typeof setTimeout>,Name:string}

const TimerLists = new Array();//Map();


module.exports=
{
    BEvent:class
{
    private _Name:string;
    private _Replace=[] as Array<string>;
    private _Time: number;
    private _CallBack:any;
    private _Argument:string;
    private _EventGroup:string;
    
    constructor(Name:string, Replace: Array<string>,minutes:number,callback:any,arg:string="")
    {
        this._Name=Name;
        this._Replace=Replace;
        this._Time=minutes*60000;
        this._CallBack=callback;
        this._Argument=arg;

    }

    public get EventGroup(){return this._EventGroup;}
    public get Name(){return this._Name;}
    public get Replace(){return this._Replace;}
    public get Minutes(){return this._Time;}
    public get CallBack(){return this._CallBack;}
    public get Argument(){return this._Argument;}

},
NewTimerEvent:function(IndividualEvent)
{
        if(TimerLists.length!=0)
        {
            for(let z=0;z<IndividualEvent.Replace.length;z++)
            {
                for(let y=0;y<TimerLists.length;y++)
                {
                    if(IndividualEvent.Replace[z]==TimerLists[y].Name)
                    {
                        console.log(`REPLACED A CURRENT TIMER  '${TimerLists[y].Name}' with: ${IndividualEvent.Name}`);
                        clearTimeout(TimerLists[y].Timer);
                        TimerLists.splice(y,1);
                        break;
                    }
                }
            }
        }
        if(IndividualEvent.CallBack)
            TimerLists.push({Timer:setTimeout(this.NewBroadCastEvent, IndividualEvent.Minutes,IndividualEvent.CallBack),Name: IndividualEvent.Name} );
},
NewBroadCastEvent:function(callingFunction:any) //some kind of object that describes the broadcast
{
 if(callingFunction){
    let data=callingFunction();
    if(data)
        DiscordEvent.BotChannelMessage(data,null,"755280645978325003");//process.env.broadcastChannelId);
}

},
NewBroadCast:function(message,embed=null) //this will get filled in with the channel of the OG interaction
{
    DiscordEvent.BotChannelMessage(message,embed,"755280645978325003");//process.env.broadcastChannelId)
}
}


function RemoveEventFromMap()
{

}
