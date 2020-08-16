var crypto = require("crypto");

class processComunicator{

  constructor(sandbox,failure,to){
    this.sandbox = sandbox;
    this.callbacks = {}
    this.failure = failure
    this.to = to

    this.childProcessComunicator = this.childProcessComunicator.bind(this)
    this.instruct = this.instruct.bind(this)

    this.to.on('message',this.childProcessComunicator)

    this.to.on('close', ()=>{
      this.processEnded = true
    })

  }


  childProcessComunicator(mes){


    if(mes.type == 'outputOfRequest'){
      if(!this.callbacks[mes.callbackCode]) return
      return this.callbacks[mes.callbackCode](mes.value)
    }

  
    let executer = async ()=>{

      try{
        let value = await this.sandbox[mes.functionName](mes.argument)
        if(this.to.killed) return

        this.to.send({type:'outputOfRequest',callbackCode:mes.callbackCode, value:value  })
    
        
      }catch(e){
        return this.failure({error:e.message})
      }
      
    }

    executer()
   
  }

  kill(){
    this.to.kill()
    this.killed = true
  }

  instruct(functionName,argument,callback){
      
    let callbackCode = crypto.randomBytes(20).toString('hex')

    this.to.send({type:'requestToExecute', functionName:functionName ,argument:argument, callbackCode:callbackCode})
    this.callbacks[callbackCode] = callback
  }

} 




  module.exports = {processComunicator:processComunicator}