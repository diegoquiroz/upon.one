
const mongoose = require('mongoose')

var { addUniquePrefix } = require('./functions.js')

const capitalize = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

//handleparse is being passed beside the fact that we can just include handleParse through require(), this is because including handleParse inside handleParse will create a never ending loop
function handleQuery(type,par,via,parentRange,prop,handleParse){

            return new Promise(resolveOutput=>{

          

              
              let appName = parentRange.appName
              var DBName = par.on
              var theDatabaseInfo = prop.database[DBName]
              if (!theDatabaseInfo) return resolveOutput({error:'Check collection name'})

              let collection = prop.db.collections[par.on]

              

              if ( (type == 'update' || type == 'find') && !par.where)  par.where = {}
              if (type === 'write' && par.where) return resolveOutput({error:"where not a recognized under $write"})
             
              if (!par.put) par.put = null

              let fieldsWithAttribute = {}
              let permissionToCheck

              switch(type){
                case 'update': 
                  permissionToCheck = 'updatable'
                  break;
                case 'find': 
                  permissionToCheck = 'findable'
                  break;  
                case 'search': 
                  permissionToCheck = 'findable'
                  break;  
                case 'write': 
                  permissionToCheck = 'writable'
                  break;      
                case 'deletable': 
                  permissionToCheck = 'deletable'
                  break;     
              }

              function failure(failureData){
                return resolveOutput({error:'permission denied',errMsg:failureData})
              }


              function errorOccured(failureData,meta){
                if(!meta) meta = null
                return resolveOutput({error:failureData, meta:meta})
              }

              function resolve(data){
                //execute onAction like onUpdate or OnWrite or Onfind

                let onActionName = 'on'+capitalize(type)

                function reportErrorToLog(dataNmeta){
                  let error = dataNmeta.error
                  //save to log collection of that app
                }

     

                handleParse(prop,{ parse:theDatabaseInfo[onActionName], put:par.put, field:data, failure:reportErrorToLog, via:'action'})
                
                resolveOutput(data)
              }


              function permissionCheckAbstraction(toParse,field){
                return new Promise(permissionResolved=>{
                  handleParse(prop,{ parse:toParse, put:par.put, field:field, failure: failure}).then(permissionResolved)
                })
              }



              for(let field in theDatabaseInfo.schema){
                if (typeof theDatabaseInfo.schema[field] !== 'object') continue
                for(let key in theDatabaseInfo.schema[field]){
                  
                  if(!fieldsWithAttribute[key]) fieldsWithAttribute[key] = {}
                  fieldsWithAttribute[key][field] = theDatabaseInfo.schema[field][key]

                }
              }

             

                
              if(par.put) if(par.put.id) throw Error(`id can't be altered`)

              par.where = translateId(par.where)

              function translateId(query){


                  for(let key in query){
                    if(key == '_id'){
                    
                      let validId = mongoose.Types.ObjectId.isValid(query[key])
                      if(!validId) throw Error('invalid id')
                      query['_id'] = mongoose.Types.ObjectId(query[key])
                      continue
                    }
                  }
            
                return query
              }

          
              
              //Note: why is field value not available to write, read and update parse: because it doesn't needs one it is only required for the permission parse as no one will say write $writer or read where $writer = user id they can just use the field name
              //exception: it is available for update put query 

              function loopPremissionCheck(info_read, callback){
                
                if (info_read.length === 0) return callback(info_read)
                var filteredRows = []
                let loopStep = 0
                permissionLoopChecker()

                function permissionLoopChecker(){

          
                  function checkComplete(returnedValue){
                    if(returnedValue == true){
                      filteredRows.push( info_read[loopStep] )
                      CheckEndOrIncrement()
                    }else{
                      return failure(returnedValue)
                    }
                  }

                  function CheckEndOrIncrement(){
                          loopStep++
                          if (loopStep >= info_read.length){
                            return callback(filteredRows)
                          }else{
                            permissionLoopChecker()
                          }
                  }

                  permissionCheckAbstraction(theDatabaseInfo[permissionToCheck], info_read[loopStep]).then(checkComplete)

                }

              }

               
              async function checkIndivisualFieldPermission(query,typeOfQuery){
                for(let field in fieldsWithAttribute[typeOfQuery]){

                  let toParseObj = fieldsWithAttribute[typeOfQuery][field]

                    if(par.select){ //to do 
                      if(!par.select[field]){
                        noIcantreadThisField(false)//if this field is not in the select obj then don't read it and thus don't check permission to read it bu continuing 
                        continue
                      }
                    }

                    
                    let parsed = await permissionCheckAbstraction(toParseObj, query)
        

                    //for indivisual permission undefined, it means allowed
                    //for main permission undefined means not allowed

                    if(query[field]) if(parsed == false && typeOfQuery !== 'findable') return failure('sub permission denied')
                    if(query[field]) if(parsed == false) query[field] = 'not allowed to read';
                  }

                return query
              }

              async function fillDefaultValues(query){
                
                for(let field in fieldsWithAttribute.default){

                  if(!query[field]){
                    let defaultValue = fieldsWithAttribute.default[field]
                    //the default value could also we a function
                    query[field] = await handleParse(prop, { via:'action', parse:defaultValue, put:par.put, failure: (data)=>{ errorOccured(data.error,'Error when setting default value') }})
                  }

                }

                return query
                
              }



              //  support for all the values listed here
              //  https://docs.mongodb.com/manual/reference/operator/query/



                
                switch(type.toLowerCase()){
                  
                  case 'write':
       
                    let writeFunction = ()=>{
                     
                      var vr_schema = new collection(par.put)
                      vr_schema.save((error,writenObj)=>{

                        if (error) return resolveOutput({error:{code:error.code,message: error.message} })

                        return resolve(writenObj)

                      })
                    }

                    let originalPut = {...par.put}

                   

                    fillDefaultValues(par.put).then(proceedTowrite) //it needs to be done even when query is requested via action
                    

                    function proceedTowrite(){
            
  
                      
                      if(via === 'action') return writeFunction()
                    
                      //we are giving original put here because default put values must not be regarded as write
                      checkIndivisualFieldPermission(originalPut,'writable').then(function(){
                  
                        permissionCheckAbstraction(theDatabaseInfo[permissionToCheck]).then((parsed)=>{
                          if(!parsed) failure()
                          
                          writeFunction()
                        })
                      })

                    }


                    
                    break
                  case 'update'://only one update doing multiple updates may slow  down server, multiple updates can occur on the client side, multiple update also doesn't has many applications
                    
                  
                  collection.findOne(par.where, (err, info_read)=>{

                      if(err) throw Error(err)
                      if(!info_read) return errorOccured('docuemnt not found to be updated')
                      if(via === 'action') return update([info_read])

                      checkIndivisualFieldPermission(par.put,'updatable').then(proceedQuery)

                      function proceedQuery(){
                        loopPremissionCheck([info_read],update) //check if we can update this document
                      }

                  })

                  //only one row is updated
                  async function update(filteredRows){

                    if(filteredRows.length === 0) return failure()

                      collection.findOneAndUpdate({_id: filteredRows[0].id},par.put, {new: true} ,function(error, doc){
                        if (error) return resolve( {error:error} )
                        return resolve( doc)
                      })
                  }


                    break
                  case 'find':
                    

                    let sortBy = {sort:{}, limit: 50}//max results are 50
                    if (par.limit) sortBy.limit = par.limit//document limit

                    if (par.sort){
                      if (!par.sort.by) return resolve({error:'sort field not declared'})
                      sortBy.sort[par.sort.by] =  par.sort.order 
                    }else{
                      sortBy.sort['created_at'] = 'descending'
                    }


                    if(par.type == 'count'){//return the number of documents, pb: permission check does not happen but it is also not that necessary as no. of documents doesn't reveal much
                      
                    collection.countDocuments(par.where, function(err, info){
                        if(err) throw Error(error)
                        return resolve(info)
                    })

                      return
                    }


                    collection.find(par.where,null,sortBy,function(error, info_read){
                      if (error) throw Error(error)
                      if(via === 'action') return resolve(info_read)

                      loopPremissionCheck(info_read,primePermissionCheckSuccessful)

                      
                      async function primePermissionCheckSuccessful(readDocumentsArray){ //now doing indivisual readable check
                        
                        let newDocArray = []
                       
                        for(let index of readDocumentsArray){
                          newDocArray.push( await checkIndivisualFieldPermission(  index ,'findable') )
                        }

                        resolve(newDocArray)
                      }
                      
                    })
                    break
                  case 'delete':
                    
                    collection.find(par.where,function(error, info_read){
                      if(error) throw Error(error)
                   
                      
                      if(info_read.length === 0) resolve({error:'not found'})
                      if(via === 'action') return checkComplete(info_read)

                      loopPremissionCheck([info_read[0]], checkComplete)

                      
                      function checkComplete(){
                        collection.deleteOne({_id: info_read[0].id}, function(err) {
                          if(err) throw Error('delete error'+err)
                          if(!err) resolve(true)
                        })
                      }


                    })


 

                    break
                  case 'search':
                   
                    //Wildcard indexes cannot support queries using the $text operator so we switched to atlas full text search
                    //atlas full text search: https://docs.atlas.mongodb.com/reference/atlas-search/tutorial/#fts-tutorial-ref
                    //par.field could be a field to allow multiple fields

                    let limit = 10
                    if(par.limit) limit = par.limit

                    if(!par.field) throw Error('field is mandatory for $search, use array for multiple field, string for indivisual field')


                    collection.aggregate([

                        {$search: {
                          "text": {
                            "query": par.for,
                            "path": par.field
                          }
                        }},
                        { "$limit": limit },
                      
                      ]).exec((error, info_read)=>{

                        if (error) return resolve( {error:error} )
                        if(via === 'action') return resolve(info_read)
                        loopPremissionCheck(info_read,resolve)

                    })

                    break                           
                }
              
            })
}






module.exports = handleQuery