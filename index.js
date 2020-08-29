if(!process.env.PORT) require('dotenv').config();
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const db = require('./db.js')
const runtm = setup()

const cookieParser = require('cookie-parser');
const GridFsStorage = require("multer-gridfs-storage");

app.use(cookieParser());
var expressWs = require('express-ws')(app);
const cron = require("node-cron");
var multer  = require('multer')
const cronWorker = require('./cronWorker.js')
const handlePost = require('./handlePost.js')

const puppeteer = require('puppeteer')
const ssr = require('./ssr.js')

const fetch = require("node-fetch")

process.on('uncaughtException', function (err) {
  console.error(err.stack);
  console.log("Node NOT closing...");
  //email yourself
});

let dbConnectionsOfApps = {}

const { mongoose } = require('./mongo_config.js');
const crypto = require("crypto");
const handleParse = require('./handleParse.js')

const path = require('path');


//-------------------------------Login with Google-----------------------
let GoogleLoginSecret = '6qxJFE704wpJe2xvjxZ22NR3'
let CLIENT_ID = '140572074409-ijht2s8v0ldnotak190gbqi4gh8ci72e.apps.googleusercontent.com'
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);


async function getUserInfo(accessToken) {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )
  const json = await response.json()
  return json
}


async function handleOAuth2(req, res) {

  let state = JSON.parse(req.query.state)

    const tokenResponse = await fetch(
    `https://www.googleapis.com/oauth2/v4/token`,
    {
      method: 'POST',
      body: JSON.stringify({
        code: req.query.code,
        client_id: CLIENT_ID,
        client_secret: GoogleLoginSecret,
        redirect_uri: state.redirectUri,
        grant_type: 'authorization_code'
      })
    }
  )
  const tokenJson = await tokenResponse.json()
  const userInfo = await getUserInfo(tokenJson.access_token)

  if(tokenJson.error){
    throw(tokenJson)
  }

  if(userInfo.error){
    throw(userInfo)
  }

  return {accessToken:tokenJson.access_token,userInfo:userInfo }
 
  //res.redirect(`http://localhost:3000?${Object.keys(userInfo).map(key => `${key}=${encodeURIComponent(userInfo[key])}`).join('&')}`)
}

async function getUserInfo(accessToken) {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )
  const json = await response.json()
  return json
}


async function getBirthdayNgender(token){
  return await fetch('https://content-people.googleapis.com/v1/people/me?personFields=birthdays,genders&access_token='+token).then(data=>data.json())
}



//--------------------------------------------------------------------

//liveDb
//const liveDb = require('./liveDb.js') foucs on roastagram for now
//db.sandboxDB.watch({ fullDocument: 'updateLookup' }).on('change', liveDb.sendLiveDbToSocket) switch to firing update through
//app.ws('/query', liveDb.livedbAddNewSocket )

//const connectToRoom = require('./room.js')
//app.ws('/room', connectToRoom )


var {getSubdomain,jwtKey,getUserData, jwtKey, generateJWT}  = require('./functions.js');
var jwt = require('jsonwebtoken');

//cron
// cron.schedule("59 23 * * *", ()=>{
//   cronWorker('daily')
// })

// cron.schedule("0 1 1 * *", ()=>{
//   cronWorker('monthly')
// })

// cron.schedule("0 1 1 */3 *", ()=>{
//   cronWorker('quaterly')
//   //every march
// })

// cron.schedule("59 23 * * SAT", ()=>{
//   cronWorker('weekly')
//   //every sunday
// })


// cron.schedule("0 1 1 1 *", ()=>{
//   cronWorker('yearly')
//   //every january
// })









app.set('subdomain offset', 0);

let browserWSEndpoint = null;



app.get('*', async (req, res) => {



  let userAgent = req.get('user-agent')
  let sub = getSubdomain(req)
  let path = req.path
  let reqCookie = req.cookies['user-cookie'] 

 
  

  function sendJS(file_name){
    res.set('Content-Type','application/javascript')
    res.sendFile( __dirname + "/" + file_name )
    // console.log(__dirname,file_name)
  }

  

  if(sub == 'www'){
    let hostLink = req.subdomains
    let wwwIndex = hostLink.indexOf('www')
    hostLink[wwwIndex] = 'home'
    return res.redirect('http://'+hostLink.reverse().join('.'))
  } 

  if(path === '/u.js'){
    sendJS('./u.js')
  }else if(path === '/telepathy.js'){
    sendJS('lib/telepathy.js')
  }else if(path === 'objlogic.js'){
    sendJS('lib/objlogic.js')
  }else if(sub === 'source'){
    sendJS('u.js')
  }else if(req.query.auc){//aus: authentication cookie
    res.cookie('user-cookie',req.query.auc,{expires: new Date(Date.now() + 9999999*99999) });
    res.redirect('http://'+req.get('host'))
    //also remove the question mark redirect
  }else if(sub == 'auth' && req.query.state ){

    let state = JSON.parse(req.query.state) 


    let redirectURLToCheck = state.redirect.replace('http://','').replace('https://','')

 
  
    if(redirectURLToCheck.indexOf('127.0.0.1:') !==0 && redirectURLToCheck.indexOf('localhost:') !==0 && redirectURLToCheck !== state.appName+'.upon.one'){
      return res.send({error:state.redirect+' is unauthorized, go to Admin panel to add additional redirects by pressing CTRL + SHIFT + A'})
    }
    //check redirect permission

    //google login
    handleOAuth2(req, res).then(loginWithGoogle).catch(error=>{
      res.send(error)
    })

    function sendToRightDestination(userdata){
      userdata.appName = state.appName
      let jwtCookie = generateJWT(userdata)
      
      res.redirect(state.redirect+`/?cookie=${jwtCookie}&devLogin=${state.devLogin}`)
    }

    async function loginWithGoogle(data){
  
        let payload = data.userInfo
        let accessToken = data.accessToken

        let genderAndBirthday = await getBirthdayNgender(accessToken)
        
        let gender = 'male'
        let birthday = null
    
        if(genderAndBirthday.genders) if(genderAndBirthday.genders[0].value) gender = genderAndBirthday.genders[0].value
        if(genderAndBirthday.birthdays){
          let lastIndex =genderAndBirthday.birthdays.length -1
          if(lastIndex >= 0){
            birthday = genderAndBirthday.birthdays[lastIndex].date
          }
        }
    
      
    
  
    
          db.users.findOne({email: payload.email} , function(err, info){
    
            if(info){
              sendToRightDestination({name:info.name,username:info.username,id:info.id,email:info.email})
            }else{
              
    
              var user_save = new db.users({
                fullName:payload.name,
                username:random(),
                password:null,
                email:payload.email,
                birthday:birthday,
                gender:gender,
                googleId:googleUserId,
                profile:payload.picture,
                verified:true,
                verificationCode:null
              })
    
            user_save.save((error,info)=>{
              
                if(error) return res.send({error:error.message})
                sendToRightDestination({name:info.name, username:info.username, id:info.id, email:info.email})

            })
    
            }
    
          })
        
    
    
    }

    
  }else if(sub == 'auth' && req.query.logout ){
    res.cookie('user-cookie','', { expires: 0 });

    res.redirect( req.query.logout)
  }else if(sub == 'auth' && reqCookie){

    
    let appToAuthorize = req.query.appName
    if(!appToAuthorize) return res.send('You are Logged in, No app given to authorize')
     
    getUserData(reqCookie,null,sub).then(data=>{


      let payLoad = {email:data.email, id:data.id, username:data.username, appName:appToAuthorize }


      const token = jwt.sign(payLoad, jwtKey,{
        algorithm: "HS256",
        expiresIn: '360 days',
      })

      let authorisingDomain = req.get('host')
      authorisingDomain = authorisingDomain.substr(authorisingDomain.indexOf('.'), authorisingDomain.length) 
      authorisingDomain = 'http://'+appToAuthorize+authorisingDomain
      //auc stands for authorized user cookie
      res.redirect( authorisingDomain+'/?auc='+token );
    })


  }else if (userAgent.indexOf('bot') !== -1){//if google bot or any bot
    
    let url = `${req.protocol}://${req.get('host')}${req.url}`
    console.log(url,'got a bot')


    if (!browserWSEndpoint) {
      const browser = await puppeteer.launch();
      browserWSEndpoint = await browser.wsEndpoint();
    }

    
    const {html} = await ssr(url, browserWSEndpoint,sub);
 
    return res.status(200).send(html);

  }else if(path.indexOf('.') !== -1){

      
      //example of path: favicon.ico in http://baseUrl/favicon.ico 
      let fileName = path.substr(1, path.length-1); //removing slash

    
      sendFile(fileName,req,res)
     //sendFile( sub+'-'+path.replace(/\//gi,'') )//for all local file + /favicon.ico' + /manifest.json
  }else{
    console.log('sending app source')
    sendAppSource( sub, (data)=>{res.send(data) } )
  }
})

//attach login by default in the script tag 

function sendAppSource(fileName,callback){//find one

  db.apps.findOne( {name:fileName.toLowerCase()} , function(err_o, info_o){

    if(!info_o) return callback( { error:'404 '+fileName+' not found' } )
    if (err_o) return console.log(err_o)
    
    
    if(info_o) callback( info_o.source ) 
              
    })            
}
//Storage




//let checksForUpload = {allowedFormats: ["jpg", "png"], transformation: [{ width: 500, height: 500, crop: "limit" }]}



app.post('/upload', function (req, res) {

  let appName = getSubdomain(req)
  
  function errorConnectingToDB(error){
    res.send(error)
  }

  giveConnection(appName,data=>{

    const storage = new GridFsStorage({
      url: data.link,
      file: uploadMiddleWare 
    });
    
    function MBtoBytes(mb){
      return mb*1000*1000
    }
    
    const upload = multer({
     storage: storage,
     limits: { fileSize: MBtoBytes(50) },
     fileFilter:fileFilter
     }).single('file')//limitation: large files can crash server
    

    upload(req, res, function (err) {

      if(err instanceof multer.MulterError){//A Multer error occurred when uploading.
        return res.send({error:err})
      }else if (err){//An unknown error occurred when uploading.
        console.log(err.message)
        return res.send({error:err.message})
      }

      if(!req.file) return res.send({error:'file was not uploaded due to an unexpected error'})
      let newGeneratedName = req.file.filename
      res.send({filename:newGeneratedName,url:req.body.bucket+'/'+newGeneratedName,code:200})
    
    })
  },errorConnectingToDB)

})



async function processCookie(req){

  
    
  let reqCookie = req.body.cookie || req.cookies['user-cookie']

  let devCookie =req.body.devCookie || req.cookies['dev-cookie']//cookie for developers

 

  let userData = reqCookie? await getUserData(reqCookie,null,getSubdomain(req)) : null
  let devData = devCookie? await getUserData(devCookie,null,getSubdomain(req)) : null


  return {user:userData,developer:devData}
} 


//post
app.post('/',(req, res) =>{




  processCookie(req).then(data=>{

    try{
      
      handlePost(req, res, data, getSubdomain(req),giveConnection)
    }catch(error){
      console.log('controlled handle post error',error)
      res.send({error:error.message})
    }
    
  })


})

function setup(){
  // extended=falseis a configuration option that tells the parser to use the classic encoding. 
  app.use(bodyParser.urlencoded( {limit: '5mb', extended: false} ))
  app.use(bodyParser.json( {limit: '5mb', extended: false} ) )
  app.use(function(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Method", 'POST, GET, OPTIONS');
    
    res.header('Access-Control-Allow-Credentials', true);

    next();});

  var config_domain = {}

  if(process.env.PORT == undefined){
    config_domain.port = 8080; //'localhost.com'
    config_domain.staticPort = 8080;
  }else{
    config_domain.port = process.env.PORT; //'upon-one.herokuapp.com'
    config_domain.staticPort = 80;//heroku server works on dynamic port but listens on static port 80
  }

  return config_domain
}


function getType(string){
  string = string.toLowerCase()
  let possibleTypes = ['string','number','boolean','array','object','date']
  if(!possibleTypes.includes(string)) throw Error('invalid type '+string)
  string = string.charAt(0).toUpperCase() + string.slice(1)

  return global[string]
}

function getSchema(collectionSchema,collection){

  let schemaObject =  JSON.parse(JSON.stringify(collectionSchema))  //cloning so that main db object is not affected

  for(let field in schemaObject){

    if(typeof schemaObject[field] == 'string'){
      schemaObject[field] = getType(schemaObject[field])
    }else if(typeof schemaObject[field] == 'object'){
      if(!schemaObject[field].type) throw Error(`schema error on collection: ${collection} | type not declared for field `+field)
      schemaObject[field].type = getType(schemaObject[field].type)
      delete schemaObject[field].updatable
      delete schemaObject[field].findable
      delete schemaObject[field].writable
      delete schemaObject[field].default
    }
  }
  

  return new mongoose.Schema(schemaObject)
}



function giveConnection(appName,success,failure,forceNewConnection){
  if(!forceNewConnection && dbConnectionsOfApps[appName]) return success(dbConnectionsOfApps[appName])
  let callbackSent = false

  function sendCallback(data,isSuccess){
    if(callbackSent) return
    callbackSent = true
    if(isSuccess) if(success) return success(data)
    if(failure) return failure(data)
  }

  db.law.findOne({app:appName},createConnection)

  function createConnection(err,infoMain){
    if(!infoMain) return sendCallback({error:'app not found'})
    let link = infoMain.dbLink
    let database = infoMain.DBs? JSON.parse(infoMain.DBs) : null

    if(!link) return sendCallback({error:'dbLink not found'})

    try{
      let newConnectionInstance = mongoose.createConnection(link,{ useUnifiedTopology: true })

      newConnectionInstance.on('error',function(error){
        dbConnectionsOfApps[appName] = null
        sendCallback({error:error.message})
      })

      newConnectionInstance.once("open", () => {
        
        dbConnectionsOfApps[appName] = {}

        let gfs = {hostingUpload:new mongoose.mongo.GridFSBucket(newConnectionInstance.db, {
          bucketName: 'hostingUpload'
        })}
        
        if(infoMain.bucket){
          let bucketLaw = JSON.parse(infoMain.bucket)
          for(let bucket in bucketLaw){

            gfs[bucket] = new mongoose.mongo.GridFSBucket(newConnectionInstance.db, {
              bucketName: bucket
            });

          }
        }

      
        
        console.log('gfs initiated')
        dbConnectionsOfApps[appName] = {gfs:gfs, collections:{}, link:link, instance:newConnectionInstance}

        if(database){
          for(let collection in database){
            if(!database[collection].schema) return sendCallback({error:'schema not found on '+collection})
            try{

            
            dbConnectionsOfApps[appName].collections[collection] = newConnectionInstance.model(collection, getSchema(database[collection].schema,collection));
            }catch(e){
              return sendCallback({error:e.message})
            }
          }
        }

        return sendCallback(dbConnectionsOfApps[appName],true)
        
      })

  
    }catch(err){
      console.log(err)
      sendCallback({error:err.message})
    }
  }


}

//_______________________________________UPLOAD SECTION_________________________________________________________




//gridfs-stream is depracated, go to the following link for a fix
//https://github.com/aheckmann/gridfs-stream/issues/135



async function getUserDataAndBucketPermission(skip,req){


    let bucketLaw = {}
    let sub = getSubdomain(req) 
  
  
    if(!skip){
      let DBconfig = await db.law.findOne({app:sub})
      if(DBconfig.bucket){
        bucketLaw = JSON.parse(DBconfig.bucket)
      }
      
    }
  
    let personData = await processCookie(req)
    return([personData,bucketLaw])
}

let hostingException = {hostingUpload:{
    findable:true,
    writable:{$equal:['$appOwnerId','$developer.id']},
    updatable:{$equal:['$appOwnerId','$developer.id']},
}}

function fileFilter (req, file, cb) {
    //file filter is called before uploading the file

  console.log('file filtering...')

    let appName = getSubdomain(req)
    if(file.mimetype == "image/svg+xml" && req.body.type == 'operationalUpload') return  cb(new Error('svg are insecure to  upload'))
    //script tags can be included inside svg thus they are really insecure. here, they are only allowed for hosting 
    
    if(req.body.originalFileName) if(req.body.originalFileName.indexOf('-') !== -1 ) return  cb( new Error('hyphen is reserved for internal use, change file name please!') )
    //because hyphen is used to separate bucket name appname and original name

      
    getUserDataAndBucketPermission(false,req).then(processUpload)
    
    
   
  
    function processUpload(returnedData){
        let userData = returnedData[0].user
        let developerData = returnedData[0].developer

        let bucketLaw = returnedData[1]

        if(req.body.bucket == 'hostingUpload' ) bucketLaw = hostingException


        //if originalFileName exists it means we are trying to update

        req.body.originalFileName? checkLaw('updatable') : checkLaw('writable')

        function checkLaw(type){
            console.log('checking permission')
            
            let currentBucket = bucketLaw[req.body.bucket]
            if(!currentBucket) return cb(new Error('permission denied because bucket was not found'))

            let permission = currentBucket[type]
            if(!permission) return cb(new Error('permission denied because bucket rule was not found')) 

            handleParse({giveConnection:giveConnection, appName:appName, parse:permission, failure: onFailure,developer:developerData,  user:userData, via:'action'}).then(onParse)
            
            function onParse(returnedData){
 
              if(!returnedData) return onFailure({error:'permission denied'})
              if(returnedData.error) return onFailure({error:returnedData.error})
              return cb(null, true)
            }
  
            function onFailure(returnedData){
         
              return cb(new Error(returnedData.error))
            }

        }


    }
  
}

function uploadMiddleWare(req, file){

    return new Promise((resolve, reject) => {

        let appName = getSubdomain(req)


        //file.original file name is the name of the file before uploding
        //req.body.originalFileName mean the desired name after uploading excluding appname and buckname prefix

        if(req.body.originalFileName){
            resolveFileInfo(req.body.originalFileName)
        }else{
            generateNewName()
        }

        function generateNewName(){
            crypto.randomBytes(16, (err, buf) => {
              if (err) {
                return reject(err);
              }

              const filename = buf.toString("hex") + path.extname(file.originalname);
              resolveFileInfo(filename)
            });
        }
      

        function resolveFileInfo(filename){

        

        giveConnection(appName,data=>{

          
          let gfs = data.gfs

          try{

            //data.instance.db[req.body.bucket].files.find({ filename:filename},console.log)
            data.instance.collection(req.body.bucket+'.files').findOne({ filename:filename},(error,fileToDelete)=>{
              if(!fileToDelete) return createFile()

              gfs[req.body.bucket].delete(fileToDelete._id,(error, result)=>{
                console.log('file deleted',fileToDelete)
                createFile()
              })
            })

          }catch(e){
            console.log(e.message)
          }
          

          function createFile(){
            
            let metadata = {  url:req.body.bucket+'/'+filename,uploadDate: Date.now() }
    
            const fileInfo = {
                metadata:metadata,
                filename: filename,
                bucketName: req.body.bucket
            }
        
            resolve(fileInfo);
          }

        })

        }


    });
}

function sendFile(fileNameString,req,res){

  if(fileNameString.indexOf('.websocket') !== -1) return

    let bucketName 
    let appName = getSubdomain(req)

    let fileName 
    let fileNameStringSplit = fileNameString.split('/')

    if(fileNameStringSplit[0] === 'cdn'){
      bucketName = fileNameStringSplit[1]
      fileName = fileNameStringSplit.slice(2,fileNameString.length).join('/')

      //slice cuts array, takes start and end index, start index is included in output but end index is excluded
      //splice replaces values of an array but also changes the original array,
      //takes where to start replacing, how many fields to replace and then what you have to replace them with
    }else{
      bucketName = 'hostingUpload'
      fileName = fileNameString
    }

    let gfs
    let database
    giveConnection(appName,data=>{
      database = data
      gfs = data.gfs
      getUserDataAndBucketPermission(false,req).then(processRead)
    })
    

    function processRead(returnedData){
        let userData = returnedData[0].user
        let developerData = returnedData[0].developer

        let bucketLaw = returnedData[1]

        if(bucketName == 'hostingUpload' ) bucketLaw = hostingException

        let currentBucket = bucketLaw[bucketName]
        if(!currentBucket)return res.send({error:'bucket does not exists, read not allowed'})

        let permission = currentBucket.findable
        if(!permission)return res.send({error:'findable rule does not exists, read not allowed'})

        handleParse({giveConnection:giveConnection, appName:appName, parse:permission, failure: onFailure, developer:developerData, user:userData, via:'action'}).then(onParse)
            
        function onParse(returnedData){
            if(!returnedData) return res.send({error:'permission denied'})
            if(returnedData.error) return res.send({error:JSON.stringify(returnedData.error) })


            database.instance.collection(bucketName+'.files').findOne({filename:fileName},(error,infoMain)=>{
              
             
              if(!infoMain) return res.send({error:'file not found'})
              
              res.set('Content-Type', infoMain.contentType)
              let readStream = gfs[bucketName].openDownloadStream(infoMain._id)
              readStream.pipe(res)
            })
              

        }

        function onFailure(err){
            return res.send(err)
        }


    }

}


//________________________________________________________________________________________________


var srv = app.listen(runtm.port, (err) => { console.log("App started on port:"+runtm.port) });