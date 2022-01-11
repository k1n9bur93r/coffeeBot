const apiApp= require('express')();
let ApiFileIO = require("./FileIO");
let APICoinFlip = require("./CoinFlip");
module.exports={

    Initalize:function()
    {
        apiApp.listen(process.env.PORT||3000); 
    }
}


apiApp.get('/profile/:id',(req,res)=>{
    const {id}=req.params;
    let returnData=ApiFileIO.getUserProfile(id);
    res.status(200).send({
        returnData
    });
});

apiApp.get('/ledger/',(req,res)=>{
    let returnData=ApiFileIO.GetPlayerLedger()
    res.status(200).send({
        returnData
    });
});

apiApp.get('/leaderboard/',(req,res)=>{
    let returnData=ApiFileIO.GetPlayerTotals()
    res.status(200).send({
        returnData
    });
});
apiApp.get('/coinflip',(req,res)=>{
    let id=req.query.id
    let flip=req.query.flip
    let returnData=APICoinFlip.CommandSetRequest(id,flip);
    res.status(200).send({
        returnData
    });
});