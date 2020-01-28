var {random,stringIt,removeKey} = require('./functions.js')

let roomsRegistry = {}
let socketClients = {}
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
      broadcast(roomToken,msg.content,'ondata',roomLabel)
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

        if (  Object.keys(roomsRegistry[roomLabel].notFull).length === 0 ) {
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

module.exports = connectToRoom