const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const cry = require('crypto')
const db = require('./db.js')
const runtm = setup()
const objLogic = require('./lib/objLogic.js')//commit
// const cron = require("node-cron");

var parse = objLogic.parse
var helperFunctions = objLogic.helperFunctions

// var cookieParser = require('cookie-parser')
//uninstall

// cron.schedule("59 23 * * *", function() {
//   console.log("---------------------");

// });

function isEmpty(obj){
  for(var prop in obj) {
    if(obj.hasOwnProperty(prop)) {
      return false;
    }
  }

  return JSON.stringify(obj) === JSON.stringify({});
}
//to do declare current app
function handlePost(req, res, userData,currentApp){


  var reqData = req.body
  console.log(reqData.type,JSON.stringify(reqData))

  var qBody = ''

  if(reqData.data){

    try{
      qBody = JSON.parse(reqData.data)
    }catch(e){

      if(reqData.data.indexOf('{') !== -1 || reqData.data.indexOf('}') !== -1) return res.send(e)
      qBody = reqData.data
    }

  }  

  switch(req.body.type.toLowerCase()){
    case'ad':
      break
    case'db':

      if (!userData)  return res.send({error:'Login required'})
      var appName = req.body.name
      //if serverside is used to detect the app name then dev environment can't be excuted
      
      db.law.find({app:appName},function(err, info_main){

        if (err)  return res.send({error:err})
        var database = JSON.parse(info_main[0].DBs)

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

        function parseScope(field,put,via){
            return new class extends helperFunctions{
              constructor(){
                super()
                this.field = field
                this.put = put
                this.via = via
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
                console.log(this.user)
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
              var theDatabaseInfo = database[DBName]
              if (!theDatabaseInfo) return resolve({error:'Check DB name'})

              var putQuery = {}
              var writeQuery = {dbName:appName+'_'+DBName}
              var whereQuery = {dbName:appName+'_'+DBName}

              prepareQuery(par.put,par.where).then(function(QQQ){

                putQuery = QQQ.put
                writeQuery = Object.assign(writeQuery,QQQ.put )
                whereQuery = Object.assign(whereQuery,QQQ.where )

                console.log('execute query')
                executeQuery()
              })

              async function prepareQuery(put,where){
                const newPut = await renameInput(par.put)
                const newWhere = await renameInput(par.where)
                console.log('preparing',par.where,newWhere)
                return{put:newPut,where:newWhere}
              } 

              function relations(){
                var relation = {}
                var string_increment = -1
                var number_increment = -1
                var array_increment = -1

                  //to do: if database doesn't exist?

                var originalSchema = database[par.on].schema

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

                    
                    relation[index] = fieldType+'_'+fieldIndex
                  }
                } 

                return relation
              }

              async function renameInput(interfaceObject){

              
                var relation=  relations()
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

                      try{
                        const parsedWriteObject = await parse(defaultValue, parseScope(null,par.put) )
                        schemaObject[ relation[key] ] = parsedWriteObject
                      }catch(err){
                        resolve({error:err})
                        console.error(err)
                      }


                    }else{
                      schemaObject[ relation[key] ] = null
                    }

                  }          
                }

                //Generate unique string 
                //in the put query if uniqe doesn't exist, if it exist
                //if this is a write request?
                if (!schemaObject['unique'] && type === 'write'){
                  console.log(schemaObject,'#############')
                  schemaObject['unique'] = Math.random().toString(36).substring(2, 15)+Math.random().toString(36).substring(2, 15)
                }

                if (!schemaObject['writer'] && type === 'write'){
                  console.log(schemaObject,'#############')
                  schemaObject['writer'] = userData.id
                }


                console.log(schemaObject,'writing default values')

                return schemaObject
              }

              function renameOutput(tobeoutputed){

                function swap(json){
                  var ret = {};
                  for(var key in json){
                    ret[json[key]] = key;
                  }
                  return ret;
                }

                var swappedRelation = swap( relations() )

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

              function checkPermission(row,onSuccess,onFailure){
                var PermissionRange = parseScope(renameOutput(row),par.put) 

                // PUT DOESN'T NEEDS TO BE TRANSFORMED BECAUSE USER SPECIFIES IT
      
                //it will need to be asynchronous!

                if(!theDatabaseInfo.permission)return onSuccess(true)

                var permissionToDatabase = theDatabaseInfo.permission[type]
                if(!permissionToDatabase)return onSuccess(true)
                //could take time, what if permission doesn't exist
                 console.log('engaging parse')

               parse(permissionToDatabase,PermissionRange).then(function(data){
                  console.log('parsed')
                  if(data === true){
                    return onSuccess(true)
                  }else{
                    if(onFailure) onFailure(data)
                    console.log('unexpected permission code: '+data)
                  }
                  
                }).catch(err => function(){
                    resolve({error:err})
                    console.error(err)
                  })
              }


              //to do: bug: undefined value makes the whole filterrow undefined

              function loopPremissionCheck(info_read,callback){
   
                if (info_read.length === 0) callback(info_read)
                var filteredRows = []
                let loopStep = 0
                permissionLoopChecker()

                function permissionLoopChecker(){

          
                  function readAllowed(){
                    filteredRows.push( renameOutput(info_read[loopStep]) )
                    CheckEndOrIncrement()
                  }

                  function readNotAllowed(error_read){//break even if one of the row is out of scope
                    return failure(error_read)
                  }

                  function CheckEndOrIncrement(){

                          loopStep++
                          console.log(loopStep,info_read)
                          if (loopStep >= info_read.length){
                            return callback(filteredRows)
                          }else{
                            permissionLoopChecker()
                          }
                  }

                  checkPermission(info_read[loopStep],readAllowed,readNotAllowed)

                        //if it is a dev environment provide a log file
                        // function readNotAllowed(error_read){
                        //   console.log(error_read,'readNotAllowed')
                        //   CheckEndOrIncrement()
                        // }

                }
              }

              function failure(failureData){
                  return resolve({error:'permission denied',errMsg:failureData})
              }

              function executeQuery(){
                switch(type.toLowerCase()){
                  case 'write':

                    function writeFunction(){
                      var vr_schema = new db.vDb(writeQuery)
                      vr_schema.save((error,writenObj)=>{
                        if (error) return resolve(error)
                        return resolve(renameOutput(writenObj))
                      })
                    }

                    if(via === 'action') return writeFunction()
                    checkPermission(null,writeFunction,failure)
                    break
                  case 'update':
                    db.vDb.find(whereQuery, function(err, info_read){
                      if (err) return resolve(err)
                      if(via === 'action') return loopUpdate(info_read)
                      loopPremissionCheck(info_read,loopUpdate)
                    })

                    async function loopUpdate(filteredRows){

                        console.log('updating',whereQuery,filteredRows)
                        if (filteredRows.length === 0 ) return resolve( {error:"permission denied"} )
                        if (err) return resolve(err)
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
                            return resolve( renameOutput(doc) )
                          })

                      })
                    }

                    break
                  case 'read':
                    // null, {sort: {date: 1}}
                    let sortBy = {sort:{}, limit: 50}

                    var sortAccordingTo = 'created_at'
                    var sortType = 1
                    var relationObject = relations()
                    if (par.limit) sortBy.limit = par.limit
                    if(par.sortBy && relationObject[par.sortBy]) sortAccordingTo = relationObject[par.sortBy]
                    sortBy.sort[sortAccordingTo] = sortType

                    console.log('sorting by..',sortBy)

                    db.vDb.find(whereQuery,null,sortBy,function(error, info_read){
                      if (error) return resolve(error)
                      if(via === 'action') return resolve(info_read)

                      loopPremissionCheck(info_read,resolve)
                    })
                    break
                  case 'erase':
                    // db.vDB.deleteOne(newQueryInput, function(err) {
                    //   if(!err) resolve(true)
                    // })
                    break                              
                }
              }



          })
        }

        parse(qBody,parseScope(null,null,'api')).then(response=>{
          console.log('success',response)
          res.send(response)
        }).catch(err => function(){
          res.send({error:err})
          console.error(err)
        })



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

      console.log(qBody.db)
      //error
      qBody.db = JSON.stringify(qBody.db)



      function updateDB(){
        db.law.findOneAndUpdate({ app:qBody.name },{
            DBs:qBody.db},{new: true,runValidators: true }).then(msg=>{console.log('laws updated') })
      }

      function saveDB(){
        if(!qBody.db) return
          var rule_save = new db.law({
            app:qBody.name,
            DBs: qBody.db
          })

          rule_save.save(error=>{
              if (error) error.code == 11000? updateDB() :console.log(error)
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
            version:0,
            seed:qBody.peerid
          })

          newapp.save(error=>{
            if (error) throw error;
            res.send({ code:200,msg:'hosted' })
          })
        }else if(info[0].password == qBody.password){
          db.apps.findOneAndUpdate({name:qBody.name},{seed:qBody.peerid},{new: true,runValidators: true}).then(doc => {
          res.send({code:200,msg:'updated'})
          }).catch(err =>console.error(err))
        }else{res.send(  { code:400,msg:'wrong app or password ip:'} )}
      })

      db.peers.deleteMany({files:qBody.name}, function(err) {
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
              console.log(err_o,info_o,fileName)
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
          version:0,
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

app.post('/', (req, res) => {

  console.log('cookies',req.body.cookie)

  if (req.body.cookie){
    getUserIdFromCookie( req.body.cookie ).then(function(userId){
      handlePost(req, res, {id:userId[0].id,username:userId[0].userName})
    })
  }else{
     handlePost(req, res)
  }

})

app.get('/', (req, res) => {// main file and search exception for get request

  function srh(query){
    let search_config = {'$text': {'$search': query} }
    query == null? search_config = {}:null
    db.apps.find(search_config).limit(10).exec(function(err, info){
      data = []
      for(index of info){ data.push( {name:index.name} ) }
      res.send( data ) 
    })
  }

  if (req.query.app || req.query.app == ''){
     req.query.app == ''? srh(null) : srh(req.query.app)
  }else{return res.redirect('/home')}
})



app.get('/:id', (req, res) => {// send peer site

    function sendJS(file_name){
    res.set('Content-Type','application/javascript',);
    res.sendFile( __dirname + "/" + file_name )
  }

  if(req.params.id == "serverination.js"){
    sendJS("serverination.js")
  }else if(req.params.id == "loader.js"){
    sendJS("loader.js")
  }else{
    var frameHtml = '<html> <head></head> <body></body> <script class="hostea" mode="'+runtm.type+'" job="receive" src="'+lcUrl('loader.js')+'"> </script> </html>'
    res.send(frameHtml)
  }
})

//shortcircuit
app.get('/:id/:asc', (req, res) => {
    var frameHtml = '<html> <head></head> <body></body> <script class="hostea" mode="'+runtm.type+'" job="receive" src="'+lcUrl('loader.js')+'"> </script> </html>'
    res.send(frameHtml)
})


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

var srv = app.listen(runtm.port, (err) => {console.log("App started....")});
var server = require('peer').ExpressPeerServer(srv, {debug: true })
app.use('/peerjs',server)

server.on('connection', (id) => console.log('connect ' + id) );
server.on('disconnect', function(id) {

  console.log('disconnected ' + JSON.stringify(id))
  deletePeer(id)
});