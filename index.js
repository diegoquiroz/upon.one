var express = require('express')
var bodyParser = require('body-parser')
 
var app = express()
 
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())
 
var port = 9000

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


app.get('/', (req, res) => res.send('Hello World!'))

app.post('/', (req, res) => {

  // let toBsaved = req.query;
  res.status(200).send('hey')
  // res.send('data saved')

});





srv = app.listen(port, (err) => {
  console.log("App started....")
});

app.use('/peerjs', require('peer').ExpressPeerServer(srv, {
  debug: true
}))