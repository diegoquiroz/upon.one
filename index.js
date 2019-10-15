if(!process.env.PORT) require('dotenv').config();
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const cry = require('crypto')
const db = require('./db.js')
const runtm = setup()
const objLogic = require('./lib/objLogic.js')//commit
var expressWs = require('express-ws')(app);
const cron = require("node-cron");
let socketRiver = {}
let roomsRegistry = {}
let socketClients = {}
var parse = objLogic.parse
var helperFunctions = objLogic.helperFunctions
var multer  = require('multer')
const sgMail = require('@sendgrid/mail')

// db.vDb.on('index', function(err) {
//     if (err) {
//         console.error('User index error: %s', err);
//     } else {
//         console.info('User indexing complete');
//     }
// });

cron.schedule("59 23 * * *", ()=>{
  cronWorker('daily')
})

cron.schedule("0 1 1 * *", ()=>{
  cronWorker('monthly')
})

cron.schedule("0 1 1 */3 *", ()=>{
  cronWorker('quaterly')
  //every march
})

cron.schedule("59 23 * * SAT", ()=>{
  cronWorker('weekly')
  //every sunday
})


cron.schedule("0 1 1 1 *", ()=>{
  cronWorker('yearly')
  //every january
})

db.vDb.watch({ fullDocument: 'updateLookup' }).on('change', sendToSocket)

app.ws('/query', livedbAddNewSocket )//livedb
app.ws('/room', connectToRoom )

app.set('subdomain offset', 0);

app.get('*', (req, res) => {

  function sendJS(file_name){
    res.set('Content-Type','application/javascript',)
    res.sendFile( __dirname + "/" + file_name )
    console.log(__dirname,file_name)
  }

  function sendFile(fileName){

    db.files.findOne({filename:fileName},(error,result)=>{

      if (!result) return res.send('default')

      res.set('content-type', result.filetype);
      // res.set('accept-ranges', 'bytes');
      res.send(result.data)
    })

  }

  let userAgent = req.get('user-agent')
  // console.log(userAgent)

  let sub = req.subdomains
  req.subdomains.length <= 1? sub = 'home' : sub = sub[sub.length -1]

  let path = req.path
  
  //first check path is working
  // console.log(req.path,req.originalUrl)

  if(path === '/favicon.ico'){
    sendFile( sub+'-favicon.ico' ) 
  }else if(path === '/manifest.json'){
    sendFile( sub+'-manifest.json' )
  }else if(path === '/apple-touch-icon'){
    sendFile( sub+'-apple-touch-icon' )
  }else if(path === '/serverination.js'){
    sendJS('serverination.js')
  }else if(path === '/loader.js'){
    sendJS('loader.js')
  }else if(path === '/telepathy.js'){
    sendJS('lib/telepathy.js')
  }else if(path === 'objlogic.js'){
    sendJS('lib/objlogic.js')
  }else if(sub === 'source'){
    sendJS('serverination.js')
  }else if(sub === 'cdn'){
    let fileName = path.replace('/','')

    //audio and images allowed
    //max size 255 kB
    //remove /from filename
    sendFile(fileName)
    
    //send images
  }else if (userAgent.indexOf('bot') !== -1) {//if google bot or any bot

    let url = sub+':'+req.path
    console.log(url,'serving bot')
    db.scrap.findOne({url:url},(error,result)=>{
      if (!result) return res.send(sub)
      //to do add link tags 
    
      let html = ` <head> ${result.head} <title> ${sub}:${result.heading} </title> </head> <body> ${result.html} </body> `
      res.send(html)
    })
  }else{
    frameHtml(res,sub)
  }
  
})


var storage = multer.memoryStorage()
var upload = multer({
 storage: storage,
 limits: { fileSize: 1048576 }//to do bytes?
 }).single('file')//limitation: large files can crash server

// ,fileFilter:fileFilter can add file filter 

let checksForUpload = {
allowedFormats: ["jpg", "png"],
transformation: [{ width: 500, height: 500, crop: "limit" }]}


function fileFilter (req, file, cb) {

  // The function should call `cb` with a boolean
  // to indicate if the file should be accepted

  // To reject this file pass `false`, like so:
  // cb(null, false)

  // To accept the file pass `true`, like so:
  cb(null, true)

  // You can always pass an error if something goes wrong:
  // cb(new Error('I don\'t have a clue!'))
}

/*
  let uploadBuffer = null
  let fileName = 'image.ico'
  fetch('image.ico').then(icon=>{ icon.blob().then(data=>{
    uploadBuffer = data 
    server.utility.upload(uploadBuffer,fileName).then(console.log)
    }) 
  })
*/



app.post('/upload',upload,(req, res) =>{

  if (!req.file) return res.send({error:'missing file'});
    
  // console.log(req.file, req.body.filename, req.body.app)
  let user = null 

  

  let name = req.body.filename
  if (!name) name = random()
  let fileName = req.body.app+'-'+name

  if(!req.body.cookie) return res.send({error:'login is required for upload'});
  
  getUserData(req.body.cookie).then(data=>{
        if (!data) return res.send({error:'login is required for upload'});
        user = data.id
        save()
  })

  function save(){


  let fileupload = new db.files({
        data:req.file.buffer,
        size:req.file.size/(1000), //a thousand bytes in 1 kb but 1024 kb is one mb
        app:req.body.app,
        owner:user,
        filename:fileName,
        filetype:req.file.mimetype,
        encoding:req.file.encoding
      })


    fileupload.save((error,doc)=>{
      if (error){

        if(error.code = 11000) {
          db.files.findOneAndUpdate({ filename:fileName, owner:user, created:true },{
            size: req.file.size/(1000),
            data: req.file.buffer,
            filetype: req.file.mimetype,
            encoding: req.file.encoding
          },{new: true, passRawResult : true},(errorUpdate,info,raw)=>{


            // console.log(raw)
            if (!raw ) return res.send({error:'permission denied for update of'+fileName})
            if (errorUpdate) return res.send({error:errorUpdate})
            res.send({code:200,url:info.filename,updated:true})
            // console.log('update uploaded'+info.filename)



          })
        }else{
          return console.log(error)
        }

      }else{
        // console.log('uploaded'+doc.filename,doc,fileName)
        res.send({code:200,url:doc.filename})
      }

      
    })//###
  }



  // return res.end('Thank you for the file');
  

})

//how to add a parameters to search

app.post('/',(req, res) =>{



  if (req.body.cookie){
    getUserData( req.body.cookie ).then(function(userObject,error){
      // console.log(userObject, req.body.cookie)
      // console.log(userObject)
      if (!userObject) return res.send({error: 'user not found' })
      if (error) return res.send(error)

      let name = null
      let about = null
      let profile = null
      let tags = []
      let id = null

      if (userObject.name) {
        name = userObject.name
      }

      if (userObject.about) {
        about = userObject.about
      }

      if (userObject.profile) {
        profile = userObject.profile
      }

      if (userObject.tags) {
        tags = userObject.tags
      }


      if (userObject.tags) {
        id = userObject.id
      }

      handlePost(req, res, {
        id:id,
        username:userObject.username,
        email:userObject.email,
        name:name,
        about:about,
        profile:profile,
        tags:tags
        },{ verificationCode: userObject.verificationCode })
    })
  }else{//if cookie exist user id is sent
     handlePost(req, res)
  }})


//check array length when putting null

//to do how to run cron for particular apps
function cronWorker(type,specificApp,callback){

  if (!type) type = 'daily'

  let query = {}
  query[type] = { '$ne': null }
  if (specificApp) query.app = specificApp

  //to do save log
  // update db

  db.law.find( query ,function(err, alltasks){

    if (err) return console.log(err)

    // console.log(alltasks)

    if (!callback)console.log('executing cron '+type)

    if (alltasks.length === 0){
      if(callback) return callback(false)
      return
    } 

    for(let task of alltasks){

      // let logforApps = [] //how to know all parse have been finished? leave it for now

      function addLog(log){//support for array

          putLogs( task.app, log ,(bool,error)=>{
            if (bool === false) return console.log(error)
          })
      }

      let allLogs = []

      let point = 0
      if (!task[type]) return
      let arrrayOfCron = JSON.parse( task[type] )


      function pushLog(data){
        allLogs.push(data+' from running cron '+type)
      }

      //to do check precode is an objet

      let preCode = null

      if (task.preCode) preCode = JSON.parse(task.preCode)

      for(let index of arrrayOfCron){

          handleParse({log:pushLog, app:task.app, preCode:preCode , parse:index, type:'action', database: JSON.parse(task.DBs) }).then((data)=>{



          if (data.error){
             pushLog(data.error)
            data = data.error
          }else{
            pushLog(data.length+' affected')
          }

          

          point += 1

          if (point >= arrrayOfCron.length){
            addLog(allLogs)
            if (callback) callback(allLogs)
          }  //all taks from array completed
          

        })



      }





      
    }
    
  })
}

/*
let rooms = roomTitle -> rooms -> (
full -> roomName -> clients ,
notFull -> roomName -> clients
,limit) 

user A connects, check if rooms[appname+_+roomTitle] exist!
if it does loop through rooms[appname+_+roomTitle].notFull 
add itself to it 
if client.length is >= rooms[appname+_+roomTitle].limit put the room to full and delete it from notFull

when user A sends a message to room roomTitle with roomToken 'something'
check if rooms[appname+_+roomTitle] exist!
find room token in both full and not full, if it exist check that user is a member, if so loop through all the clients and send them a message


*/

function arrayHas(array,value){
  for (let index of array){
    if (index === value) return true
  }

  return false
}

function connectToRoom(ws,req){ // socket connection for rooms

  var clientId = random()

  function leftRoom(room,key){
      broadcast(room,socketClients[clientId].user,'onleave',key)
  }

  ws.on('close', function(req){
 
    //to do if user doesnot exist fallback, broadcast a leave message, on error
    //to remember: remove key can handle both array and object




    for (let key in roomsRegistry){

      for (let room in roomsRegistry[key].full){

        //remove client from full instance, remove instance from full and and add it not full

        if ( roomsRegistry[key].full[room].clients.includes(clientId ) ){

          removeFromBuilding('full',key,room)
          //because currently room is full if anyone leaves the room it will become empty


        }else{
          // console.log( roomsRegistry[key].full[room].clients[clientId] )
        }

      }

      
      for (let room in roomsRegistry[key].notFull){

        if ( roomsRegistry[key].notFull[room].clients.includes( clientId) ) {
            removeFromBuilding('notFull',key,room)
        }
      }

    }

    socketClients = removeKey(socketClients,clientId)

  })

      //remove user from all the room
    function removeRoomFromFullAddToNotFull(label,uniqueKeyOfRoom){
      roomsRegistry[label].notFull[uniqueKeyOfRoom] = roomsRegistry[label].full[uniqueKeyOfRoom]
      roomsRegistry[label].full = removeKey(roomsRegistry[label].full,uniqueKeyOfRoom)
      leftRoom(uniqueKeyOfRoom,label)
    }

    //there are two kinds of room in the building full and notFull
    function removeFromBuilding(kind,label,uniqueKeyOfRoom){
      roomsRegistry[label][kind][uniqueKeyOfRoom].clients = removeKey(roomsRegistry[label][kind][uniqueKeyOfRoom].clients,clientId)

      kind === 'full'? removeRoomFromFullAddToNotFull(label,uniqueKeyOfRoom) : leftRoom(uniqueKeyOfRoom,label)
    }

    function leaveRoom(label,uniqueKeyOfRoom,newRoom){

      if (!roomsRegistry[label]) {
        return sendError(label+' label is invalid',newRoom)
      }

      if (roomsRegistry[label].full[uniqueKeyOfRoom]){
        removeFromBuilding('full',label,uniqueKeyOfRoom)
      }else if(roomsRegistry[label].notFull[uniqueKeyOfRoom]){
        removeFromBuilding('notFull',label,uniqueKeyOfRoom)
      }

    }

    function sendError(errorMessage,label){
      ws.send( stringIt({type:'onerror', data:errorMessage, token:label}) )
    }
    //type getRoomToken
    // to do solve conflict of name query socket connection
    //limit defined by user
  ws.on('message', function(msg){


    msg = JSON.parse(msg)
    let roomLimit = 2
    // let roomId = msg.token
    let roomLabel = msg.app+'_'+msg.token //msg token is hotel name
    let roomToken = null
    if (msg.broadcastToken) roomToken = msg.broadcastToken 
    if (msg.limit) if(msg.limit >= 2) roomLimit = msg.limit

    //what if where is not defined in update

  //the update function does not gives the update doc?

    //user can connect to multiple rooms the front end functions are mapped to 
    if (msg.purpose == 'join'){
      createOrAddToRoom()
    }else if(msg.purpose == 'broadcast'){
      // console.log('broadcasting')
      broadcast(roomToken,msg.content,'onmessage',roomLabel)
    }else if(msg.purpose == 'change_room'){




      //to do save from crash not defineed
      if (!msg.currentRoomLabel || !msg.unique || !msg.newToken) return sendError('required values missing')
      leaveRoom(msg.app+'_'+msg.currentRoomLabel, msg.unique, msg.newToken)

      // console.log('leaving room',msg.currentRoomLabel,'unique',msg.unique)
      roomLabel = msg.app+'_'+msg.newToken
      createOrAddToRoom()

    }else if(msg.purpose == 'leave'){

      if (!msg.currentToken || !msg.unique ) return sendError('required values missing')

      leaveRoom(msg.app+'_'+msg.currentToken,msg.unique )
    }


    

    //why one to one does not exist? because it can be created with room with limit 2

    function createOrAddToRoom(){

      if(!socketClients[clientId]){

        //if user does not exist
        return getUserData( msg.cookie ).then(function(userObject,error){//what if cookie is invalid
          if (error) return sendError('invalid cookie')
          socketClients[clientId] = {user:{id:userObject.id, username:userObject.username}, socket:ws}

          createOrAddToRoom()
        })

        
      }

      //also broadcast on join and leave and also joined member
      // console.log(clientId,'creating room or adding:'+roomLabel)
      function createRoom(){
        roomToken = random()
        roomsRegistry[roomLabel].notFull[roomToken] = {clients:[],limit:roomLimit}
        roomsRegistry[roomLabel].notFull[roomToken].clients.push(clientId)
      }

      if (!roomsRegistry[roomLabel]){ //room not constructed 
        roomsRegistry[roomLabel] = { full:{},notFull:{} }
        createRoom()
      }else{

        if ( ObjectLength(roomsRegistry[roomLabel].notFull) === 0 ) {
          createRoom()
        }else{

          roomToken = Object.keys(roomsRegistry[roomLabel].notFull)[0]
          roomsRegistry[roomLabel].notFull[roomToken].clients.push(clientId)
          broadcast(roomToken,socketClients[clientId].user,'onjoin',roomLabel)

          let notFullRoomLimit = roomsRegistry[roomLabel].notFull[roomToken].limit
          let membersCountOfNotFull = roomsRegistry[roomLabel].notFull[roomToken].clients.length

       

        // if(membersCountOfNotFull > notFullRoomLimit) console.log('limit exceeded', membersCountOfNotFull, notFullRoomLimit)

        if(membersCountOfNotFull === notFullRoomLimit){
          roomsRegistry[roomLabel].full[roomToken] = roomsRegistry[roomLabel].notFull[roomToken]
          roomsRegistry[roomLabel].notFull = removeKey(roomsRegistry[roomLabel].notFull,roomToken)
        }

        }

      }

      broadcast(roomToken,null,'onopen',roomLabel)

    }

   })
  //add coments and decrease code
  // roomArgToken room name, roomLabel key
  function broadcast(roomArgToken,content,type,roomLabel){// room label is the type of room and roomArgToken is unique id of room which can be full or not full

      let token = roomLabel.split('_')[1]

      let broadcastTo = null
      try{
        broadcastTo = roomsRegistry[roomLabel].notFull[roomArgToken] === undefined ? roomsRegistry[roomLabel].full[roomArgToken] : roomsRegistry[roomLabel].notFull[roomArgToken] 
      }catch(e){
        return ws.send( stringIt({error:roomArgToken+' room not found in '+roomLabel+'to broadcast'+e}) )
      }

      let members = []

      if (!broadcastTo) return ws.send( stringIt({ unique:roomArgToken, token:token, type:'onerror', data:'invalid unique' }))

      for (let index of broadcastTo.clients){

        members.push( socketClients[index].user )
      }

      if (type == 'onopen')  return ws.send( stringIt({ unique:roomArgToken, token:token, members:members, type:type }))


      for (let index of broadcastTo.clients){
        if (index !== clientId) socketClients[index].socket.send( stringIt({unique:roomArgToken, members:members, token:token, sender:socketClients[clientId].user, data:content, type:type }) )
      }

  }
}

//comparison between making two queries and less code vs better code but might be slower

function livedbAddNewSocket(ws, req){ //live db


  var clientId = random()

  ws.on('close', function(req){
    // console.log('closed',uuid.v4(),clientId)
    socketClients = removeKey(socketClients,clientId)

    for (key in socketRiver){
      socketRiver[key].clients = removeKey(socketRiver[key].clients,clientId)
    }
    
  })

  //dbs->clients->tokens->query and socket

  //when a chnage happens the above object is climbed and data is sent to appropriate socket

  //two client id can have the same username as a user can have two instances running

  ws.on('message', function(msg){ //either update the request or make a new connection

    msg = JSON.parse(msg)
    // console.warn(msg,'query')
    if (!msg.query) return ws.send( stringIt({type:'onerror', token: msg.token,data:'error msg query not given'}) )
    if (!msg.query.on) return ws.send( stringIt({type:'onerror',token: msg.token,data:'error the databse to look into not given at "on" '}) ) 
    if (!msg.token) return ws.send( stringIt({type:'onerror', data:'error token required, query'+JSON.stringify(msg) })  )

    var dbName = msg.query.on

    function tokenUpdater(){//why was I returning that error
      if (!socketRiver[dbName]){
          socketRiver[dbName] = {clients:{},format:{}}
          getDbRules(proceed)
          // console.log('creating new db socket entry')
        // return ws.send( stringIt({type:'onerror', token:msg.token ,data:'db no query live '+dbName})  )
      }

      socketRiver[dbName].clients[clientId].token[msg.token] = msg.query
    }

    if (msg.purpose === 'update') return tokenUpdater()
    


    socketClients[clientId] = {user:null,socket:ws} //user is not required for live db

    
    //db -> schema, clients-> (user,token -> query)
    //to do dbnames can contradict if changed in real time

    if (!socketRiver[dbName]){
      socketRiver[dbName] = {clients:{},format:{}}
      getDbRules(proceed)
    }else{
      proceed()
    }

    function getDbRules(callback){
      db.law.find({app:msg.app},function(err, info_main){

          if (err)  return console.log(err)

          //to do make it error detectable
          if (info_main.length === 0) return  ws.send( stringIt({token: msg.token,data:'error database not found '+dbName}) )
          var database = JSON.parse(info_main[0].DBs)
          socketRiver[dbName].format = database[dbName]
          
          callback()
      })      
    }

    function proceed(){

      //add new client does not matter if the same computer or another computer
      if (!socketRiver[dbName].clients[clientId]) socketRiver[dbName].clients[clientId] = {user:{},token:{}}
 

      socketRiver[dbName].clients[clientId].token[msg.token] = msg.query  

      // to do meta api send meta data
      getUserData( msg.cookie ).then(function(userObject,error){
          if (error) return  ws.send( stringIt({error:error}) )
          // if (!userObject) return  ws.send( stringIt({token: msg.token,data:'user not found'}) )
        //when ever you make change to the db restart the server

          socketRiver[dbName].clients[clientId].user =  {id:userObject.id, username:userObject.username} 
      })
    }


  });
}

function sendToSocket(next){
  //next


// if one thing is mismatched

//how or works if any of the thing matches return false


  let data = next.fullDocument
  let type = next.operationType

  //match is the where and data 

  function matchQuery(where,data,type){

    // console.log('to match',where,data )

    for (key in where){

      
      // console.log( check(),key,where,data )
      //we need to make recheck a function

      if(type === 'or'){
        if ( check() === true ) return true
        //if anything matches return true
      }else if(type === 'and'){
        if ( check() === false) return false
        //if any of them where element not match return false
      }else{
        //for extending feature
        throw Error('invalid type')
      }



      function check(){

        if (key === 'or') {
          return matchQuery( where[key] ,data,'or')
        }else if( key === 'and'){
          return matchQuery( where[key] ,data,'and')
        }else{
          return (where[key] === data[key])
        }


      }




    }

    return true // for and query
  }

  if (!data) return console.log(' document deleted manually ')

  let dbName = data.dbName
  let appName = dbName.split('_')[0]
  dbName = dbName.split('_')[1]

  if(!socketRiver[dbName]) return console.log('no socket is looking for this query',socketRiver)
  let dataFormat = socketRiver[dbName].format
  let clients = socketRiver[dbName].clients

  // console.log('data before removing',data)

  data = renameOutput(data,dataFormat.memoryAllocation,addUniquePrefix(data.dbName))
  
  // console.log('data after removing',data)

  // console.log(data)

  function checkPermission2(user,onSuccess){
    // console.log('checking permissions')

    if (!dataFormat.permission) return onSuccess()
    if (!dataFormat.permission.read) return onSuccess()
    let permissionToDatabase = dataFormat.permission.read


    //send logs too//it does not need log
    handleParse({app:appName, parse:permissionToDatabase, field:data, failure:console.log, database:theDB, user:user}).then(
            function(data){
              data === true? onSuccess() : console.log('permission denied')
            })
  }


  let theDB = {}
  theDB[dbName] = dataFormat

  for (let clientId in clients){
    for(let token in clients[clientId].token){



      function sendToClient(){//why it was on open
        socketClients[clientId].socket.send( stringIt( {token:token,data:data,type:'ondata',operationType:type} ) )
      }


      // console.log('matching',clients[clientId].token[token].where,data ,clients[clientId].user,'checkPermission2',matchQuery(clients[clientId].token[token].where , data ,'and'))

      if (matchQuery(clients[clientId].token[token].where , data ,'and') === true){
     
        
        checkPermission2(clients[clientId].user,sendToClient)

      }
    }
  }
}


function handleParse(prop,range){

  
  let userData = prop.user
  let appName = prop.app
  if (!prop.field) prop.field = null //for premission checking or update's put can take input from $field  
  if (!prop.put) prop.put = null
  if (!prop.type) prop.type = 'api' //obey permission or not
  if (!prop.success) return new Promise(resolveHandleParse=>{
    if (!prop.failure) prop.failure = resolveHandleParse
    doParse(resolveHandleParse,prop.failure)
  })

  if (!prop.failure) prop.failure = prop.success

  doParse(prop.success,prop.failure)

  function doParse(success,failure){


    let rangeToFeed = parseScope(prop.field, prop.put, prop.user, prop.type)
    if (range) rangeToFeed = range


    if (prop.preCode) {

        let wantRange = true
        rangeToFeed.via = 'action'//this code will have authorized permission
        parse(prop.preCode, rangeToFeed, 'wantRange').then(newRange=>{

          prop.preCode = null //so it won't calculate the new range again
          newRange.via = 'action'
          handleParse(prop,newRange) //it will have success and failure parameter same as the original one just the failure of precode is also attached

        }).catch(err =>{

          if (err) err = err.message
          failure({error:err})

        })

      return
    }


    //code before this had range with via = action which involves precode and the code after this will be apis
    let newAddress = random()
    rangeToFeed[newAddress] = {parent:rangeToFeed, global:rangeToFeed.global, via:'api' }
    //everything after this will we api
    rangeToFeed = rangeToFeed[newAddress]



    parse(prop.parse, rangeToFeed ).then(response=>{

      success(response)//also pass in range
    }).catch(err =>{
      console.log(err,prop.parse,rangeToFeed,prop)
      failure({error:err.message})
    })


  }  



  function parseScope(field,put,userData,via){

            return new class extends helperFunctions{
              constructor(){
                
                //where is global defined

                super()

                this.global = this //is it right to declare global at this place cause if a range is not loaclized it would not have global
                this.field = field//for permission check
                this.put = put//for permission check
                this.via = via
                this.app = appName
                this.date = Date.now()
                this.user = userData
                this.random = random
                this.read = this.read.bind(this)
                this.write = this.write.bind(this)
                this.update = this.update.bind(this)
                this.erase = this.erase.bind(this)
                this.log = this.log.bind(this)

                if(prop.log) this.logs = prop.log
              }


              log(string){
                // console.log(string,'loggin')
                if (this.logs) this.logs.push(string)
                return string
              }payToUser(obj,range){


                return new Promise(resolve=>{

                  if(range.via !== 'action') throw Error('pay function is reserved for only serverside action for making transaction from app to user')

                  let type = 'a2u'
                  let receiver = obj.receiver
                  let amount = obj.amount

                  if (!receiver) throw Error('receiver not declared')
                  if (!amount) throw Error('amount not declared')

                    checkBalance(range.global.app,'app').then(balance=>{

                      if (balance < amount) throw Error('receiver not declared')

                      //to do fees order id
                      //to do range global app
                      //to do range global via

                      var pay_save = new db.transactions({
                              amount:amount,
                              type: 'u2a',
                              meta:'fees',
                              app:range.global.app,
                              orderID:random(),
                              sandboxed:testMode,
                              status: 'paid'
                            })

                      pay_save.save((error,transaction)=>{
                        if (error) throw Error(error)
                        resolve(transaction)
                       })


                    })
                })
              }checkBalance(obj){

                return new Promise(resolve=>{

                    if (!userData) return res.send({error:'login required'})

                    

                    let receiver = userData.id
                    let type = 'user'

                    if (obj.ofApp === true){
                      receiver = range.global.app
                      type = 'app'
                    } 

                    checkBalance(receiver,type).then(data=>{
                      resolve(data)
                    })

                })
              }

              checkSign(obj){

                //do throw error on all helper functions
                return new Promise(resolve=>{
                  db.transactions.findOne({ orderID: obj.id },(error,result)=>{
                    if (error) console.log(error)

                    if (!result) throw Error('invalid transaction id')
                    if(result.type === 'paypal') throw Error('invalid transaction id')
                    if(obj.mode !== 'testing' && result.sandboxed === true) throw Error(' sandboxed transaction given ')

                    result.signed === false? resolve(false): resolve(true)
                    
                  })
                })

              }

              //to do check source
              signTransaction(obj){
                let transactionId = obj.id
                //to do fix promise spelling
                //do throw error on all helper functions
                return new Promise(resolve=>{
                  db.transactions.findOneAndUpdate({_id:transactionId},{signed:true},(error,result)=>{
                    if (error) console.log(error)
                    if (!result) throw new Error('invalid transaction id')
                    result.signed === false? resolve(false): resolve(true)
                    
                  })
                })
              }findUser(usernameOrid){


                return new Promise(resolve=>{

      

                  if(!usernameOrid) throw Error('$findUser '+typeof usernameOrid)


                  extractUserData(usernameOrid).then(data=>{
                    if (!data) return resolve(null)

                    
                    resolve({ id:data.id,
                    username:data.username,
                    profile:data.username,
                    profile:data.profile,
                    about:data.about,
                    interest:data.interest })
                  })

                })
              }findUsers(arrrayOfusers,range){
                return new Promise(resolvePay=>{
                  let allusers = {}

                  if (!Array.isArray(arrrayOfusers) )throw Error('$findUsers expects an arrray') 

                    async function loop(){
                      
                      for(let index of arrrayOfusers){
                        allusers[index] = await range.global.findUser(index)
                      }
                      
                      return allusers
                    }

                    loop().then(resolve)
                })
              }email(obj){

                return new Promise(resolve=>{
                  sendEmail(obj.to, obj.content,obj.subject,resolve)
                })
              }

              async search(par,range){
                var queryOu = await handleQuery('search',par,range.via,this)
                return queryOu
              }countNotifications(type,range){

                return new Promise(resolve=>{
                  //to do define app name automatically for security



                  let query = {receiver:userData.id, seen:false}

                  if (type === 'old') query.seen = true

                  if ( range.global.app !== 'home') {
                    query = Object.assign(query, {app:range.global.app})
                  }

                  db.action.countDocuments(query, function(err, info){
                    resolve(info) 
                  })
                })
              }sendNotification(object,range){

                //send notification takes in object



                  return new Promise(resolve=>{

                    sendNotification(object,userData.id,range.global.app).then(resolve)

                  })



              }readNotifications(limit,range){

                return new Promise(resolve=>{

                  let query = {receiver:userData.id, seen:false}

                  if ( range.global.app !== 'home') {
                    query = Object.assign(query, {app:range.global.app} )
                  }

                  //note second parameter in find is the columns to return

                  

                  db.action.find(query,null,{sort:{created_at:-1},limit:limit},function(error,info){


                    if (error) throw Error(error)//to do crash the server

                    // we can combine but we will get efficiency at the cost of time 
                    





                    

                    async function getUsernameOfAllSender(){
                      let newIndex = []
                      for(let index of info){
                        let senderData = await getUserData(index.sender,'id')

                        // console.log(index,'senderData')


                        //to do remove reference and make a split -|

                        let referenceUnique = index.reference.split(':')
                        let referenceDb = index.reference[0]

                        referenceDb = referenceDb.split('_')[1] //to do documet format appname_dbname:unique

                        referenceUnique = referenceUnique[1]
                        

                        newIndex.push({

                          type:index.type,
                          sender:{id:senderData.id, username:senderData.username, profile:senderData.profile},
                          reference:{unique:referenceUnique, db:referenceDb},
                          official:index.official,
                          message:index.message,
                          created_at:index.created_at
                        })


                        db.action.findOneAndUpdate({_id: index.id},{seen:true},{returnOriginal : false},function(error, doc){
                          console.log('marked seen')
                        })

                      }

                      resolve(newIndex)
                    }


                    getUsernameOfAllSender()

                  })



                })
              }async write(par,range){
                //par contains write on what database and what values to put
                var queryOu = await handleQuery('write',par,range.via,this)  
                return queryOu
              }async read(par,range){

                // throw new Error('error  does not exist in raniable name:')
                var queryOu = await handleQuery('read',par,range.via,this)
                return queryOu
              }async update(par,range){
                var queryOu = await handleQuery('update',par,range.via,this)
                return queryOu
              }async erase(par,range){
                var queryOu = await handleQuery('erase',par,range.via,this)
                return queryOu
              }async follow(toFollow,range,contentId){

                if (typeof toFollow === 'object' || typeof toFollow === 'array') throw Error('wrong input for follow '+typeof toFollow)
                //to do abstract follow and like as the same

                try{
                  return await followOrLike(toFollow,'follow',range.global.app)
                }catch(error){
                  throw Error(error.message )
                }
                
              }async like(content,range){



                let contentId = content.unique
                let dbName = content.db

                if (typeof contentId === 'object' || typeof contentId === 'array') throw Error('wrong input for like '+typeof contentId)
                if (!contentId || !dbName) throw Error('parameter error on like function: '+JSON.stringify(content) )

                try{
                  contentId = addUniquePrefix(range.global.app+'_'+dbName, contentId)
                  return await followOrLike(contentId,'like',range.global.app)
                }catch(error){
                  throw Error(error.message )
                }         
                
              }checkFollow(person){
                // var person = typeof obj === 'object' ? obj.of : obj 

                return new Promise(resolve=>{

                  let actionId = 'follow:'+userData.id+':'+person

                  db.action.findOne({ actionId:actionId },
                    function(err, info_main){
                      if (err) throw Error(err)

                        if (info_main) {
                          resolve(true)
                        }else{
                          resolve(false)
                        }

                    } 
                  )
                })
              }checkLike(content,range){
                // var contentId = typeof obj === 'object' ? obj.on : obj 

                return new Promise(resolve=>{


                  let contentId = content.unique
                  let dbName = content.db
                  contentId = addUniquePrefix(range.global.app+'_'+dbName,contentId)
                  //yes userdata
                  let actionId = 'like:'+userData.id+':'+contentId

     

                  db.action.findOne({ actionId:actionId },function(err, info_main){

                    if (err) throw Error(err)
                    if(!info_main) return resolve(false)
                    return resolve(true)

                  })

                })
              }followings(person){
                // var person = obj.of
                return followList(person,'followings')
              }followers(person){
                // var person = obj.of
                return followList(person,'followers')
              }countFollowings(person){
                // var person = obj.of
                return count(person,'following')
              }countFollowers(person){
                // var person = obj.of
                return count(person,'followers')
              }countLikes(content){ //make it small

                  let contentId = content.unique
                  let dbName = content.db
                  contentId = addUniquePrefix(range.global.app+'_'+dbName, contentId)
                
                // var contentId = obj.on
                if (!contentId) throw Error('of parameter undefined on $countlikes')


                return new Promise(resolve => {

                    db.action.countDocuments({type:'like',reference:contentId}, function(err, info){
                      // console.log('like count: '+info)
                      if (!info) return resolve(0)
                      resolve(info)
                    })

                })
              }


            }
  }


  async function followOrLike(id,type,app){

      // console.log(app)

      if (!id) throw Error('parameter error')


        let endPart = id//content id for like
        let receiver = id//content id for like
        let contentId = null

        if (type !== 'follow' && type !== 'like') throw Error(' invalid type')

        if(type === 'follow'){

          let receiverData = await extractUserData(id)
          if (!receiverData) throw Error(`receiver not found `)
          endPart = receiverData.id
          receiver = receiverData.id

        }else{

          contentId = id

          //we need to add unique prefix
          let content = await db.vDb.findOne({unique:contentId})

          //we need to find the writer to make a notification
          console.log(contentId)
          if (!content) throw Error('invalid id of content')
          receiver = content.registered_writer_field//what if writer doesn't exist
          if (!receiver) throw Error('author not found') 

        }


      
        function executeSave(){
          return new Promise(resolve=>{
             let actionId = type+':'+userData.id+':'+endPart

            var act = new db.action({
              sender:userData.id,
              receiver:receiver,
              type:type,
              actionId:actionId,
              app:app,
              reference:contentId,
            })

            act.save(error=>{

              if (!error) return resolve( {status:true, id:id, type:type} )//following

              if(error) {
                
                if(error.code = 11000){

                  db.action.deleteOne({actionId:actionId},
                   err=> {

                    if (err) return resolve({error:err})

                    resolve( {status:false, id:id, type:type} ) //unfollowed

                   } 

                   )
                }else{
                  console.log(error)
                }

                
              }
            })
                   
          })
        }


        let savedResult = await executeSave()

        return savedResult

  }

  //before following or liking check if recever id is given and use @convention

  function handleQuery(type,par,via,parentRange){

          return new Promise(resolve=>{


              //name this thing
              if (type === 'write' && par.where) throw Error("I am not that smart but where doesn't makes sense when in $write")

              //to do make all 

              var DBName = par.on
              var databaseSchema = prop.database
              var theDatabaseInfo = databaseSchema[DBName]

              if ( (type === 'update' || type === 'read') && !par.where)  return resolve({error:'where field not given'})



              //app name cant be changed
              // console.log(databaseSchema,'database')
              // console.log(databaseSchema)
              if (!theDatabaseInfo) return resolve({error:'Check DB name'})
              if (!theDatabaseInfo.memoryAllocation) return resolve({error:'Check Memory allocation not found'})

              if (!par.put) par.put = null

              // console.log('processing query')//appname doesn't exist
              let fullDbName = appName+'_'+DBName
              let uniquePrefix = addUniquePrefix(fullDbName)


              var relation = theDatabaseInfo.memoryAllocation
              var putQuery = {}
              var writeQuery = {dbName:fullDbName}
              var whereQuery = {dbName:fullDbName}

              

              prepareQuery(par.put,par.where).then(function(QQQ){

                putQuery = QQQ.put
                writeQuery = Object.assign(writeQuery,QQQ.put )//to do what if is a read we are giving undefined variable or stopping the execution in case of node js update
                whereQuery = Object.assign(whereQuery,QQQ.where )
                
                executeQuery()
              })

              async function prepareQuery(put,where){
                // console.log('processing query 1')
                const newPut = await renameInput(par.put)


                const newWhere = await renameInput(par.where)
           
                
                return{put:newPut,where:newWhere}
              }

              //Note: why is field value not available to write, read and update parse: because it doesn't needs one it is only required for the permission parse as no one will say write $writer or read where $writer = user id they can just use the field name
              //exception: it is available for update put query 
              

              async function renameInput(interfaceObject,internallyCalled,whereOrPut){

                // console.log(interfaceObject)

                var schemaObject = {}

                // console.log(interfaceObject)

                if(interfaceObject){
                  if (interfaceObject['_id']) schemaObject['_id'] = interfaceObject['_id']
                  if (interfaceObject['id']) schemaObject['_id'] = interfaceObject['id']
                }

                if(interfaceObject) for(let key in interfaceObject){
                  
                  if(key === 'or' || key === 'and'){

                    if(! Array.isArray(interfaceObject[key])  ) throw Error('an Array was expected for '+key)

                    let queryArray = []

                    for(let index of interfaceObject[key]){
                      queryArray.push( await renameInput(index,true) )
                    }
                    schemaObject['$'+key] = queryArray

                  }else if(relation[key]){

                    schemaObject[ relation[key] ] = interfaceObject[key]

                  }else{
                    // console.log(interfaceObject, internallyCalled)
                    throw Error('invalid key '+key)
                    //it was not caught, //to do how to abort
                  }

                }
               


                //if default value exist and value is not assigned
                if(type === 'write' && !internallyCalled){
                  //it is called one more time for the where query


                  for(let key in relation){



                    if( schemaObject[ relation[key] ] ) continue

                    let defaultValue = theDatabaseInfo.schema[key].default

                    
                      //cautious 
                      if (defaultValue !== undefined){
                      
                          //the default value could also we a function
                          const parsedWriteObject = await handleParse({log: parentRange.logs ,app:appName, parse:defaultValue, put:par.put, failure: resolve, database:databaseSchema, user:userData})
                          schemaObject[ relation[key] ] = parsedWriteObject
     
                  
                          
                      }else{
                        //why do this?
                        // schemaObject[ relation[key] ] = null
                      }


                  }
                }

                //if I remake the whole object I wont be able to check if all the values of relation are provided 

                //Generate unique string 
                //in the put query if uniqe doesn't exist, if it exist
                //if this is a write request?
                if (!schemaObject['unique'] && type === 'write' && !internallyCalled){
                  schemaObject['unique'] = Math.random().toString(36).substring(2, 15)+Math.random().toString(36).substring(2, 15)
                }



                if(schemaObject['unique']){

                  let valueUnique = schemaObject['unique']
                  if( valueUnique.indexOf(uniquePrefix) !== -1 ) throw Error('not permitted unique value: '+valueUnique)

                  schemaObject['unique'] = addUniquePrefix(fullDbName,schemaObject['unique'])
                }

                if (type === 'write' && !internallyCalled){
                  schemaObject['registered_writer_field'] = userData.id
                }

                //input is renamed
               

                return schemaObject
              }

              function checkPermission(row,onSuccess,onFailure){

                if(!theDatabaseInfo.permission)return onSuccess(true)
                var permissionToDatabase = theDatabaseInfo.permission[type]
                if(!permissionToDatabase)return onSuccess(true)

                handleParse({log: parentRange.logs ,app:appName, parse:permissionToDatabase, put:par.put, field:renameOutput(row,relation,uniquePrefix),  success:parseSuccess, failure: resolve, database:databaseSchema, user:userData})

                function parseSuccess(data){
                  if(data === true){
                    return onSuccess(true)
                  }else{
                    if(onFailure) onFailure(data)
                    // console.log('unexpected permission code: '+data)
                  }
                }

              }

              function loop_RenameOutput_Resolve(info_read){
                let data = []
                if (info_read.length === 0) return resolve(data)
                for(let index of info_read){
                  data.push( renameOutput(index,relation,uniquePrefix) )
                }
                resolve(data)
              }
              
              function loopPremissionCheck(info_read,callback){
   
                if (info_read.length === 0) return callback(info_read)
                var filteredRows = []
                let loopStep = 0
                permissionLoopChecker()

                function permissionLoopChecker(){

          
                  function readAllowed(){
                    filteredRows.push( renameOutput(info_read[loopStep],relation,uniquePrefix) )
                    CheckEndOrIncrement()
                  }

                  function readNotAllowed(error_read){//break even if one of the row is out of scope
                    return failure(error_read)
                  }

                  function CheckEndOrIncrement(){

                          loopStep++
                          if (loopStep >= info_read.length){
                            return callback(filteredRows)
                          }else{
                            permissionLoopChecker()
                          }
                  }

                  checkPermission(info_read[loopStep],readAllowed,readNotAllowed)

                }
              }

              function failure(failureData){
                return resolve({error:'permission denied',errMsg:failureData})
              }

              function executeQuery(){


                let requiredFields = {}
                let unMutableFields = {}

                for (key in theDatabaseInfo.schema){
                  if (typeof theDatabaseInfo.schema[key] !== 'object') continue
                  if (theDatabaseInfo.schema[key].required == true) requiredFields[ relation[key] ] = key
                  if (theDatabaseInfo.schema[key].mutable == false) unMutableFields[ relation[key] ] = key
                }

                function requiredMutableFieldCheck(queryToCheck,just){

                    for (key in unMutableFields){ //only actions can do mutation
                      if (queryToCheck[key]) throw Error('field '+unMutableFields[key]+' is not mutable')
                    }

                    if (just === 'mutation') return

                    for (key in requiredFields){
                      if (!queryToCheck[key])  throw Error('required field '+requiredFields[key]+' missing')
                    }
                }


                //get requored field


                switch(type.toLowerCase()){
                  case 'write':


             
                   //make rank unmutable

                    function writeFunction(){
                      // console.log(writeQuery)
                      var vr_schema = new db.vDb(writeQuery)
                      // console.log(writeQuery)
                      vr_schema.save((error,writenObj)=>{
                        if (error) return resolve( {error:error} )
                        return resolve(renameOutput(writenObj,relation,uniquePrefix))
                      })
                    }

                    if(via === 'action') return writeFunction()


                    requiredMutableFieldCheck(writeQuery)
                    checkPermission(null,writeFunction,failure)


                    break
                  case 'update':
                    db.vDb.find(whereQuery, function(err, info_read){
                      if (err) return resolve( {error:err} )

                        // console.log(info_read,'to update',whereQuery)

                      //if put query has a parameter which is a function

                      // console.log(whereQuery)

                      if (info_read.length === 0) return resolve({error:info_read+' field not found to update '})
                      if(via === 'action') return loopUpdate(info_read)
                      requiredMutableFieldCheck(putQuery,'mutation')
                      loopPremissionCheck(info_read,loopUpdate)
                    })

                    async function loopUpdate(filteredRows){

                        if (filteredRows.length === 0 ) return resolve( {error:"permission denied"} )
                        var updatedRow = []
                        for (let index of filteredRows){
                          let updateRow = await listUpdate(index)
                          updatedRow.push(updateRow)
                        }


                        resolve(updatedRow)                      
                    }

                    async function parsePutQuery(field){
                      let parsedPutQuery = {}

                      for (let key in putQuery){

                        if (typeof putQuery[key] === 'object'){

                          function errorOccured(error){
                            throw Error(error)
                          }

                          //to do give log to handle parse in action
                          // console.log('parsing',putQuery[key],renameOutput(field,relation))
                          parsedPutQuery[key] = await handleParse({log:parentRange.logs, app:appName, parse:putQuery[key], field:renameOutput(field,relation,uniquePrefix), failure:errorOccured ,database:databaseSchema, user:userData})
                           
                          continue
                        }

                        parsedPutQuery[key] = putQuery[key]
                      }

                      // console.log(parsedPutQuery,'parsedPutQuery')

                      return parsedPutQuery
                    }

                    function listUpdate(obj){
                      return new Promise(resolve=>{

                          parsePutQuery(obj).then(parsedPutQuery=>{

                              // console.log(obj.id,parsedPutQuery)

                              db.vDb.findOneAndUpdate({_id: obj.id},parsedPutQuery, {new: true} ,function(error, doc){
                                if (error) return resolve( {error:error} )
                                // console.log(doc,'updated doc')
                                return resolve( renameOutput(doc,relation,uniquePrefix) )
                              })

                          })




                      })
                    }

                    break
                  case 'read':
                    
                    let sortBy = {sort:{}, limit: 50}
                    let sortOrder = 1

                    let sortAccordingTo = 'created_at'
                    //accesding or decending
                    let relationObject = relation

                    if (par.limit) sortBy.limit = par.limit

                    if (par.sort) {

                      if (!par.sort.by) return resolve({error:'sort field not declared'})
                      if (!relationObject[ par.sort.by ]) return resolve({error:'sort field '+par.sort.by+' not declared'})
                      if (par.sort.order) sortOrder = par.sort.order
                      sortAccordingTo = relationObject[par.sort.by]
                      
                  
                    }

                    sortBy.sort[sortAccordingTo] = sortOrder 
                    // if(par.sort && relationObject[par.sortBy]) sortAccordingTo = relationObject[par.sort.by] //sort according to which field
                    
                    
                    // sortBy.sort[sortAccordingTo] = sortType// null, {sort: {date: 1}}

                    // console.log('sorting by..',sortBy)

                    db.vDb.find(whereQuery,null,sortBy,function(error, info_read){
                      if (error) return resolve( {error:error} )

                      if(via === 'action') return loop_RenameOutput_Resolve(info_read)

                      loopPremissionCheck(info_read,resolve)
                    })
                    break
                  case 'erase':
                    // db.vDb.deleteOne(newQueryInput, function(err) {
                    //   if(!err) resolve(true)
                    // })
                    break
                  case 'search':
                    //##
                    db.vDb.find( {$and:[ {'$text': {'$search': par.for} },{dbName:appName+'_'+DBName}
                      ]} ).limit(10).exec((error, info_read)=>{
                        
                        if (error) return resolve( {error:error} )
                        if(via === 'action') return loop_RenameOutput_Resolve(info_read)
                        loopPremissionCheck(info_read,resolve)

                      })
                    break                           
                }
              }

              //to do: bug: undefined value makes the whole filterrow undefined
          })
  }

  function count(person,type){

          var query = { sender:person, type:'follow'}
          if (type === 'followers') query = { receiver:person, type:'follow'}

          return new Promise(resolve => {

            if (!person){
                throw Error('parameter not available for "of" on count'+type)
                // return resolve(0)
            }

            db.action.countDocuments(query, function(err, info){
              // console.log('follow count: '+info)
              resolve(info) //it will give zero if nothing found
            })

          })
  }

  function followList(person,type){

              var query = { sender:person, type:'follow'}
              if (type === 'followers') query = { receiver:person, type:'follow'}

              return new Promise((resolve)=>{
                db.action.find(query,function(err, info_main){

                  resolve(info_main)

                })
              })
  }


}

function handlePost(req, res, userData,userMeta){

  var qBody = ''
  var reqData = req.body

  // console.log(reqData.type)


  if(reqData.data){

    try{
      qBody = JSON.parse(reqData.data) //remember data is passed 
    }catch(e){

      if(reqData.data.indexOf('{') !== -1 || reqData.data.indexOf('}') !== -1) return res.send(e)//json encoding error
      qBody = reqData.data
    }
  }

  switch(reqData.type){
    case'editProfile':
      // qBody.currentUserName

      // qBody.username
      // qBody.profile
      // qbody.tags
      // qbody.name

      // qbody.verificationCode

      //to do an abstraction to eliminate crash due to undefined variable maybe a catch on handle post

      if (qBody.username !== userData.username){

         db.users.findOne({username:qBody.username}).then((err,data)=>{
          if (data)  return res.send({error:'username already exist'})
          makeUpdate()
         })

      }else{
        makeUpdate()
      }

      function makeUpdate(){

        db.users.findOneAndUpdate({verificationCode:qBody.verificationCode,username:userData.username},
        {
          username:qBody.username, profile:qBody.profile, name:qBody.name, tags:qBody.tags, about:qBody.about

        },{returnOriginal : false},function(err, info_main){
          //what if it was not unique
          if (!err){
            return res.send({error:err})
          }
          if (!info_main)return res.send({error:'wrong verification code, typo happens'})
          res.send({code:200,data:info_main})
          //reset configration code
        })
      }
      break
    case'db':

      let meta = {log:[],timeTaken:0}

      function sendApiData(data){
        res.send({data:data,meta:meta})
      }

      if (!userData)  return sendApiData({error:'Login required'})
      var appName = req.body.name

      // console.log(qBody,appName)

      db.law.findOne({app:appName},function(err, info_main){

        if (err)  return res.send({error:err})
        if (!info_main) return sendApiData({error: appName+' not found: ' , code:1211 })
        
        var database = JSON.parse(info_main.DBs)
        var preCode = null

        if ( info_main.preCode ) preCode = JSON.parse(info_main.preCode)



        let prop = {app:appName, parse:qBody, preCode:preCode ,success:sendApiData, database:database, user:userData,log:meta.log}
        handleParse(prop)


      })


      break
    case'confirmPaymentFromPaypal'://add paypal transaction to ledger

      if(!userData) return res.send({error:'login required invalid'})

      var paypal_orderID = qBody.transactionId//TP

      process.env.PAYPAL_SANDBOXED === 'TRUE'? qBody.sandboxed = true : qBody.sandboxed = false

      if (!paypal_orderID) return res.send({error:'order id invalid'})
      // 1. Set up your server to make calls to PayPal

      // 1a. Import the SDK package
      const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
      const payPalClient = require('./paypalEnvironment.js');



      handlePaypal()
      async function handlePaypal() {

        let request = new checkoutNodeJssdk.orders.OrdersGetRequest(paypal_orderID);

        let order;

        try {
          order = await payPalClient.client().execute(request);
        } catch (err) {


          console.error(err.HttpError.error_description,err);
          return res.send( {error: err.HttpError.error_description ,code: 500} );
        }

        // console.log(order)

        let amount = order.result.purchase_units[0].amount.value
    
        

        //it can be done more than once
        var pay_save = new db.transactions({
                receiver:userData.id,//id // to do everywhere id
                amount:amount,
                orderID:paypal_orderID,
                sandboxed:qBody.sandboxed,
                orderID:random(),
                type: 'paypal',
                status: 'paid'
              })

        pay_save.save((error,transaction)=>{
          if (error){

            function crashServer(){//to do stop process
              throw Error(error)
            }//so than no other paypal payment is left unnoted

            error.code === 11000? res.send({error: 'order already noted' }) : crashServer()
            return
          }  
          res.send({code:200,transactionId: paypal_orderID,amount:amount})
          //return payment id
         })
        // db.transaction.findOneAndUpdate({ _id:transactionId },{status:'paid',amount:amount},{verified:true},{new: true,runValidators: true }).then(msg=>{ console.log('writing trnsaction') })
        
        
      }
      

      //also verify amount
      
      break
    case'confirm_payment':

      // to do charge wallet will show current balance 
      
      // console.log(qBody.verificationCode,'verification code',userMeta)

      //why two step so that we email the amount declared so that user can't be ffished and also make amount immutable
      if (qBody.verificationCode !== userMeta.verificationCode) return res.send({error:'wrong verification code'})
      if (!qBody.orderIDs) return res.send( {error: 'orderID is required' } )


        // console.log(qBody.orderIDs,'orderids')


      function confirmPayment(orderID){

        return new Promise(resolvePay=>{

          db.transactions.findOne({ orderID:orderID } , function(err, info){

            if(!info) return res.send( {error: 'invalid orderID' } )
            if(!info.type === 'paypal') return res.send( {error: ' can not confirm this payment ' } )
            if(!info.status === 'paid') return res.send( {error: 'already paid' } )
            if(userData.id !== info.sender) return res.send( {error: 'payment author mismatch' } )

            let status = 'paid'

            db.transactions.findOneAndUpdate({ orderID:orderID },{status:status},{new: true,runValidators: true },(err,data)=>{

              if (err) return res.send({code:400, error:err.message ,orderID:qBody.orderID})

              sendNotification({message: 'amount of $'+data.amount+ ' received' ,to:data.receiver, meta:data.amount}
                                ,data.sender
                                ,data.app
                                ,true)

              if(info.type === 'u2u') if(info.fees) return payfees( info.app, info.fees, info.sandboxed).then(()=>{
                resolvePay(orderID)
              })

              
              resolvePay(orderID)


            })
          })
        })
      }

      async function payAllOrders(){
        for(let index of qBody.orderIDs){
          // console.log('paying',index)
          await confirmPayment(index)
          
        }

        setNewVerificationCode(userData.email)//change verification code once it is used

        res.send({code:200})
      }
      payAllOrders()


      function payfees(app,amount,testMode){

        return new Promise(resolve=>{

            var pay_save = new db.transactions({
                sender:userData.id,
                amount:amount,
                type: 'u2a',
                isFees:true,
                orderID:random(),
                app:app,
                sandboxed:testMode,
                status: 'paid'
              })

        pay_save.save((error,transaction)=>{
          if (error) throw Error(error)
          resolve(transaction)
         })
      })
      }

      

      break
    case'initialize_payment':

      //to do make initialize payment and confirm payment both take objects


      if(!qBody.sandboxed) qBody.sandboxed = false
      if (qBody.sandboxed !== true) qBody.sandboxed = false

      if( process.env.PAYPAL_SANDBOXED === 'TRUE' ) qBody.sandboxed = true

      if (!qBody.app) return res.send( {error: 'app not specified' } )
      if (!qBody.type) return res.send( {error: 'type of payment not specified' } )
      if (!qBody.paymentList) return res.send( {error: 'paymentList of payment not specified' } )
      if (qBody.type !== 'u2u' && qBody.type !== 'u2a' ) return res.send( {error: 'invalid type value' } )


      let fees = 0
      let totalAmount = null


      findFees().then(data=>{

        if(data.error) return res.send({error:data.error})

        fees = data

        findTotalAmount().then(total=>{
          totalAmount = total
          if (qBody.sandboxed === true) return iterateOnPayments() //if it is just testing

          checkBalance(userData.id).then( balance=>{
            //document the code 999
            if ( total > balance ) return res.send( {code:999 ,error: `your balance: ${balance} is not enough to satisfy the transfer of ${total} with fees ${fees}` } )
            iterateOnPayments()
          })

        }).catch(errorInCalculation=>{
          res.send({error:errorInCalculation.message})
        })

      }).catch(error=>{
        console.warn(error)
        res.send({error:error.message})
      })


      async function iterateOnPayments(){

        sendVerificationEmail( userData.email,'transaction of $'+totalAmount+' including fees of $'+fees)

        let paymentData = []

        for(let key in qBody.paymentList ){

            //document receiver's username can also be given
            let receiverData = await extractUserData(key)
            if (!receiverData) return res.send( { error: `receiver not found: ${key}` } )

              let newPaymentData = await initializePayment(receiverData.id, qBody.paymentList[key] )
            // console.log(newPaymentData)
            paymentData.push( newPaymentData.orderID )
        }

        return res.send( {msg:'success! payment initialized',orderIDs:paymentData,code:200,totalAmount:totalAmount } )
      }

      function findTotalAmount(){

        return new Promise(resolve=>{

          let sumAmount = 0

          for(let key in qBody.paymentList){

            try{
              // console.log(qBody.paymentList[key],'number')
              sumAmount += totalWithFees( qBody.paymentList[key]  )
            }catch(error){

              // console.log(error)
              throw Error(error.message)
            }
            

          }

          resolve(sumAmount)
        })
      }

      function totalWithFees(amount){
        amount = Number(amount)
        // console

        //document if the amount is a string then that percentage is calculated if it is a number amount is just added

        let totalAmount = typeof fees === 'string'? amount + (  (Number( fees.replace(/%/gi,''))/100) * amount ) : amount + Number(fees) 
        if( isNaN( totalAmount  )  ) throw Error('invalid fees '+fees+' or amount: '+amount)

        return totalAmount
      }

      function initializePayment(receiver,amount){
        return new Promise(resolve=>{

          let status = 'initiated'
              let calculatedFees = totalWithFees(amount)
              //u2u: streaming site donation
              //u2a:gambling game
              //a2u:gambling game
              let orderID = random()

              var pay_save = new db.transactions({
                  sender:userData.id, //verify by cookie
                  receiver:receiver,//id
                  amount:amount,
                  type: qBody.type,
                  orderID:random(),
                  fees:calculatedFees,
                  app:qBody.app,
                  sandboxed:qBody.sandboxed,
                  status: status
                })

          pay_save.save( (error,transaction)=>{
            if (error) throw Error(error)
            resolve(transaction)
            //return payment id
           } )




        })
      }

      function findFees(){
        return new Promise(resolve=>{

          db.apps.findOne({ name:qBody.app }).then(rulesFound=>{
            if (!rulesFound) throw Error('app not found')


            if(qBody.flavour){

              // console.log(rulesFound)
              if(!rulesFound.fees) throw Error('fees is not defined')
              let feesObject = JSON.parse( rulesFound.fees )

              // console.log(feesObject,qBody.flavour,feesObject[qBody.flavour])

              if( !feesObject[qBody.flavour] ) throw Error( 'invalid flavour: '+qBody.flavour )
              
              resolve( feesObject[qBody.flavour] )

            }else{
              resolve(0)
            }

          }).catch(error=>{
            resolve({ error:error.message })
          })


        })
      }






      
      break//see if email is verified
    case 'sendCodeEmail':

      if (!userData) return res.send({error:'not logged in'})

      sendVerificationEmail( userData.email, qBody.context, (k)=>{  res.send(k) } )
      break
    case'forgot_password':

        //to resend code user the same function why does resend exist
        getUserData(qBody.emailOrusername,true).then((data,error)=>{
          if (error) return res.send(error)

          function callback(data2){
            if (data2.error) return res.send(data2.error)
            res.send( {msg:'email sent to '+data.email.substring(0,data.email.length/3)+'....'} )
          }

          if (!data)return res.send({error:'no one found'})

          sendVerificationEmail(data.email,'reseting your password, your username is '+data.username,callback)
        })
      break
    case 'runCRON':
      if(!qBody.app) return res.send( {error:'app name required'} )
      if(!qBody.type) return res.send( {error:'type  required'} )

      cronWorker(qBody.type,qBody.app,(data)=>{
        res.send({log:data})
      })
      break
    case'verify_email_access':
      //to do expire the verification email, (not now)
      //how to hnage pass word when logged in
      //either otp or email verification , forgot password
      
      //to do username cant have athedate or any other symbol

      // console.log(qBody.job,qBody.verificationCode)

      let verificationCode = null
      let user = null
      let cookie = null
      let email = null
        // if( return res.send({error:'wrong OTP'})




        
        function proceedVerify_email_access(){

          // console.log('qBody.verificationCode, verificationCode')

          qBody.verificationCode = qBody.verificationCode.trim()

          if (qBody.verificationCode !== verificationCode) return res.send({error:'wrong verification code'  })

            switch(qBody.job.toLowerCase()){

              case 'forgot_password':
                if (!qBody.newPassword) return res.send({msg:'newPassword field required'})
                db.users.findOneAndUpdate({ username:user },{password:hash(qBody.newPassword),verified:true },{new: true,runValidators: true }).then(msg=>{console.log('email verified'+qBody.username)})
                break
              case 'verify_email':
                db.users.findOneAndUpdate({ username:user },{verified:true},{new: true,runValidators: true }).then(msg=>{console.log('email verified '+qBody.username)})
                break
            }
            //this setup will work for both the condition

            //shound we make verification mandatory for cookies to be assigned
            
            res.send( {code:200,msg:cookie} ) //in case of otp breach session can be breached but it doesn't matters as it can do any thing due to localstorage it is already in secure and cookies can be stolen
            let code = setNewVerificationCode(email)//change verification code one it is used
            // type === 'otp'? res.send({msg:'account verified'}) : 
          }
        
        if (userData) {
          user = userData.username
          verificationCode = userMeta.verificationCode
          email = userData.email
          proceedVerify_email_access()
        }else if(qBody.username){
          

          getUserData(qBody.username,true).then(data=>{

            if (!data) return res.send({error:'username not found'})

            cookie = data.cookie
            user = data.username
            email = data.email
            verificationCode = data.verificationCode

            // console.log(qBody.verificationCode, verificationCode)
            proceedVerify_email_access()
          })
        }else{
          return res.send({error:'username not given'})
        }


      break
    case'resendVerificationCode':
      
      //get user data from cookie
      sendVerificationEmail( userData.email, qBody.context, (k)=>{  res.send(k) } )

      break
    case'loginOrSignup':


      let newAccount = qBody.newAccount || false
      let salt =  hash(null)
      qBody.password = hash(qBody.password)

      if(!qBody.username) return res.send(  {code:400,msg:'fill username'} )
      if(!qBody.password) return res.send(  {code:400,msg:'fill password'} )
      if(!qBody.email && newAccount === true) return res.send(  {code:400,msg:'fill email'} )


      if(newAccount === true){

          var emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
          
          if(emailRegex.test(qBody.email) == false){

            return res.send({error:'invalid email'})
          }else{

            createAccount()
          }

        
      }else{
        login()
      }

      function createAccount(){

        var user_save = new db.users({
            username:qBody.username,
            password:qBody.password,
            email:qBody.email,
            interest: qBody.tags,
            verified:false,
            verificationCode:null,
            cookie: salt
          })

        user_save.save(error=>{



          if (error){

            function reportError(msg){

              if(msg.indexOf('username_1') !== -1){
                res.send(  {code:400,error:'username taken'} )
              }else if(msg.indexOf('email_1') !== -1){
                res.send(  {code:400,error:'email already exist'} )
              }else{
                res.send(  {code:400,error:'A error occured please report it on http://bugs.upon.one'} )
                // console.log(msg)
              }
              
              
            }
           
            error.code == 11000? reportError(error.message)  : console.log(error)
             
          }else{
            // sendCookie(salt)
             //cookie will only be provided after verification
            sendVerificationEmail( qBody.email, 'new account', (data)=>{ 

              if(data.error) return res.send( {error:data.error} )
              res.send( {code:200, username:qBody.username,email:qBody.email} )

             })
          }

        })
      }

      function login(){
        
        db.users.findOne(  { $or: [{username: qBody.username}, {email: qBody.username}] } , function(err, info){

              if (!info) return res.send({code:400,error:'wrong username or email'})

              if (info.password == qBody.password){

                if(!info.verified) return res.send({error:'account not verified'})

                sendCookie(info.cookie)
                
                //if not authorized make a redirect to the auth page and with the redirect variable

              }else{

                res.send(  {code:400,error:'wrong password or username'} )

              }

        })

      }

      function sendCookie(cookie){
          res.send( {code:200,msg:cookie} )
          // console.log('logged in',cookie)
      }


      break//rename login
    case'new':

      qBody.db = JSON.stringify(qBody.db)

      if (!qBody.description) qBody.description = null //take from meta tag to dp
      if (!qBody.preCode) qBody.preCode = null
      if (!qBody.fees) qBody.fees = null

      if (!qBody.meta) qBody.meta = null

      if (qBody.searchable === undefined )qBody.searchable = true

      if ( typeof qBody.searchable !== 'boolean' ) qBody.searchable = false
       //fixed searchable bug but still apps wont be affected
      

      if (qBody.preCode) qBody.preCode   = JSON.stringify(qBody.preCode)
      if (qBody.fees) qBody.fees  =  JSON.stringify(qBody.fees)

      function allocateMemory(dataDB,existingRelation,theDatabaseName){

          // console.log(db)

                var relation = {}
                var string_increment = -1
                var number_increment = -1
                var array_increment = -1

                var originalSchema = dataDB.schema

                if ( existingRelation ) { //previously originalSchema.memoryAllocation why?

                  //changed existing relation

                  for(key in existingRelation){

                    if( key.indexOf('S_') !== -1){
                      string_increment += 1
                    }else if( key.indexOf('N_') !== -1){
                      number_increment += 1
                    }else if( key.indexOf('A_') !== -1){
                      array_increment += 1
                    }
                  }



                }

                var uniqueField = null

                for(let index in originalSchema){

                  var field_value = originalSchema[index]

                  var fieldType = typeof field_value === 'object'? field_value.type : field_value


                  let validFieldType = ['array','number','string','unique']

                  if( typeof fieldType !== 'string' ) throw Error('type:'+fieldType+' is invalid  at field: '+index+' on database: '+theDatabaseName)

                  if( !validFieldType.includes( fieldType.toLowerCase() ) ) throw Error('type:'+fieldType+' is invalid  at field: '+index+' on database: '+theDatabaseName)



                  let prohibitedFieldValues = {registered_writer_field:true}

                  if( prohibitedFieldValues[index] ) throw Error('Memory allocation error, use of'+index) 



                  if(fieldType === 'unique'){
                    relation[index] = 'unique'
                  }else{

                    var fieldIndex = 0


                    switch(fieldType.toLowerCase()){
                      case 'array':
                        fieldType = 'A'
                        fieldIndex = array_increment += 1 
                        break
                      case 'string':
                        fieldType = 'S'
                        fieldIndex = string_increment += 1 
                        break
                      case 'number':
                        fieldType = 'N'
                        fieldIndex = number_increment += 1 
                        break
                    }


                    var contrainsts = {N:6,A:6,S:6} //constraints on the number of fields available

                    if ( fieldIndex >= ( contrainsts[fieldType] - 1 ) ){
                      throw Error('Memory allocation error limit exceeded for:'+fieldIndex+'of type'+fieldType)
                    }
                    
                    relation[index] = fieldType+'_'+fieldIndex
                  }




                } 

                return relation //am I giving the memory allocation of the previous one
      }

      function addCron(){


          if (!qBody.cron) return

          if (qBody.cron){



            let tasksPutValues = {}

            for(let when of ['daily','weekly','monthly','quaterly','yearly']){

              if (qBody.cron[when].length === 0){
                tasksPutValues[when] = null
                continue
              } 
              
              tasksPutValues[when] = JSON.stringify( qBody.cron[when] ) //arrray of indivisual when
               //so that our $ne query could work
            }

            db.law.findOneAndUpdate({ app:qBody.name },tasksPutValues,{new: true,runValidators: true }).then(msg=>{console.log('cron job added')})
          } 
      }

      function saveDB(callback){

        if(!qBody.db) return callback({code:200})

        db.law.findOne({ app:qBody.name }).then(rulesFound=>{

          let newDatabase = JSON.parse(qBody.db)

          //first time: allocate memory in the first time

          function updateDB(){

            //old database
            var oldDatabase = JSON.parse(rulesFound.DBs)


            try{
              newDatabase = memoryAllocationLoop(newDatabase,oldDatabase)
            }catch(schemaErr){
              return callback({error:schemaErr.message})
            }

            // var util = require('util')//really usefull
            // console.log(util.inspect(newDatabase))
            // console.log(oldDatabase, newDatabase)

            //bug: anyone can change the database.....

            db.law.findOneAndUpdate({ app:qBody.name },{DBs:newDatabase},{new: true,runValidators: true },(updateErr,doc)=>{

             if(updateErr) console.log(updateErr)
                
             

              callback({code:200})

           })
          }

          function memoryAllocationLoop(newDatabase,oldDatabase){
            for (let key in newDatabase){

              // console.log(newDatabase[key],key)

              let oldMemoryAllocation = null
              if(oldDatabase) if (oldDatabase[key]) oldMemoryAllocation =  oldDatabase[key].memoryAllocation

              
                let newRelation  = allocateMemory( newDatabase[key], oldMemoryAllocation,key)
                newDatabase[key].memoryAllocation = newRelation
                //if warning is given then 
                
              
              
            }

            return JSON.stringify(newDatabase)
          }

          function writeDB(){
            let newDatabase = JSON.parse(qBody.db)
            //why isn't write db allocating db

            try{
              newDatabase = memoryAllocationLoop(newDatabase,null)
            }catch(schemaErr){
              return callback({error:schemaErr.message})
            }

     

            var rule_save = new db.law({
              app:qBody.name,
              DBs: newDatabase
            })

            rule_save.save(error=>{

              if(error){

                error.code == 11000? updateDB() :console.log(error)

              }else{

               callback()

              }

            })            
          }


          rulesFound === null? writeDB() : updateDB() //does it return null

        })
      }


      saveDB(rulesSavedNowSaveAppsConfig)//save rules

      
      qBody.password = hash( qBody.password )
      function rulesSavedNowSaveAppsConfig(msg){

        // console.log(msg,'msg')

        if(msg) if (msg.error) return res.send({error: msg.error})

        // console.log(qBody.fees,'fees')


        db.apps.find({name:qBody.name} , function(err, info){

          if (info.length == 0) {//add new doc

            var newapp = new db.apps({
              name:qBody.name,
              password:qBody.password,
              preCode: qBody.preCode ,
              fees:qBody.fees,
              description:qBody.description,
              meta:qBody.meta,
              searchable:qBody.searchable,
              owner:qBody.owner,
            })

            newapp.save(error=>{
              if (error) throw error;
              if(!res.headersSent) res.send({ code:200,msg:'hosted' })
              addCron() 
            })
          }else if(info[0].password == qBody.password){ //update doc if password matches

            db.apps.findOneAndUpdate({name:qBody.name},
            {
              description:qBody.description,
              meta:qBody.meta,
              owner:qBody.owner,
              preCode: qBody.preCode,
              fees:qBody.fees,
              searchable:qBody.searchable
            },{new: true,runValidators: true}).then(doc => {

              if(!res.headersSent) res.send({code:200,msg:'updated'})
              addCron()

            }).catch(err =>console.error(err))

          }else{ res.send(  { code:400, error:'wrong app or password ip:'} ) }
        })        
      }


      break
      // to do: version update: whenever apps are updated remove all peers!
    case'chache_hash':
      // save index file

      //to do check password
      qBody.url = JSON.parse(req.body.configuration).name+qBody.url
     

      qBody.response = JSON.stringify(qBody.response)

   

      var chache_save = new db.chache({
        url: qBody.url,
        data: qBody.response
      })

      chache_save.save(error=> {if(error){
        
        if (error.code == 11000) db.chache.findOneAndUpdate({ url:qBody.url },{data:qBody.response},{new: true,runValidators: true },(error, doc) => {
          if (error) console.log(error)
          // console.log('Chache updated')
        })
        
      }})

      break
    case'getSavedChache':
      sendSavedChache( qBody.app+'/index', (data)=>{res.send(data) } )
      break
    case'search':
      let query = qBody.query
      let type = qBody.type
      let search_config = {'$text': {'$search': query} }

      if(!query) search_config = {} 


      if(type === 'sites'){

        db.scrap.find(search_config).limit(10).exec((error, info_read)=>{

          if(error) return res.send({error:info_read})
          res.send(info_read)

        })

      }else{

        // /$ne

        search_config['searchable'] = true
          
        db.apps.find(search_config).limit(10).exec(function(err, info){
          data = []
          for(index of info){ data.push( {name:index.name} ) }

          res.send( data ) 
        })
  

      }


      break
    case'scrap':
      let heading = qBody.heading
      let text = qBody.text
      let head = qBody.head
      let html = qBody.html
      let url = qBody.app+':'+qBody.url

      var scrap = new db.scrap({
        url: url,
        heading: heading,
        text: qBody.text,
        html:html,
        head:head
      })

      scrap.save(error=>{

        if(!error) return res.send({code:200,msg:'saved'})
        if (error.code !== 11000) throw Error(error)

        db.scrap.findOneAndUpdate({ url:url },{html:html, text:qBody.text, heading:qBody.heading,head:head},{new: true,runValidators: true },(error, doc) => {
          if(error) return console.log(error)
          res.send({code:200,msg:'updated'})
        }) 
        
      })
      break
    //to do get request file
  }  
}


function checkBalance(subject,forApp){
  //useuserid
  return new Promise(resolve=>{

      let sandboxed = false

      if( process.env.PAYPAL_SANDBOXED === 'TRUE' ){
        sandboxed = true
      }

      let query1 = { receiver:subject, status:'paid', sandboxed:sandboxed }
      let query2 = {sender:subject, status:'paid' ,sandboxed:sandboxed}

      if (forApp === true) {
          let query1 = { app:subject, type:'u2a', status:'paid', sandboxed:sandboxed }
          let query2 = {app:subject, type:'a2u', status:'paid' ,sandboxed:sandboxed}
      }

      db.transactions.find( query1 , function(err, info){
          if (err) return console.log(err)
          if (info.length === 0) return resolve(0)
          
          let credited = 0
          for (let index of info){
            credited += Number(index.amount)
          }

          withdraws(credited)
        })


      function withdraws(credited){
        //why status done is not specified? because status being pending can be exploited

        db.transactions.find(query2  , function(err, info){
          if (err) return console.log(err)

            let withdrawed = 0
            for (let index of info){
              withdrawed += index.amount
            }

            //save cut

            //fees to not sent for virtual apps
            //to do generalize how app name is sent

            resolve( credited - withdrawed )




       



        })
      }






  })
}


function getUserData(value,searchBy){

  return new Promise(resolve=>{
     // if (!cookieid) return resolve(null)
    let queryObj = {cookie:value}

    if (searchBy == true){
      queryObj =  { $or: [{username: value}, {email: value}] }
    }else if(searchBy == 'id'){
      queryObj = {_id:value}
    }else if(searchBy === 'username'){
      queryObj = {username:value}
    }

    db.users.findOne( queryObj, function(err, info){//to do test findone



      if (err )return resolve(null, {error:err} )
      if ( !info)return resolve(null, {error:'user not found'} )
      resolve(info)
    })
  })
}

function setup(){
   // extended=falseis a configuration option that tells the parser to use the classic encoding. 
  app.use(bodyParser.urlencoded( {limit: '5mb', extended: false} ))
  app.use(bodyParser.json( {limit: '5mb', extended: false} ) )
  app.use(function(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Method", 'POST, GET, OPTIONS');
    next();});

  var config_domain = {}

  if(process.env.PORT == undefined){
    config_domain.host = 'localhost'
    config_domain.port = 8080;
    config_domain.type = 'testing'
    config_domain.staticPort = 8080;
  }else{
    config_domain.host = 'serverination.herokuapp.com'
    config_domain.port = process.env.PORT;
    config_domain.type = 'online'
    config_domain.staticPort = 80;//heroku server works on dynamic port but listens on static port 80
  }

  return config_domain
}



function random(digits){
  if(digits) return Math.floor( Math.random() * Math.pow(10,digits) )//numbers 
  return Math.random().toString(36).substring(2, 15)+Math.random().toString(36).substring(2, 15) //string
}

function hash(data){
  if(data == null) data = random()
  return cry.createHmac('sha256',data).digest('hex')
}

function lcUrl(url){

 return 'http://'+runtm.host+':'+runtm.staticPort+'/'+url 
}


function isEmpty(obj){
  for(var prop in obj) {
    if(obj.hasOwnProperty(prop)) {
      return false;
    }
  }

  return JSON.stringify(obj) === JSON.stringify({});
}


function renameOutput(tobeoutputed,relation,uniquePrefix){

                function swap(json){
                  var ret = {};
                  for(var key in json){
                    ret[json[key]] = key;
                  }
                  return ret;
                }

                var swappedRelation = swap( relation )

                //to do: select as a field

                var returnObject = {}

                for(let key in tobeoutputed){

                  //### fix array output

                  if (typeof tobeoutputed[key] === 'function') continue

                  if ( swappedRelation[key] ){
                    returnObject[ swappedRelation[key] ] = tobeoutputed[key]
                  }else if (key === 'id'){
                    returnObject['id'] = tobeoutputed[key]
                  }else if (key === 'registered_writer_field'){ //hidden from user used for like and other notification
                    returnObject['registered_writer_field'] = tobeoutputed[key] //dont show
                  }//exception for id

                }

                let theUniqueField = swappedRelation['unique'] 

                // console.log(swappedRelation,theUniqueField , returnObject[ theUniqueField],'renaming output')
                console.log('uniquePrefix',uniquePrefix)
                if( returnObject[ theUniqueField] ){
                  
                  returnObject[ theUniqueField] = returnObject[ theUniqueField].replace(uniquePrefix,'')
                }
                 
                return returnObject
                
}

function frameHtml(res,domain){

  //peer file
  

    // if (data.error) return res.send(data.error)


      // db.apps.findOne({name:domain}).exec(function(err, info){
        // if (err) return console.log(err)

        // let hash = info.hash
  let fullHTML=`<html> 
                <head>
                  <meta name="apple-mobile-web-app-capable" content="yes">
                  <meta name="mobile-web-app-capable" content="yes">
                  <meta name='viewport' content='width=device-width, initial-scale=1.0, user-scalable=0' >
              </head> 

        <body></body>
          <script class="hostea"  app_name="${domain}" mode="${runtm.type}" job="receive" src="${ lcUrl('loader.js') }">
          </script>
 

         </html>`

         res.send(fullHTML)
    // })

  

  
  

}

function addUniquePrefix(fullDbName,unique){

  if (!unique) unique = ''

  return fullDbName+':'+unique
}

function stringIt(json){
  return JSON.stringify(json)
}

function removeKey(object,keyname){

  if (Array.isArray(object)){
    let newObj = []

    for (let index of object){
      if (index !== keyname) newObj.push(index)
    }

    return newObj
  }else{

    let newObj = {}
    for(let key in object){
      if (key != keyname) newObj[key] = object[key]
    }

    return newObj

  }

 

}


function sendSavedChache(fileName,callback){//find one

  db.chache.findOne( {url:fileName} , function(err_o, info_o){

    // console.log(fileName, info_o)
    if(!info_o) return callback( { error:'404 '+fileName+' not found' } )
    if (err_o) return console.log(err_o)
    
    if(info_o) callback( { chache: info_o.data } ) 
              
    })            
}

function sendNotification(object,sender,app,byapp){

  return new Promise(resolve=>{


    let type = 'message'
    let actionId = type+':'+sender+':'+random()

    if(!byapp) byapp = false

    if(!object.message) throw Error('message not defined')
    if(!object.to) throw Error('parameter "to" not defined')

    if (object.meta === undefined) object.meta = null 

    var act = new db.action({
      sender:sender,
      receiver:object.to,
      type:type,
      actionId:actionId,
      app:app,
      meta:object.meta,
      message:object.message,
      official:byapp
    })

    act.save(error=>{

      if (error) throw Error(error)
      return resolve(true)

    })
  })
                  

}


 function ObjectLength(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function setNewVerificationCode(to){
    let code = random(6)
    db.users.findOneAndUpdate({ email:to },{verificationCode:code},{returnOriginal : false},function(error, doc){
      // console.log(doc.userName+' settting email of:'+to)
    })
    

    return code
}



sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// console.log(process.env.SENDGRID_API_KEY)
function sendEmail(to,message,subject,callback){

  //make them aware about the appname
    var from = 'noreply@upon.one';

    // html: '<strong>and easy to do anywhere, even with Node.js</strong>',

    
    
    const msg = {
      from: from,
      to: to, 
      subject: subject,
      text: message
      
    };

    sgMail.send(msg, (error, response) => {

        // console.log('sending email')
        if(error){
            console.log(error);
            callback( {error:error} )
            //to get make callback for edge cases
        }else{
          // console.log('email sent',response);
          if (callback) return callback( {status:'email sent'} )
            
        }

      });


}

function sendVerificationEmail(to,context,callback){

    let code = setNewVerificationCode(to)

    
    var message = `your verification code is ${code} `;
    if (context) message += 'for '+context
    sendEmail(to,message,'verification code',callback)

}

async function extractUserData(key){
//###
  //username can be #username or id
  let userdata = key.indexOf('@') !== -1? await getUserData(key.replace('@',''),'username') : getUserData(key,'id')

  return userdata
}

function putLogs(appname,logMessage,callback){

  db.apps.findOne({name: appname}, function (error, doc) {
    if (!doc) return callback(false)

    let logList = doc.logs
    let newLogList = []

    for(let index of logList){
      newLogList.push( index ) 
    }

    for(let index of logMessage){
      newLogList.push(index)
    }

    // 45 is the highest amount of logs

    let theShiftCount = newLogList.length - 45

    if(theShiftCount > 0) for(let t = 0; t<=theShiftCount; t++){
      newLogList.shift()
    }

    // console.log(newLogList)

    db.apps.findOneAndUpdate({name: appname},{logs:newLogList}).then((err,doc2)=>{
      if (err) return callback(false,err)
      callback(true,doc2)
    })

  })
}




var srv = app.listen(runtm.port, (err) => { console.log("App started on:"+lcUrl('') ) });