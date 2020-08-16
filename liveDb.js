const db = require('./db.js')
var {getUserData,random,stringIt,removeKey,renameOutput} = require('./functions.js')


let socketRiver = {}

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
    


    socketClients[clientId] = {user:null, socket:ws} //user is not required for live db

    
    //db -> schema, clients-> (user,token -> query)
    //to do dbName can contradict if changed in real time

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


function sendLiveDbToSocket(next){

  // if one thing is mismatched

  //how or works if any of the thing matches return false


  let data = next.fullDocument
  if(!data) return //operation was delete doc

  if(data) data = data.data
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

  let dbName = next.fullDocument.dbName
  let appName = dbName.split('_')[0]
  dbName = dbName.split('_')[1]

  if(!socketRiver[dbName]) return console.log('no socket is looking for this query',socketRiver)
  let dataFormat = socketRiver[dbName].format
  let clients = socketRiver[dbName].clients



  data = renameOutput(data,dataFormat.memoryAllocation,addUniquePrefix(data.dbName))
  



  function checkPermission2(user,onSuccess){


    if (!dataFormat.permission) return onSuccess()
    if (!dataFormat.permission.findable) return onSuccess()
    let permissionToDatabase = dataFormat.permission.findable


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


module.exports = {livedbAddNewSocket:livedbAddNewSocket, sendLiveDbToSocket:sendLiveDbToSocket}