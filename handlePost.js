const db = require('./db.js')
const cronWorker = require('./cronWorker.js')

const {generateJWT, getUserData, hash,setNewVerificationCode,sendVerificationEmail, random} = require('./functions.js')

const handleParse = require('./handleParse.js')





const fetch = require("node-fetch")


function handlePost(req, res, processedCookieData,appName,giveConnection){

  let userData = processedCookieData.user
  let developerData = processedCookieData.developer

  var qBody = ''
  var reqData = req.body

  function sendCookie(res,userDataForToken){
  
    userDataForToken.appName = appName

    const token = generateJWT(userDataForToken)



    if(!qBody.devLogin) res.cookie('user-cookie',token,{ expires: new Date(Date.now() + 9999999*99999) });

  


  // httpOnly: cookies won't be accessible on the client
  // When working on localhost, the cookie domain must be omitted entirely. Just setting it to "" or NULL or FALSE instead of "localhost" is not enough.
  //otherwise you can use a hack and host all of the application to something.localhost so that subdomains exist on *.something.localhost this ise because standards require two dots in universal subdomain cookie declaration
  //another work around: https://stackoverflow.com/questions/38669040/share-cookies-to-subdomain-on-localhost

  res.send( {code:200,msg:token} )

}






  if(reqData.data){

    try{
      qBody = JSON.parse(reqData.data) //remember data is passed 
    }catch(e){
      if(reqData.data.indexOf('{') !== -1 || reqData.data.indexOf('}') !== -1) return res.send(e)//json encoding error
      qBody = reqData.data
    }
  }

  switch(reqData.type){
    case'editProfile':
      // qBody.currentUserName

      // qBody.username
      // qBody.profile
      // qbody.tags
      // qbody.name

      // qbody.verificationCode

      //to do an abstraction to eliminate crash due to undefined variable maybe a catch on handle post

      if (qBody.username !== userData.username){

         db.users.findOne({username:qBody.username}).then((err,data)=>{
          if (data)  return res.send({error:'username already exist'})
          makeUpdate()
         })

      }else{
        makeUpdate()
      }

      function makeUpdate(){

        db.users.findOneAndUpdate({verificationCode:qBody.verificationCode,username:userData.username},
        {
          username:qBody.username, profile:qBody.profile, name:qBody.name, tags:qBody.tags, about:qBody.about

        },{returnOriginal : false},function(err, info_main){
          //what if it was not unique
          if (!err){
            return res.send({error:err})
          }
          if (!info_main)return res.send({error:'wrong verification code, typo happens'})
          res.send({code:200,data:info_main})
          //reset configration code
        })
      }
      break
    case'db':

      let meta = {timeTaken:0}

      function sendApiData(data){
        res.send({data:data,meta:meta})
      }

      //login exceptions
      // if (!userData )  return sendApiData({error:'Login required'})
      //do it only for red, write and update

      if(req.body.adminMode){ //check owner

        db.apps.findOne({name:appName} , function(err, info){

          if(!info) return sendApiData( {error: `app not found` } )
          if(info.owner == developerData.id){

            proceedQuery('action')

          }else{
            return sendApiData( {error: `You don't have owner permission` } )
          }
          

        })
      }else{
        proceedQuery('api')
      }

  

      function proceedQuery(via){
          //also in failure send sendApiData
          let prop = {giveConnection:giveConnection, appName:appName, via:via ,parse:qBody, failure:sendApiData, developer:developerData, user:userData}
          handleParse(prop).then(sendApiData)
      }


      break
    case 'saveDbLink':

      db.apps.findOne({name:appName},function(err, info_main){
        if(!info_main) return res.send({error:'app not found: '+prop.appName})
        if(!developerData) return res.send({error:'not logged as developer'})

        if(developerData.id != info_main.owner) return res.send({error:'permision denied'})
        
        db.law.findOneAndUpdate({app:appName},{dbLink:qBody.dbLink},function(err, info_main){
          res.send({code:200,msg:info_main})
        })

      })

      break
    case 'sendEmail':

      if (!userData) return res.send({error:'not logged in'})

      sendVerificationEmail( userData.email, qBody.context, (k)=>{  res.send(k) } )
      break
    case'forgot_password':

        //to resend code user the same function why does resend exist
        getUserData(qBody.emailOrusername,true).then((data,error)=>{
          if (error) return res.send(error)

          function callback(data2){
            if (data2.error) return res.send(data2.error)
            res.send( {msg:'email sent to '+data.email.substring(0,data.email.length/3)+'....'} )
          }

          if (!data)return res.send({error:'no one found'})

          sendVerificationEmail(data.email,'reseting your password, your username is '+data.username,callback)
        })
      break
    case 'runCRON':
  
      if(!qBody.type) return res.send( {error:'type  required'} )

        //**

      db.apps.findOne({name:appName},function(err,app){

        if(developerData.id !== app.owner) return res.send( {error:'you are not the owner'} )

        cronWorker(qBody.type,appName,(data)=>{
          res.send({log:data})
        })

      })

      break
    case 'logout':
      res.cookie('user-cookie','', { expires: 0 });
      res.send({code:200})
      break
    case'verify_email_access':
      //to do expire the verification email, (not now)
      //how to hnage pass word when logged in
      //either otp or email verification , forgot password
      
      //to do username cant have athedate or any other symbol







        
        function proceedVerify_email_access(userToVerify){


          //for email verification you need to be logged in


          qBody.verificationCode = qBody.verificationCode.trim()

          if (qBody.verificationCode !== userToVerify.verificationCode) return res.send({error:'wrong verification code'  })

            switch(qBody.job.toLowerCase()){

              case 'forgot_password':
                if (!qBody.newPassword) return res.send({msg:'newPassword field required'})
                db.users.findOneAndUpdate({ username:userToVerify.username },{password:hash(qBody.newPassword),verified:true },{new: true,runValidators: true }).then(msg=>{console.log('email verified '+qBody.username)})
                break
              case 'verify_email':
                db.users.findOneAndUpdate({ username:userToVerify.username },{verified:true},{new: true,runValidators: true }).then(msg=>{console.log('email verified '+qBody.username)})
                break
            }
            //this setup will work for both the condition

            //shound we make verification mandatory for cookies to be assigned
            
            sendCookie(res,{name:userToVerify.name, username:userToVerify.username, id:userToVerify.username.id, email:userToVerify.username.email}) //in case of otp breach session can be breached but it doesn't matters as it can do any thing due to localstorage it is already in secure and cookies can be stolen
            let code = setNewVerificationCode(userToVerify.email)//change verification code one it is used
            // type === 'otp'? res.send({msg:'account verified'}) : 
        }

        
        if(qBody.username){//for forgot password
          
          getUserData(qBody.username,true).then(userToVerify=>{
            if (!userToVerify) return res.send({error:'username not found'})
            proceedVerify_email_access(userToVerify)
          })
            
        }else{
          return res.send({error:'username not given'})
        }


      break
    case'resendVerificationCode':
        
      var personData = qBody.devLogin? developerData : userData
      //get user data from cookie
      sendVerificationEmail( personData.email, qBody.context, (k)=>{  res.send(k) } )

      break
    case'loginOrSignup':


      let newAccount = qBody.newAccount || false

      qBody.password = hash(qBody.password)

      if(!qBody.username) return res.send(  {code:400,msg:'fill username'} )
      if(!qBody.password) return res.send(  {code:400,msg:'fill password'} )
      if(!qBody.email && newAccount === true) return res.send(  {code:400,msg:'fill email'} )


      if(newAccount === true){

          var emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
          
          if(emailRegex.test(qBody.email) == false){

            return res.send({error:'invalid email'})
          }else{

            createAccount()
          }

        
      }else{
        login()
      }

      function createAccount(){


        if(!qBody.birthday) return res.send(  {code:400,error:` Don't worry we won't ask for any treat on your birthday`} )
        
        let gender

        if(qBody.male){
          gender = 'male'
        }else if(qBody.female){
          gender = 'female'
        }else{
          gender = 'other'
        }

        
        let birthday = null

        if(qBody.birthday){
          let birthdaySplit = qBody.birthday.split('-')
          birthday = {
            year:birthdaySplit[0],
            month:birthdaySplit[1],
            day:birthdaySplit[2]
          }
        }
        
        var user_save = new db.users({
            name:qBody.name,
            username:qBody.username,
            password:qBody.password,
            email:qBody.email,
            birthday:birthday,
            gender:gender,
            interest: qBody.tags,
            verified:false,
            verificationCode:null
          })

        user_save.save(error=>{



          if (error){

            function reportError(msg){

              if(msg.indexOf('username_1') !== -1){
                res.send(  {code:400,error:'username taken'} )
              }else if(msg.indexOf('email_1') !== -1){
                res.send(  {code:400,error:'email already exist'} )
              }else{
                res.send(  {code:400,error:'A error occured please report it on http://bugs.upon.one'} )
              }
              
              
            }
           
            error.code == 11000? reportError(error.message)  : console.log(error)
             
          }else{
        
             //cookie will only be provided after verification
            sendVerificationEmail( qBody.email, 'new account', (data)=>{ 

              if(data.error) return res.send( {error:data.error} )
              res.send( {code:200, username:qBody.username,email:qBody.email} )

             })
          }

        })
      }

      function login(){
        
        db.users.findOne(  { $or: [{username: qBody.username}, {email: qBody.username}] } , function(err, info){

              if (!info) return res.send({code:400,error:'wrong username or email'})

              if (info.password == qBody.password){

                if(!info.verified) return res.send({error:'account not verified'})

                sendCookie(res,{username:info.username,id:info.id,email:info.email})
                
                //if not authorized make a redirect to the auth page and with the redirect variable

              }else{

                res.send(  {code:400,error:'wrong password or username'} )

              }

        })

      }




      break//rename login

    case'host':
      
      function failed(error,code){
        if (!code) code = 400
        res.send({code:code, error:error})
      }

      if(!developerData) return  failed('dev not logged in')

      if (!qBody.description) qBody.description = null //take from meta tag to dp
      if (!qBody.preCode) qBody.preCode = null
      if (!qBody.fees) qBody.fees = null

      qBody.db = JSON.stringify(qBody.db)
      qBody.bucket = JSON.stringify(qBody.bucket)
      qBody.cloudFunctions = JSON.stringify(qBody.cloudFunctions)

      if (!qBody.meta) qBody.meta = null

      if (qBody.searchable === undefined )qBody.searchable = false
      if ( typeof qBody.searchable !== 'boolean' ) qBody.searchable = false


       //fixed searchable bug but still apps wont be affected
      
      if ( typeof qBody.name !== 'string' ) failed('name must be string')

      qBody.name = qBody.name.toLowerCase()

      if (qBody.preCode) qBody.preCode   = JSON.stringify(qBody.preCode)
      if (qBody.fees) qBody.fees  =  JSON.stringify(qBody.fees)




      function saveDB(callback){

        if(!qBody.db) return callback({code:200})

        let tasksPutValues = {}
        for(let when of ['daily','weekly','monthly','quaterly','yearly']){

          if (qBody.cron[when].length === 0){
            tasksPutValues[when] = null
            continue
          } 
          tasksPutValues[when] = JSON.stringify( qBody.cron[when] ) //arrray of indivisual when //so that our $ne query could work

        }


        db.law.findOne({ app:qBody.name }).then(rulesFound=>{

          function updateDB(){
            db.law.findOneAndUpdate({ app:qBody.name }, Object.assign({DBs:qBody.db, bucket:qBody.bucket, cloudFunctions: qBody.cloudFunctions }, tasksPutValues) ,{new: true,runValidators: true },(updateErr,doc)=>{
             if(updateErr) console.log(updateErr)
              callback({code:200})
           })
          }



          function writeDB(){


            var rule_save = new db.law(Object.assign({
              app:  qBody.name,
              DBs: qBody.db,
              bucket: qBody.bucket,
              cloudFunctions: qBody.cloudFunctions 
            },tasksPutValues) )

            rule_save.save(error=>{

              if(error){

                error.code == 11000? updateDB() :console.log(error)

              }else{

               callback()

              }

            })            
          }


          rulesFound === null? writeDB() : updateDB() //does it return null

        })
      }



      checkAppPermission(()=>{

       saveDB(()=>{

        function success(){
          res.send({code:200})
        }

        giveConnection(qBody.name,success,success,true)
            

       }); 


       })//save rules

      
      //to do send cookie

      function checkAppPermission(callback){

        db.apps.find({name:qBody.name} , function(err, info){

          if (info.length == 0){//add new doc

            var newapp = new db.apps({
              name:qBody.name,
              preCode: qBody.preCode ,
              fees:qBody.fees,
              description:qBody.description,
              meta:qBody.meta,
              searchable:qBody.searchable,
              owner:developerData.id,
              source:qBody.response,
              logo:qBody.logo,
              description:qBody.description
            })

            newapp.save(error=>{
              if (error) throw error;

              callback()

            })
          }else if(info[0].owner == developerData.id){ //update doc if password matches

            db.apps.findOneAndUpdate({name:qBody.name},
            {description:qBody.description,
              meta:qBody.meta,
              preCode: qBody.preCode,
              fees:qBody.fees,
              searchable:qBody.searchable,
              source:qBody.response,
              logo:qBody.logo,
              description:qBody.description
            },{new: true,runValidators: true}).then(doc => {


              callback()

            }).catch(err =>console.error(err))

          }else{ failed('You are Not the owner')  }




        })        
      }


    
      break
    default:
      res.send({error:'request not recognized'})
      break
  }  
}




module.exports = handlePost