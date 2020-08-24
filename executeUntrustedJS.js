const {VM} = require('vm2');
var { processComunicator} = require('./processComunicator.js')

let sandbox = {executeJS:executeJS}
let cumminicator = new processComunicator(sandbox,console.log,process)


const fetch = require("node-fetch")


function executeJS(obj){

    return new Promise(resolve=>{

      
      if(!obj.sandboxGlobalContext) obj.sandboxGlobalContext = {}

      function done(output){
        resolve(output)
      }

    
      obj,sandboxGlobalContext.fetch = fetch
      obj.sandboxGlobalContext.done = done
      obj.sandboxGlobalContext.errorOccured = errorOccured

      let U = {collection:(collectionName)=>{
        return new class{
          constructor(){
            this.collectionName = collectionName
            this.find = this.find.bind(this)
            this.search = this.search.bind(this)
            this.update = this.update.bind(this)
            this.delete = this.delete.bind(this)
            this.getQuery = this.getQuery.bind(this)
          }
    
          getQuery(where,put,aditionalQuery){
            if(!aditionalQuery) aditionalQuery = {}
            return Object.assign({on:this.collectionName, where:where, put:put},aditionalQuery)
          }
    
          find(where,aditionalQuery){
            return U.query({ $find: this.getQuery(where,null,aditionalQuery)})
          }
    
          
          search(where,aditionalQuery){
            return U.query({ $search: this.getQuery(where,null,aditionalQuery)})
          }
    
          count(where,aditionalQuery){
            return U.query({ $count: this.getQuery(where,null,aditionalQuery)})
          }
    
          delete(where,aditionalQuery){
            return U.query({ $delete: this.getQuery(where)})
          }
    
          update(where,put,aditionalQuery){
            return U.query({ $update: this.getQuery(where,put)})
          }
    
          write(put,aditionalQuery){
            return U.query({ $write: this.getQuery(null,put)})
          }
        }
      },query:(toParse)=>{

        return new Promise(resolve=>{
          //how is code declared in action mode?
          //if handle parse inherits action as type from prop code will run without permission check
          cumminicator.instruct('handleParse',toParse,(data)=>{
            
            if(data) if(data.error){
          
              throw Error(data.error)
            } 
            resolve(data)
          })
        })
      }}

      obj.sandboxGlobalContext.U = U



      const vm = new VM({
        timeout: 1000,
        sandbox: obj.sandboxGlobalContext
      });

      let code = `
      async function wrapper(){

        console = {log:async (...toLog)=>{
          await U.query({$log:toLog})
          return toLog
        }}

     
        let functionToExecute = ${obj.code};
        const put = ${JSON.stringify(obj.put)};
        const field = ${JSON.stringify(obj.field)};
        const user = ${JSON.stringify(obj.user)};

        let valueToReturn = null
        if(typeof functionToExecute == 'function'){
          try{
            valueToReturn = await functionToExecute(${obj.arg})
          }catch(error){
            if(error.message) return errorOccured(error.message)
            return errorOccured(error)
          }
          
        }else{
            valueToReturn = functionToExecute
        }

     

        return done(valueToReturn)
        
      }; wrapper()
    `
    try{
        vm.run(code)
    }catch(error){
        console.log(error)
        errorOccured(error.message)
    }

    })


    




}


function errorOccured(message){
  cumminicator.instruct('errorOccured',message,null)
}

process.on('unhandledRejection',(reason)=>{
  errorOccured(reason.message)
})

process.on('uncaughtException', (reason) => {
  errorOccured(reason.message)
})