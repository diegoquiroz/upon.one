var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var cry = require('crypto')
var db = require('./db.js')
var runtm = setup()
var objLogic = require('./objLogic.js')

var parse = objLogic.parse
var helperFunctions = objLogic.helperFunctions

// var cookieParser = require('cookie-parser')
//uninstall
// app.use(cookieParser())

//to do declare current app
function handlePost(req, res, userData,currentApp){


  var reqData = req.body
  console.log(reqData.type,JSON.stringify(reqData))
  // var reqDataS = JSON.stringify(reqData.body)

  // console.log(reqData.type,JSON.stringify(reqData.body).substr(0, 10)+'...')

  var qBody = ''

  if(reqData.data){

    try{
      qBody = JSON.parse(reqData.data)
    }catch(e){

      if(reqData.data.indexOf('{') !== -1 || reqData.data.indexOf('}') !== -1) return res.send(e)
      qBody = reqData.data
    }

  }  

  switch(req.body.type.toLowerCase()) {
    case'like':
      break    
    case'follow':

      getUserIdFromCookie(userData.id).then(function(resolveData){
        var sender = resolveData
        var follow = new db.follow({
          sender:sender,
          receiver:req.body.receiver
        })

        follow.save(error=>{
          if (!error) return
          if (error.code = 11000) {
              db.follow.deleteOne({sender:sender,receiver:req.body.receiver}, err=> err == undefined? console.log('deleted!') : console.log(err) )
          }
        })
      })

      break
    case'ad':
      break
    case'db':

      if (!userData)  return res.send({error:'Login required'})
      var appName = req.body.name
      //if serverside is used to detect the app name then dev environment can't be excuted
      
      db.law.find({app:appName},function(err, info_main){

        if (err)  return res.send({error:err})
        var database = JSON.parse(info_main[0].DBs)

        function parseScope(field,put){
            return new class extends helperFunctions{
              constructor(){
                super()
                this.field = field
                this.put = put
                this.user = userData
                this.getFollowerCount = getFollowerCount
                    //just count
                    // random variable
                    // date and time
              }
              

              async write(par){
                var queryOu = await handleQuery('write',par)  
                return queryOu
              }async read(par){
                var queryOu = await handleQuery('read',par)
                return queryOu
              }async update(par){
                 var queryOu = await handleQuery('update',par)
                return queryOu
              }async erase(par){
                var queryOu = await handleQuery('erase',par)
                return queryOu
              }
            }
        }


        function handleQuery(type,par){

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

                executeQuery()
              })

              async function prepareQuery(put,where){
                const newPut = await renameInput(par.put)
                const newWhere = await renameInput(par.where)

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
                if(!interfaceObject) return {}

                //to do: time will be also needed or maybe it should use date and time mongo type so that we can query older than ... 
                var publicData = {}//available data for default value
                publicData.user = userData


                for(let key in relation){
                  if (interfaceObject[key]){
                    schemaObject[ relation[key] ] = interfaceObject[key]
                  }else if(type === 'write'){
                    let defaultValue = theDatabaseInfo.schema[key].default

                    if (defaultValue){

                      //either put query or the where query

                      try{
                        const parsedWriteObject = await parse(defaultValue, parseScope(null,par.put) )
                        schemaObject[ relation[key] ] = parsedWriteObject
                        console.log(schemaObject,'$$$$$$$FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF$$$$$$$$$',parsedWriteObject)
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
                  }//exception for id

                }

                 
                return returnObject
              }

              function checkPermission(row,onSuccess,onFailure){
                var PermissionRange = parseScope(renameOutput(row),par.put) 

                // PUT DOESN'T NEEDS TO BE TRANSFORMED BECAUSE USER SPECIFIES IT
      
                //it will need to be asynchronous!

                var permissionToDatabase = theDatabaseInfo.permission[type]
                if(!permissionToDatabase)return onSuccess(true)
                //could take time, what if permission doesn't exist
               parse(permissionToDatabase,PermissionRange).then(function(data){
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

              //to do:not necessary: async default value parse
              //to do: bug: undefined value makes the whole filterrow undefined

              //fly js is messing up with peeer js
              //slide chnage parameters need to be changed how it updates
              function readHelper(info_read){
                return new Promise(read_resolve=>{

                    console.log(info_read)

                    if (info_read.length === 0) read_resolve(info_read)

                    var filteredRows = []

                    for (let i = 0; i<info_read.length;){


                        function readAllowed(){
                          filteredRows.push( renameOutput(info_read[i]) )
                          CheckEndOrIncrement()
                        }

                        function readNotAllowed(error_read){
                          console.log(error_read)
                          CheckEndOrIncrement()
                        }

                        function CheckEndOrIncrement(){
                          console.log(i)
                          i++
                          if (i=== info_read.length) return read_resolve(filteredRows)
                          //what I learned, i is increment before the return then the loop will go on forever because the i never crosed the condition
                        }

                        checkPermission(info_read[i],readAllowed,readNotAllowed)
                    }

                })
              }

              function WritenUpdateFailure(failureData){

                    return resolve({error:'permission denied',msg:failureData})
              }

              //for read loop through all rows and check if it has the permission
              //for write there is no where command so proceed with input check
              //update command first find the row check permission and then update the row by using id

              function executeQuery(){
                switch(type.toLowerCase()){
                  case 'write':
                    checkPermission(null,function(){
                      var vr_schema = new db.vDb(writeQuery)
                      vr_schema.save((error,writenObj)=>{
                        if (error) return resolve(error)
                        return resolve(renameOutput(writenObj))
                      })
                    },WritenUpdateFailure)
                    break
                  case 'update':
                    db.vDb.findOne(whereQuery, function(err,obj) {
                      //what if obj is empty

                      if (Object.keys(obj).length === 0 && obj.constructor === Object) return resolve( {error:"can't find to update"} )

                      if (err) return resolve(err)
                      checkPermission(obj,function(fc){
                        console.log(obj,'updating',obj.unique)

                        db.vDb.findOneAndUpdate({_id: obj.id},putQuery,{returnOriginal : false},function(error, doc){
                          console.log(doc,'updated',error)
                          if (error) return resolve(error)
                          return resolve( renameOutput(doc) )
                        })

                      },WritenUpdateFailure)
                    })
                    break
                  case 'read':
                    db.vDb.find(whereQuery, function(error, info_read){
                      if (error) return resolve(error)
                      readHelper(info_read).then((filteredRows)=>resolve(filteredRows))
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

        parse(qBody,parseScope(null,null)).then(response=>{
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

      //error
      qBody.law.db = JSON.stringify(qBody.law.db)



      function updateDB(){
        db.law.findOneAndUpdate({ app:qBody.name },{
            DBs:qBody.law.db},{new: true,runValidators: true }).then(msg=>{console.log('laws updated') })
      }

      function saveDB(){
        if(!qBody.law.db) return
          var rule_save = new db.law({
            app:qBody.name,
            DBs: qBody.law.db
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
          console.log(doc,'Chache updated')
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
      console.log(fileName)

      if (oldpeer)deletePeer(oldpeer)
        
      //push peer on data received (chache fallback makes it very less likely)
      //fix indention from sublime text
        db.peers.find({files:fileName} , function(err_o, info_o){
          if(info_o.length !== 0 && oldpeer == undefined){// if other peer exist
            res.send( { id:info_o[info_o.length-1].peerId} )
            savePeer(pid,fileName)
          }else{// fallback
            db.chache.find( {url:fileName} , function(err_o, info_o){
              if(info_o[0]) chached = info_o[0].data
              res.send( { chache:chached } )
              savePeer(pid,fileName)
             })
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

    db.follow.countDocuments({user:prsedUserId}, function(err, info){
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

function hash(data){
  if(data == null) data = Math.random().toString(36).substring(2, 15)+Math.random().toString(36).substring(2, 15)
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