var parse = async function(object,range,returnRange){

  // console.log(object)

// console.log(object)
  //$if:[condition,]
  //if then sececs else 

  //write:{on:'',put:'' }
  // if :{check: condition, then: if true, else: if false }
  
  // {'$if' :{
//     check:{ 

//   {$and:[

//     {$or:[

//       {$isEqual:[2,4] },
//       {$isBig:[4,2]}

//     ]}

//     ,{$isBig:[

//       {$multiple:[2,2]} 

//       ,{$divide:[4,2]} 

//      ] }

//   ]} 

// }, 
//     then:{'$if':{

//           check:{'$isequal':[2,2] }, 
//           then: {'$add':[2,2] }, 
//           else: {'$minus':[2,2] } 

//         }}, 
//     else: {'$minus':[2,2] } 
//   } }

// { '$if':[
//  {'$isequal':[2,2] } 
//  ,{ '$if':[

//    {'$isequal':[2,2] } 
//    ,{'$add':[2,2] } 
//    ,{'$minus':[2,2] }

//   ]} 
//  ,{'$minus':[2,2] }
//  ]}

  //pro and cons of object vs array
  // { $if:[ condition, if true , if false ] }
  // { $if:[ {'$isequal':[2,2] } , {'$add':[2,2] } , {'$minus':[2,2] }] }

  if(!range) range = new helperFunction()

  if(typeof object === 'boolean'){
    return object
  }else if(typeof object === 'string' || typeof object === 'number'){
    return await range.global.value(object,range)
  }else if(object === null || object === undefined){
    return null
  }else if (Object.keys(object).length === 0 && object.constructor === Object){
    return {}//why 
  }else if( Array.isArray(object) ){

      let toReturn = []

      for (let b of object){

        toReturn.push( await getValueOfTheParameter(b) )
        //if return variable exist then break the loop

        if(range._var_to_return_ !== undefined) break
      }

    if (range._var_to_return_) return range._var_to_return_

    return toReturn
  }


// write -> on, put-> string,array
//what if there is an array
  


    async function getValueOfTheParameter(tm){
      var finalValue = null
      var temporary_parameter = await parse(tm,range)

      if(temporary_parameter == null) return null

      if(temporary_parameter.then){
        temporary_parameter.then(resultOfP=> finalValue = resultOfP)
      }else{
        finalValue = temporary_parameter
      }

      if(finalValue === undefined) throw new Error('undefined value not permitted. origin: '+tm)
      // console.log(finalValue,'obj')
      return finalValue
    }

    function localizeRange(parentRange){
      let newAddress = parentRange.global.random()
      //to do: in case of $function we need to set range in the place where function was defined at the time of execution
      parentRange[newAddress] = {parent:parentRange, global:parentRange.global, via:parentRange.via }// if code is changed it should match the one for precode 
      range = parentRange[newAddress]
    }


  //what if there is an array
  for (let a in object) {

    //can the work of value be done in the first loop
    //functional object or not

    //global is for just core functions function, global needs to be removed

    // if(a.indexOf('$') !== -1){
    var functionName = a.replace("$", "") //for compatablity
    // }

    let exceptionFunctions = ['function','for','if','>','<','=','==','>=','<=','return','()','&','||']

    // console.log(functionName,exceptionFunctions[])
    //makes dollar not mandotory//add climb 
    // if( !range.global[functionName] && !range[functionName] && !exceptionFunctions.includes(functionName) ){ //if that as a function exist then execute, otherwise return the parsed object
      
    //   if( a.indexOf('$') !== -1) throw new Error('function: '+a+' not found') 

    //   //if as a funtion it was not found and there is not even a dollar sign object must be returned with just parsed variables 
    //   return await range.global.value(object,range)

    // }

    if(a.substr(0,1) !== '$' && !exceptionFunctions.includes(functionName) ){
      return await range.global.value(object,range) //it is not a function string or something
    }


    //to do document the difference between $or and or. $or is a function but or is part of database query language mongodb  

    /*

    how to declare a function

    declared when it is called pipeing makes it take too much time, it will be available ti it as a parent function

    { '()' :[ 

      {let: follow_count: {getfollowcount:{user:'$user.username'}} }
      ,{ if:[ bigger:[follow_count,100], return:[true], return:[false] ] }

      
      //it is a great way to visualize how a programming language works

    ]}

    the follow_count is { getfollowcount:{user:'$user.username'} }
    if [ bigger:[follow_count,100] then say true otherwise say false

    */


    //what if not a function, so it returns oject with parsed variables, for arrays it is done above

    

    let childs = object[a]
    let parameter = null
    let objParameter = {}
    let arrayParameter = []


    // to do declare a function






    switch(functionName){

      case 'return':
        functionName = 'setResolve'
        // console.log(childs,object)
        break
      case '()':
        functionName = 'lines'
        localizeRange(range)
        break
      case '<':
        functionName = 'smaller'
        break
      case 'for':
        functionName = 'loop'
        break
      case '>':
        functionName = 'greater'
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


    //anonymus function
    
    //check if a reserved function is not being declared

    /*
      now the format is { '()':[
        
        //equal
        {let: {followCount: {getFollowCount:{user:'$user.id'}}   }},
        { equal:[followCount,200] }
          

      ]}
        }

    */

    //exception function 
    // if (functionName === 'return') console.log(childs)

    //a function is declared
    if (functionName === 'function'){
      parameter = childs//don't parse child return as it is and make use of set
      functionName = 'set' 
    }else if (functionName === 'if'){

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

      // if (!ifFalseObj) ifFalseObj = {$echo:false} //to do send meta data with api

      if ( !ifTrueObj ) throw new Error('parameter not defined for :'+functionName)

      let condition_value = await getValueOfTheParameter(conditionObj)

      if (condition_value == true){
        await getValueOfTheParameter(ifTrueObj)
        arrayParameter.push(  true)
      }else if(ifFalseObj){
        await getValueOfTheParameter(ifFalseObj)
        arrayParameter.push( false )
      }

      parameter = arrayParameter

      functionName = 'echo'
    }else if(Array.isArray(childs)){
      
      for (let b of childs){

        arrayParameter.push( await getValueOfTheParameter(b) )
        //if return variable exist then break the loop

        if(range._var_to_return_ !== undefined) break
      }
      
      parameter = arrayParameter
    }else if (typeof childs === 'object'){
      // console.log(childs[b])
      for (let b in childs){
        objParameter[b] = await getValueOfTheParameter(childs[b])
      }
      parameter = objParameter
    }else if(typeof childs === 'string' || typeof childs === 'boolean' ){//child type of string
      parameter = await parse(childs,range)

      // console.log(functionName+': '+a+' has '+parameter)
    }


    //check if function execution is allowed
    let isAllowed = range.global.exceptionForLogin(functionName,exceptionFunctions)
    if(isAllowed.allowed === false) throw new Error(isAllowed.error) 


    // check for strings too
    let climedPosition = climbToFindRange(range,functionName,'function not defined')



    let virtualFunction = climedPosition.value//## does it give range, change name of the variable
    let output = null

    if(typeof virtualFunction === 'object'){

      //important: the scope of declared function is defined by the place it was declared not where it was executed
      localizeRange(climedPosition.range)
      range.arg = parameter //put parameter in the range
      output = await parse(virtualFunction,range); //how to pass parameters
    }else if(typeof virtualFunction === 'function'){
      // console.log('function found',virtualFunction)
      output = await virtualFunction(parameter,range);
    }else{

      throw new Error('function type of '+typeof virtualFunction+' not allowed') 
    }


    if ( output === undefined ) throw Error(functionName+' function: '+a+' has undefined output') 


    if(output === null){
      return null
    }else if (output.then){
      output.then(result => {

        if(returnRange) return range //exception for precode

        if ( result === undefined ) throw Error(functionName+' function: '+a+' cant output undefined ')
        return result;
      });
    }else{
      if(returnRange) return range //exception for precode

      return output;
    }
  }
};


//how to implement if statement

// how to test write and update and read conditions

// it is also extended by the range which is passed
class helperFunction{

  constructor(){
    this.global = this
  }

  random(){
    return Math.random().toString(36).substring(2, 15)+Math.random().toString(36).substring(2, 15)
  }


//might remove 
  let(obj,range){//current range is passed to all functions
    return range.global.the(obj,range)
  }



  var(obj,range){
    return range.global.the(obj,range)
  }

  The(obj,range){
    return range.global.the(obj,range)
  }

  set(obj,range){
    return range.global.the(obj,range)
  }
//might remove 


  the(obj,range){

    if (typeof obj !== 'object' ) throw new Error('let or set function only takes object not '+typeof object) 
    if (Array.isArray(obj) ) throw new Error('let or set function only takes object not array') 

    let resurved = ['_var_to_return_']

    for(let key in obj){
      if ( resurved[key] ) throw new Error(resurved[key]+'is resurved ') 
      range[key] = obj[key]
    }

    return true
  }

  loop(objOrArray,range){

    return new Promise(resolve=>{

    let initialValue = null
    let condition = null
    let manipulatorFunction = null
    let executable = null

    //we will need to pass the initialValue as the argument for the executable

    if ( Array.isArray(objOrArray) ) {
      initialValue = objOrArray[0]
      condition = objOrArray[1]
      manipulatorFunction = objOrArray[2]
      executable = objOrArray[3]

    }else if(typeof objOrArray === 'object'){
      initialValue = objOrArray.with
      condition = objOrArray.condition
      manipulatorFunction = objOrArray.move
      executable = objOrArray.do
    }else{
      throw Error('invalid input: $loop')
    }

    let maxLoopCount = 500
    let loopTimes = 0

//we dont need initial value
//to do make initial value an intiher

    //initial value is not mandatory

    async function doLoop(){

      initialValue = Number(initialValue)

      if(isNaN(initialValue)) throw Error('initial value is NaN') 

        let parsedCondition = await  parse(condition,range)
        if (parsedCondition !== true) return resolve(true)

        loopTimes += 1
        if (loopTimes >= maxLoopCount) throw Error('loop limit crossed'+maxLoopCount)

         //check

        await parse(executable,range) //execute
        await parse(manipulatorFunction,range) //increment
        await doLoop() //repeat

    
    }

    if (initialValue) {
      parse(initialValue,range).then(declared=>{

        initialValue = declared
        doLoop().then(data=>{
          resolve(true)
        })

      })
    }else{
      doLoop().then(data=>{
        resolve(true)
      })
    }


    })

  }

  // { '()':'hey' } how anonymus function can be called and function will be declared by {function : { a:'something' } }

  //a new range is set when function is called either by $(function) 

  //if statement for return function to make return function setresolve, setresolve is the $return


  //this is the real return function 
  setResolve(value,range){

    // if (!Array.isArray(array) ) throw new Error('$setResolve function takes array, '+typeof arg+'was provided') 

    // if(array.length === 0 || array[0] === undefined ) throw new Error('the value to return is undefined')

    if (Array.isArray(value) ) value = value[0]

    range._var_to_return_ = value
    // range.breakLine === true
    return range._var_to_return_
    //mark it as resurved
    //break executing too
  }

  //this is the real  function () 
  lines(object,range){
    // variable 
    //what to return

    if (range._var_to_return_ !== undefined){

      console.log(range._var_to_return_,'function')

      let returnVar = range._var_to_return_
     // reuse not needed // range._var_to_return_ = undefined //so it it can be reused for another stack, like recursively
      return returnVar

    }else{
      console.log('return value not set',object)//for a function it is not necessay to return a value
      return null 
    }
    // retuobject.variable

    // object.lines
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

  // <= add for compatablity

  big_equal(on){//big or equal

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


  //compatablity
  equal(on,range){
    return range.global.isEqual(on)
    // isEqual(on)
  }

  bigger(on,range){
    range.global.isBig(on)
    // isEqual(on)
  }


  smaller(on,range){
    range.global.isSmall(on)
    // isEqual(on)
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
    
    if (typeof value === "number") return value;
    if (typeof value === "object"){

      // console.log('object detected')

      var newTransformedObject = {}

      if ( Array.isArray(value) ) {

        newTransformedObject = []

        for(let index of value){
          newTransformedObject.push(  await parse( index ,range) )

          // if (this.breakLine === true){
          //   this.breakLine === false
          //   break;
          // } //why break line for non executing objects?

        }

      }else{

        for(let index in value){

          newTransformedObject[index] = await parse( value[index] ,range)

          // if (this.breakLine === true){
          //   this.breakLine === false
          //   break;
          // }

        }

      }


        
        

      
      return newTransformedObject
    
      
    }else{

      return value.substr(0,1) !== '$' ? value : breakDots(value)
    }

    // if it is a string


    
    //breakDots has a copy in index . js for the default value processing
    function breakDots(varTree){
      
      

      if( !Array.isArray(varTree) ){

        varTree = varTree.replace("$", "")
        varTree = varTree.split('.')

      }

      var TMP = null

      for(let index of varTree){


          let temporarySwitch = null
          
          TMP=== null ? temporarySwitch = range : temporarySwitch = TMP

          //to do restrict parent
          if(TMP=== null && range.parent && temporarySwitch[index] === undefined){

            // let valueToFind = index
            if (index.indexOf('[') !== -1){

              // console.log('founddddddddddd',index.substring(0,index.indexOf('[')) ,  index.substring( index.indexOf('[')+1 , index.indexOf(']') ))
              let parentIndex = climbToFindRange(range,  index.substring(0,index.indexOf('[')) )


              let childIndex = index.substring( index.indexOf('[')+1 , index.indexOf(']') )

              if ( childIndex.indexOf('\'') !== -1 ||  childIndex.indexOf('\"') !== -1 ) {

                childIndex = childIndex.replace(/\'/gi,'')
                childIndex = childIndex.replace(/\"/gi,'')

              }

                if (childIndex.substr(0,1) === '$'){
                  childIndex = climbToFindRange(range, childIndex ).value
                }

                //to do in telepathy parser if there is no quotes between square brackets add a dollar sign
                //telepathy also deals with string form of square brackets



              // temporarySwitch = parentIndex.value[childIndex]

              TMP = parentIndex.value[childIndex] //it makes the TMP not equal to null and make it proceed to the next loop if there is a loop


              continue
            }

            let newRangeandValue = climbToFindRange(range,index)//if parent exist and current location does not has the value

            temporarySwitch = newRangeandValue.range

          }

          if (temporarySwitch[index] === undefined){

            console.log(range)
            throw new Error('error '+index+' does not exist in local variable '+value,range)
            
          } 

          TMP = temporarySwitch[index]

      

      }
      return TMP
    }

// temporarySwitch = newRange.parent

  }
}


//either used to find function or value in case of value (string) it tells what range to start scanning from
function climbToFindRange(newRange,index,errorMsg){

  //parent setup changed

  
  

  if( newRange[index]){
    return {value: newRange[index] ,range:newRange}
  }else if(newRange.parent){//if parent does not has the value but parent has a parent
    return climbToFindRange(newRange.parent,index)
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
