if(!process.env.PORT) require('dotenv').config();
const express = require('express')
const bodyParser = require('body-parser')
const app = express()


const db = require('./db.js')
const runtm = setup()
var expressWs = require('express-ws')(app);
const cron = require("node-cron");






var multer  = require('multer')



const handleParse = require('./handleParse.js')
const cronWorker = require('./cronWorker.js')

const handlePost = require('./handlePost.js')

//liveDb
const liveDb = require('./liveDb.js')
db.vDb.watch({ fullDocument: 'updateLookup' }).on('change', liveDb.sendLiveDbToSocket)
app.ws('/query', liveDb.livedbAddNewSocket )

const connectToRoom = require('./room.js')
app.ws('/room', connectToRoom )

var {getUserData,checkBalance,random}  = require('./functions.js')

//cron
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





//subdomain

app.set('subdomain offset', 0);
app.get('*', (req, res) => {

  function sendJS(file_name){
    res.set('Content-Type','application/javascript',)
    res.sendFile( __dirname + "/" + file_name )
    // console.log(__dirname,file_name)
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

  if(path === '/apple-touch-icon'){
    sendFile( sub+'-apple-touch-icon' )
  }else if(path === '/uponOne.js'){
    sendJS('uponOne.js')
  }else if(path === '/loader.js'){
    sendJS('./loader.js')
  }else if(path === '/telepathy.js'){
    sendJS('lib/telepathy.js')
  }else if(path === 'objlogic.js'){
    sendJS('lib/objlogic.js')
  }else if(sub === 'source'){
    sendJS('uponOne.js')
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
  }else if(path.indexOf('.') !== -1){

     sendFile( sub+'-'+path.replace(/\//gi,'') )//for all local file + /favicon.ico' + /manifest.json

  }else{
    
    if(sub === 'home' || sub === '' || sub === 'www'){
      console.log(sub)
      return res.sendFile('index.html', {root: __dirname })
    }

    frameHtml(res,sub)
  }
})








//Storage

var storage = multer.memoryStorage()
var upload = multer({
 storage: storage,
 limits: { fileSize: 1048576 }//to do bytes?
 }).single('file')//limitation: large files can crash server
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
          db.files.findOneAndUpdate({ filename:fileName, owner:user},{
            size: req.file.size/(1000),
            data: req.file.buffer,
            filetype: req.file.mimetype,
            encoding: req.file.encoding
          },{new: true, passRawResult : true},(errorUpdate,info)=>{

            if(errorUpdate) return res.send({error:errorUpdate})

            if(!info) return res.send({error:'permission denied for update of: '+fileName})
            if(info.owner !== user) return res.send({error:'permission denied for update of: '+fileName})



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










//post
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

//remove adsense script

function frameHtml(res,domain){

   

  let fullHTML=`<html> 
                <head>
                  <!-- Global site tag (gtag.js) - Google Analytics -->
                  <script async src="https://www.googletagmanager.com/gtag/js?id=UA-90406803-2"></script>
                  <script>
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());

                    gtag('config', 'UA-90406803-2');
                  </script>

                  <meta name="apple-mobile-web-app-capable" content="yes">
                  <meta name="mobile-web-app-capable" content="yes">
                  <meta name='viewport' content='width=device-width, initial-scale=1.0, user-scalable=0' >

              </head> 

        <body></body>
          <script class="hostea"  app_name="${domain}" mode="${runtm.type}" job="receive" src="${ lcUrl('loader.js') }">
          </script>



 

         </html>`

         res.send(fullHTML)
}

function lcUrl(url){
 return 'http://'+runtm.host+':'+runtm.staticPort+'/'+url 
}

var srv = app.listen(runtm.port, (err) => { console.log("App started on:"+lcUrl('') ) });