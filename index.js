var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var cry = require('crypto')
var db = require('./db.js')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(function(req, res, next){
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

let appDB = db.apps,
peerDB = db.peers,
chacheDB = db.chache,
hashDB = db.hash,
userDB = db.users,
vDb = db.vDb,
runtm = {}

if(process.env.PORT == undefined){
  runtm.host = 'localhost'
  runtm.port = 8080;
  runtm.type = 'testing'
  runtm.staticPort = 8080;
}else{
  runtm.host = 'serverination.herokuapp.com'
  runtm.port = process.env.PORT;
  runtm.type = 'online'
  runtm.staticPort = 80;//heroku server works on dynamic port but listens on static port 80
}

app.post('/', (req, res) => {

  console.log(req.body)
  if(req.body.data) var qBody = JSON.parse(req.body.data)

  if (req.body.type == 'ad'){//post ad//the advertisement will act like an serverination app

  }else if (req.body.type == 'db'){//virtual data

    //virtual schema rules
    //series of action as per condition
    // find(sacascas) > do this > do this return() | find(sacascas) > do this > do this return() 

    var whatTO = data.type

    if(data == 'create') {

    }else if(data == 'read') {
      
    }else if(data == 'write') {
      
    }
    


    // db schema ty

    //(update not allowed, read only)
    //1 //type:: payment
        // writer: input

        // user:: input
        //amount:: input 
        // bitcoin string (generated)

        //enum (yes or no): only server bitcoin exchange instance can change

    //custom
      /*
      config{
        allowUpdate: 0,1
        public_read: 0 1
        Publuc_write: 0 1
      }

      schema{
        val0:
        val1:
      }

      */

    //qBody.app it should be detected automatically
    //qBody.action qBody.value_array qBody.app

  }else if(req.body.type == 'getUser' && runtm.type == 'testing' ){//user data

    getUser(qBody,req,res,null)

  }else if (req.body.type == 'knock'){//send cookie

      console.log('login')
      let redirect = qBody.redirect

      let salt =  hash(null)
      qBody.password = hash(qBody.password)

      var user_save = new userDB({
          userName:qBody.username,
          password:qBody.password,
          cookie: salt
        })

      user_save.save(error=>{ 

          function sendCookie(cookie){
                  res.cookie('user',cookie, { maxAge: 900000, httpOnly: true });
                  res.send( {code:200,msg:cookie} )
                  console.log('logged in',cookie)
          }

        if (error){

          if (error.code == 11000){

            userDB.find({userName:qBody.username} , function(err, info){

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

  }else if (req.body.type == 'new'){

    appDB.find({name:qBody.name} , function(err, info){
    qBody.password = hash(qBody.password)

      if (info.length == 0) {

        var newapp = new appDB({
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

      appDB.findOneAndUpdate({ name:qBody.name },{seed:qBody.peerid},{new: true,runValidators: true }).then(doc => {
        res.send( { code:200,msg:'updated' }  )
      }).catch(err =>console.error(err) )

      }else{
        res.send(  { code:400,msg:'wrong app or password ip:'} )
      }
      

    } )

  }else if(req.body.type == 'chache_hash'){

    qBody.url = JSON.parse(req.body.configuration).name +qBody.url
     

    qBody.response = JSON.stringify(qBody.response)

   

      var chache_save = new chacheDB({
        url: qBody.url,
        data: qBody.response
      })

      chache_save.save(error=> {if(error){

        console.log(error.code,'updated',error)

        if (error.code == 11000) chacheDB.findOneAndUpdate({ url:qBody.url },{data:qBody.response},{new: true,runValidators: true })
        
      }})

      let new_hash = hash(qBody.response) 


      var hash_save = new hashDB({
        url: qBody.url,
        data: new_hash
      })

      hash_save.save(error=> {if(error){

         if (error.code == 11000) hashDB.findOneAndUpdate({ url:qBody.url },{data:new_hash},{new: true,runValidators: true })

       }})

      
  }else if(req.body.type == 'peerFile'){

    var pid = req.body.pid
    var oldpeer = req.body.oldpeer
    var app_n = req.body.app
    var fileName = app_n+req.body.file;
    var chached = null

    if (oldpeer)deletePeer(oldpeer)
      
    //push peer on data received (chache fallback makes it very less likely)
    //fix indention from sublime text
      peerDB.find({files:fileName} , function(err_o, info_o){

        if(info_o.length !== 0 && oldpeer == undefined){// if other peer exist
          res.send( { id:info_o[0].peerId} )
          savePeer(pid,fileName)
        }else{// fallback
          chacheDB.find( {url:fileName} , function(err_o, info_o){
            if(info_o[0]) chached = info_o[0].data
            res.send( { chache:chached } )
            savePeer(pid,fileName)
           })
        }
      })

          
    function savePeer(pid,filename){

      var peer_s = new peerDB({
        files: filename,
        version:0,
        peerId:pid
      })

      peer_s.save(error=> {if(error){
          console.log('!!!!!!!!!updating peer: '+pid,error.code)
          if (error.code == 11000) peerDB.findOneAndUpdate({ peerId:pid }, {'$addToSet': {files:filename}} ).then(console.log)
      }})
  }

  }
})

app.get('/', (req, res) => {//exception for get request

  function srh(query){
    let search_config = {'$text': {'$search': query} }
    query == null? search_config = {}:null
    appDB.find(search_config).limit(10).exec(function(err, info){
      data = []
      for(index of info){ data.push( {name:index.name} ) }
      res.send( data ) 
    })
  }

  if (req.query.app || req.query.app == ''){
     req.query.app == ''? srh(null) : srh(req.query.app)
  }else{return res.redirect('/home')}

})// main file and search

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
    var frameHtml = '<html> <head></head> <body></body> <script class="hostea" mode="'+runtm.type+'" job="receive" src="'+lcUrl('loader.js')+'"> </script> </html>'
    res.send(frameHtml)
  }
})// send peer site


function getUser(cookieid,req,res,app){
  //also do auth by app name
  userDB.find({cookie:cookieid} , function(err, info){
    res.send( { id:info[0].id, username:info[0].userName })
    console.log('logged in' ,info[0],)
  })

}

function deletePeer(id){

  peerDB.deleteOne({ peerId:id}, function(err) {

    if (!err) {console.log('deleted!') }
    else{ console.log('error')}

  })
}

function hash(data){
  if(data == null) data = Math.random().toString(36).substring(2, 15)+Math.random().toString(36).substring(2, 15)
  return cry.createHmac('sha256',data).digest('hex')
}

function lcUrl(url){ return 'http://'+runtm.host+':'+runtm.staticPort+'/'+url }

var srv = app.listen(runtm.port, (err) => {console.log("App started....")});
var server = require('peer').ExpressPeerServer(srv, {debug: true })
app.use('/peerjs',server)

server.on('connection', (id) => console.log('connect ' + id) );
server.on('disconnect', function(id) {

  console.log('disconnected ' + JSON.stringify(id))
  deletePeer(id)
});