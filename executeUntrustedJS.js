const {VM} = require('vm2');
var { processComunicator} = require('./processComunicator.js')

let sandbox = {executeJS:executeJS}
let cumminicator = new processComunicator(sandbox,console.log,process)





function executeJS(obj){

    return new Promise(resolve=>{

      
      if(!obj.sandboxGlobalContext) obj.sandboxGlobalContext = {}

      function done(output){
        resolve(output)
      }

    

      obj.sandboxGlobalContext.done = done
      obj.sandboxGlobalContext.errorOccured = errorOccured

      obj.sandboxGlobalContext.U = {query:(toParse)=>{

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

        console.log('parsing started')
        let functionToExecute = ${obj.code};
        const put = ${JSON.stringify(obj.put)};
        const field = ${JSON.stringify(obj.field)};
        const user = ${JSON.stringify(obj.user)};

        let valueToReturn = null
        if(typeof functionToExecute == 'function'){
          try{
            valueToReturn = await functionToExecute(${obj.argument})
          }catch(error){
            if(error.message) return errorOccured(error.message)
            return errorOccured(error)
          }
          
        }else{
            valueToReturn = functionToExecute
        }

        console.log(valueToReturn)

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