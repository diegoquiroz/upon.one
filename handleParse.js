const db = require('./db.js')
const handleQuery = require('./handleSandboxQuery.js')
var {parse,helperFunctions} = require('./lib/objLogic.js')
var pos = require('node-pos').partsOfSpeech;
var { getUserData,random,sendEmail } = require('./functions.js')
var { processComunicator} = require('./processComunicator.js')
const path = require('path');


const { fork } = require('child_process');
//process.on('uncaughtException', (err) => {
 // console.error('Asynchronous error caught.', err);
//})


var Twit = require('twit');
if(!process.env.PORT) require('dotenv').config();

var twitter = new Twit({
  consumer_key:         process.env.consumer_key,
  consumer_secret:      process.env.consumer_secret,
  access_token:         process.env.access_token,
  access_token_secret:  process.env.access_token_secret
});

function handleParse(passedProp,overwrite){




  return new Promise(resolveHandleParse=>{
     //if failure and success both callbacks are absent

    let prop = {}

    for(let key in passedProp){
      prop[key] = passedProp[key]
    }

    if(overwrite){
      for(let key in overwrite){
        prop[key] = overwrite[key]
      }
    }

      /* 
      function that are run synchronously can make prop.failure or resolve handle parse run twice or more
      which can make res.send run twice or more which will throw an error
      for example just assume $log command is fired without await and there is an erron in the $log function
      the same could be true for any function even $executeJS

      to prevent this U.query is changed to throw error
      */

    if(!prop.giveConnection) throw new Error('giveConnection not not passed')
    if(!prop.appName) throw new Error('app name not passed')

    if (!prop.via) prop.via = 'api' //obey permission or not, action: don't obey permission, api:obey permission
  
    if(overwrite) if (overwrite.overwriteFailure){
      prop.failure = (error)=>{
        console.log(error)
        resolveHandleParse(error)
      }
    }

    if(!prop.failure) throw Error('failure parameter of handleParse not satisfied')
    

 
    if(!prop.database){
      //if we would have taken appname from userdata than loggedout user won't have been able to work
      db.law.findOne({app:prop.appName},function(err, info_main){
        
        if (err)  return prop.failure({error:err})
        if (!info_main) return prop.failure({error: prop.appName+'database schema not found found: ' , code:1211 })

        prop.cloudFunctions = {}
        prop.database = {}

        try{
          if(info_main.cloudFunctions) prop.cloudFunctions = JSON.parse(info_main.cloudFunctions)
          if(info_main.DBs) prop.database = JSON.parse(info_main.DBs)
        }catch(err){


          prop.failure({error:err.message})
          return
        }
        doParse()
      })
    }else{
      doParse()
    }





    function doParse(){
        
        if(!prop.appOwnerId){
          db.apps.findOne({name:prop.appName},function(err, info_main){
            if(!info_main) return prop.failure({error:'app not found: '+prop.appName})
           
            if(!info_main.owner) return prop.failure({error:'owner undefined'})
            prop.appOwnerId = info_main.owner
            doParse()
          })
          return 
        }

        if(!prop.db) return prop.giveConnection(prop.appName,data=>{
          prop.db = data
          doParse()
        },prop.failure)
  
        parse(prop.parse, parseScope()).then(response=>{
          resolveHandleParse(response)
        }).catch(err =>{
          console.log('(controlled error)',err)
          prop.failure({error:err.message})
        })

    
    }  



    function parseScope(){

              return new class extends helperFunctions{
                constructor(){
                  
        

                  super()

                  this.appOwnerId = prop.appOwnerId
                 
                  this.field = prop.field//for permission check
                  this.put = prop.put//for permission check
                  this.via = prop.via
                  this.appName = prop.appName
                  
                  this.user = prop.user
                  this.developer = prop.developer

                  this.random = random
                  this.find = this.find.bind(this)
                  this.search = this.search.bind(this)
                  this.write = this.write.bind(this)
                  this.update = this.update.bind(this)
                  this.delete = this.delete.bind(this)
         
                }


                async run(argumentArray){
                  let functionName = argumentArray[0]
                  let functionCodeInString = prop.cloudFunctions[functionName]
                  let functionParam = argumentArray[1]
                  if(!functionCodeInString) throw Error('function not found')

                 
                  let toParse = {$executeJS:{code:functionCodeInString, sandboxGlobalContext:{arg:functionParam} }}

                  let parsedFunctionData = handleParse(prop,{parse:toParse, via:'action', failure:prop.failure})

                  return parsedFunctionData
                }async readBucket(obj,range){
                  let skip = obj.skip
                  let bucket = obj.bucket
                  let limit = obj.limit

                  if(typeof skip == 'undefined') skip = 0
                  if(typeof limit == 'undefined') limit = 10

                  let data = await prop.db.instance.collection(bucket+'.files').find({}).skip(skip).limit(limit).toArray()
                  
                  return(data)

                }gte(val){
                  return {'$gte':val}
                }lte(val){
                  return {'$lte':val}
                }or(val){
                  return {'$or':val}
                }and(val){
                  return {'$and':val}
                }in(val){
                  return {'$in':val}
                }async searchApps(appToSearch){

                  let search_config = {searchable:true}
                  
                  if(appToSearch){
                    search_config['$text'] = {'$search': appToSearch}
                  }
                    
                  return await db.apps.find(search_config,['name', 'logo','description'])

                }ne(val){
                  return {'$ne':val}
                }nin(val){
                  return {'$nin':val}
                }executeJS(obj,range){

                  return new Promise(resolve=>{

                    const forked = fork(path.join(__dirname,'executeUntrustedJS.js'));
                 
                    let sandbox = {
                      handleParse:async (toParse)=>{
                        return await handleParse(prop,{ overwriteFailure:true, put:range.put, field:range.field, parse:toParse })
                      },errorOccured:(errorMessage)=>{
                        if(forked.killed) return
            
                        prop.failure({error:errorMessage})
                        forked.kill('SIGINT')
                      }
                    }
                    
                    setTimeout(()=>{//kill process after 6 seconds if it is still alive
                      if(forked.killed) return
                      prop.failure({error:'function timeout'})
                      forked.kill('SIGINT')
                    },6000)


                    if(typeof obj == 'string'){//for testing
                      let stringCode = obj
                      obj = {code:stringCode,sandboxGlobalContext:{} }
                    }

                    obj.put = range.put
                    obj.field = range.field
                    obj.user = range.user

                    let cumminicator = new processComunicator(sandbox,prop.failure,forked)

                    cumminicator.instruct('executeJS',obj,(data)=>{
                      if(forked.killed) return
                      resolve(data)
                      forked.kill('SIGINT')
                    })

                  })

                }date(string){
                  if(Date[string]){
                    let fun = Date[string]
                    if(typeof fun !== 'function') throw new Error(string+' not recognized as function inside $data function')
                    return fun()
                  }else{
                    throw new Error(string+' not recognized inside $data function')
                  }
                }async log(toLog,range){
                  if(range.via !== 'action') throw Error('logging '+JSON.stringify(toLog)+' is not allowed as this is not a secure environment')
                    let newLog = await db.logs({app: range.appName,log:toLog}).save()
                    return newLog
                }async readLogs(limit,range){
                  if(range.appOwnerId !== prop.developer.id) return prop.failure({error:'not allowed'})
                  let logs = await db.logs.find({app: range.appName} ).sort({createdAt:'descending'}).limit(limit)
                  return logs
                }tellTimeBefore(val){ 

                  
                //younger than and older than feature

                //curresponding to the date updated
                // YoungerThan:'2day', YoungerThan:'2day',YoungerThan:'2day'
                // YoungerThan:'2day', YoungerThan:'2day',YoungerThan:'2day'



                  if(val[val.length-1] !== 's') val = val+'s'
                  let limit = 0
                  let number = parseInt(val)
                  switch(val.replace(/[0-9]/g, '').toLowerCase()){
                    case 'days':
                      limit = new Date(new Date().setDate(new Date().getDate()-number))
                      break
                    case 'hours':
                      limit = new Date(Date.now() - number*60*60 * 1000)
                      break
                    case `minutes`:
                      limit = new Date(Date.now() - number*60 * 1000)
                      break
                    case 'seconds':
                      limit = new Date(Date.now() - number* 1000)
                      break
                  }
                  return limit

                }twitterSearch(obj){

                  return new Promise(resolve=>{

                    

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
                }async readDBconfig(config,range){
                  
                  let dbConfig = await db.law.findOne({app: range.appName})
                  if(!dbConfig) return null
                  return dbConfig


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
                }async search(par,range){//handleparse is being passed beside the fact that we can just include handleParse through require(), this is because including handleParse inside handleParse will create a never ending loop
                  var queryOu = await handleQuery('search',par,range.via,this,prop, handleParse)
                  return queryOu
                }async write(par,range){
                  //par contains write on what database and what values to put
                  var queryOu = await handleQuery('write',par,range.via,this,prop, handleParse)  
                  return queryOu
                }async count(par,range){
                  par.type = 'count'
                  let data = await range.find(par,range)
                  return data
                }async find(par,range){

                  // throw new Error('error  does not exist in raniable name:')
                  var queryOu = await handleQuery('find',par,range.via,this,prop, handleParse)
                  return queryOu
                }async update(par,range){
                  var queryOu = await handleQuery('update',par,range.via,this,prop, handleParse)
                  return queryOu
                }async delete(par,range){
                  var queryOu = await handleQuery('delete', par, range.via, this, prop, handleParse)
                  return queryOu
                }


              }
    }



})

}


async function extractUserData(key){
  //###
  //username can be #username or id
  let userdata = key.indexOf('@') !== -1? await getUserData(key.replace('@',''),'username') : getUserData(key,'id')

  return userdata
}

 module.exports = handleParse