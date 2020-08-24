if(!process.env.PORT) require('dotenv').config();
var jwt = require('jsonwebtoken');

const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY);



const jwtKey = process.env.jwtKey

const cry = require('crypto')

const db = require('./db.js')

function generateJWT(userDataForToken){
  return jwt.sign(userDataForToken, jwtKey, {
    algorithm: "HS256",
    expiresIn: '360 days',
  })
}

function getUserData(value,searchBy,appName){

  return new Promise(resolve=>{

    if(!appName) appName = false

    if (searchBy == true){
      queryObj =  { $or: [{username: value}, {email: value}] }
    }else if(searchBy == 'id'){
      queryObj = {_id:value}
    }else if(searchBy === 'username'){
      queryObj = {username:value}
    }else{

      if(!appName) throw new Error('error appName doesnt exits')

      var payload
      try {
        // Parse the JWT string and store the result in `payload`.
        // Note that we are passing the key in this method as well. This method will throw an error
        // if the token is invalid (if it has expired according to the expiry time we set on sign in),
        // or if the signature does not match
        payload = jwt.verify(value, jwtKey)
      } catch (e) {
        //if (e instanceof jwt.JsonWebTokenError) {
          // if the error thrown is because the JWT is unauthorized, return a 401 error
          //return res.status(401).end()
       // }
        // otherwise, return a bad request error
        //return res.status(400).end()
        console.log(e)
        resolve(null)
      }
    
     
      if(payload.appName !== appName) return resolve(null)

      return resolve(payload)


    }

    db.users.findOne( queryObj, function(err, info){//to do test findone



      if (err )return resolve(null, err )
      if ( !info)return resolve(null, 'user not found' )
      resolve(info)
    })
  })
}




//subdomain
function getSubdomain(req){


  let sub = req.subdomains

  sub.length <= 2? sub = 'home' : sub = sub[sub.length -1]
  return sub 
}


function random(digits){
  if(digits) return Math.floor( Math.random() * Math.pow(10,digits) )//numbers 
  return Math.random().toString(36).substring(2, 15)+Math.random().toString(36).substring(2, 15) //string
}
function hash(data){
  if(data == null) data = random()
  return cry.createHmac('sha256',data).digest('hex')
}

function renameOutput(tobeoutputed,relation,uniquePrefix){

                function swap(json){
                  var ret = {};
                  for(var key in json){
                    ret[json[key]] = key;
                  }
                  return ret;
                }

                var swappedRelation = swap( relation )

                //to do: select as a field

                var returnObject = {}

                for(let key in tobeoutputed){

                  //### fix array output

                  if (typeof tobeoutputed[key] === 'function') continue

                  if ( swappedRelation[key] ){
                    returnObject[ swappedRelation[key] ] = tobeoutputed[key]
                  }else if (key === 'id'){
                    returnObject['id'] = tobeoutputed[key]
                  }else if (key === 'registered_writer_field'){ //hidden from user used for like and other notification
                    //returnObject['registered_writer_field'] = tobeoutputed[key] //dont show
                  }//exception for id

                }

                let theUniqueField = swappedRelation['unique'] 

           
                if( returnObject[ theUniqueField] ){
                  
                  returnObject[ theUniqueField] = returnObject[ theUniqueField].replace(uniquePrefix,'')
                }
                 
                return returnObject          
}
function stringIt(json){
  return JSON.stringify(json)
}
function removeKey(object,keyname){

  if (Array.isArray(object)){
    let newObj = []

    for (let index of object){
      if (index !== keyname) newObj.push(index)
    }

    return newObj
  }else{

    let newObj = {}
    for(let key in object){
      if (key != keyname) newObj[key] = object[key]
    }

    return newObj

  }
}

function setNewVerificationCode(to){//for securityReson
    let code = random(6)
    db.users.findOneAndUpdate({ email:to },{verificationCode:code},{returnOriginal : false},function(error, doc){
  
    })
    return code
}

function sendEmail(to,message,subject,callback){

  //make them aware about the appname
    var from = 'noreply@upon.one';

    // html: '<strong>and easy to do anywhere, even with Node.js</strong>',

    
    
    const msg = {
      from: from,
      to: to, 
      subject: subject,
      text: message
      
    };

    sgMail.send(msg, (error, response) => {


        if(error){
            console.log(error);
            callback( {error:error} )
            //to get make callback for edge cases
        }else{
          
          if (callback) return callback( {status:'email sent'} )
            
        }

      });
}

function sendVerificationEmail(to,context,callback){

    let code = setNewVerificationCode(to)

    
    var message = `your verification code is ${code} `;
    if (context) message += 'for '+context
    sendEmail(to,message,'verification code',callback)
}



module.exports = {
	getUserData: getUserData,
	random: random,
	hash: hash,
	renameOutput: renameOutput,
	stringIt: stringIt,
  removeKey: removeKey,
  getSubdomain:getSubdomain,
	setNewVerificationCode: setNewVerificationCode,
	sendEmail: sendEmail,
	sendVerificationEmail: sendVerificationEmail,
  jwtKey:jwtKey,
  generateJWT:generateJWT
}