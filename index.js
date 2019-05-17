var express = require('express')
var bodyParser = require('body-parser')
var app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
var port = process.env.PORT || 8080;
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
// app.use(express.static(__dirname__ + '/public'));


let db = require('./db.js')
let app_set = db.apps
let peer_set = db.peers


var frameHtml

fetch('serverination.js').then(data =>{
  frameHtml = '<html><script>'+data+'</script> </html>'
})



app.get('/:id/:data', (req, res) => {

  if (req.params.data == null) {
    res.send(frameHtml)
  }else{
    app_set.find({name:req.params.id}).then( data=>{
      res.send(data.seed.id)
    })    
  }  
})



app.post('/', (req, res) => {

  var newapp = new app_set({
    name:req.body.name,
    password:req.body.password,
    version:0,
    seed:req.body.peerid
  })

  newapp.save(error=>{
    if (error) throw err;
    res.send('hosted')
  })

})



srv = app.listen(port, (err) => {
  console.log("App started....")
});

app.use('/peerjs', require('peer').ExpressPeerServer(srv, {
  debug: true
}))