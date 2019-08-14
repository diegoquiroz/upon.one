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

//to do: use data stream for db format changes
//socket disconnects -
//fix home page
//tik tac toe
//more than one socket connection
//bitcoin payment
//a lot of testing
//required values
//mutation false values

cron.schedule("59 23 * * *", cronWorker)

db.vDb.watch({ fullDocument: 'updateLookup' }).on('change', sendToSocket)

app.ws('/query', addNewSocket )
app.ws('/room', connectToRoom )

app.get('/', (req, res) => res.send( frameHtml() ) )

app.post('/',(req, res) =>{

  function srh(query){
    let search_config = {'$text': {'$search': query} }
    query == null? search_config = {}:null
    db.apps.find(search_config).limit(10).exec(function(err, info){
      data = []
      for(index of info){ data.push( {name:index.name} ) }
      res.send( data ) 
    })
  }

  if (req.body.type === 'search'){//set default app name
    srh(req.body.app) //change app to search query (var name on front end)
  }else if (req.body.cookie){
    getUserIdFromCookie( req.body.cookie ).then(function(userId){
      handlePost(req, res, {id:userId[0].id,username:userId[0].userName})
    })
  }else{
     handlePost(req, res)
  }})

app.get('/:id', (req, res) => {


  function sendJS(file_name){
    res.set('Content-Type','application/javascript',);
    res.sendFile( __dirname + "/" + file_name )
  }

  if(req.params.id == "serverination.js"){
    sendJS("serverination.js")
  }else if(req.params.id == "loader.js"){
    sendJS("loader.js")
  }else{
    
    res.send(frameHtml())
  }
})//get rid of it

function cronWorker(){

   db.law.find({daily:{ '$ne': null }},function(err, alltasks){

    for(let task of alltasks){
      handleParse({app:task.app, parse:task.daily, failure: console.log, type:'action', database:task.schema})
      console.log('-----DAILY-----TASK-------')
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

function connectToRoom(ws,req){

  var clientId = random()

  ws.on('close', function(req){
 
    //to do if user doesnot exist fallback, broadcast a leave message
    //to remember: remove key can handle both array and object

    function leftRoom(room,key){
      broadcast(room,socketClients[clientId].user,'onleave',key)
    }

    for (let key in roomsRegistry){

      for (let room in roomsRegistry[key].full){

        //remove client from full instance, remove instance from full and and add it not full

        if ( arrayHas(roomsRegistry[key].full[room].clients,clientId) ){
          roomsRegistry[key].full[room].clients = removeKey(roomsRegistry[key].full[room].clients,clientId)
          roomsRegistry[key].notFull[room] = roomsRegistry[key].full[room]
          roomsRegistry[key].full = removeKey(roomsRegistry[key].full,room)
          leftRoom(room,key)
          console.log('leaveing')
        }else{
          console.log( roomsRegistry[key].full[room].clients[clientId] )
        }

        //putting room back to not full so that it can be reused (we dont need to delete it) and new users can log in
      }

      
      for (let room in roomsRegistry[key].notFull){

        if ( arrayHas(roomsRegistry[key].notFull[room].clients,clientId) ) {
          leftRoom(room,key)
          roomsRegistry[key].notFull[room].clients = removeKey(roomsRegistry[key].notFull[room].clients,clientId)
        }
      }

    }

    socketClients = removeKey(socketClients,clientId)

  })


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


    if (msg.purpose == 'join') {
      createOrAddToRoom()
    }else if(msg.purpose == 'broadcast'){
      console.log('broadcasting')
      broadcast(roomToken,msg.content,'onmessage',roomLabel)
    }

    //why one to one does not exist? because it can be created with room with limit 2

    function createOrAddToRoom(){

      if(!socketClients[clientId]){

        //if user does not exist
        return getUserIdFromCookie( msg.cookie ).then(function(userId){//what if cookie is invalid
          socketClients[clientId] = {user:{id:userId[0].id, username:userId[0].userName}, socket:ws}

          createOrAddToRoom()
        })

        
      }

      //also broadcast on join and leave and also joined member
      console.log(clientId)
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

       

        if(membersCountOfNotFull > notFullRoomLimit) console.log('limit exceeded', membersCountOfNotFull, notFullRoomLimit)

        if(membersCountOfNotFull === notFullRoomLimit){
          roomsRegistry[roomLabel].full[roomToken] = roomsRegistry[roomLabel].notFull[roomToken]
          roomsRegistry[roomLabel].notFull = removeKey(roomsRegistry[roomLabel].notFull,roomToken)
        }

        }

      }

      broadcast(roomToken,null,'onopen',roomLabel)

    }

   })
  // roomArgToken room name, roomLabel key
  function broadcast(roomArgToken,content,type,roomLabel){

      let token = roomLabel.split('_')[1]

      let broadcastTo = null
      try{
        broadcastTo = roomsRegistry[roomLabel].notFull[roomArgToken] === undefined ? roomsRegistry[roomLabel].full[roomArgToken] : roomsRegistry[roomLabel].notFull[roomArgToken] 
      }catch(e){
        return ws.send(stringIt({error:roomArgToken+' room not found in '+roomLabel+'to broadcast'+e}) )
      }

      let members = []

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

function addNewSocket(ws, req){

  console.log('hey')
  var clientId = random()

  ws.on('close', function(req){
    // console.log('closed',uuid.v4(),clientId)
    socketClients = removeKey(socketClients,clientId)

    for (key in socketRiver){
      socketRiver[key].clients = removeKey(socketRiver[key].clients,clientId)
    }
    
  })

  ws.on('message', function(msg){
    console.log('websocket',msg)
    msg = JSON.parse(msg)
    if (!msg.query) return ws.send( stringIt({token: msg.token,data:'error'}) )
    if (!msg.query.on) return ws.send( stringIt({token: msg.token,data:'error'}) ) 
    if (!msg.token) return ws.send( stringIt({data:'error token required'})  )

    function tokenUpdater(){
      socketRiver[dbName].clients[clientId].token[msg.updateToken] = msg.query
    }

    if (msg.updateToken) return tokenUpdater()
    
    socketClients[clientId] = {user:null,socket:ws}




    var dbName = msg.query.on

    //db -> schema, clients-> (user,token -> query)
    //to do dbnames can contradict

    if (!socketRiver[dbName]){
      socketRiver[dbName] = {clients:{},format:{}}
      getDbRules(proceed)
    }else{
      proceed()
    }

    function getDbRules(callback){
      db.law.find({app:msg.app},function(err, info_main){

          if (err)  return console.log(err)
          if (info_main.length === 0) return  ws.send( stringIt({token: msg.token,data:'error database not found '+dbName}) )
          var database = JSON.parse(info_main[0].DBs)
          socketRiver[dbName].format = database[dbName]
          
          callback()
      })      
    }

    function proceed(){

      if (!socketRiver[dbName].clients[clientId]) socketRiver[dbName].clients[clientId] = {user:{},token:{}}
 

      socketRiver[dbName].clients[clientId].token[msg.token] = msg.query  

      getUserIdFromCookie( msg.cookie ).then(function(userId){
          socketRiver[dbName].clients[clientId].user =  {id:userId[0].id, username:userId[0].userName} 
      })
    }


  });
}

function sendToSocket(next){
  //next



  let data = next.fullDocument
  let type = next.operationType

  function matchQuery(match,data){
    for (key in match){

      if (match[key] != data[key]){ 
        console.log(match[key],data[key])
        return false//check for permission
        
      }
    }
    return true
  }

  let dbName = data.dbName
  let appName = dbName.split('_')[0]
  dbName = dbName.split('_')[1]

  if(!socketRiver[dbName]) return console.log('no socket is looking for this query',socketRiver)
  let dataFormat = socketRiver[dbName].format
  let clients = socketRiver[dbName].clients

  data = renameOutput(data,dataFormat.memoryAllocation)
  

  console.log(data)

  function checkPermission2(user,onSuccess){
    console.log('checking permissions')

    if (!dataFormat.permission) return onSuccess()
    if (!dataFormat.permission.read) return onSuccess()
    let permissionToDatabase = dataFormat.permission.read

    handleParse({app:appName, parse:permissionToDatabase, field:data, failure:console.log, database:theDB, user:user}).then(
            function(data){
              data === true? onSuccess() : null
            })
  }


  let theDB = {}
  theDB[dbName] = dataFormat

  for (let clientId in clients){
    for(let token in clients[clientId].token){



      function sendToClient(){
        socketClients[clientId].socket.send( stringIt( {token:token,data:data,type:'onopen',operationType:type} ) )
      }



      if (matchQuery(clients[clientId].token[token].where,data) === true){
        console.log('permi')
        checkPermission2(clients[clientId].user,sendToClient) 
      } 
    }
  }
}


function handleParse(prop){

  let userData = prop.user
  let appName = prop.app
  if (!prop.field) prop.field = null
  if (!prop.put) prop.put = null
  if (!prop.type) prop.type = 'api' //obey permission or not
  if (!prop.success) return new Promise(resolveHandleParse=>{
    doParse(resolveHandleParse,prop.failure)
  })

  if (!prop.failure) prop.failure = prop.success

  doParse(prop.success,prop.failure)

  function doParse(success,failure){
    parse(prop.parse,parseScope(prop.field, prop.put, prop.user, prop.type)).then(response=>{
      success(response)
    }).catch(err =>{
      console.log(err,'there is an error')
      failure({error:err})
    })
  }  



  function parseScope(field,put,userData,via){

            return new class extends helperFunctions{
              constructor(){
                super()
                this.field = field//for permission check
                this.put = put//for permission check
                this.via = via
                this.date = Date.now()
                this.user = userData
                this.getFollowerCount = getFollowerCount
                this.random = random
                this.read = this.read.bind(this)
                this.write = this.write.bind(this)
                this.update = this.update.bind(this)
                this.erase = this.erase.bind(this)

              }

              async write(par){
                var queryOu = await handleQuery('write',par,this.via)  
                return queryOu
              }async read(par){
                // throw new Error('error  does not exist in raniable name:')
                var queryOu = await handleQuery('read',par,this.via)
                return queryOu
              }async update(par){
                var queryOu = await handleQuery('update',par,this.via)
                return queryOu
              }async erase(par){
                var queryOu = await handleQuery('erase',par,this.via)
                return queryOu
              }follow(obj){
                var toFollow =  obj.person

                if (!toFollow) return {error:'parameter error'}

                return new Promise(resolve=>{

                    var follow = new db.action({
                      sender:userData.id,
                      receiver:toFollow,
                      type:'follow'
                    })

                    follow.save(error=>{

                      if (!error) resolve( {status:'following', person:toFollow} )
                      if(error.code = 11000) {
                        db.follow.deleteOne({sender:userData.id, receiver:toFollow, type:'follow'}, err=> err == undefined? resolve( {status:'unfollowed', person:toFollow} ) : resolve(err) )
                      }else{resolve(error)}

                    })

                })
              }like(obj){
                var contentId = obj.on

                if (!contentId) return {error:'parameter error'}

                return new Promise(resolve=>{


                   db.vDb.findOne({_id:contentId}, function(err,objData) {

                    var receiver = objData.writer//what if writer doesn't exist

                    if (!receiver) return resolve({error:'author not found'})

                    var follow = new db.action({
                      sender:userData.id,
                      reference:contentId,
                      receiver:receiver,
                      type:'follow'
                    })

                    follow.save(error=>{

                      if (!error) resolve( {status:'following', person:toFollow} )
                      if(error.code = 11000) {
                        db.follow.deleteOne({sender:userData.id, reference:contentId, type:'follow'}, err=> err == undefined? resolve( {status:'unfollowed', person:toFollow} ) : resolve(err) )
                      }else{resolve(error)}

                    })

                  })



                })
              }checkFollow(obj){
                var person = obj.of

                return new Promise(resolve=>{
                  db.action.findOne({ sender:userData.id, receiver:person, type:'follow' },
                    function(err, info_main){
                      if (err) return resolve(err)
                      isEmpty(info_main) === true? resolve(true):resolve(false)
                    } 
                  )
                })
              }checkLike(obj){
                var contentId = obj.on

                return new Promise(resolve=>{
                  db.action.findOne({ sender:userData.id, reference:contentId, type: 'like' },function(err, info_main){
                    if (err) return resolve(err)
                    isEmpty(info_main) === true? resolve(true):resolve(false)
                  })

                })
              }followings(obj){
                var person = obj.of
                return followList(person,'followings')
              }followers(obj){
                var person = obj.of
                return followList(person,'followers')
              }Countfollowings(obj){
                var person = obj.of
                return count(person,'following')
              }Countfollowings(obj){
                var person = obj.of
                return count(person,'followers')
              }Countlikes(obj){
                var person = obj.on
                var contentId = obj.for

                var query = {type:'like'}

                if (person) Object.assign(query,{receiver:person} )
                if (contentId) Object.assign(query,{reference:contentId} )

                return new Promise(resolve => {

                    if (!prsedUserId){
                        console.log('parameter not available to getFollowerCount',person)
                        return resolve(0)
                    } 

                    db.action.countDocuments(query, function(err, info){
                      console.log('follow count: '+info)
                      resolve(info)
                    })

                })
              }


            }
  }

  function handleQuery(type,par,via){

          return new Promise(resolve=>{
              
              var DBName = par.on
              var databaseSchema = prop.database
              var theDatabaseInfo = databaseSchema[DBName]

              
              if (!theDatabaseInfo) return resolve({error:'Check DB name'})
              if (!theDatabaseInfo.memoryAllocation) return resolve({error:'Check Memory allocation not found'})

              if (!par.put) par.put = null

              console.log('processing query')//appname doesn't exist

              var relation = theDatabaseInfo.memoryAllocation
              var putQuery = {}
              var writeQuery = {dbName:appName+'_'+DBName}
              var whereQuery = {dbName:appName+'_'+DBName}

              

              prepareQuery(par.put,par.where).then(function(QQQ){

                putQuery = QQQ.put
                writeQuery = Object.assign(writeQuery,QQQ.put )
                whereQuery = Object.assign(whereQuery,QQQ.where )
                
                executeQuery()
              })

              async function prepareQuery(put,where){
                console.log('processing query 1')
                const newPut = await renameInput(par.put)
                const newWhere = await renameInput(par.where)
           
                return{put:newPut,where:newWhere}
              }

              async function renameInput(interfaceObject){

              
       
                //why is field value not available to write, read and update parse: because it doesn't needs one it is only required for the permission parse as no one will say write $writer or read where $writer = user id they can just use the field name

                var schemaObject = {}
                // if(!interfaceObject) return {} //what error will it create

                //to do: time will be also needed or maybe it should use date and time mongo type so that we can query older than ... 
                var publicData = {}//available data for default value
                publicData.user = userData

                if(interfaceObject){
                  if (interfaceObject['_id']) schemaObject['_id'] = interfaceObject['_id']
                  if (interfaceObject['id']) schemaObject['_id'] = interfaceObject['id']
                }

                for(let key in relation){

                  if(!interfaceObject) break

                  if (interfaceObject[key]){
                    schemaObject[ relation[key] ] = interfaceObject[key]
                  }else if(type === 'write'){
                    let defaultValue = theDatabaseInfo.schema[key].default

                    if (defaultValue){

                      //either put query or the where query
                      
                     
                        const parsedWriteObject = await handleParse({app:appName, parse:defaultValue, put:par.put, failure: resolve, database:databaseSchema, user:userData})
                        schemaObject[ relation[key] ] = parsedWriteObject
         


                    }else{
                      schemaObject[ relation[key] ] = null
                    }
   

                  }          
                }

                //Generate unique string 
                //in the put query if uniqe doesn't exist, if it exist
                //if this is a write request?
                if (!schemaObject['unique'] && type === 'write'){
                  schemaObject['unique'] = Math.random().toString(36).substring(2, 15)+Math.random().toString(36).substring(2, 15)
                }

                if (!schemaObject['writer'] && type === 'write'){
                  schemaObject['writer'] = userData.id
                }


               

                return schemaObject
              }


              function checkPermission(row,onSuccess,onFailure){

                if(!theDatabaseInfo.permission)return onSuccess(true)
                var permissionToDatabase = theDatabaseInfo.permission[type]
                if(!permissionToDatabase)return onSuccess(true)

                handleParse({app:appName, parse:permissionToDatabase, put:par.put, field:renameOutput(row,relation),  success:parseSuccess, failure: resolve, database:databaseSchema, user:userData})

                function parseSuccess(data){
                  if(data === true){
                    return onSuccess(true)
                  }else{
                    if(onFailure) onFailure(data)
                    console.log('unexpected permission code: '+data)
                  }
                }

              }
              
              function loopPremissionCheck(info_read,callback){
   
                if (info_read.length === 0) callback(info_read)
                var filteredRows = []
                let loopStep = 0
                permissionLoopChecker()

                function permissionLoopChecker(){

          
                  function readAllowed(){
                    filteredRows.push( renameOutput(info_read[loopStep],relation) )
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

                    for (key in unMutableFields){
                      if (queryToCheck[key]) return resolve({error:'field'+unMutableFields[key]+'is not mutable'})
                    }

                    if (just === 'mutation') return

                    for (key in requiredFields){
                      if (!queryToCheck[key]) return resolve({error:'required field'+requiredFields[key]+'missing'})
                    }
                }


                //get requored field


                switch(type.toLowerCase()){
                  case 'write':

                    function writeFunction(){
                      var vr_schema = new db.vDb(writeQuery)
                      vr_schema.save((error,writenObj)=>{
                        if (error) return resolve(error)
                        return resolve(renameOutput(writenObj,relation))
                      })
                    }

                    if(via === 'action') return writeFunction()


                    requiredMutableFieldCheck(writeQuery)
                    checkPermission(null,writeFunction,failure)


                    break
                  case 'update':
                    db.vDb.find(whereQuery, function(err, info_read){
                      if (err) return resolve(err)
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

                    function listUpdate(obj){
                      return new Promise(resolve=>{
                          db.vDb.findOneAndUpdate({_id: obj.id},putQuery,{returnOriginal : false},function(error, doc){
                            if (error) return resolve(error)
                            return resolve( renameOutput(doc,relation) )
                          })

                      })
                    }

                    break
                  case 'read':
                    
                    let sortBy = {sort:{}, limit: 50}

                    var sortAccordingTo = 'created_at'
                    var sortType = 1
                    var relationObject = relation
                    if (par.limit) sortBy.limit = par.limit
                    if(par.sortBy && relationObject[par.sortBy]) sortAccordingTo = relationObject[par.sortBy]
                    sortBy.sort[sortAccordingTo] = sortType// null, {sort: {date: 1}}

                    console.log('sorting by..',sortBy)

                    db.vDb.find(whereQuery,null,sortBy,function(error, info_read){
                      if (error) return resolve(error)
                      if(via === 'action') return resolve(info_read)

                      loopPremissionCheck(info_read,resolve)
                    })
                    break
                  case 'erase':
                    // db.vDb.deleteOne(newQueryInput, function(err) {
                    //   if(!err) resolve(true)
                    // })
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

            if (!prsedUserId){
                console.log('parameter not available to getFollowerCount',person)
                return resolve(0)
            } 

            db.action.countDocuments(query, function(err, info){
              console.log('follow count: '+info)
              resolve(info)
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

  function getFollowerCount(prsedUserId){

    return new Promise(resolve => {

      if (!prsedUserId){
          console.log('parameter not available to getFollowerCount',prsedUserId)
          resolve(0)
      } 

      db.action.countDocuments({receiver:prsedUserId,type:'follow'}, function(err, info){
        console.log('follow count: '+info)
        resolve(info)
      })

    })
  }

}

function handlePost(req, res, userData,currentApp){

  var qBody = ''
  var reqData = req.body

  console.log(reqData.type)


  if(reqData.data){

    try{
      qBody = JSON.parse(reqData.data) //remember data is passed 
    }catch(e){

      if(reqData.data.indexOf('{') !== -1 || reqData.data.indexOf('}') !== -1) return res.send(e)//json encoding error
      qBody = reqData.data
    }
  }

  switch(reqData.type.toLowerCase()){
    case'ad':
      break
    case'db':

      if (!userData)  return res.send({error:'Login required'})
      var appName = req.body.name
      
      db.law.find({app:appName},function(err, info_main){

        if (err)  return res.send({error:err})
        var database = JSON.parse(info_main[0].DBs)

        let prop = {app:appName, parse:qBody, success:res.send.bind(res), database:database, user:userData}
        handleParse(prop)


      })


      break
    case'knock':
      console.log('login')
      let redirect = qBody.redirect
      let salt =  hash(null)
      qBody.password = hash(qBody.password)
      var user_save = new db.users({
          userName:qBody.username,
          password:qBody.password,
          cookie: salt
        })

      user_save.save(error=>{ 

          function sendCookie(cookie){
                  res.send( {code:200,msg:cookie} )
                  console.log('logged in',cookie)
          }
        if (error){

          if (error.code == 11000){

            db.users.find({userName:qBody.username} , function(err, info){

              if (info[0].password == qBody.password){

                sendCookie(info[0].cookie)
                
                //if not authorized make a redirect to the auth page and with the redirect variable

              }else{

                res.send(  {code:400,msg:'wrong password or username already exist'} )

              }

            })
          }else{console.log(error) }
        }else{
          sendCookie(salt)
        }
      })
      break
    case'new':

      qBody.db = JSON.stringify(qBody.db)

      if (!qBody.logo) qBody.logo = null
      if (!qBody.description) qBody.description = null
      if (!qBody.meta) qBody.meta = null
      if (!qBody.searchable) qBody.searchable = false
      if ( typeof qBody.searchable !== 'boolean') qBody.searchable



      function allocateMemory(dataDB){
                var relation = {}
                var string_increment = -1
                var number_increment = -1
                var array_increment = -1

                var originalSchema = dataDB.schema

                if (originalSchema.memoryAllocation) {

                  var existingRelation = dataDB.memoryAllocation

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


                    var contrainsts = {N:6,A:1,S:6}

                    if ( fieldIndex > ( contrainsts[fieldType] - 1 ) ){
                       res.send(  { code:400,msg:'Memory allocation error'} ) 
                    }
                    
                    relation[index] = fieldType+'_'+fieldIndex
                  }
                } 

                return relation
      }



      function saveDB(){

        if(!qBody.db) return

        db.law.findOne({ app:qBody.name }).then(rulesFound=>{

          var dataDB = JSON.parse(qBody.db)

          function updateDB(){
            var relation = rulesFound.memoryAllocation
            for (key in dataDB){
              var newRelation  = allocateMemory( dataDB[key] )
              dataDB[key].memoryAllocation = newRelation
            }
            dataDB = JSON.stringify(dataDB)
            db.law.findOneAndUpdate({ app:qBody.name },{DBs:dataDB},{new: true,runValidators: true }).then(msg=>{console.log('laws updated')})
          }

          function writeDB(){
            var rule_save = new db.law({
              app:qBody.name,
              DBs: qBody.db
            })

            rule_save.save(error=>{
              if(error)error.code == 11000? updateDB() :console.log(error)
            })            
          }

          function addTasks(dbTasks){

            let tasksPutValues = {}
            for(let when of ['daily','weekly','monthly','yearly']){
              if (dbTasks[when]) taksPutValues[when] = dbTasks[when]
              if (!dbTasks[when]) taksPutValues[when] = null
            }

            db.law.findOneAndUpdate({ app:qBody.name },tasksPutValues,{new: true,runValidators: true }).then(msg=>{console.log('tasks updated')})
          }

          if (dataDB.tasks) addTasks(dataDB.tasks)
          rulesFound === null? writeDB() : updateDB()

        })
      }

      saveDB()//save rrules
    
      //save actual apps
      qBody.password = hash(qBody.password)
      db.apps.find({name:qBody.name} , function(err, info){

        if (info.length == 0) {

          var newapp = new db.apps({
            name:qBody.name,
            password:qBody.password,
            logo:qBody.logo,
            description:qBody.description,
            meta:qBody.meta,
            searchable:qBody.searchable,
            seed:qBody.peerid
          })

          newapp.save(error=>{
            if (error) throw error;
            res.send({ code:200,msg:'hosted' })
          })
        }else if(info[0].password == qBody.password){
          db.apps.findOneAndUpdate({name:qBody.name},
          {
            seed:qBody.peerid,
            logo:qBody.logo,
            description:qBody.description,
            meta:qBody.meta,
            searchable:qBody.searchable
          },{new: true,runValidators: true}).then(doc => {
          res.send({code:200,msg:'updated'})
          }).catch(err =>console.error(err))
        }else{ res.send(  { code:400,msg:'wrong app or password ip:'} ) }
      })

      db.peers.deleteMany({files:qBody.name+'/index'}, function(err) {
        if (!err) {console.log('deleted! peers') }
        else{ console.log(err) }
      })//remove older version from network

      break
      // to do: version update: whenever apps are updated remove all peers!
    case'chache_hash':
      // console.log('its chache_hash')
      qBody.url = JSON.parse(req.body.configuration).name+qBody.url
     

      qBody.response = JSON.stringify(qBody.response)

   

      var chache_save = new db.chache({
        url: qBody.url,
        data: qBody.response
      })

      chache_save.save(error=> {if(error){
        
        if (error.code == 11000) db.chache.findOneAndUpdate({ url:qBody.url },{data:qBody.response},{new: true,runValidators: true },(error, doc) => {
          if (error) console.log(error)
          console.log('Chache updated')
        })
        
      }})

      let new_hash = hash(qBody.response) 

      var hash_save = new db.hash({
        url: qBody.url,
        data: new_hash
      })

      hash_save.save(error=> {if(error){
         if (error.code == 11000) db.hash.findOneAndUpdate({ url:qBody.url },{data:new_hash},{new: true,runValidators: true })
       }})
      break
    case'peerfile':
      var pid = req.body.pid
      var oldpeer = req.body.oldpeer
      var app_n = req.body.app
      var fileName = app_n+req.body.file;
      var chached = null

      if (oldpeer)deletePeer(oldpeer)
        
      //push peer on data received (chache fallback makes it very less likely)
      //fix indention from sublime text
        db.peers.find({files:fileName} , function(err_o, info_o){
          if (err_o){
            console.log(err_o)
            return sendSavedChache()
          }

          function sendSavedChache(){//find one
            db.chache.find( {url:fileName} , function(err_o, info_o){
              if(info_o.length == 0) return res.send( { error:'404 App not found' } )
              if (err_o) return console.log(err_o)
              if(info_o[0]) chached = info_o[0].data
              res.send( { chache:chached } )
              savePeer(pid,fileName)

             })            
          }

          if(info_o.length !== 0 && oldpeer == undefined){// if other peer exist
            res.send( { id:info_o[info_o.length-1].peerId} )
            savePeer(pid,fileName)
          }else{// fallback
            sendSavedChache()
          }

        })

            
      function savePeer(pid,filename){

        var peer_s = new db.peers({
          files: filename,
          peerId:pid
        })

        peer_s.save(error=> {if(error){
            console.log('!!!!!!!!!updating peer: '+pid,error.code)
            if (error.code == 11000) db.peers.findOneAndUpdate({ peerId:pid }, {'$addToSet': {files:filename}} ).then(console.log)
        }})
      }
      break
  }  
}





function getUserIdFromCookie(cookieid){

  return new Promise(resolve=>{
     if (!cookieid) return resolve(null)
    db.users.find({cookie:cookieid} , function(err, info){
      if (err) resolve(err)
      resolve(info)
    })
  })
}

function setup(){
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())
  app.use(function(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
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

function deletePeer(id){

  db.peers.deleteOne({ peerId:id}, function(err) {

    if (!err) {console.log('deleted!') }
    else{ console.log('error')}

  })
}

function random(){
  return Math.random().toString(36).substring(2, 15)+Math.random().toString(36).substring(2, 15)
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


function renameOutput(tobeoutputed,relation){

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

                  if ( swappedRelation[key] ){
                    returnObject[ swappedRelation[key] ] = tobeoutputed[key]
                  }else if (key === 'id'){
                    returnObject['id'] = tobeoutputed[key]
                  }else if (key === 'writer'){
                    returnObject['writer'] = tobeoutputed[key]
                  }//exception for id

                }

                 
                return returnObject
}

function frameHtml(){
  return '<html> <head></head> <body></body> <script class="hostea" mode="'+runtm.type+'" job="receive" src="'+lcUrl('loader.js')+'"> </script> </html>'
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

 function ObjectLength(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

var srv = app.listen(runtm.port, (err) => { console.log("App started on:"+lcUrl('') ) });