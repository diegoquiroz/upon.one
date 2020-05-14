const db = require('./db.js')
const handleQuery = require('./handleQuery.js')
var {parse,helperFunctions} = require('./lib/objLogic.js')
const fetch = require("node-fetch");
var pos = require('node-pos').partsOfSpeech;
var { getUserData,checkBalance,random,renameOutput,setNewVerificationCode,sendEmail,sendVerificationEmail,addUniquePrefix } = require('./functions.js')

var Twit = require('twit');

var twitter = new Twit({
  consumer_key:         process.env.consumer_key,
  consumer_secret:      process.env.consumer_secret,
  access_token:         process.env.access_token,
  access_token_secret:  process.env.access_token_secret
});

// let checkBalance = functions.checkBalance
// let random = functions.random
// let renameOutput = functions.renameOutput
// let setNewVerificationCode = functions.setNewVerificationCode
// let sendEmail = functions.sendEmail
// let sendVerificationEmail = functions.sendVerificationEmail

function handleParse(prop,range){

  
  let userData = prop.user
  let appName = prop.app
  if (!prop.field) prop.field = null //for premission checking or update's put can take input from $field  
  if (!prop.put) prop.put = null
  if (!prop.type) prop.type = 'api' //obey permission or not

  if (!prop.success) return new Promise(resolveHandleParse=>{
    if (!prop.failure) prop.failure = resolveHandleParse
    doParse(resolveHandleParse,prop.failure)
  })

  if (!prop.failure) prop.failure = prop.success

  doParse(prop.success,prop.failure)

  function doParse(success,failure){


    let rangeToFeed = parseScope(prop.field, prop.put, prop.user, prop.type)
    if (range) rangeToFeed = range


    if (prop.preCode) {

        let wantRange = true
        rangeToFeed.via = 'action'//this code will have authorized permission
        parse(prop.preCode, rangeToFeed, 'wantRange').then(newRange=>{

          prop.preCode = null //so it won't calculate the new range again
          newRange.via = 'action'
          handleParse(prop,newRange) //it will have success and failure parameter same as the original one just the failure of precode is also attached

        }).catch(err =>{

          if (err) err = err.message
          failure({error:err})

        })

      return
    }


    //code before this had range with via = action which involves precode and the code after this will be apis
    let newAddress = random()
    rangeToFeed[newAddress] = {parent:rangeToFeed, global:rangeToFeed.global, via: prop.type }
    //everything after this will we api
    rangeToFeed = rangeToFeed[newAddress]



    parse(prop.parse, rangeToFeed ).then(response=>{

      success(response)//also pass in range
    }).catch(err =>{
      console.log('logging caught error on parse:',err,prop.parse,rangeToFeed,prop)
      failure({error:err.message})
    })


  }  



  function parseScope(field,put,userData,via){


            return new class extends helperFunctions{
              constructor(){
                
                //where is global defined

                super()

                this.global = this //is it right to declare global at this place cause if a range is not loaclized it would not have global
                this.field = field//for permission check
                this.put = put//for permission check
                this.via = via
                this.app = appName
                this.date = Date.now()
                this.user = userData
                this.random = random
                this.read = this.read.bind(this)
                this.write = this.write.bind(this)
                this.update = this.update.bind(this)
                this.erase = this.erase.bind(this)
                this.log = this.log.bind(this)
                this.log = this.log.bind(this)
                this.exceptionForLogin = this.exceptionForLogin.bind(this)
                
                if(prop.log) this.logs = prop.log
              }


              exceptionForLogin(functionName,exceptionList2){
                let exceptionList1 = ['twitterSearch','pos','googleSearch','youtubeSearch']
                if(!this.user && !exceptionList1.includes(functionName) && !exceptionList2.includes(functionName) ){
                  console.log(exceptionList1.includes(functionName)+' '+functionName)
                  return {allowed:false,error:'Login required'}
                }
            
                return {allowed:true}
              }twitterSearch(obj){

                return new Promise(resolve=>{

                  console.log(obj.string)

                  let query = {
                    q: obj.string, 
                    count: 20,
                    result_type:obj.type
                  }

                  function resulted(err,data){
                      resolve({error:err,data:data})
                  }

                  twitter.get('search/tweets',query, resulted);
                })

              }log(string){
                // console.log(string,'loggin')
                if (this.logs) this.logs.push(string)
                return string
              }googleSearch(string){
                let url = `https://www.googleapis.com/customsearch/v1?limit=4&key=AIzaSyDmj2fG7vMUR50j9n_TtYDcYHGqBw0eB_s&cx=013886194400589540356:b4shtzahg_0&q=${string}`
                return fetch(url).then(function(response){return response.json();})
              }youtubeSearch(string){
                let url = `https://content.googleapis.com/youtube/v3/search?q=${string}&maxResults=8&part=snippet&key=AIzaSyDbxoOtKFsBdUbgg85UMhwWClUzlgSu7yw`
                return fetch(url).then(function(response){return response.json();})
              }pos(string){
                return new Promise(resolve=>{

                  //replaces everything except numbers and words
                  //                 \w stands for "word character", usually [A-Za-z0-9_]. Notice the inclusion of the underscore and digits.

                  //                 \s stands for "whitespace character". It includes [ \t\r\n].
                  //even full stop and commas
                  //^ means except

                  pos(string.replace(/[^\w\s]/g,''), function (data) {
                    resolve(data);
                  })
                })
              }payToUser(obj,range){


                return new Promise(resolve=>{

                  if(range.via !== 'action') throw Error('pay function is reserved for only serverside action for making transaction from app to user')

                  let type = 'a2u'
                  let receiver = obj.receiver
                  let amount = obj.amount

                  if (!receiver) throw Error('receiver not declared')
                  if (!amount) throw Error('amount not declared')

                    checkBalance(range.global.app,'app').then(balance=>{

                      if (balance < amount) throw Error('receiver not declared')

                      //to do fees order id
                      //to do range global app
                      //to do range global via

                      var pay_save = new db.transactions({
                              amount:amount,
                              type: 'u2a',
                              meta:'fees',
                              app:range.global.app,
                              orderID:random(),
                              sandboxed:testMode,
                              status: 'paid'
                            })

                      pay_save.save((error,transaction)=>{
                        if (error) throw Error(error)
                        resolve(transaction)
                       })


                    })
                })
              }checkBalance(obj){

                return new Promise(resolve=>{



                    

                    let receiver = userData.id
                    let type = 'user'

                    if (obj.ofApp === true){
                      receiver = range.global.app
                      type = 'app'
                    } 

                    checkBalance(receiver,type).then(data=>{
                      resolve(data)
                    })

                })
              }

              checkSign(obj){

                //do throw error on all helper functions
                return new Promise(resolve=>{
                  db.transactions.findOne({ orderID: obj.id },(error,result)=>{
                    if (error) console.log(error)

                    if (!result) throw Error('invalid transaction id')
                    if(result.type === 'paypal') throw Error('invalid transaction id')
                    if(obj.mode !== 'testing' && result.sandboxed === true) throw Error(' sandboxed transaction given ')

                    result.signed === false? resolve(false): resolve(true)
                    
                  })
                })

              }//to do check source
              signTransaction(obj){
                let transactionId = obj.id
                //to do fix promise spelling
                //do throw error on all helper functions
                return new Promise(resolve=>{
                  db.transactions.findOneAndUpdate({_id:transactionId},{signed:true},(error,result)=>{
                    if (error) console.log(error)
                    if (!result) throw new Error('invalid transaction id')
                    result.signed === false? resolve(false): resolve(true)
                    
                  })
                })
              }findUser(usernameOrid){


                return new Promise(resolve=>{

      

                  if(!usernameOrid) throw Error('$findUser '+typeof usernameOrid)


                  extractUserData(usernameOrid).then(data=>{
                    if (!data) return resolve(null)

                    
                    resolve({ id:data.id,
                    username:data.username,
                    profile:data.username,
                    profile:data.profile,
                    about:data.about,
                    interest:data.interest })
                  })

                })
              }findUsers(arrrayOfusers,range){
                return new Promise(resolvePay=>{
                  let allusers = {}

                  if (!Array.isArray(arrrayOfusers) )throw Error('$findUsers expects an arrray') 

                    async function loop(){
                      
                      for(let index of arrrayOfusers){
                        allusers[index] = await range.global.findUser(index)
                      }
                      
                      return allusers
                    }

                    loop().then(resolve)
                })
              }email(obj){

                return new Promise(resolve=>{
                  sendEmail(obj.to, obj.content,obj.subject,resolve)
                })
              }countNotifications(type,range){

                return new Promise(resolve=>{
                  //to do define app name automatically for security



                  let query = {receiver:userData.id, seen:false}
                  if (type === 'seen') query.seen = true //make type seen, unseen

                  if ( range.global.app !== 'home') {
                    query = Object.assign(query, {app:range.global.app})
                  }

                  db.action.countDocuments(query, function(err, info){
                    resolve(info) 
                  })
                })
              }sendNotification(object,range){

                //send notification takes in object



                  return new Promise(resolve=>{

                    sendNotification(object,userData.id,range.global.app).then(resolve)

                  })
              }readNotifications(limit,range){

                return new Promise(resolve=>{

                  let query = {receiver:userData.id, seen:false}

                  if ( range.global.app !== 'home') {//home can receiece notifications from all apps
                    query = Object.assign(query, {app:range.global.app} )
                  }

                  //note second parameter in find is the columns to return

                  

                  db.action.find(query,null,{sort:{created_at:-1},limit:limit},function(error,info){


                    if (error) throw Error(error)//to do crash the server

                    // we can combine but we will get efficiency at the cost of time 
                    





                    

                    async function getUsernameOfAllSender(){
                      let newIndex = []

                      for(let index of info){

                        let referenceData = null
                        // console.log(index,'senderData')


                        //to do remove reference and make a split -|

                        if(index.reference){
                          referenceData = {id:index.reference , db:index.referenceDb} 
                        } 
                        
                        // if(index.reference){
                        //   let referenceUnique = index.reference.split(':')
                        //   let referenceDb = index.reference[0]
                        //   referenceDb = referenceDb.split('_')[1] //to do documet format appname_dbName:unique
                        //   referenceUnique = referenceUnique[1]
                        //   referenceData = {unique:referenceUnique, db:referenceDb}
                        // }

                        newIndex.push({

                          type:index.type,
                          sender:index.sender,
                          reference: referenceData,
                          official:index.official,
                          message:index.message,
                          created_at:index.created_at
                        })


                        db.action.findOneAndUpdate({_id: index.id},{seen:true},{returnOriginal : false},function(error, doc){
                          console.log('marked seen')
                        })
                      }

                      resolve(newIndex)
                    }


                    getUsernameOfAllSender()

                  })



                })
              }async search(par,range){
                var queryOu = await handleQuery('search',par,range.via,this,prop.database,handleParse)
                return queryOu
              }async write(par,range){
                //par contains write on what database and what values to put
                var queryOu = await handleQuery('write',par,range.via,this,prop.database,handleParse)  
                return queryOu
              }async read(par,range){

                // throw new Error('error  does not exist in raniable name:')
                var queryOu = await handleQuery('read',par,range.via,this,prop.database,handleParse)
                return queryOu
              }async update(par,range){
                var queryOu = await handleQuery('update',par,range.via,this,prop.database,handleParse)
                return queryOu
              }async erase(par,range){
                var queryOu = await handleQuery('erase',par,range.via,this,prop.database,handleParse)
                return queryOu
              }async follow(toFollow,range,contentId){

                if (typeof toFollow === 'object' || typeof toFollow === 'array') throw Error('wrong input for follow '+typeof toFollow)
                //to do abstract follow and like as the same

                try{
                  return await followOrLike(toFollow,'follow',range.global.app)
                }catch(error){
                  throw Error(error.message )
                }
                
              }async dislike(content,range){
                let magnitude = -1
                return await range.global.like(content,range,magnitude)
              }async like(content,range,magnitude){

                //either use unique or id

                
                if(!content.db) throw Error('db name not provided')
                let dbName = content.db
                let contentId = await idOrUnique(content,range.global.app,dbName)



  
                if(!magnitude) magnitude = 1

                if (typeof contentId === 'object' || typeof contentId === 'array') throw Error('wrong input for like '+typeof contentId)
                  console.log(contentId,dbName)
                if (!contentId || !dbName) throw Error('parameter error on like function ' )

                try{
                  // , not needed from now we will use 
                  return await followOrLike(contentId, 'like', range.global.app, magnitude,dbName)
                }catch(error){
                  throw Error(error.message )
                }         
                
              }checkFollow(person){
                // var person = typeof obj === 'object' ? obj.of : obj 

                return new Promise(resolve=>{

                  let actionId = 'follow:'+userData.id+':'+person

                  db.action.findOne({ actionId:actionId },
                    function(err, info_main){
                      if (err) throw Error(err)

                        if (info_main) {
                          resolve(true)
                        }else{
                          resolve(false)
                        }

                    } 
                  )
                })
              }async getLikeMagnitude(content,range){
                // var contentId = typeof obj === 'object' ? obj.on : obj 

                


                  
                  let dbName = content.db
                  let contentId = await idOrUnique(content,range.global.app,dbName)
                  // contentId = addUniquePrefix(range.global.app+'_'+dbName,contentId)
                  //yes userdata
                  let actionId = 'like:'+userData.id+':'+contentId

                  return await queryActionDb()
                  function queryActionDb(){return new Promise(resolve=>{

                    db.action.findOne({ actionId:actionId },function(err, info_main){

                      if (err) throw Error(err)
                      if(!info_main) return resolve(0)
                      return resolve(info_main.magnitude)

                    })
                  })}
              }followings(person){
                // var person = obj.of
                return followList(person,'followings')
              }followers(person){
                // var person = obj.of
                return followList(person,'followers')
              }countFollowings(person){
                // var person = obj.of
                return count(person,'following')
              }countFollowers(person){
                // var person = obj.of
                return count(person,'followers')
              }async countDislikes(content,range){

                return await range.global.countLikes(content,range,-1)
              }async countLikes(content,range,magnitude){ //make it small

                  if(!magnitude)magnitude = 1
                  
                  let dbName = content.db
                  let contentId = await idOrUnique(content,range.global.app,dbName)
                  // contentId = addUniquePrefix(range.global.app+'_'+dbName, contentId)
                  // console.log(contentId,'iddd')
                // var contentId = obj.on
                if (contentId.error) throw Error('$countlikes error: '+contentId.error)

                return await queryForCounting()
                function queryForCounting(){
                  return new Promise(resolve => {


                      db.action.countDocuments({type:'like',reference:contentId,magnitude:magnitude}, function(err, info){
                     
                        if (!info) return resolve(0)
                        // console.log(info,magnitude)
                        resolve(info)
                      })

                  })
                }

              }


            }
  }

  async function idOrUnique(content,appName,dbName){
      let contentId = null
                  if(content.unique){


                    // try{
                      let unique = addUniquePrefix(appName+'_'+dbName, content.unique)
                      
                      let data = await db.vDb.findOne({unique: unique})
                      // console.log(data)
                      if(!data) throw Error('document not found, unique: '+unique)
                      contentId = data.id
                    // }catch(error){
                      // return {error:error}
                    // }

                  }else{
                    contentId = content.id
                  }

                  return contentId
  }
  async function followOrLike(id,type,app,magnitude,dbName){

    // console.log(app)

    if (!id) throw Error('parameter error')


          let endPart = id//content id for like
          let receiver = id//content id for like
          let contentId = null
          if(!dbName) dbName = null

          if (type !== 'follow' && type !== 'like') throw Error('invalid type')

          if(!magnitude) magnitude = 1
          if (magnitude !== 1 && magnitude !== -1) throw Error('invalid magnitude')

          if(type === 'follow'){

            let receiverData = await extractUserData(id)
            if (!receiverData) throw Error(`receiver not found`)
            endPart = receiverData.id
            receiver = receiverData.id

          }else{

            contentId = id

            //we need to add unique prefix
            let content = await db.vDb.findOne({_id:contentId})

            //we need to find the writer to make a notification
            // console.log(contentId)
            if (!content) throw Error('invalid id of content')
            receiver = content.registered_writer_field//what if writer doesn't exist
            if (!receiver) throw Error('author not found') 

    }

    /*
    both like and dislike can hold three values, 1 & -1 and deleted. 

    -1 follow: blocked
    -1 like: disliked

    to add it to the db, following is the logic used

    if the action id provided already exist 
    if the magnitude is same, remove happens, like or dislike whatever it was
    otherwise an update happens

    if the action id already does not exist

    status now sent will be 1:liked, -1:disliked, 0:removed

    we will not have to do backward compatablity with rubbbit as we will switch to component

    */
        //@@
    function executeSave(){
      return new Promise(resolve=>{
      let actionId = type+':'+userData.id+':'+endPart

      db.action.findOne({actionId:actionId},function(err, info_main){
        if (err) return resolve({error:err})

        if (!info_main){//add fresh data to db

          var act = new db.action({
            sender:userData.id,
            receiver:receiver,
            type:type,
            magnitude:magnitude,
            actionId:actionId,
            app:app,
            reference:contentId,
            referenceDb:dbName
          })




          act.save(error=>{
            if (!error) return resolve( {magnitude:magnitude, id:id, type:type} )
            if (error) return resolve({error:error})
          })
        }else{//either remove(if magnitude is same as before) or update

          if(info_main.magnitude === magnitude){//remove

              db.action.deleteOne({actionId:actionId}, err=> {
                if (err) return resolve({error:err})
                resolve({magnitude:0, id:id, type:type})
              })

          }else{//update
            db.action.findOneAndUpdate({actionId: actionId},{magnitude:magnitude}, {new: true} ,function(error, doc){
              if (error) return resolve({error:error})
              resolve({magnitude:magnitude, id:id, type:type})
            })

          }
        }




      })

      })
    }


          let savedResult = await executeSave()

          return savedResult
  }

    //before following or liking check if recever id is given and use @convention



  function count(person,type){

            var query = { sender:person, type:'follow'}
            if (type === 'followers') query = { receiver:person, type:'follow'}

            return new Promise(resolve => {

              if (!person){
                  throw Error('parameter not available for "of" on count'+type)
                  // return resolve(0)
              }

              db.action.countDocuments(query, function(err, info){
                // console.log('follow count: '+info)
                resolve(info) //it will give zero if nothing found
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
}

function sendNotification(object,sender,app,byapp){

  return new Promise(resolve=>{


    let type = 'message'
    let actionId = type+':'+sender+':'+random()

    if(!byapp) byapp = false

    if(!object.message) throw Error('message not defined')
    if(!object.to) throw Error('parameter "to" not defined')

    if (object.meta === undefined) object.meta = null 

    var act = new db.action({
      sender:sender,
      receiver:object.to,
      type:type,
      actionId:actionId,
      app:app,
      meta:object.meta,
      message:object.message,
      official:byapp
    })

    act.save(error=>{

      if (error) throw Error(error)
      return resolve(true)

    })
  })             
}

async function extractUserData(key){
  //###
  //username can be #username or id
  let userdata = key.indexOf('@') !== -1? await getUserData(key.replace('@',''),'username') : getUserData(key,'id')

  return userdata
}

 module.exports = handleParse