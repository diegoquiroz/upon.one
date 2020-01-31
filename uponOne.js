(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){
// global.Peer = require('peerjs-client')

// to do make notify user shadow dom as well 
//to do send socket on connect and type in ws

// if(!process.env.PORT) require('dotenv').config();




// let global = window


global.server = new class{
    constructor(){
      this.info={}//to do differentiation
      this.configuration={ cron:{daily:[],weekly:[],monthly:[],quaterly:[],yearly:[]}, fees:{} }
      this.files={}
      this.db = {}
      this.request_callbacks={}
      this.listen_callbacks={}
      this.socket = {}
      this.qued = {query:[],room:[]}

      this.utility = this.utilityFunctions()
      this.api = this.api.bind(this)
      this.declareLoaded = this.declareLoaded.bind(this)

      this.ask = this.prompt.bind(this)

      this.socketFunctions = {query:{},room:{}}

      this.peer = null
      this.onload = null
      this.loaded = false
      this.loginCallback = null

      // this.declareComponents = this.declareComponents.bind(this)

      // window.addEventListener('load',this.declareComponents)
    }start(...arg){
      console.log('starting')

      prepSourceExtraction = prepSourceExtraction.bind(this)
      launch = launch.bind(this)



      if (!arg[1]) {
        arg[1] = {job:'host',mode:'production'}
      }

      if(typeof arg[1] === 'string'){
        console.warn('parameter 2 now takes config')
        arg[1] = {}
      }

      if (arg[1].local) this.local = arg[1].local
      



      Object.assign(this.configuration,arg[1])

      this.mode = arg[1].mode
      this.job = arg[1].job



        if (!this.configuration.name || this.configuration.name === 'www') this.configuration.name = 'home'

          //document either mode could be testing or local variable could be declared
        if (this.mode == 'testing' || location.host == 'localhost:8080' || this.local === true){//environment difinition
          this.info.host = 'localhost'
          this.info.port = 8080
        }else{
          this.info.host = 'upon.one'
          this.info.port = 80
        }

        this.info.serverUrl = 'http://'+this.info.host+':'+this.info.port

        if(this.info.port === 80) this.info.serverUrl = 'http://www.'+this.info.host+':'+this.info.port
        server.saveUserData()


      if (arg[1].bypass) this.bypass = arg[1].bypass
      if (arg[1].beta) this.beta = arg[1].beta

      if (this.job == 'receive'){
        return launch()
      }else{
        this.job == 'host'
        this.hostStatus = false
        document.readyState === "complete"?prepSourceExtraction() : window.addEventListener('load',prepSourceExtraction)
      }



      function launch(){
        // if (window.location.protocol == 'https:' || window.location.protocol == 'http:') this.configuration.name = window.location.pathname.split('/')[1].split('.')[0]
        function host(){

                this.configuration.url = '/index'
                this.configuration.response = this.files['/index']


                this.post({data:this.configuration,type:'host',cookie: localStorage.getItem('hostea')},data=>{
                    
                    if (data.error) return server.deploying.update(data.error)//error occured
                      
                    let port = this.info.port

                    this.info.port === 80? port = '' : ':'+this.info.port
                    this.print('http://'+this.configuration.name+'.'+this.info.host+':'+port)
                    

                      server.deploying.kill()
                      server.declareLoaded()

                })         
          
        }

        function receive(){

          //server go to host, and it will be chached and server request to get that file
          
          this.post( {type: 'getAppSource', data:{ app:this.configuration.name } }, (data)=>{

            // console.log(data,'received')

            if(data.error){
              document.body.innerHTML = '404 Page Not Found'
              return console.log(data.error)
            } 

            this.newpage( data.data)

          })
          //to do here make new post request for chache
        }

        receive = receive.bind(this)
        host = host.bind(this)



        this.callback = this.job == 'receive'? receive : host //either host will run or receive will

        //login before data is loaded so that password is not tracked
        if ( !localStorage.getItem('hostea') ){
          return server.login().then(this.callback)
        } //for both host and receiving
        this.callback()
      }

      async function prepSourceExtraction(){


            if ( !localStorage.getItem('hostea') ){
              return server.login().then(()=>{ prepSourceExtraction(arg) })
            } //for both host and receiving




            if (this.db){ //scan and if there is String function 
              removeTypeFunction(this.db)
            }

            this.configuration.db = this.db

            if(this.code) this.configuration.preCode = this.code
            //make for index of to

            this.tmp = {}

            this.configuration.name = arg[0]

            function removeTypeFunction(obj){

              for(let key in obj){

                if (typeof obj[key] === 'object'){
                  removeTypeFunction(obj[key])
                  continue
                }

                  switch(obj[key]){
                    case String:
                      obj[key] = 'string'
                      break
                    case Array:
                      obj[key] = 'array'
                      break
                    case Number:
                      obj[key] = 'number'
                      break
                    case Object:
                      throw Error('Object type not supported')
                      break                                                                  
                  }

              }
            }
            




             //set user variable



            if (this.configuration.name.indexOf('beta') !== -1) return console.warn('app name cant have beta use beta:true in the second argument')


            if(this.beta === true){
              this.configuration.name = 'beta-'+this.configuration.name
              this.configuration.searchable = false
              //make a new instance that shares the same db? no does not shares the database. if we wont keep the database common how can we test if new users like it or not
            }


            if (this.bypass === true){
              console.log('bypassing')
              if(!localStorage.getItem('hostea')) return server.login().then(server.declareLoaded)

              server.declareLoaded()
            //prompt login if 
              return
            }



            let virtualDiv = document.createElement('div')


            virtualDiv.innerHTML = document.body.parentNode.innerHTML;
            var scripts = virtualDiv.querySelectorAll(`script`);
            console.log(scripts)
            var i = scripts.length;
            while (i--) {

              console.log(scripts[i])

              let linkToThisFile = false
              let srcToCheck = scripts[i].getAttribute('src')

              if(srcToCheck){
                if(srcToCheck.indexOf('source.upon.one') !== -1 || srcToCheck.indexOf('uponOne.js') !== -1  ){
                  linkToThisFile = true
                }
              }

              if(scripts[i].getAttribute('class') === 'private' || linkToThisFile === true ){
                // console.log('removing script',scripts[i])
                scripts[i].parentNode.removeChild(scripts[i]);
              }


            }

            

            console.log('deploying...')
            server.deploying = server.say('deploying...')

            



            async function fetchNupload(location,name){
                let icon = await fetch(location)
                let blob = await icon.blob()

                if (!name) name = location.split('/')[ location.split('/').length -1 ]
                return await server.utility.upload(blob,name) //upload and get the new link, newAttributes.href so that it can be overridden
            }

            async function newIconOrManifest(index){

                let OldHref = index.getAttribute('href')
                let newHref = null
                let rel = index.getAttribute('rel')
                // if (attributeHref.indexOf('http') !== -1 && attributeHref.indexOf('https') !== -1 ) {
                //   server.tmp.link.push( getAttributeObject(index) )
                //   hrefToStore = attributeHref
                // }else{ //we will upload external images to /favicon as well for home page


                  switch(rel){
                    case'icon':
                      newHref = 'favicon.ico'
                      break
                    case'manifest':
                      newHref = 'manifest.json' //to do on the server side
                      break
                    case'apple-touch-icon':
                      newHref = 'apple-touch-icon' //to do on the server side
                      break                                            
                  }

                  let hrefToStore = await fetchNupload(OldHref,newHref)


                  console.log('uploaded ',hrefToStore)
                  // direct to the server
                  return newHref
                  // server.tmp.link.push(newAttributes)
                  //render link tags
                // }

                // this.configuration[rel]  = hrefToStore//not needed
            }


            for(let index of virtualDiv.querySelectorAll('link') ){

              let href = null

              let rel = index.getAttribute('rel')

              switch(rel.toLowerCase()){
                  case'icon':
                    href = await newIconOrManifest(index)
                    break
                  case'manifest':
                    href = await newIconOrManifest(index)
                    break
                  case'apple-touch-icon':
                    href = await newIconOrManifest(index)
                    break
                }
      
                  index.setAttribute('href',href)

            }

            
            extractCodeOfExternalScript.call(this)

            async function extractCodeOfExternalScript(){

                for(let index of virtualDiv.querySelectorAll(`script`) ){

                  var src = index.getAttribute('src')
                  if(!src) continue

                  if (src.indexOf('http') === -1 && src.indexOf('https') === -1) {//local file
                    var localJsFetch = await fetch(src)
                    var localJsText = await localJsFetch.text()
                    index.removeAttribute('src')
                    index.innerHTML = localJsText
                  }                  
                }



                this.files['/index'] = virtualDiv.innerHTML
                launch()
            }
      }

            //we say this after so that the deploying message doesn't get sourced out
    




    }addFees(value, flavour){
      server.configuration.fees[flavour] = value
    }declareLoaded(){
      console.log('declaring loaded')
      //login is not done here because of security reasons
      if(localStorage.getItem('hostea')) if( !localStorage.getItem('user') ) return server.saveUserData().then(doLoad)
    

      function doLoad(){
        if (server.onload)  server.onload()
        server.loaded = true
      }

      doLoad()

    }addCron(when,code){
      if (!this.configuration.cron[when] ) throw Error ('when parameter '+when+' is invalid')

        this.configuration.cron[when].push(code)
    }handleError(data){
      switch(data.code){
        case 1211://app was not found
          document.body.innerHTML = data.error
          break
        default:
          console.error(data)
      }
    }saveUserData(){

      return new Promise(resolve=>{

        if (!localStorage.getItem( 'hostea')) return resolve()

        if ( !localStorage.getItem( 'user') ){ //if someone tampers with localStorage 
              server.api('$user',function(u){

                if (u.error) return server.handleError(u)//we dont send data


                if(!u) throw Error(u)
                localStorage.setItem( 'user', JSON.stringify(u) )
                resolve(u)
              })
              
          }



      })

    }api(query,functionR){


      
      executeApi = executeApi.bind(this)
      
      function executeApi(){
        //to do: remove response process json on post
        server.post({  name:this.configuration.name, data:query,type:'db',cookie:localStorage.getItem("hostea") }, (apiData) =>{


          if(apiData.error === 'Login required'){
            console.log('api requires login',query)

        
            throw Error('API requires login reload page')
            // server.login().then(()=>{

            //     server.api(query,functionR)

            // })
            return
          } 

          functionR(apiData.data,apiData.meta)

        })
      }

      if (!functionR){

        // console.log('returning new promise')
        return new Promise(resolve=>{

          functionR = resolve
          executeApi()

        })

      }else{
        executeApi()
      }

      //on login error tell user to login and call the same function
    }post(dataTobeSent,callback){
      let url = ''
      for(let value in dataTobeSent){
        if(!dataTobeSent[value])continue
        var dataString =  value+'='+(typeof dataTobeSent[value] == 'object'? encodeURIComponent(JSON.stringify(dataTobeSent[value])) : dataTobeSent[value] )
        url == ''? url += dataString: url += '&'+dataString
      }




      // console.log(url,dataTobeSent)
      fetch( this.info.serverUrl,{method:'POST',headers:{"Content-type":"application/x-www-form-urlencoded; charset=UTF-8"},body: url }).then(response=>{

              response.json().then(postData=>{

                callback(postData)

              })

              // .catch((er)=>{
              //   console.log(er,response)
              // }) removed because it was catching all the uncaught error

            })

      if (!callback){
        return new Promise(resolve=>{
          callback = resolve
        })
      }
    }loadScript(script,jusUrl) {
      return new Promise(function (resolve, reject) {

          if(jusUrl){
            let src = script
            let script = document.createElement('script')
            script.setAttribute('src',script)
          }


          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
          if(!script.src) resolve() //load event is not triggerd in case of internal script
      });
    }newpage(file_data){

      // console.log('received',file_data)
      //file data is null
      if (loader) {loader.finish()} //loader playing is not being checked

        document.removeChild( document.children[0])
        let virtualHtml = document.createElement('html')
        virtualHtml.innerHTML = file_data

        // for(let index of virtualDiv.querySelectorAll('script')){
        //   let newElement = document.createElement('script')
        //   console.log(index)
        //   newElement.innerHTML = index.innerHTML
        //   newElement.setAttribute('type',index.getAttribute('type'))
        //   document.head.appendChild(newElement)
        // }

        document.appendChild( virtualHtml)
        loadAllScripts()

        async function loadAllScripts(){ //loads script with order
          let scripts = virtualHtml.querySelectorAll('script')


          for(let index of scripts){
            let scriptClone = document.createElement('script')
            scriptClone.innerHTML = index.innerHTML
            await server.loadScript(scriptClone)
          }

          server.declareLoaded()
        }


                        // this.frontcall[url] execute
    }repeatedCheck(checkFunction,success){
      console.log('ca')

      let intervalInstance = setInterval(checker, 100);

      function checker(){

        if(checkFunction() === true){
          clearInterval(intervalInstance)
          success()
        }else{
          console.log(checkFunction())
        }

      }



    }print(data){

      console.log('%c'+data, 'color: Green; background-color: LightGreen; padding: 2px 5px; border-radius: 2px');//type of print: error, warning, greeting
    }followOrUn(id,callback){
      server.api({$follow:id},callback)//to do
    }onstart(newfn){

      //also consider that the receive needs to be completed

      //implement this.loaded
      if (this.loaded === true) return newfn()

      let previous = this.onload
      this.onload = function(){
        if (previous) previous()
        newfn()
      }

      // if(this.job == 'receive'){
      //    if(document.readyState === "complete") return newfn()
      //       let pr = window.onload
      //       window.onload = function(){
      //           if (pr) pr()
      //           newfn()
      //       }
      // }else{
      //   //status hosted

      //   if(this.hostStatus == true){
      //     newfn()
      //   }else{
      //     let pr = this.hostedCallback
      //     this.hostedCallback = function(){
      //         if (pr) pr()
      //         newfn()
      //     }
      //   }

        
      // }
    }random(){
      return Math.random().toString(36).substring(2, 15)+Math.random().toString(36).substring(2, 15)
    }killSocket(type){
      server.socket[type].close();
      server.socket[type] = null
    }callSocketFunction(msg,type){

      //to de return type as well
      


      let functionTobeCalled = server.socketFunctions[type][msg.token]
      if (!functionTobeCalled) return console.warn('websocket '+msg.token+' message: '+msg.data+' not caught '+type,msg)
      if (!functionTobeCalled[msg.type]) return console.warn('websocket '+msg.type+' not caught',msg)

        //set members

      functionTobeCalled = functionTobeCalled[msg.type] //msg type is open, update, leave ....

      //document: whole object is sent by the second parameter 
      functionTobeCalled(msg.data,msg)
    }setupSocket(query,type){

      server.socket[type] = new WebSocket('ws://'+this.info.serverUrl.replace('http://','')+'/'+type)

      // console.log(server.socket[type])

      server.socket[type].onopen = function (event){

        server.socket[type].onmessage = function (event){

          let msg = JSON.parse(event.data)

          //setup socket won't be called more than once, how fix works? type will sustain because it is only
          //defined once per type we just need to find the appropriate reception object

          let recep = server.socketFunctions[type][msg.token]

          // console.log('new unique',JSON.parse(event.data) ,recep)
          if(msg.unique) recep.unique = msg.unique
            
          server.callSocketFunction(msg,type)
        }

        // console.log(server.socket[type])
        server.newSocketJob(query,type)

        //for all the qued connection as well

        for(let index of server.qued[type]){
          server.newSocketJob(index,type)
        }
      };

      // return receptionObject
    }newSocketJob(msg,type,receptionObject){

      // if (server.socket[type]) return server.socket[type]

      function broadcast(data){
          if (!this.unique) return console.log('Unique not assigned')
          server.socket.room.send( JSON.stringify( {app:server.configuration.name, purpose:'broadcast', content:data, token:this.id, broadcastToken:this.unique  } ) )
      }

      function update(query){
          //server side handle if query is null
          if (!server.socket.query) return 'socket not instantiated'
          server.socket.query.send( JSON.stringify( {query:query, token:this.id, purpose:'update'} ) )

      }

      function leave(){
        server.socketFunctions['room'][this.id] = null
        server.socket.room.send( JSON.stringify({ unique:this.unique, currentToken:this.id, purpose:'leave'}) )
      }

      function change(newToken,limit){

        //fix its loop
        if (this.unique === null) return console.warn('in the process of changing')

        if (!limit) limit = 2
        server.socketFunctions['room'][this.id] = null
        server.socketFunctions['room'][newToken] = this

        server.socket.room.send( 
          JSON.stringify({limit:limit, 
                        cookie: localStorage.getItem('hostea'),
                        app:server.configuration.name,
                        unique:this.unique, 
                        newToken:newToken, 
                        currentRoomLabel:this.id, 
                        purpose:'change_room'}))

        this.id = newToken
        this.unique = null
      }

      function on(type,callback){
          this['on'+type] = callback
      }

      if(!server.socketFunctions[type][msg.token]) server.socketFunctions[type][msg.token] = new class{  
          constructor(){
          this.id = msg.token
          this.on = on.bind(this)

          if(type === 'room'){
            this.broadcast = broadcast.bind(this)
            this.change = change.bind(this)
            this.leave = leave.bind(this)
          } 
          
          if (type == 'query') this.update = update.bind(this)
      }}

      // server.socketFunctions[type][msg.token] = receptionObject

      // console.log(msg,server.socket[type])

      if(!server.socket[type]){
        server.setupSocket(msg,type)

        return server.socketFunctions[type][msg.token]
      } 
        


      if(!server.socket[type].readyState){
        this.qued[type].push( msg )
        return server.socketFunctions[type][msg.token]
      }

      //messsage to make a room is to be sent after conversation starts between the server
      
      
      msg.app = server.configuration.name
      msg.cookie = localStorage.getItem('hostea')

      // console.log('sending..',msg)
      server.socket[type].send( JSON.stringify(msg) );
      
      return server.socketFunctions[type][msg.token]
    }liveDb(query){
      //to do it doesnot needs to be async anymore 
      if (!localStorage.getItem('hostea') ) return server.logout()

      query = {token:server.random() ,query:query}
      return server.newSocketJob(query,'query')
    }room(token,limit){
     
     //make server login ui a promise
      if (!localStorage.getItem('hostea') ) return server.logout()

      let query = {limit:limit,token:token}
      query.purpose = 'join'
      return server.newSocketJob(query,'room')
    }logout(){
      localStorage.removeItem('user')
      localStorage.removeItem('hostea')
      location.reload();
    }search(query,type){

      return new Promise(resolve=>{

        server.post({type:'search',data:{  query:query, type:type } },data=>{
          resolve(data)
        })

      })

    }signUp(){
      return new Promise(resolve=>{


        function signUp(cred){

            let signingup = server.say(' just a second...',300)

            server.post({type:'loginOrSignup',data:{ tags:cred.interest, newAccount:true,email:cred.email , username:cred.username.toLowerCase(), password:cred.password }},data=>{

              signingup.kill()
              //if the password was wrong handled

              if (data.error) return server.say(data.error)

              proceedToVerifyEmail() 

              function proceedToVerifyEmail(){
                server.verifyEmail( data.username ).then(resolve)
                loginPrompt.kill()
              }
              

            })
        }

        //to do make the maximum limit
        //###
        //placeholder for div
        //not to do notify user update
        //to do placeholder
        let loginPrompt = server.prompt({h1:'Sign Up'},{ username:null, 
          password:{type:"password"}, 
          email:null,
          interest:{ array:5, placeholder:'interest' } },{ 'sign up': signUp })

      })
    }changePassword(msg){

      return new Promise(resolve=>{



        function changePassword(cred){

          let processingRequest = server.say('just a second')
           server.post({ type:'verify_email_access',

            data:{
              username:cred.username,
              newPassword:cred.newPassword,
              job:'forgot_password',
              verificationCode:cred.verificationCode 
            }


          },data=>{


            if (data.error) return processingRequest.update(data.error)
            processingRequest.kill()
            if (data.code === 200){
              if (!data.msg) throw Error('username not found')
              localStorage.setItem('hostea',data.msg)
              server.saveUserData().then(newUserdata=>{
                loginPrompt.kill() //to do rename login prompt
                resolve()
              })
            }

           })
        }


        //not to do notify user update
        let loginPrompt = server.prompt({h1:'check your email for verification code', h5:msg},{ username:null,newPassword:{type:"password", placeholder:'new password'},verificationCode:{type:"password"} },{login: changePassword})

      }) //benifit of different prompts? reusable
    }capitalize(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }async readLogs(){
        let readLogs = await server.post({ type:'readLogs', data:{app:server.configuration.name}, cookie:localStorage.getItem("hostea") })

        return readLogs
    }async runCronManually(type){
      // server.runCronManually('daily').then(console.log)
        let cronLog = await server.post({ type:'runCRON', data:{app:server.configuration.name,type:type}, cookie:localStorage.getItem("hostea") })

        return cronLog

    }editProfile(){
        
      return new Promise(resolve=>{

        let sending_code = server.say('just a second')
        engage()

        let loginPrompt = null
        let user = null

        function engage(){
          server.api('$user',(data)=>{
            if(!data){
              sending_code.kill()
              return resolve(false)
            }
            user = data
            sendVerificationCode()
          })
        }

        function sendVerificationCode(){



          function emailSent(data){
            sending_code.kill()

            if (data.error) return server.say(data.error)

            loginPrompt = server.ask(

              {title:'Editing profile',image:user.profile},

              {
              profile:{placeholder:'change profile picture',type:'file' },
              username:{placeholder:'username',value:user.username, required:true},
              name:{placeholder:'Full Name',value:user.name},
              about:{placeholder:'your goals?',value:user.about},
              tags:{placeholder:'tags',value:user.tags,array:5},
              verificationCode:{placeholder:'check your email for verification code',required:true},
             }

              ,{'confirm changes': editProfile,'cancel':cancel })            
          }

          // return emailSent({}) //bypassing for testing

          server.post({ type:'sendCodeEmail',cookie:localStorage.getItem("hostea") },emailSent)
          
        }

        function cancel(){
          loginPrompt.kill()
          resolve(false)
        }



        async function editProfile(cred){

          // console.log(cred)
          let profileImage = null

          if (cred.profile.files.length === 0){
            profileImage = user.profile
          }else{
            profileImage = await server.utility.upload( cred.profile.files[0], user.username+'profile' )//it is still not unique because for every app it will be different
            profileImage = profileImage.url
          }


          if (!profileImage) profileImage = user.profile

          server.post({
            type:'editProfile',
            cookie:localStorage.getItem("hostea"), 
            data:{
              verificationCode:cred.verificationCode,
              name:cred.name,
              about:cred.about,
              tags: cred.tags,
              username:cred.username,
              profile:profileImage
            }
          },data=>{
            if (data.error) return server.say(data.error)

            loginPrompt.kill()
            localStorage.removeItem('user')
            server.saveUserData().then(newUserdata=>{
              resolve(newUserdata)
            })
            // location.reload();
            

          })
        }

        
      })

    }forgotPassword(){
      return new Promise(resolve=>{

        let foundPerson = null

        function sendVerificationCode(cred){
          let notifySending = server.say('just a second')
          server.post({ type:'forgot_password', data:{emailOrusername:cred.username}  },data=>{
            notifySending.kill()
            if (data.error) return server.say(data.error)
            // console.log(data)
            server.changePassword(data.msg).then(resolve)
          })
          
        }

        let loginPrompt = server.prompt({h1:'Your username or email'},{ username:{placeholder:'username or email'} },{'send verification Code': sendVerificationCode })
      
      })      
    }whatDevicesHaveMyLogin(){//save it somewhere it is being shown for the last time
    }verifyEmail(username){
      //not mandatory, will happen afterwards, email verified as a variable as well

      return new Promise(resolve=>{



        function verify_email(cred){
           server.post({ type:'verify_email_access', data:{ username:username, job:'verify_email',verificationCode:cred.code.trim() }  },data=>{
            if (data.error) return server.say(data.error)
            if (data.code === 200){
              loginPrompt.kill()
              localStorage.setItem('hostea',data.msg)
              resolve()
            }
           })
        }


        //not to do notify user update
        let loginPrompt = server.prompt({h1:'hi '+username+' check your email for verification code'},{ code:{type:"password"} },{'verify email': verify_email})

      }) //benifit of different prompts? reusable

      //to do only from hompage
    }readUser(field){




          let whole = JSON.parse( localStorage.getItem('user') ) 

          return whole[field]





    }fromPhone(){
      let width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
      if (width < 500)  return true
      return false
    }login(){


      //to do set placeholder, set cookie
       

      return new Promise(resolve=>{

        if (server.loginResolve) return server.loginResolve //if login is called twice all are given the same resolve
        server.loginResolve = resolve

        function login(cred){

            server.post({type:'loginOrSignup',data:{ newAccount:false, username: cred.username.toLowerCase() , password:cred.password }},data=>{

              //if the password was wrong handled
              console.log(data,'login')
              if(data.error){

                if(data.error === 'account not verified') return server.verifyEmail(cred.username).then(resolve)
              } 

              data.code == 200? completeLogin( data ) : server.say(data.error)

              function completeLogin(data){
                loginPrompt.kill()
                localStorage.setItem('hostea',data.msg)
                server.saveUserData().then(()=>{ resolve( data ) })
                
              }

            })
        }

        function forgotPassword(cred){
          server.forgotPassword().then( ()=>{ resolve() })
        }

        function signUp(cred){
          server.signUp().then(resolve)
        }

        //not to do notify user update
        let loginPrompt = server.prompt({h1:'Login'},{ username:null,password:{type:"password"} },{ login: login, 'sign up':signUp, 'forgot password':forgotPassword })

      })
    }say(message,duration){//to do suit to the chages made, make it echo
      //to do animate and background, message should work as message it should disappeaer after a moment

      //loading blockade is another thing maybe do a type fullscreen and make it a component
      var html = `

        <div style='

          position: fixed;
          color: rgb(34, 34, 34);
          background: rgb(255, 255, 255);
          width: 62%;
          left: 19%;
          font-family: roboto, calibri;
          padding: 1.5vw 0px;
          text-align: center;
          z-index: 5;
          max-height: 75vh;
          border-radius: 1vw;
          border: 0.5vw solid #000;
          overflow: hidden;
          top: 10%;
          box-shadow: rgba(0, 0, 0, 0.36) 1vw 1vw 20px 0px;    
          display: grid;
          justify-items: center;

        '></div> <p style='

        position: fixed;
        background-color: #00000054;
        width: 100%;
        height: 100%;
        left: 0;
        /* z-index: -1; */
        top: 0;
        margin: 0;

        '></p>
      `


      //plan

      /*
        its requirement 

        self distruct messages
        exceptional input
        full screen message blocking
      

      */

      //clickable will be fullscreen

      if(typeof message === 'object') message = JSON.stringify(message)

      let mainDiv = document.createElement('div')
      mainDiv.innerHTML = html
      mainDiv.setAttribute('id','notifyUser')

      let messagesDiv = mainDiv.querySelector("div")
      messagesDiv.innerHTML = message
      document.body.appendChild(mainDiv)
      
      let returnObject = {
            kill:deleteThis,
            update:(value)=>{//change value
              messagesDiv.innerHTML = value
            },dom:messagesDiv
        }

      
      //interactive
      if (duration === 'clickable'){
        mainDiv.querySelector("p").addEventListener('click', ()=>{

        deleteThis() 
        if (returnObject.onCancel) returnObject.onCancel()
         

       })
        return returnObject
      } 


        //why was localstorage set to 'undefiend' of type string

   
      //it is a message
      mainDiv.querySelector("p").style.display = 'none'
      mainDiv.querySelector("div").style.overflow = 'hidden'
      mainDiv.addEventListener('click',deleteThis)
      function deleteThis(){
          if(mainDiv) if(mainDiv.parentNode) mainDiv.parentNode.removeChild(mainDiv)
      }
      if (!duration) return returnObject




      //it will self distruct if duration is provided
      setTimeout(()=>{

        if (!mainDiv) return
        if (!mainDiv.parentNode) return
        mainDiv.parentNode.removeChild(mainDiv)

      }, duration * 1000 )

      return returnObject





    }chargeWallet(callback){//to do notify user prompt user

      //load paypal

      let notifyUserPaypalLoad = server.say('Loading Payment GateWay...',60)


      //important: https://developer.paypal.com/docs/api/orders/v2/
      
      function engage(){
        server.checkBalance().then(balance=>{//to do 
          showPaypalPaymentGateway(balance)
        })
      }

      



      if (window.paypal) return engage()
      if(!window.paypal) server.loadScript('https://www.paypal.com/sdk/js?client-id='+server.Paypalclient_id+'&currency=USD').then(engage)
      // fetch(,{mode: 'no-cors'}).then( res=>{ res.text().then(startSettingUp) } )


      // function startSettingUp(scriptData){
      //   notifyUserPaypalLoad.kill()
      //   // Get the first script element on the page
      //   var ref = document.getElementsByTagName( 'script' )[ 0 ];

      //   // Create a new script element
      //   var script = document.createElement( 'script' );

      //   // Set the script element `src`
      //   script.innerHTML = scriptData;
      //   console.log(scriptData)

      //   // Inject the script into the DOM
      //   ref.parentNode.insertBefore( script, ref );


      //   showPaypalPaymentGateway()

      // }

      //to do

      // to do redo the implementation

      //hash 
      
      //to do send a2u $pay button 

      function showPaypalPaymentGateway(balance){
        notifyUserPaypalLoad.kill()



        let amount = 5



        // let paypalPrompt =  server.prompt({h1:'Add money to your wallet with Paypal',h2:'',h3:'','#paypal-button-container':''},
        //   {amount: {event:{keyUp:setamount}} } )



        //inclued paypal

        // let paypalButton = document.createElement('div')
        // paypalButton.setAttribute('style',`


        //   `)

        // paypalPrompt.dom.appendChild(paypalButton)



        //paypal api does not supports shadow dom

        let paypalGateway = server.say(`

            <h1 id='notifyUserTitle'>
              Recharge Wallet. Balance: $${balance}
            </h1>
            <center contenteditable='true' id='_paypal_dollarAmount' style='
                width: 100%;
                padding: 2vw 0;
                margin: 0;
                border: none;
                font-size: 3vw;
                padding-top: 5vw;
                text-align: center;
                border-top: 0.1vw solid;
            ' 

            placeholder='$' onkeyup='setAmmount(event)'> </center>




          `,'clickable')



        window.setAmmount = function(event){
          amount = Number(event.target.innerHTML)

          if( paypalGateway.dom.querySelector('#paypalbuttons') ) paypalGateway.dom.querySelector('#paypalbuttons').parentNode.removeChild( paypalGateway.dom.querySelector('#paypalbuttons') )

          if (amount<=0 || isNaN(amount) ) {

          }else{
            let paypalDiv = document.createElement('div')
            paypalDiv.setAttribute('id','paypalbuttons')
            paypalGateway.dom.appendChild(paypalDiv)
            renderPaypal()

          }
        } 

        // paypalGateway.dom.querySelector('#amount').innerHTML = 0

        server.CSS('#_paypal_dollarAmount:before',{
          content:'$'
        })//add to doc

        server.CSS('#paypalbuttons',{
            width: '62%',
            'margin-left': '19%',
            'margin-top': '1vw'
        })

        paypalGateway.onCancel = function(){ if(callback) callback(false) }

        function renderPaypal(){

    

            paypal.Buttons({
              createOrder: function(data, actions) {
                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      value: amount
                    }
                  }],order_application_context:{
                      shipping_preference: "NO_SHIPPING"
                    }
                });
              },
              onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {

                  // alert('Transaction completed by ' + details.payer.name.given_name);
                  // Call your server to save the transaction
                  // return fetch('/paypal-transaction-complete', {
                  //   method: 'post',
                  //   headers: {
                  //     'content-type': 'application/json'
                  //   },
                  //   body: JSON.stringify({
                  //     orderID: data.orderID
                  //   })
                  // });
                  // paypalGateway.innerHTML = 'verifying payment'


                  paypalGateway.kill()
                  verifyPayment(data.orderID)

                });
              }//to do implemet payout
                //define currency
            }).render( '#paypalbuttons' ); //https://developer.paypal.com/docs/checkout/integrate/#6-verify-the-transaction

   
        }



        function verifyPayment(transactionID){
          let verifying = server.say('Verifying Payment')

          server.post({ type:'confirmPaymentFromPaypal', cookie:localStorage.getItem('hostea') ,data:{ transactionId:transactionID } },data=>{
          if (data.error)return verifying.update(data.error)
            if (callback) callback(true)
            // paypalGateway.kill() activate
            verifying.update('Payment successful')
          })
        }
    }
      
    }checkBalance(callback){
    //documentation to mention we can use a function both through sync and async 


    server.api( {$checkBalance:null} ).then(data=>{

      if (callback) {
        callback(data)
      }

    })

    if (!callback){
      return new Promise(resolve=>{
        callback = resolve
      })
    }

  }paymentPrompt(arrayOfReceiver,amount,flavour,message){

    if (!amount) amount = 0
    let loading = server.say('loading payment prompt')
    //if flavour done not exists it means no fees

    async function getUsernameOfAll(){
      let newArrayOfReceiver = []

      for(let index of arrayOfReceiver){

        if (index.indexOf('@') !== -1) {
          newArrayOfReceiver.push(index)
          continue
        }

        let object = await server.api({$findUser: index })
        console.log(object,index)
        newArrayOfReceiver.push('@'+object.username)
      }

      return newArrayOfReceiver
    }

    getUsernameOfAll().then(newArrayOfReceiver =>{
      arrayOfReceiver = newArrayOfReceiver
      server.checkBalance(makePromptForPayment)
    })
    

    let paymentPrompt = null

    //how to update the pay button

    function makePayment(cred){
      paymentPrompt.kill()

      let paymentList = {}

      for (let index of cred.receiver){
        paymentList[index] = cred.amount
      }

      server.pay(paymentList, 'u2u' , flavour)
    }

    //document the pay function takes object {receiver:amount}


    function updatePayButton(event,cred){
      let total = Number( cred.amount ) * cred.receiver.length
      paymentPrompt.button(1).innerHTML = 'pay $'+total//to do
    }

    

    function makePromptForPayment(balance){
      loading.kill()
      paymentPrompt = server.ask({h1:message,h3: 'Your balance: $'+balance}, { receiver:{ event:{keyup:updatePayButton}, type:'array',value:arrayOfReceiver } ,amount: {value: amount,required:true, event:{keyup:updatePayButton}} },

        {pay:makePayment,
        cancel:()=>{ paymentPrompt.kill() },
        recharge:()=>{

          paymentPrompt.kill()
          server.chargeWallet()

        }
      })

      updatePayButton(null,{amount:amount,receiver: arrayOfReceiver })

    }

      //also show balance
      //more than one receiver can be added
      //type will be object
      //enable bulk payment
      //detect @ and according to it user will be found

    }componentRegistered(name){
       return document.createElement(name).constructor !== HTMLElement;
    }pay(paymentList,type,flavour){ //it is async will return order id

      let orderIDs = null
      let callback = null

      async function confirmPayment(fieldsData){

        let confirmRequest = await server.post({ type:'confirm_payment', cookie:localStorage.getItem('hostea'), data:{ verificationCode: fieldsData.verification_code, orderIDs:orderIDs } })

        if (confirmRequest.error) return server.say(confirmRequest.error)

        console.log(confirmRequest)

        if (confirmRequest.code !== 200) return server.say(confirmRequest.error)

        verificationPrompt.kill()
        callback(confirmRequest.orderID)

        server.say('payment done')

      }

      let verificationPrompt = null

      function cancel(){
        callback({error:'canceled'})
        verificationPrompt.kill()
      }

      async function initializePayment(){

        return await server.post({ type:'initialize_payment', cookie:localStorage.getItem('hostea'), data:{ flavour:flavour, type:type, paymentList:paymentList ,app:server.configuration.name } })
        //to do what about order id       
      }

      let notify = server.say('Initializing transaction and making sure you have enough balance')

      initializePayment().then(confiredOrNot=>{

        if (confiredOrNot.error){
          notify.update(confiredOrNot.error)
          return console.error(confiredOrNot.error)
        } 

        orderIDs = confiredOrNot.orderIDs

        console.log(orderIDs)

        notify.kill()
        promptForMakingTransaction(confiredOrNot.totalAmount)//to do

      })

      //notify user unique id 

      function promptForMakingTransaction(totalAmount){

        server.checkBalance().then(balance=>{
          //if it is of the same type it will be hard to read
          verificationPrompt = server.prompt(
            { h1:'A verification Code has been Sent', h3:'Amount: $'+totalAmount+' | Balance: $'+balance},
            {verification_code: {placeholder:'verification code', onEnter:confirmPayment} },
            { 'Confirm Payment': confirmPayment, Cancel:cancel }
          )

        })
      }

      return new Promise(resolve=>{
        callback = resolve
      })

    }sendVerificationEmail(email,msg){

      return new Promise(resolve=>{
        server.post({ type:'sendVerificationEmail',context:context,email:email },resolve)
      })
    }closePrompt(type){
      server.removeDom( document.querySelector('prompt-ui[data-type:"'+type+'"]') )
    }removeDom(dom){

      if (!dom.parentNode) return
      dom.parentNode.removeChild(dom)
    }CSS(selector, css) {

      if (!server.stylesheet) server.stylesheet = document.head.appendChild( document.createElement("style") ).sheet
      
      var sheet = server.stylesheet

      var propText = typeof css === "string" ? css : Object.keys(css).map(function (p) {

          //p is the different stype
          //object key map will return image
          return p + ":" + (p === "content" ? "'" + css[p] + "'" : css[p]);

      }).join(";");


      sheet.insertRule(selector + "{" + propText + "}", sheet.cssRules.length);
    

    }prompt(titles,fields,buttons,other){//title with varying weight

      //for paypal

      // {h1:'your balance is',medium:''}

      // {//make transaction
      //   verification_code:{tag:'input',onEnter:callback},
      // }

     // return new Promise((resolveLogin)=>{

      

        var html = `

              <style>

                .promptUi {
                  background: #000000d6;
                  padding: 0 19%;
                  padding-top: 5vh;
                  position: absolute;
                  height: 95vh;
                  width: 62%;
                  top: 0;
                  overflow-y: scroll;
                  /* padding-bottom: 10vw; */
                  left: 0;
                  z-index:3;
                }

                #fields textarea{
                  resize: none;
                  height:5vw;
                }

                #fields div:focus:before{
                  content: '';
                }

                #fields div:before {
                    color:#999;
                    content: attr(data-placeholder);
                }

                #fields div span{
                  padding: 1vw;
                  color: #232020;
                  margin:0 1vw;
                  border: 0.1vw solid;
                  border-radius: 1vw;
                }

                #fields input,#fields textarea, #fields div{
                  width: 100%;
                  background:#fff;
                  margin-top: 5%;
                  height: 2vh;
                  font-size: 1.5vw;
                  text-align: center;
                  color: #222;
                  border: none;
                  padding: 2vw 0;
                  border-radius: 0.5vw;
                  /* border-bottom: 0.5vw solid #fff; */
                  /* background: transparent; */
                }

                #fields input[type=file] {
                    visibility: hidden;
                    position: relative;
                }

                #fields input[type=file]:before {
                    width: 100%;
                    background: #fff;
                    height: 5vh;
                    font-size: 2vw;
                    text-align: center;
                    color: #222;
                    border: none;
                    padding: 2vw 0;
                    border-radius: 0.5vw;
                    visibility: visible;
                    position: absolute;
                    top: 0;
                    content: attr(data-placeholder);
                    cursor:pointer;
                }

                #buttons button{
                  width: 100%;
                  background: transparent;
                  border: none;
                  border-right: 0.1vw solid #000;
                  font-size: 2vw;
                  padding: 1vw 0;
                  color: #000;
                }

                #head{
                  color:#fff;
                  font-family:roboto,calibri;
                }

                #head #title{
                  font-size:1vw;
                  color:#fff;
                  text-align:center;
                }

                #head #imgpadding{
                  width50%;
                  height:50%;
                  padding:0 25%;
                  border-radius:100vw;
                }

                #head #image {
                    background-color: #000;
                    height: 20.6vw;
                    width: 20.6vw;
                    margin: 2vw 0;
                    margin-left: 20.6vw;
                    object-fit: contain;
                    background-size: contain;
                    border-radius: 50vw;
                }

                #buttons{
                  margin-top: 3vw;
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
                  border-radius: 0.5vw;
                  background: #fff;
                  margin-bottom: 5vw;
                }

                #buttons button:last-child{
                  border:none;
                }

                #buttons button:first-child{
                  border-right: 0.1vw solid #000;
                }

                @media only screen and (max-width: 500px){
                  .promptUi {
                      padding: 10vw 2.5%;
                      width: 95%;
                  }

                  #fields input,#fields textarea, #fields div{
                    height:10vw;
                    font-size:4vw;
                  }

                  #buttons button{
                    padding: 4vw 0;
                    font-size: 4vw;
                  }

                  #head #title {
                      font-size: 5vw;
                      padding: 4vw 0;
                  }

                  #head #image{
                    height: 38vw;
                    width: 38vw;
                    margin: 2vw 0;
                    margin-left: 31vw;
                  }

                }


              </style>

              <div class='promptUi'>
                <div id='head'>
                </div>
                <div id='fields'>
                </div>
                <div id='buttons'>
                </div>
              </div>
              `
        

        //to remember if two source are trying to do something that will require login, two event listener will be set to the input box
        if (document.querySelector('prompt-ui')){
          document.querySelector('prompt-ui').parentNode.removeChild( document.querySelector('prompt-ui') )
        }


        const template = document.createElement('template');
        template.innerHTML = html;
        
          //add prompt fields buttons and callbacks

        class promptInterface extends HTMLElement{
  
            constructor() {
              super();
              this.attachShadow({mode: 'open'});

              let aTemplate = template.content
              this.shadowRoot.appendChild(aTemplate.cloneNode(true));
              // const button = this.shadowRoot.querySelector("button");
              // button.addEventListener("click", this.handleClick);
            }
            
            handleClick(e){
              alert("Sup?");
            }
        }

        if(!customElements.get('prompt-ui')){
          window.customElements.define('prompt-ui', promptInterface);
        }else{
        }

        var loginUiHolder = document.createElement('template')
        loginUiHolder.innerHTML = html

        let newPromptTag = document.createElement('prompt-ui')
        document.body.appendChild( newPromptTag  )

        let shadowDom = document.querySelector('prompt-ui').shadowRoot

        let promptUiShadowRoot = shadowDom.querySelector('.promptUi')

        let css = document.querySelector('prompt-ui').shadowRoot.querySelector('style')
        if (!other) other = {css:''}
        css.innerHTML += other.css 

        for(let key in titles){

          //head and title

          let elementType = key
          if(key.indexOf('#') !== -1) elementType = 'div'

          


          if (key === 'title' || key === 'image') {
            elementType = 'div'
          }

          let newTag = document.createElement(elementType)
          if(key.indexOf('#') !== -1) newTag.setAttribute('id',key.replace('#',''))


          if (key === 'title') {
            newTag.setAttribute('id', 'title' )
          }else if(key === 'image'){
            newTag.setAttribute('id', 'image' )
            
          }



          key === 'image'? newTag.style['background-image'] = `url(${server.link( titles[key]) })` :  newTag.innerHTML = titles[key]
          promptUiShadowRoot.querySelector('#head').appendChild(newTag)

        }

        let requiredFields = []
        for(let key in fields){
            
          let temp = { placeholder:key, type:'text' }

          let theField = fields[key]
          if (theField === null){
            theField = temp
          }

          //to do no strings

          function parseInterest(event){
                // console.log(event,fieldValue)
                // console.log(fieldValue)
                    if( event.keyCode !== 32) return

                      let interest = getInterest(event.target.innerHTML)

                    if (!interest) return
                      
                      event.target.innerHTML = ''

                      for(let x of interest){
                        event.target.innerHTML += `<span>${x}</span> `
                      }

                      var range = document.createRange();
                  var sel = window.getSelection();
                  range.setStart(event.target.childNodes[event.target.childNodes.length-1], 0);
                  range.collapse(true);
                  sel.removeAllRanges();
                  sel.addRange(range);
                  event.target.focus();

                      // event.target.selectionEnd = event.target.innerHTML.length
          }//for array field like tags





          //for array field like tags


          if (theField.type === 'array'){
            theField.array = 10
          }

          if (theField.array){
            theField.tag = 'div'
          }

          let fieldType = 'input' 
          if(theField.tag) fieldType = theField.tag
          let newTag = document.createElement(fieldType) 

          if (theField.array) newTag.setAttribute('contenteditable',true)
          if(!theField.placeholder) theField.placeholder = key
          newTag.setAttribute('placeholder',theField.placeholder)

          if (theField.array){
            newTag.addEventListener('keyup', parseInterest)
            newTag.setAttribute('data-placeholder',theField.placeholder)
          }else if(theField.type === 'file'){
            newTag.setAttribute('data-placeholder',theField.placeholder)

            function sayFileWasSelected(event){
            if(event.target.files[0]) event.target.setAttribute('data-placeholder','file selected: '+event.target.files[0].name)
            }

            newTag.addEventListener('change',sayFileWasSelected)
          }

          if (theField.attributes){
            for(let key in theField.attributes){
              newTag.setAttribute(key,theField.attributes[key] )
            }
          }

          if (theField.value) { //if the field accepts array
            if(fieldType === 'div'){

              let html = ''
              for(let index of theField.value){
                html += '<span>'+index+'</span> ' //the last space is important
              }
              newTag.innerHTML = html

            }else{
              newTag.value = theField.value
            }
          }

          //adding event listener
          if(theField.event){

            for(let eventType in theField.event){

                function intermediate(event){
                  let newFn = theField.event[eventType]
                  let fieldValue = GetAllFieldValues()
                  newFn(event,fieldValue)//event function only need event not all field values
                }

                if(eventType === 'onEnter'){
                  eventType = 'keyup'

                  intermediate = function(event){
                    if(event.keyCode !== 13 ) return

                    intermediate()
                  }
                }

              newTag.addEventListener(eventType, intermediate)


            }
          }

          

          if (theField.required === true) requiredFields.push(key)

          if(!theField.type) theField.type = 'text'
          if(theField.type !== 'array') newTag.setAttribute('type',theField.type)
          newTag.setAttribute('data-name',key)
          promptUiShadowRoot.querySelector('#fields').appendChild(newTag)
        }

        let primaryButon = null

        for(let key in buttons){

          if (primaryButon === null) primaryButon = key

          let newTag = document.createElement('button')


          //in the doc the first button specified is the primary button the required values are only checked for primary button


          function intermediate(){
            let newFn = buttons[key]
            let fieldValues = GetAllFieldValues()
            if ( requiredOmmited(fieldValues) === false && key === primaryButon) return server.say('required field is missing') //a required value was ommited and a primary button was clicked
            newFn(fieldValues)
          }

          newTag.innerHTML = key
          newTag.addEventListener('click',intermediate)
          promptUiShadowRoot.querySelector('#buttons').appendChild(newTag)
        }

        function requiredOmmited(cred){

          for(let index of requiredFields){
            if (!cred[index]) return false
          }

          return true
        }

        function getInterest(html){
              let interest = []

              let splits = html.split(' ')

              
              if (splits.length <=0) return null

              for(let oneInterest of splits ){

                
                let a = oneInterest.replace(/<\/span>/gi,'').replace(/<span>/gi,'')
                
                // a = a.replace(/&nbsp;/g,'').trim()
                if(!a) continue
                console.log(a)
                interest.push(a)
              }

              console.log(html,splits,splits.length,interest)

              return interest
        }


        //
        function GetAllFieldValues(){

                let Obj = {}
                for( let index of promptUiShadowRoot.querySelectorAll('#fields input,#fields textarea, #fields div') ){
                  // console.log(index)

                  if ( index.getAttribute('type') === 'file'){

                    Obj[ index.getAttribute('data-name') ] = index

                  }else if ( index.getAttribute('contenteditable') ){

                    let arrayValues  = getInterest(index.innerHTML)
                    if (arrayValues.length>5) return server.say(' five tags are enough, right? ')
                    Obj[ index.getAttribute('data-name') ] = arrayValues
                    continue

                  }else{
                    Obj[ index.getAttribute('data-name') ] = index.value
                  }
                  
                }

                return Obj

        }


        function button(number){
          return shadowDom.querySelectorAll('#buttons button')[number-1]
        }

        return {kill:()=>{ server.removeDom(newPromptTag) }, dom:shadowDom, button:button}

    }scrap(url,element){
      if(location.host === 'localhost') return



      let heading = ''
      let text = ''

      for (let index of element.querySelectorAll('h1,h2,h3') ){
        heading += index.innerHTML
      }




      for(let index of element.querySelectorAll(':not(h1):not(h2):not(h3)') ){
        text += index.innerText
      }

      
      server.post({type:'scrap',data:{ head:document.querySelector('head').innerHTML, heading:heading, text:text, url:url,html:element.innerHTML, app:server.configuration.name }},data=>{
        console.log(data,'scrap')
      })
    }utilityFunctions(){

      return new class{

        upload(file,fileName){

          return new Promise(resolve=>{

            console.log('uploading...')
            let form = new FormData()
            form.append('file',file )
            form.append('app', server.configuration.name)
            form.append('filename',fileName)

            if( localStorage.getItem('hostea') ) form.append('cookie',localStorage.getItem('hostea') )
            

            fetch(server.info.serverUrl+'/upload', {
              method: 'POST',
              body: form
            }).then( response => response.json().then(postData=>{

             if(postData.error) return resolve({error: postData.error})

              resolve(postData)

           }))


          })



        }
      }

    }link(id){//from cdn document
      if (!id) return 'https://www.yakindowebdesigns.com/images/BS-Broken-Link-Icon.jpg'
      return 'http://cdn.'+server.info.host+':'+server.info.port+'/'+id
    }upload(message,fileName,callback){

      


      const onSelectFile = (event) => {

        if (!fileName) fileName = null

        let uploading = server.say('uploading....')
        server.utility.upload( event.target.files[0],fileName ).then((url)=>{

            if (url.error) return uploading.update(url.error)
            uploading.kill()
            uploadPrompt.kill()
            callback(url.url)

          });
      }

      let uploadPrompt = server.prompt({h1:'Upload '+message},{ file: { event:{chage:onSelectFile}, attributes:{type:'file'}  }} )

      //also async
      if(!callback) return new Promise(resolve=>{
        callback = resolve
      })
    }

    //to do veriy email prompt
}
  
  let PAYPAL_SANDBOXED = 'TRUE'
  server.Paypalclient_id = 'AQE_rig7P4zSK-XlRXctpAvqEV-3dFM_bcxVqBxvHd9wJISq0RIfcAqxdSYqlc4ekFR445I_bMjMG2Er'

  if( PAYPAL_SANDBOXED === 'TRUE' ){
    console.log('running paypal checkout in test env')
    server.Paypalclient_id = 'ATmVk60R3iDM8x5gfm8n4d07wvemHhEyuoENv9YKqixM2Elt_kmNCL96MOFeH0_OP0A8UWFYj4YYnDzx'
  }
      


  //to do test notifyUser
  //add random, date, hash
  //how to descover people, make the home app
  //to do new receiver, seprate code for receiver and hoster
let ScTag = document.getElementsByClassName('hostea')[0]
  if (ScTag){

    server.configuration.name = ScTag.getAttribute("app_name")

    // console.log()
    // function engageReceiving(){
      server.start(null, {mode:ScTag.getAttribute("mode"), job:ScTag.getAttribute("job")} )
    



    //why we need to make it global as we should not allow client to mess up anything, because we  want to give them api support on start 
    // if( ScTag.getAttribute("mode") == 'testing')global.TST = server
}


  

//server.live( {on:'answers',where:{} } ,console.log )    

// var addRule = (function (style) {
//     var sheet = document.head.appendChild(style).sheet; //it is a self provoking function which takes the value of the bracket that has followed and returns a function so that new stylesheet is created only once
//     return function (selector, css) {
//         var propText = typeof css === "string" ? css : Object.keys(css).map(function (p) {
//             return p + ":" + (p === "content" ? "'" + css[p] + "'" : css[p]);
//         }).join(";");
//         sheet.insertRule(selector + "{" + propText + "}", sheet.cssRules.length);
//     };
// })( document.createElement("style") );
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
