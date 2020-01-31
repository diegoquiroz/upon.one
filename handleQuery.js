const db = require('./db.js')
var {parse,helperFunctions} = require('./lib/objLogic.js')
var { getUserData,checkBalance,random,renameOutput,setNewVerificationCode,sendEmail,sendVerificationEmail,addUniquePrefix } = require('./functions.js')


function handleQuery(type,par,via,parentRange,databaseSchema,handleParse){

            return new Promise(resolve=>{

              let appName = parentRange.app
              let userData = parentRange.user
                //name this thing
                if (type === 'write' && par.where) return resolve({error:"I am not that smart but where doesn't makes sense when in $write"})

                //to do make all 

                var DBName = par.on
                var theDatabaseInfo = databaseSchema[DBName]

                if ( (type === 'update' || type === 'read') && !par.where)  return resolve({error:'where field not given'})



                //app name cant be changed
                // console.log(databaseSchema,'database')
                // console.log(databaseSchema)
                if (!theDatabaseInfo) return resolve({error:'Check DB name'})
                if (!theDatabaseInfo.memoryAllocation) return resolve({error:'Check Memory allocation not found'})

                if (!par.put) par.put = null

                // console.log('processing query')//appname doesn't exist
                let fullDbName = appName+'_'+DBName
                let uniquePrefix = addUniquePrefix(fullDbName)


                var relation = theDatabaseInfo.memoryAllocation
                var putQuery = {}
                var writeQuery = {dbName:fullDbName}
                var whereQuery = {dbName:fullDbName}

                

                prepareQuery(par.put,par.where).then(function(QQQ){

                  putQuery = QQQ.put
                  writeQuery = Object.assign(writeQuery,QQQ.put )//to do what if is a read we are giving undefined variable or stopping the execution in case of node js update
                  whereQuery = Object.assign(whereQuery,QQQ.where )
                  
                  executeQuery()
                })


                async function prepareQuery(put,where){
                  // console.log('processing query 1')
                  
                  
                    const newPut = await renameInput(par.put)


                    const newWhere = await renameInput(par.where)
               
                    
                    return{put:newPut,where:newWhere}
               

                }

                //Note: why is field value not available to write, read and update parse: because it doesn't needs one it is only required for the permission parse as no one will say write $writer or read where $writer = user id they can just use the field name
                //exception: it is available for update put query 
                

                async function renameInput(interfaceObject,internallyCalled,whereOrPut){

                  // console.log(interfaceObject)

                  var schemaObject = {}

                  // console.log(interfaceObject)

                  // if(interfaceObject){
                  //   if (interfaceObject['_id']) schemaObject['_id'] = interfaceObject['_id']
                  //   if (interfaceObject['id']) schemaObject['_id'] = interfaceObject['id']
                  // }

                  if(interfaceObject) for(let key in interfaceObject){
                    
                    if(key === 'or' || key === 'and'){

                      if(! Array.isArray(interfaceObject[key])  ) throw Error('an Array was expected for '+key)

                      let queryArray = []

                      for(let index of interfaceObject[key]){
                        queryArray.push( await renameInput(index,true) )
                      }
                      schemaObject['$'+key] = queryArray

                    }else if(relation[key]){

                      schemaObject[ relation[key] ] = interfaceObject[key]

                    }else if(key === 'id' || key === '_id'){
                      schemaObject[ '_id' ] = interfaceObject[key]
                    }else{
                      // console.log(interfaceObject, internallyCalled)
                      return resolve({error:'invalid key '+key})
                
                      //it was not caught, //to do how to abort
                    }

                  }
                 


                  //if default value exist and value is not assigned
                  if(type === 'write' && !internallyCalled){
                    //it is called one more time for the where query


                    for(let key in relation){



                      if( schemaObject[ relation[key] ] ) continue

                      let defaultValue = theDatabaseInfo.schema[key].default

                      
                        //cautious 
                        if (defaultValue !== undefined){
                        
                            //the default value could also we a function
                            const parsedWriteObject = await handleParse({log: parentRange.logs ,app:appName, parse:defaultValue, put:par.put, failure: resolve, database:databaseSchema, user:userData})
                            schemaObject[ relation[key] ] = parsedWriteObject
       
                    
                            
                        }else{
                          //why do this?
                          // schemaObject[ relation[key] ] = null
                        }


                    }
                  }

                  //if I remake the whole object I wont be able to check if all the values of relation are provided 

                  //Generate unique string 
                  //in the put query if uniqe doesn't exist, if it exist
                  //if this is a write request?
                  if (!schemaObject['unique'] && type === 'write' && !internallyCalled){
                    schemaObject['unique'] = Math.random().toString(36).substring(2, 15)+Math.random().toString(36).substring(2, 15)
                  }



                  if(schemaObject['unique']){

                    let valueUnique = schemaObject['unique']
                    if( valueUnique.indexOf(uniquePrefix) !== -1 ) throw Error('not permitted unique value: '+valueUnique)

                    schemaObject['unique'] = addUniquePrefix(fullDbName,schemaObject['unique'])
                  }

                  if (type === 'write' && !internallyCalled){
                    schemaObject['registered_writer_field'] = userData.id
                  }

                  //input is renamed
                 

                  return schemaObject
                }

                function checkPermission(row,onSuccess,onFailure){

                  if(!theDatabaseInfo.permission)return onSuccess(true)
                  var permissionToDatabase = theDatabaseInfo.permission[type]
                  if(!permissionToDatabase)return onSuccess(true)


                  handleParse({log: parentRange.logs ,app:appName, parse:permissionToDatabase, put:par.put, field:renameOutput(row,relation,uniquePrefix),  success:parseSuccess, failure: resolve, database:databaseSchema, user:userData})

                  function parseSuccess(data){
                    if(data === true){
                      return onSuccess(true)
                    }else{
                      if(onFailure) onFailure(data)
                      // console.log('unexpected permission code: '+data)
                    }
                  }

                }

                function loop_RenameOutput_Resolve(info_read){
                  let data = []
                  if (info_read.length === 0) return resolve(data)
                  for(let index of info_read){
                    data.push( renameOutput(index,relation,uniquePrefix) )
                  }
                  resolve(data)
                }
                
                function loopPremissionCheck(info_read,callback){
     
                  if (info_read.length === 0) return callback(info_read)
                  var filteredRows = []
                  let loopStep = 0
                  permissionLoopChecker()

                  function permissionLoopChecker(){

            
                    function readAllowed(){
                      filteredRows.push( renameOutput(info_read[loopStep],relation,uniquePrefix) )
                      CheckEndOrIncrement()
                    }

                    function readNotAllowed(error_read){//break even if one of the row is out of scope
                      return failure(error_read)
                    }

                    function CheckEndOrIncrement(){

                            loopStep++
                            if (loopStep >= info_read.length){
                              return callback(filteredRows)
                            }else{
                              permissionLoopChecker()
                            }
                    }

                    checkPermission(info_read[loopStep],readAllowed,readNotAllowed)

                  }
                }

                function failure(failureData){
                  return resolve({error:'permission denied',errMsg:failureData})
                }

                function executeQuery(){


                  let requiredFields = {}
                  let unMutableFields = {}

                  for (key in theDatabaseInfo.schema){
                    if (typeof theDatabaseInfo.schema[key] !== 'object') continue
                    if (theDatabaseInfo.schema[key].required == true) requiredFields[ relation[key] ] = key
                    if (theDatabaseInfo.schema[key].mutable == false) unMutableFields[ relation[key] ] = key
                  }

                  function requiredMutableFieldCheck(queryToCheck,just){

                      for (key in unMutableFields){ //only actions can do mutation
                        if (queryToCheck[key]) throw Error('field '+unMutableFields[key]+' is not mutable')
                      }

                      if (just === 'mutation') return

                      for (key in requiredFields){
                        if (!queryToCheck[key])  throw Error('required field '+requiredFields[key]+' missing')
                      }
                  }





                  //curresponding to the date updated
                  // YoungerThan:'2day', YoungerThan:'2day',YoungerThan:'2day'
                  // YoungerThan:'2day', YoungerThan:'2day',YoungerThan:'2day'


                  function tellTimeBefore(val){ 

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

                  }

                  if(par.youngerThan || par.olderThan){

                    let val = par.youngerThan || par.olderThan



                    let comparisonType = '$lt' //older than means age less than

                    if(par.youngerThan){
                      comparisonType = '$gte'
                    }


                    whereQuery['created_at'] = {}
                    whereQuery['created_at'][comparisonType] = tellTimeBefore(val)

                  }

                  //get required field


                  switch(type.toLowerCase()){
                    case 'write':


               
                     //make rank unmutable

                      function writeFunction(){
                        // console.log(writeQuery)
                        var vr_schema = new db.vDb(writeQuery)
                        // console.log(writeQuery)
                        vr_schema.save((error,writenObj)=>{
                          if (error){

                            return error.code === 11000? resolve( {error:'duplicates not allowed by schema'} ) : resolve({error:error})

                          } 
                          return resolve(renameOutput(writenObj,relation,uniquePrefix))
                        })
                      }

                      if(via === 'action') return writeFunction()


                      requiredMutableFieldCheck(writeQuery)
                      checkPermission(null,writeFunction,failure)


                      break
                    case 'update':
                      db.vDb.find(whereQuery, function(err, info_read){
                        if (err) return resolve( {error:err} )

                          // console.log(info_read,'to update',whereQuery)

                        //if put query has a parameter which is a function

                        // console.log(whereQuery)

                        if (info_read.length === 0) return resolve({error:info_read+' field not found to update '})
                  
                        if(via === 'action') return loopUpdate(info_read)
                        requiredMutableFieldCheck(putQuery,'mutation')
                        loopPremissionCheck(info_read,loopUpdate)
                      })

                      async function loopUpdate(filteredRows){

                          if (filteredRows.length === 0 ) return resolve( {error:"permission denied"} )
                          var updatedRow = []
                          for (let index of filteredRows){
                            let updateRow = await listUpdate(index)
                            updatedRow.push(updateRow)
                          }


                          resolve(updatedRow)                      
                      }

                      async function parsePutQuery(field){
                        let parsedPutQuery = {}

                        for (let key in putQuery){

                          if (typeof putQuery[key] === 'object'){

                            function errorOccured(error){
                              return resolve( {error:error} )
                            }

                            //to do give log to handle parse in action
                            // console.log('parsing',putQuery[key],renameOutput(field,relation))
                            parsedPutQuery[key] = await handleParse({log:parentRange.logs, app:appName, parse:putQuery[key], field:renameOutput(field,relation,uniquePrefix), failure:errorOccured ,database:databaseSchema, user:userData})
                             
                            continue
                          }

                          parsedPutQuery[key] = putQuery[key]
                        }

                        // console.log(parsedPutQuery,'parsedPutQuery')

                        return parsedPutQuery
                      }

                      function listUpdate(obj){
                        return new Promise(resolve=>{

                            parsePutQuery(obj).then(parsedPutQuery=>{

                                // console.log(obj.id,parsedPutQuery)

                                db.vDb.findOneAndUpdate({_id: obj.id},parsedPutQuery, {new: true} ,function(error, doc){
                                  if (error) return resolve( {error:error} )
                                  // console.log(doc,'updated doc')
                                  return resolve( renameOutput(doc,relation,uniquePrefix) )
                                })

                            })




                        })
                      }

                      break
                    case 'read':
                      
                      let sortBy = {sort:{}, limit: 50}
                      let sortOrder = 1

                      let sortAccordingTo = 'created_at'
                      //accesding or decending
                      let relationObject = relation

                      if (par.limit) sortBy.limit = par.limit

                      if (par.sort) {

                        // console.log(par.sort, par.sort.by, !par.sort.by)
                        if (!par.sort.by) return resolve({error:'sort field not declared'})
                        if (!relationObject[ par.sort.by ]) return resolve({error:'sort field '+par.sort.by+' not declared'})
                        if (par.sort.order) sortOrder = par.sort.order
                        sortAccordingTo = relationObject[par.sort.by]
                        
                    
                      }



                      sortBy.sort[sortAccordingTo] = sortOrder 
                      // if(par.sort && relationObject[par.sortBy]) sortAccordingTo = relationObject[par.sort.by] //sort according to which field
                      
                      
                      // sortBy.sort[sortAccordingTo] = sortType// null, {sort: {date: 1}}

                      // console.log('sorting by..',sortBy)

                      if(par.type === 'count'){//return the number of documents, pb: permission check does not happen but it is also not that necessary as no. of documents doesn't reveal much
                        
                        db.vDb.countDocuments(whereQuery, function(err, info){
                          if(err) return resolve( {error:error} )
                          return resolve(info)
                        })

                      }else if(par.type === 'one'){
                        //to just return one document
                        
                      }

                      db.vDb.find(whereQuery,null,sortBy,function(error, info_read){
                        if (error) return resolve( {error:error} )

                        if(via === 'action') return loop_RenameOutput_Resolve(info_read)

                        loopPremissionCheck(info_read,resolve)
                      })
                      break
                    case 'erase':
                      // db.vDb.deleteOne(newQueryInput, function(err) {
                      //   if(!err) resolve(true)
                      // })
                      break
                    case 'search':
                      //##
                      db.vDb.find( {$and:[ {'$text': {'$search': par.for} },{dbName:appName+'_'+DBName}
                        ]} ).limit(10).exec((error, info_read)=>{
                          
                          if (error) return resolve( {error:error} )
                          if(via === 'action') return loop_RenameOutput_Resolve(info_read)
                          loopPremissionCheck(info_read,resolve)

                        })
                      break                           
                  }
                }

                //to do: bug: undefined value makes the whole filterrow undefined
            })
}






module.exports = handleQuery