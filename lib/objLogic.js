var parse = async function(object,range){

  if(typeof object === 'string' || typeof object === 'number'){
    return range.value(object,range)
  }else if(object === null || object === undefined){
    return null
  }else if (Object.keys(object).length === 0 && object.constructor === Object){
    return {}
  }


// write -> on, put-> string,array

  if(!range) range = new helperFunction()

  for (let a in object) {

    //can the work of value be done in the first loop
    //functional object or not
    if(a.indexOf('$') === -1)return await range.value(object,range)

    var functionName = a.replace("$", "")

    var childs = object[a]
    var parameter = null
    var objParameter = {}
    var arrayParameter = []

    async function getValue(tm){
      var finalValue = null
      var temporary_parameter = await parse(tm,range)

      if(temporary_parameter == null) return null

      if(temporary_parameter.then){
        temporary_parameter.then(resultOfP=> finalValue = resultOfP)
      }else{
        finalValue = temporary_parameter
      }
      // console.log(finalValue,'obj')
      return finalValue
    }


    if(childs.length){
      
      for (let b of childs){

        arrayParameter.push( await getValue(b) )
     
      }
      
      parameter = arrayParameter
    }else if (typeof childs === 'object'){
      // console.log(childs[b])
      for (let b in childs){
        objParameter[b] = await getValue(childs[b])
      }
      parameter = objParameter
    }

    // check for strings too
    var virtualFunction = range[functionName];

    if (!virtualFunction) throw new Error('function does not exist :'+functionName)

    var output = await virtualFunction(parameter);

    if (output === null || output === undefined ){
      return null
      console.log(output,functionName,parameter,'null output from object parser')
    }

    if (output.then) {
      output.then(result => {
        return result;
      });
    } else {
      return output;
    }
  }
};


// it is also extended by the range which is passed
class helperFunction{

  select(array){
    var key = array[0]
    var obj = array[1]

    console.log(key,obj,'selecting')

    if (!obj || !key) {
      return null
    }

    if (obj[key]) {
      return obj[key]
    }else{
      return null
    }

    
  }

  big_equal(on){

    return on[0] >= on[1] ? true : false;
  }

  small_equal(on){

    return on[0] <= on[1] ? true : false;
  }

   isBig(on){

    return on[0] > on[1] ? true : false;
  }
  
   isSmall(on){
    return on[0] < on[1] ? true : false;
  }
  
   isEqual(on){
    return on[0] === on[1] ? true : false;
  }
  
   add(on){

    var toBeAdded = []
    for (let nm of on){
      isNaN(nm)? toBeAdded.push(nm) : toBeAdded.push( Number(nm) )
    }

    var sum = 0
    if (isNaN(on[0])) sum = ''
    

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
    return on[0] * on[1];
  }
  
  remainder(on) {
    return on[0] % on[1];
  }
  
  async value(value,range) {
    
    if (typeof value === "number") return value;
    if (typeof value === "object"){

      // console.log('object detected')

      var newTransformedObject = {}

      if ( Array.isArray(value) ) {

        newTransformedObject = []

        for(let index of value){
          newTransformedObject.push(  await parse( index ,range) ) 
        }

      }else{

        for(let index in value){
            newTransformedObject[index] = await parse( value[index] ,range) 
        }

      }


        
        

      
      return newTransformedObject
    
      
    }else{
      return value.indexOf("$") === -1 ? value : breakDots(value)
    }

    // if it is a string


    
    //breakDots has a copy in index . js for the default value processing
    function breakDots(val){
      
      var replacedDollar = val.replace("$", "")

      var varTree = replacedDollar.split('.')
      var TMP = null
      for(let index of varTree){

        if(TMP=== null){


          if (range[index] === undefined) throw new Error('error '+index+' does not exist in range:'+range+'variable name:'+val)

          TMP = range[index]
        }else{

          if (TMP[index] === undefined) throw new Error('error '+index+' does not exist in local variable '+TMP+' at range:'+range+'variable name:'+val)


          TMP = TMP[index]
        }

      }
      return TMP
    }

  }
}

module.exports = {
  parse: parse,
  helperFunctions: helperFunction
}