if(!process.env.PORT) require('dotenv').config();

const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


const cry = require('crypto')

const db = require('./db.js')

function getUserData(value,searchBy){

  return new Promise(resolve=>{
     // if (!cookieid) return resolve(null)
    let queryObj = {cookie:value}

    if (searchBy == true){
      queryObj =  { $or: [{username: value}, {email: value}] }
    }else if(searchBy == 'id'){
      queryObj = {_id:value}
    }else if(searchBy === 'username'){
      queryObj = {username:value}
    }

    db.users.findOne( queryObj, function(err, info){//to do test findone



      if (err )return resolve(null, {error:err} )
      if ( !info)return resolve(null, {error:'user not found'} )
      resolve(info)
    })
  })
}
function checkBalance(subject,forApp){
  //useuserid
  return new Promise(resolve=>{

      let sandboxed = false

      if( process.env.PAYPAL_SANDBOXED === 'TRUE' ){
        sandboxed = true
      }

      let query1 = { receiver:subject, status:'paid', sandboxed:sandboxed }
      let query2 = {sender:subject, status:'paid' ,sandboxed:sandboxed}

      if (forApp === true) {
          let query1 = { app:subject, type:'u2a', status:'paid', sandboxed:sandboxed }
          let query2 = {app:subject, type:'a2u', status:'paid' ,sandboxed:sandboxed}
      }

      db.transactions.find( query1 , function(err, info){
          if (err) return console.log(err)
          if (info.length === 0) return resolve(0)
          
          let credited = 0
          for (let index of info){
            credited += Number(index.amount)
          }

          withdraws(credited)
        })


      function withdraws(credited){
        //why status done is not specified? because status being pending can be exploited

        db.transactions.find(query2  , function(err, info){
          if (err) return console.log(err)

            let withdrawed = 0
            for (let index of info){
              withdrawed += index.amount
            }

            //save cut

            //fees to not sent for virtual apps
            //to do generalize how app name is sent

            resolve( credited - withdrawed )




       



        })
      }






  })
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
                    returnObject['registered_writer_field'] = tobeoutputed[key] //dont show
                  }//exception for id

                }

                let theUniqueField = swappedRelation['unique'] 

                // console.log(swappedRelation,theUniqueField , returnObject[ theUniqueField],'renaming output')
                // console.log('uniquePrefix',uniquePrefix)
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
      // console.log(doc.userName+' settting email of:'+to)
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

        // console.log('sending email')
        if(error){
            console.log(error);
            callback( {error:error} )
            //to get make callback for edge cases
        }else{
          // console.log('email sent',response);
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


function addUniquePrefix(fullDbName,unique){

  if (!unique) unique = ''

  return fullDbName+':'+unique
}


module.exports = {
	getUserData: getUserData,
	checkBalance: checkBalance,
	random: random,
	hash: hash,
	renameOutput: renameOutput,
	stringIt: stringIt,
	removeKey: removeKey,
	setNewVerificationCode: setNewVerificationCode,
	sendEmail: sendEmail,
	sendVerificationEmail: sendVerificationEmail,
  addUniquePrefix: addUniquePrefix,
}