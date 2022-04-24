"use strict"
let socialIO = require("./FileIO");
let SocialEvents= require("./BuisnessEvents");

export  interface SocialResponse{ Success:boolean,Message:string};
interface SocialRequest {Type:SocialGames,ID:string, Amount:number,RequestData:any}


let maxRequestAmount = 69; 

let requests = [] as Array<SocialRequest>;

enum SocialGames
{
    Drop=0
}


module.exports=
{
    CommandCoffeeDrop:function(interactionUser,amount) : SocialResponse
    {
        //see if there is a request to respond to
        for(let x=0;x<requests.length;x++)
        {
            if(requests[x].Type==SocialGames.Drop)
            {

                socialIO.AddUserCoffee(requests[x].ID,interactionUser,requests[x].Amount,"DROP");
                for(let y=0;y<requests[x].RequestData.Removals.length;y++)
                {
                   let item= socialIO.GetPlayerTransfer(interactionUser,requests[x].ID,requests[x].RequestData.Removals[y].RefID1,requests[x].RequestData.Removals[y].Amount);
                    if(item.Success==false)
                    {
                        SocialEvents.NewBroadCast(`<@${requests[x].ID}> is a loser that spent coffs that they dropped lul.`);
                    }
                }

                let message=`<@${interactionUser}> has picked up  **${requests[x].Amount}** :coffee: ${requests[x].Amount > 1 ? "s" : ""} that <@${requests[x].ID}> dropped  `;
                requests.splice(x,1);
                return {Success:true,Message:message};
            }
        }
        //there is no request, create one
        if(amount==undefined)
            return {Success:false,Message:"You need to specify how many coffees you want to drop "};
        let removalAmount;
        removalAmount=socialIO.GetBalancedRemoval(interactionUser,amount)
        if(removalAmount.CanDrop)
        {
            requests.push({Type:SocialGames.Drop,ID:interactionUser,Amount:amount,RequestData:removalAmount});
            return  {Success:true,Message:`<@${interactionUser}> has dropped **${amount}** :coffee: ${amount > 1 ? "s" : ""} on the ground! Use */drop* to pick it up!`};
        }
        else
        return {Success:false,Message:"You can not drop more coffs than you are owed"};

    }

}
   