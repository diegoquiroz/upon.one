var parse = async function(object,range){


  if(!range) range = new helperFunction()

  if(typeof object === 'boolean'){
    return object
  }else if(typeof object === 'string' || typeof object === 'number'){
    return await range.value(object,range)
  }else if(object === null || object === undefined){
    return object
  }else if (Object.keys(object).length === 0 && object.constructor === Object){
    return {}//why 
  }else if( Array.isArray(object) ){

      let toReturn = []

      for (let b of object){

        toReturn.push( await getValueOfTheParameter(b) )
        //if return variable exist then break the loop
      }

    return toReturn
  }else if( typeof object == 'object'){
    for (let a in object) {

      var functionName = a.replace("$", "") 

  
      let exceptionFunctions = ['function','for','if','>','<','=','==','>=','<=','return','()','&','||']
  
      if(a.substr(0,1) !== '$' && !exceptionFunctions.includes(functionName) ){ //a is not a function
        return await range.value(object,range) 
      }
  
      
  
      let childs = object[a]

      let parameter = null
      let objParameter = {}
      let arrayParameter = []
  
  
      switch(functionName){
  
        case 'return':
          functionName = 'setResolve'
          break
        case '()':
          functionName = 'lines'
          localizeRange(range)
          break
        case '<':
          functionName = 'smallerThan'
          break
        case 'for':
          functionName = 'loop'
          break
        case '>':
          functionName = 'greaterThan'
          break
        case '=':
          functionName = 'set'
          break
        case '==':
          functionName = 'equal'
          break
        case '===':
          functionName = 'equal'
          break
        case '>=':
          functionName = 'big_equal'
          break
        case '<=':
          functionName = 'small_equal'
          break
        case '||':
          functionName = 'or'
          break
        case '&':
          functionName = 'and'
          break
      }
  
      if (functionName === 'if'){
  
        let conditionObj = null
        let ifTrueObj = null
        let ifFalseObj = null
  
        if ( Array.isArray(childs) ) {
          conditionObj = childs[0]
          ifTrueObj = childs[1]
          ifFalseObj = childs[2]
        }else{
          conditionObj = childs['check']
          ifTrueObj = childs['then']
          ifFalseObj = childs['else']
        }
  
  
        if ( !ifTrueObj ) throw new Error('parameter not defined for :'+functionName)
        if ( !conditionObj ) throw new Error('condition not defined for :'+functionName)
  
        let condition_value = await getValueOfTheParameter(conditionObj)
  
        if (condition_value == true){
          await getValueOfTheParameter(ifTrueObj)
          arrayParameter.push(true)
        }else if(ifFalseObj){
          await getValueOfTheParameter(ifFalseObj)
          arrayParameter.push(false)
        }
  
        parameter = arrayParameter
  
        functionName = 'echo'
      }else if(Array.isArray(childs)){
        for (let b of childs) arrayParameter.push( await getValueOfTheParameter(b) )
        parameter = arrayParameter
      }else if (typeof childs === 'object'){
        for (let b in childs) objParameter[b] = await getValueOfTheParameter(childs[b])
        parameter = objParameter
      }else if(typeof childs === 'number' || typeof childs === 'string' || typeof childs === 'boolean' ){
        parameter = await parse(childs,range)
      }
  
  
  
      // check for strings too
      let climedPosition = climbToFindRange(range,functionName,'function not defined')
  
  
  
      let virtualFunction = climedPosition.value//## does it give range, change name of the variable
      let output = null
  
      if(typeof virtualFunction === 'function'){
        // console.log('function found',virtualFunction)
        output = await virtualFunction(parameter,range);
      }else{
        console.log(virtualFunction,functionName)
        throw new Error('function type of '+typeof virtualFunction+' not allowed') 
      }
  
  
      if(!output){
        return output
      }else if (output.then){
        output.then(result => {return result});
      }else{
        return output;
      }


    }
  }else{
    throw Error('type not supported: '+typeof object)
  }



  async function getValueOfTheParameter(tm){
    var finalValue = null
    var temporary_parameter = await parse(tm,range)

    if(temporary_parameter == null) return null

    if(temporary_parameter.then){
      temporary_parameter.then(resultOfP=> finalValue = resultOfP)
    }else{
      finalValue = temporary_parameter
    }
    return finalValue
  }




};


class helperFunction{

  constructor(){
  }

  random(){
    return Math.random().toString(36).substring(2, 15)+Math.random().toString(36).substring(2, 15)
  }


  and(args){

    if (!Array.isArray(args) ) throw new Error('$and function takes array, '+typeof arg+'was provided') 

    for (let index of args){
      if (index === false) return false
    }

    return true


  }

  or(args){

    if (!Array.isArray(args) )  throw new Error('$or function takes array, '+typeof arg+'was provided')

    for (let index of args){
      if (index === true) return true
    }

    return true
  }

  checkNAN(arg){
    return isNaN(arg)
  }

  checkType(arg){
    return typeof arg
  }

  checkArray(arg){
    return Array.isArray(arg)
  }

  select(array){

    console.log(array)
    if (!Array.isArray(array) )  throw new Error('$select function takes array, '+typeof arg+'was provided')

    var key = array[0]
    var obj = array[1]

    console.log(key,obj,'selecting')

    if (!obj || !key) {
      return null
    }

    if (!obj[key] && obj[key] !== 0) {
      return null 
    }else{
      return obj[key]
    }

    
  }

  echo(data){
    return data
  }

  big_equal(on){//big or equal

    return on[0] >= on[1] ? true : false;
  }

  small_equal(on){

    return on[0] <= on[1] ? true : false;
  }

  greaterThan(on){
    return on[0] > on[1] ? true : false;
  }
  
  smallerThan(on){
    return on[0] < on[1] ? true : false;
  }
  
  equal(on){
    return on[0] === on[1] ? true : false;
  }


  join(args){

    let returnValue = ''

    for (let string of args){
      if(typeof string !== 'string') throw new Error('$join only takes string ')
    }

    for (let string of args){
      returnValue = returnValue + string
    }

    return returnValue
  }

  add(on){//to do for all math function check for case when it is not a number

    var toBeAdded = []
    for (let nm of on){
      isNaN(nm)? toBeAdded.push(nm) : toBeAdded.push( Number(nm) )
    }

    var sum = 0
    if (isNaN(on[0])) sum = ''//risky case fix it soon
    

    for ( let operationValue of toBeAdded){
      sum += operationValue
    }

    return sum;
  }
  
  minus(on) {
    return on[0] - on[1];
  }
  
  divide(on) {
    return on[0] / on[1];
  }


  multiply(on) {
    console.log(on)
    return on[0] * on[1];
  }
  
  remainder(on) {
    return on[0] % on[1];
  }
  
  async value(value,range) {
    
    //converts $user to actual object

    if (typeof value === "number") return value;
    if (typeof value === "object"){

      // console.log('object detected')

      var newTransformedObject = {}

      if ( Array.isArray(value) ) {

        newTransformedObject = []

        for(let index of value) newTransformedObject.push(  await parse(index ,range) )
          
      }else{

        for(let index in value) newTransformedObject[index] = await parse( value[index] ,range)
          
      }

      
      return newTransformedObject
    
      
    }else{

      return value.substr(0,1) == '$' ? breakDots(value) : value
    }



    function breakDots(varTree){
      
      if( !Array.isArray(varTree) ){
        varTree = varTree.replace("$", "")
        varTree = varTree.split('.')
      }


      let currentObject = range
      let previousIndex = null
      for(let index of varTree){

          
          if (currentObject == undefined || currentObject == null){
            throw new Error('undefined: '+previousIndex)
            //can't go deeper
          }

      

          previousIndex = index
          currentObject = currentObject[index]

      }
      return currentObject
    }



  }
}


//either used to find function or value in case of value (string) it tells what range to start scanning from
function climbToFindRange(newRange,index,errorMsg){

  //parent setup changed

  
  

  if( newRange[index]){
    return {value: newRange[index] ,range:newRange}
  }else{//if parent's parent does not and parent does not has the value
    throw Error(errorMsg+': '+index)
  }

}



if( typeof module !== 'undefined'){
  module.exports = {
  parse: parse,
  helperFunctions: helperFunction
  }  
}
