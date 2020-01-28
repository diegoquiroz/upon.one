const db = require('./db.js')
const handleParse = require('./handleParse.js')

function cronWorker(type,specificApp,callback){//callback: in case of manually running log

  if (!type) type = 'daily'

  let query = {}
  query[type] = { '$ne': null }


  if (specificApp) query.app = specificApp// for manually running log

  //to do save log
  // update db

  db.law.find( query ,function(err, alltasks){

    if (err) return console.log(err)
    if (!callback) console.log('executing cron '+type)

    if (alltasks.length === 0){
      if(callback) return callback(false)
      return
    } 

    for(let task of alltasks){

    	if (!task[type]) continue

      function writeAllLogs(log){//support for array log

          writeLogsToAppsDb( task.app, log ,(bool,error)=>{
            if (bool === false) return console.log(error)
          })
      }

      let allLogs = []
      let point = 0
      let arrrayOfCron = JSON.parse( task[type] ) //ex: if multiple daily cron exist on a single app


      function pushLog(data){
        allLogs.push(type+' cron log: '+data)
      }


      let preCode = null
      if(task.preCode) preCode = JSON.parse(task.preCode) //precode is parsed here as well, so that additional function are provided

      for(let index of arrrayOfCron){

          //$user is intentionally not provided
          handleParse({log:pushLog, app:task.app, preCode:preCode , parse:index, type:'action', database: JSON.parse(task.DBs) }).then((data)=>{

          	// parse executed

          if(!data){
          	pushLog('successful')
          }else if(data.error){
             pushLog('cron error: '+data.error)
            data = data.error
          }else{
            pushLog(data)
          }

          

          point += 1

          if (point >= arrrayOfCron.length){
            writeAllLogs(allLogs)
            if (callback) callback(allLogs)
          }  //all taks from array completed
          

        })



    }





      
    }
    
  })
}

function writeLogsToAppsDb(appname,logMessage,callback){

	

  db.apps.findOne({name: appname}, function (error, doc) {

  	if (error) return callback(false,error)
    if (!doc) return callback(false,'app not found')

    let logList = doc.logs
    let newLogList = []

    for(let index of logList){
      newLogList.push( index ) 
    }

    for(let index of logMessage){
      newLogList.push(index)
    }

    // 45 is the highest amount of logs

    let theShiftCount = newLogList.length - 45

    if(theShiftCount > 0) for(let t = 0; t<=theShiftCount; t++){
      newLogList.shift()
    }

    // console.log(newLogList)

    db.apps.findOneAndUpdate({name: appname},{logs:newLogList},(err,doc2)=>{
      if (err) return callback(false,err)
      callback(true,doc2)
    })

  })
}

module.exports = cronWorker