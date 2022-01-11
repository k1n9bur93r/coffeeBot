"use strict"
export  interface commandObject {Name:string,Logic:{Func:any,Args:Array<string>}};
export  interface commandExecute {Func:any,Args:Array<string>};

export   interface commandArgs {UserID:string,RefID1:string,RefID2:string,amount:number,amount2:number,text:string,UIDAvatar:string,R1IDAvatar:string,UIDName:string,R1IDName:string};
