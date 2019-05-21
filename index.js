var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var PeerServer = require('peer').PeerServer;



app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())



app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
// app.use(express.static(__dirname__ + '/public'));



let db = require('./db.js')
let app_set = db.apps
let peer_set = db.peers

let runtm = {}


// console.log(process.env.PORT)

if(process.env.PORT == undefined){
  runtm.host = 'localhost'
  runtm.port = 8080;
  runtm['type'] = 'testing'
}else{
  runtm.host = 'serverination.herokuapp.com'
  runtm.port = process.env.PORT || 8080;
  runtm['type'] = 'online'
}

runtm.port = process.env.PORT || 8080;

var frameHtml = '<html> <body> <script class="hostea" mode="'+runtm['type']+'" job="receive" src="http://'+runtm.host+':'+runtm.port+'/serverination.js"> </script> </body> </html>'

app.get('/', (req, res) => {
  res.send('home')
})

app.get('/:id', (req, res) => {

  if(req.params.id == "serverination.js"){

    res.set(
      'Content-Type','application/javascript',
    );

    res.sendFile( __dirname + "/" + "serverination.js" )
    console.log('ser')
  }else{
    console.log(frameHtml)
    res.send(frameHtml)
  }

})

function savePeer(pid,appname){
  //if already exist then update
            var peer_s = new peer_set({
              app: appname,
              version:0,
              peerId:pid
            })

            peer_s.save(error=> {if(error)throw error})
}

app.get('/:id/:data', (req, res) => {

    console.log('data with index')

    var pid = req.query.pid
    var app_n = req.params.id
    // console.log(pid,'pid')
    if (req.params.data == 'index') {

      peer_set.find({app:app_n} , function(err_o, info_o){

        // console.log(info_o)
        if(info_o.length !== 0){// if other peer exist
            res.send( JSON.stringify( info_o[0].peerId ) )
            savePeer(pid,app_n)
            console.log('if other peer exist')
        }else{//if only seed is online
          
          app_set.find({name:app_n} , function(err, info){
            console.log('if only seed is online')
            if(info.length !== 0){

              res.send( JSON.stringify( info[0].seed ) )
              savePeer(pid,app_n)

            }else{res.status(404).send(JSON.stringify('Not found') )} 

          })
        }
      })







  }else{
    //could be /peerjs
    // server will connect to the peer and access the file
  }

  
})


app.post('/', (req, res) => {

  let qBody = JSON.parse(req.body.data)

    app_set.find({name:qBody.name} , function(err, info){

      if (info.length == 0) {

        var newapp = new app_set({
          name:qBody.name,
          password:qBody.password,
          version:0,
          seed:qBody.peerid
        })

      newapp.save(error=>{ 
        if (error) throw error;
        res.send('hosted')
      })

      }else if(info[0].password == qBody.password){

      app_set.findOneAndUpdate({ name:qBody.name },{seed:qBody.peerid},{new: true,runValidators: true }).then(doc => {

        res.send('updated')

      }).catch(err =>console.error(err) )

      }else{
        res.send('wrong app or password')
      }
      

    } )




})


srv = app.listen(runtm.port, (err) => {
  console.log("App started....")
});

// console.log(window.location)

var server =  require('peer').ExpressPeerServer(srv, {
  debug: true
})

app.use('/peerjs',server)
// var server = new PeerServer({port: port, allow_discovery: true});
// var server = PeerServer({port: 8080, path: '/peerjs'});

server.on('connection', function(id) {
console.log('connect ' + id)
});
 
server.on('disconnect', function(id) {
  console.log('disconnected ' + JSON.stringify(id))

  peer_set.deleteOne({ peerId:id}, function(err) {

    if (!err) {
            console.log('notification!');
    }
    else{
           console.log('error') ;
    }

  })

   // peer_set.find({}).remove()

});