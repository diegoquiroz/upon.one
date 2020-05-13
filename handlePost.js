if(!process.env.PORT) require('dotenv').config();

const db = require('./db.js')
const cronWorker = require('./cronWorker.js')

const {getUserData, hash,checkBalance,random,setNewVerificationCode,sendEmail,sendVerificationEmail} = require('./functions.js')

const handleParse = require('./handleParse.js')

function sendAppSource(fileName,callback){//find one

  db.apps.findOne( {name:fileName.toLowerCase()} , function(err_o, info_o){
    // console.log(fileName,info_o)
    // console.log(fileName, info_o)
    if(!info_o) return callback( { error:'404 '+fileName+' not found' } )
    if (err_o) return console.log(err_o)
    
    
    if(info_o) callback( { data: {source:info_o.source,loginByDefault:info_o.loginByDefault} } ) 
              
    })            
}

function handlePost(req, res, userData,userMeta){

  var qBody = ''
  var reqData = req.body

  // console.log(reqData.type)


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

      let meta = {log:[],timeTaken:0}

      function sendApiData(data){
        res.send({data:data,meta:meta})
      }

      //login exceptions
      // if (!userData )  return sendApiData({error:'Login required'})
      //do it only for red, write and update



      var appName = req.body.name

      // console.log(qBody,appName)

      db.law.findOne({app:appName},function(err, info_main){

        if (err)  return res.send({error:err})
        if (!info_main) return sendApiData({error: appName+' not found: ' , code:1211 })
        
        var database = JSON.parse(info_main.DBs)
        var preCode = null

        if ( info_main.preCode ) preCode = JSON.parse(info_main.preCode)


        //also in failure send sendApiData
        let prop = {app:appName, parse:qBody, preCode:preCode ,success:sendApiData, database:database, user:userData,log:meta.log}
        handleParse(prop)


      })


      break
    case'confirmPaymentFromPaypal'://add paypal transaction to ledger

      if(!userData) return res.send({error:'login required invalid'})

      var paypal_orderID = qBody.transactionId//TP

      process.env.PAYPAL_SANDBOXED === 'TRUE'? qBody.sandboxed = true : qBody.sandboxed = false

      if (!paypal_orderID) return res.send({error:'order id invalid'})
      // 1. Set up your server to make calls to PayPal

      // 1a. Import the SDK package
      const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
      const payPalClient = require('./paypalEnvironment.js');



      handlePaypal()
      async function handlePaypal() {

        let request = new checkoutNodeJssdk.orders.OrdersGetRequest(paypal_orderID);

        let order;

        try {
          order = await payPalClient.client().execute(request);
        } catch (err) {


          console.error(err.HttpError.error_description,err);
          return res.send( {error: err.HttpError.error_description ,code: 500} );
        }

        // console.log(order)

        let amount = order.result.purchase_units[0].amount.value
    
        

        //it can be done more than once
        var pay_save = new db.transactions({
                receiver:userData.id,//id // to do everywhere id
                amount:amount,
                orderID:paypal_orderID,
                sandboxed:qBody.sandboxed,
                orderID:random(),
                type: 'paypal',
                status: 'paid'
              })

        pay_save.save((error,transaction)=>{
          if (error){

            function crashServer(){//to do stop process
              throw Error(error)
            }//so than no other paypal payment is left unnoted

            error.code === 11000? res.send({error: 'order already noted' }) : crashServer()
            return
          }  
          res.send({code:200,transactionId: paypal_orderID,amount:amount})
          //return payment id
         })
        // db.transaction.findOneAndUpdate({ _id:transactionId },{status:'paid',amount:amount},{verified:true},{new: true,runValidators: true }).then(msg=>{ console.log('writing trnsaction') })
        
        
      }
      

      //also verify amount
      
      break
    case'confirm_payment':

      // to do charge wallet will show current balance 
      
      // console.log(qBody.verificationCode,'verification code',userMeta)

      //why two step so that we email the amount declared so that user can't be ffished and also make amount immutable
      if (qBody.verificationCode !== userMeta.verificationCode) return res.send({error:'wrong verification code'})
      if (!qBody.orderIDs) return res.send( {error: 'orderID is required' } )


        // console.log(qBody.orderIDs,'orderids')


      function confirmPayment(orderID){

        return new Promise(resolvePay=>{

          db.transactions.findOne({ orderID:orderID } , function(err, info){

            if(!info) return res.send( {error: 'invalid orderID' } )
            if(!info.type === 'paypal') return res.send( {error: ' can not confirm this payment ' } )
            if(!info.status === 'paid') return res.send( {error: 'already paid' } )
            if(userData.id !== info.sender) return res.send( {error: 'payment author mismatch' } )

            let status = 'paid'

            db.transactions.findOneAndUpdate({ orderID:orderID },{status:status},{new: true,runValidators: true },(err,data)=>{

              if (err) return res.send({code:400, error:err.message ,orderID:qBody.orderID})

              sendNotification({message: 'amount of $'+data.amount+ ' received' ,to:data.receiver, meta:data.amount}
                                ,data.sender
                                ,data.app
                                ,true)

              if(info.type === 'u2u') if(info.fees) return payfees( info.app, info.fees, info.sandboxed).then(()=>{
                resolvePay(orderID)
              })

              
              resolvePay(orderID)


            })
          })
        })
      }

      async function payAllOrders(){
        for(let index of qBody.orderIDs){
          // console.log('paying',index)
          await confirmPayment(index)
          
        }

        setNewVerificationCode(userData.email)//change verification code once it is used

        res.send({code:200})
      }
      payAllOrders()


      function payfees(app,amount,testMode){

        return new Promise(resolve=>{

            var pay_save = new db.transactions({
                sender:userData.id,
                amount:amount,
                type: 'u2a',
                isFees:true,
                orderID:random(),
                app:app,
                sandboxed:testMode,
                status: 'paid'
              })

        pay_save.save((error,transaction)=>{
          if (error) throw Error(error)
          resolve(transaction)
         })
      })
      }

      

      break
    case'initialize_payment':

      //to do make initialize payment and confirm payment both take objects


      if(!qBody.sandboxed) qBody.sandboxed = false
      if (qBody.sandboxed !== true) qBody.sandboxed = false

      if( process.env.PAYPAL_SANDBOXED === 'TRUE' ) qBody.sandboxed = true

      if (!qBody.app) return res.send( {error: 'app not specified' } )
      if (!qBody.type) return res.send( {error: 'type of payment not specified' } )
      if (!qBody.paymentList) return res.send( {error: 'paymentList of payment not specified' } )
      if (qBody.type !== 'u2u' && qBody.type !== 'u2a' ) return res.send( {error: 'invalid type value' } )


      let fees = 0
      let totalAmount = null


      findFees().then(data=>{

        if(data.error) return res.send({error:data.error})

        fees = data

        findTotalAmount().then(total=>{
          totalAmount = total
          if (qBody.sandboxed === true) return iterateOnPayments() //if it is just testing

          checkBalance(userData.id).then( balance=>{
            //document the code 999
            if ( total > balance ) return res.send( {code:999 ,error: `your balance: ${balance} is not enough to satisfy the transfer of ${total} with fees ${fees}` } )
            iterateOnPayments()
          })

        }).catch(errorInCalculation=>{
          res.send({error:errorInCalculation.message})
        })

      }).catch(error=>{
        console.warn(error)
        res.send({error:error.message})
      })


      async function iterateOnPayments(){

        sendVerificationEmail( userData.email,'transaction of $'+totalAmount+' including fees of $'+fees)

        let paymentData = []

        for(let key in qBody.paymentList ){

            //document receiver's username can also be given
            let receiverData = await extractUserData(key)
            if (!receiverData) return res.send( { error: `receiver not found: ${key}` } )

              let newPaymentData = await initializePayment(receiverData.id, qBody.paymentList[key] )
            // console.log(newPaymentData)
            paymentData.push( newPaymentData.orderID )
        }

        return res.send( {msg:'success! payment initialized',orderIDs:paymentData,code:200,totalAmount:totalAmount } )
      }

      function findTotalAmount(){

        return new Promise(resolve=>{

          let sumAmount = 0

          for(let key in qBody.paymentList){

            try{
              // console.log(qBody.paymentList[key],'number')
              sumAmount += totalWithFees( qBody.paymentList[key]  )
            }catch(error){

              // console.log(error)
              throw Error(error.message)
            }
            

          }

          resolve(sumAmount)
        })
      }

      function totalWithFees(amount){
        amount = Number(amount)
        // console

        //document if the amount is a string then that percentage is calculated if it is a number amount is just added

        let totalAmount = typeof fees === 'string'? amount + (  (Number( fees.replace(/%/gi,''))/100) * amount ) : amount + Number(fees) 
        if( isNaN( totalAmount  )  ) throw Error('invalid fees '+fees+' or amount: '+amount)

        return totalAmount
      }

      function initializePayment(receiver,amount){
        return new Promise(resolve=>{

          let status = 'initiated'
              let calculatedFees = totalWithFees(amount)
              //u2u: streaming site donation
              //u2a:gambling game
              //a2u:gambling game
              let orderID = random()

              var pay_save = new db.transactions({
                  sender:userData.id, //verify by cookie
                  receiver:receiver,//id
                  amount:amount,
                  type: qBody.type,
                  orderID:random(),
                  fees:calculatedFees,
                  app:qBody.app,
                  sandboxed:qBody.sandboxed,
                  status: status
                })

          pay_save.save( (error,transaction)=>{
            if (error) throw Error(error)
            resolve(transaction)
            //return payment id
           } )




        })
      }

      function findFees(){
        return new Promise(resolve=>{

          db.apps.findOne({ name:qBody.app }).then((err, rulesFound)=>{
            if (!rulesFound) throw Error('app not found')


            if(qBody.flavour){

              // console.log(rulesFound)
              if(!rulesFound.fees) throw Error('fees is not defined')
              let feesObject = JSON.parse( rulesFound.fees )

              // console.log(feesObject,qBody.flavour,feesObject[qBody.flavour])

              if( !feesObject[qBody.flavour] ) throw Error( 'invalid flavour: '+qBody.flavour )
              
              resolve( feesObject[qBody.flavour] )

            }else{
              resolve(0)
            }

          }).catch(error=>{
            resolve({ error:error.message })
          })


        })
      }






      
      break//see if email is verified
    case 'sendCodeEmail':

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
    case 'readLogs':
      if(!qBody.app) return res.send( {error:'app name required'} )

      db.apps.findOne({name:qBody.app},function(err,app){

        if(userData.id !== app.owner) return res.send( {error:'you are not the owner'} )

          res.send({log:app.logs})

      })
      break
    case 'runCRON':
      if(!qBody.app) return res.send( {error:'app name required'} )
      if(!qBody.type) return res.send( {error:'type  required'} )

        //**

      db.apps.findOne({name:qBody.app},function(err,app){
        // console.log(qBody.app)
        if(userData.id !== app.owner) return res.send( {error:'you are not the owner'} )

        cronWorker(qBody.type,qBody.app,(data)=>{
          res.send({log:data})
        })

      })

      break
    case'verify_email_access':
      //to do expire the verification email, (not now)
      //how to hnage pass word when logged in
      //either otp or email verification , forgot password
      
      //to do username cant have athedate or any other symbol

      // console.log(qBody.job,qBody.verificationCode)

      let verificationCode = null
      let user = null
      let cookie = null
      let email = null
        // if( return res.send({error:'wrong OTP'})




        
        function proceedVerify_email_access(){

          // console.log('qBody.verificationCode, verificationCode')

          qBody.verificationCode = qBody.verificationCode.trim()

          if (qBody.verificationCode !== verificationCode) return res.send({error:'wrong verification code'  })

            switch(qBody.job.toLowerCase()){

              case 'forgot_password':
                if (!qBody.newPassword) return res.send({msg:'newPassword field required'})
                db.users.findOneAndUpdate({ username:user },{password:hash(qBody.newPassword),verified:true },{new: true,runValidators: true }).then(msg=>{console.log('email verified'+qBody.username)})
                break
              case 'verify_email':
                db.users.findOneAndUpdate({ username:user },{verified:true},{new: true,runValidators: true }).then(msg=>{console.log('email verified '+qBody.username)})
                break
            }
            //this setup will work for both the condition

            //shound we make verification mandatory for cookies to be assigned
            
            res.send( {code:200,msg:cookie} ) //in case of otp breach session can be breached but it doesn't matters as it can do any thing due to localstorage it is already in secure and cookies can be stolen
            let code = setNewVerificationCode(email)//change verification code one it is used
            // type === 'otp'? res.send({msg:'account verified'}) : 
          }
        
        if (userData) {
          user = userData.username
          verificationCode = userMeta.verificationCode
          email = userData.email
          proceedVerify_email_access()
        }else if(qBody.username){
          

          getUserData(qBody.username,true).then(data=>{

            if (!data) return res.send({error:'username not found'})

            cookie = data.cookie
            user = data.username
            email = data.email
            verificationCode = data.verificationCode

            // console.log(qBody.verificationCode, verificationCode)
            proceedVerify_email_access()
          })
        }else{
          return res.send({error:'username not given'})
        }


      break
    case'resendVerificationCode':
      
      //get user data from cookie
      sendVerificationEmail( userData.email, qBody.context, (k)=>{  res.send(k) } )

      break
    case'loginOrSignup':


      let newAccount = qBody.newAccount || false
      let salt =  hash(null)
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

        var user_save = new db.users({
            username:qBody.username,
            password:qBody.password,
            email:qBody.email,
            interest: qBody.tags,
            verified:false,
            verificationCode:null,
            cookie: salt
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
                // console.log(msg)
              }
              
              
            }
           
            error.code == 11000? reportError(error.message)  : console.log(error)
             
          }else{
            // sendCookie(salt)
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

                sendCookie(info.cookie)
                
                //if not authorized make a redirect to the auth page and with the redirect variable

              }else{

                res.send(  {code:400,error:'wrong password or username'} )

              }

        })

      }

      function sendCookie(cookie){
          res.send( {code:200,msg:cookie} )
          // console.log('logged in',cookie)
      }


      break//rename login

    case'host':
      
      function failed(error,code){
        if (!code) code = 400
        res.send({code:code, error:error})
      }

      qBody.db = JSON.stringify(qBody.db)

      if (!qBody.description) qBody.description = null //take from meta tag to dp
      if (!qBody.preCode) qBody.preCode = null
      if (!qBody.fees) qBody.fees = null

      if (!qBody.meta) qBody.meta = null

      if (qBody.searchable === undefined )qBody.searchable = true
      if ( typeof qBody.searchable !== 'boolean' ) qBody.searchable = false

      if (qBody.loginByDefault === undefined ) qBody.loginByDefault = true
      if ( typeof qBody.loginByDefault !== 'boolean' ) qBody.loginByDefault = false
       //fixed searchable bug but still apps wont be affected
      
      if ( typeof qBody.name !== 'string' ) failed('name must be string')

      qBody.name = qBody.name.toLowerCase()

      if (qBody.preCode) qBody.preCode   = JSON.stringify(qBody.preCode)
      if (qBody.fees) qBody.fees  =  JSON.stringify(qBody.fees)

      function allocateMemory(dataDB,existingRelation,theDatabaseName){

          // console.log(db)

                var relation = {}
                var string_increment = -1
                var number_increment = -1
                var array_increment = -1

                var originalSchema = dataDB.schema

                if ( existingRelation ) { //previously originalSchema.memoryAllocation why?

                  //changed existing relation

                  for(key in existingRelation){

                    if( key.indexOf('S_') !== -1){
                      string_increment += 1
                    }else if( key.indexOf('N_') !== -1){
                      number_increment += 1
                    }else if( key.indexOf('A_') !== -1){
                      array_increment += 1
                    }
                  }



                }

                var uniqueField = null

                for(let index in originalSchema){

                  var field_value = originalSchema[index]

                  var fieldType = typeof field_value === 'object'? field_value.type : field_value


                  let validFieldType = ['array','number','string','unique']

                  if( typeof fieldType !== 'string' ) throw Error('type:'+fieldType+' is invalid  at field: '+index+' on database: '+theDatabaseName)

                  if( !validFieldType.includes( fieldType.toLowerCase() ) ) throw Error('type:'+fieldType+' is invalid  at field: '+index+' on database: '+theDatabaseName)



                  let prohibitedFieldValues = {registered_writer_field:true}

                  if( prohibitedFieldValues[index] ) throw Error('Memory allocation error, use of'+index) 



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


                    var contrainsts = {N:11,A:6,S:11} //constraints on the number of fields available

                    if ( fieldIndex >= ( contrainsts[fieldType] - 1 ) ){
                      throw Error('Memory allocation error limit exceeded for:'+fieldIndex+'of type'+fieldType)
                    }
                    
                    relation[index] = fieldType+'_'+fieldIndex
                  }




                } 

                return relation //am I giving the memory allocation of the previous one
      }

      function addCron(callback){


          if (!qBody.cron) return

          if (qBody.cron){



            let tasksPutValues = {}

            for(let when of ['daily','weekly','monthly','quaterly','yearly']){

              if (qBody.cron[when].length === 0){
                tasksPutValues[when] = null
                continue
              } 
              
              tasksPutValues[when] = JSON.stringify( qBody.cron[when] ) //arrray of indivisual when
               //so that our $ne query could work
            }

            db.law.findOneAndUpdate({ app:qBody.name },tasksPutValues,{new: true,runValidators: true },(error,msg)=>{
              if(error) return failed(error.errMsg)
              return callback({code:200})
            })
          } 
      }

      function saveDB(callback){

        if(!qBody.db) return callback({code:200})

        db.law.findOne({ app:qBody.name }).then(rulesFound=>{

          let newDatabase = JSON.parse(qBody.db)

          //first time: allocate memory in the first time

          function updateDB(){

            //old database
            var oldDatabase = JSON.parse(rulesFound.DBs)


            try{
              newDatabase = memoryAllocationLoop(newDatabase,oldDatabase)
            }catch(schemaErr){
              return failed(schemaErr.message)
            }

            // var util = require('util')//really usefull
            // console.log(util.inspect(newDatabase))
            // console.log(oldDatabase, newDatabase)

            //bug: anyone can change the database.....

            db.law.findOneAndUpdate({ app:qBody.name },{DBs:newDatabase},{new: true,runValidators: true },(updateErr,doc)=>{

             if(updateErr) console.log(updateErr)
                
             

              callback({code:200})

           })
          }

          function memoryAllocationLoop(newDatabase,oldDatabase){
            for (let key in newDatabase){

              // console.log(newDatabase[key],key)

              let oldMemoryAllocation = null
              if(oldDatabase) if (oldDatabase[key]) oldMemoryAllocation =  oldDatabase[key].memoryAllocation

              
                let newRelation  = allocateMemory( newDatabase[key], oldMemoryAllocation,key)
                newDatabase[key].memoryAllocation = newRelation
                //if warning is given then 
                
              
              
            }

            return JSON.stringify(newDatabase)
          }

          function writeDB(){
            let newDatabase = JSON.parse(qBody.db)
            //why isn't write db allocating db

            try{
              newDatabase = memoryAllocationLoop(newDatabase,null)
            }catch(schemaErr){
              return failed({error:schemaErr.message})
            }

     

            var rule_save = new db.law({
              app:qBody.name,
              DBs: newDatabase
            })

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

      function saveAppSource(callback){
        qBody.url = qBody.name+qBody.url
       

        // console.log(qBody.response)

     

        var appSource_save = new db.appSource({
          url: qBody.url,
          data: qBody.response
        })

        appSource_save.save(error=> {

            if(!error) return callback({code:200})
            
            if (error.code == 11000) db.appSource.findOneAndUpdate({ url:qBody.url },{data:qBody.response},{new: true,runValidators: true },(error, doc) => {
              
              if (error) return console.log(error)
              callback({code:200})
              // console.log('appSource updated')
            }) })
      }



      checkAppPermission(()=>{

       saveDB(()=>{


          addCron(()=>{

            res.send({code:200})

          })



       }); 


       })//save rules

      
      //to do send cookie

      function checkAppPermission(callback){

        db.apps.find({name:qBody.name} , function(err, info){

          if (info.length == 0) {//add new doc

            var newapp = new db.apps({
              name:qBody.name,
              preCode: qBody.preCode ,
              fees:qBody.fees,
              description:qBody.description,
              meta:qBody.meta,
              searchable:qBody.searchable,
              owner:userData.id,
              source:qBody.response,
              loginByDefault:qBody.loginByDefault
            })

            newapp.save(error=>{
              if (error) throw error;

              callback()

            })
          }else if(info[0].owner == userData.id){ //update doc if password matches

            db.apps.findOneAndUpdate({name:qBody.name},
            {description:qBody.description,
              meta:qBody.meta,
              preCode: qBody.preCode,
              fees:qBody.fees,
              searchable:qBody.searchable,
              source:qBody.response,
              loginByDefault:qBody.loginByDefault
            },{new: true,runValidators: true}).then(doc => {


              callback()

            }).catch(err =>console.error(err))

          }else{ failed('You are Not the owner')  }




        })        
      }


      break

    case'getAppSource':
      sendAppSource( qBody.app, (data)=>{res.send(data) } )
      break
    case'search':
      let query = qBody.query
      let type = qBody.type
      let search_config = {'$text': {'$search': query} }

      if(!query) search_config = {} 


      if(type === 'sites'){

        db.scrap.find(search_config).limit(10).exec((error, info_read)=>{

          if(error) return res.send({error:info_read})
          res.send(info_read)

        })

      }else{

        // /$ne

        search_config['searchable'] = true
          
        db.apps.find(search_config).limit(10).exec(function(err, info){
          data = []
          for(index of info){ data.push( {name:index.name} ) }

          res.send( data ) 
        })
  

      }


      break
    case'scrap':
      let heading = qBody.heading
      let text = qBody.text
      let head = qBody.head
      let html = qBody.html
      let url = qBody.app+':'+qBody.url

      var scrap = new db.scrap({
        url: url,
        heading: heading,
        text: qBody.text,
        html:html,
        head:head
      })

      scrap.save(error=>{

        if(!error) return res.send({code:200,msg:'saved'})
        if (error.code !== 11000) throw Error(error)

        db.scrap.findOneAndUpdate({ url:url },{html:html, text:qBody.text, heading:qBody.heading,head:head},{new: true,runValidators: true },(error, doc) => {
          if(error) return console.log(error)
          res.send({code:200,msg:'updated'})
        }) 
        
      })
      break
    //to do get request file
  }  
}


module.exports = handlePost