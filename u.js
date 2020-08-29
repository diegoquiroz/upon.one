
let U = new class{
  constructor(){
    this.info = {}//to do differentiation
    this.configuration={ cron:{daily:[],weekly:[],monthly:[],quaterly:[],yearly:[]}, fees:{} }
    this.files = {}
    this.db = {}
    this.cloudFunctions = {}

    this.bucket = {}//for image upload

    this.request_callbacks = {}
    this.listen_callbacks = {}
    this.socket = {}
    this.socketData = {query:[],room:[]}

    this.utility = this.utilityFunctions()
    this.query = this.query.bind(this)
  

    this.socketFunctions = {query:{},room:{}}

    this.receivingStatus = false
    this.loginCallback = null
    this.staticFiles = []
    // this.declareComponents = this.declareComponents.bind(this)

    // window.addEventListener('load',this.declareComponents)

    //----------------------Set cookie from url param----------------------------------------

      if(this.urlParam('cookie')){
        let cookie = this.urlParam('cookie')
        let devLogin = this.urlParam('devLogin')

        if(devLogin !== 'false'){
          console.log('setting dev cookie')
          localStorage.setItem('dev-cookie',cookie)
        }else{
          console.log('setting user cookie')
          document.cookie = `user-cookie=${cookie}; expires=Sun, 1 Jan 2023 00:00:00 UTC; path=/`
        }
      }

    //----------------------------------------------------------------------------------------
  }runCloudFunction(functionName,arg){
   return U.query({ $run: [functionName,arg] })
  }collection(collectionName){
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
  }uploadStaticFiles(staticFiles){
    //fetch
    U.staticFiles = staticFiles

  }run(appName,configuration){

    document.addEventListener('keydown',(evt)=>{//Admin Pannel
      if (!evt) evt = event;
      if (evt.ctrlKey && evt.shiftKey && evt.keyCode==65){ //CTRL+ALT+A -> open admin pannel
          this.openAdminPannel()
      }
    });

    prepSourceExtraction = prepSourceExtraction.bind(this)
    uploadSource = uploadSource.bind(this)

    if(!configuration) configuration = {}
    Object.assign(this.configuration,configuration) //transfer all variables of arg 1 into this.configuration
    U.configuration.name = appName.toLowerCase()




      if (!this.configuration.name || this.configuration.name === 'www') this.configuration.name = 'home'

        //document either mode could be testing or local variable could be declared
      if (this.configuration.mode == 'testing' || location.host.indexOf('localhost.com:8080') !== -1 || this.configuration.local === true){//environment difinition
        this.info.host = 'localhost.com'
        this.info.port = 8080
      }else{
        this.info.host = 'upon.one'
        this.info.port = 80
      }

      if(this.configuration.job !== 'receive') this.configuration.job = 'host'
   
      
      this.info.serverUrl = window.location.origin
     
      
      //production environment
     if(U.configuration.job == 'host') this.info.serverUrl = `http://${this.configuration.name}.`+this.info.host+':'+this.info.port

     console.log( this.info.serverUrl)


    if (this.configuration.job !== 'receive'){
      this.configuration.job == 'host'
      this.hostStatus = false
      document.readyState === "complete"?prepSourceExtraction() : window.addEventListener('load',prepSourceExtraction)//why
    }


    async function uploadSource(){
      // if (window.location.protocol == 'https:' || window.location.protocol == 'http:') this.configuration.name = window.location.pathname.split('/')[1].split('.')[0]


        console.log('deploying...')
        U.deploying = U.say('Deploying...')

              this.configuration.logo = null 
              this.configuration.description = null 

              if(document.querySelector('link[type="image/x-icon"]')){
                this.configuration.logo = document.querySelector('link[type="image/x-icon"]').getAttribute('href')
              }

              if(document.querySelector('meta[property="og:description"]')){
                this.configuration.description = document.querySelector('meta[property="og:description"]').getAttribute('content')
              }

              this.post({data:this.configuration,type:'host'},async (data)=>{
                  
                if (data.error){
                  if(data.error == 'dev not logged in'){
                    U.deploying.kill()
                    return U.login('DEVELOPER').then(uploadSource)
                  } 
                  if(data.error) return U.deploying.update(data.error)//error occured
                } 
                    
                  let port = this.info.port

                  this.info.port === 80? port = '' : ':'+this.info.port
                  this.print('http://'+this.configuration.name+'.'+this.info.host+':'+port)

                  U.deploying.kill()

                  for(let index of U.staticFiles){
                    if(!U.configuration.skipUploads) await U.fetchNhost(index)
                  }

                    
              })     
        
    }

    async function prepSourceExtraction(){
        


        if (typeof this.configuration.host !== 'undefined'){
          
          if (this.configuration.host === false){
            console.log('bypassing hosting')
            return
          } 
        }else{
          console.log('hosting in progress')
        }

        //scan and if there is String function
        if (this.db) transformTypes(this.db)
        console.log(this.db)



        
        this.configuration.db = this.db
        this.configuration.cloudFunctions = this.cloudFunctions
        this.configuration.bucket = this.bucket

        for(let key in this.cloudFunctions){
          this.cloudFunctions[key] = this.cloudFunctions[key].toString()
        }

        function transformTypes(obj){

          let blackListFunctions = [String,Number,Array,Object,Date,Object]

          for(let key in obj){

            if (typeof obj[key] === 'object'){
              transformTypes(obj[key])
              continue
            }else if(typeof obj[key] === 'function' ){
              if( blackListFunctions.includes( obj[key] ) == false) obj[key] = { $executeJS:{code: obj[key].toString() }}
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
                case Boolean:
                  obj[key] = 'boolean'
                  break
                case Date:
                  obj[key] = 'date'
                  break
                case Object:
                  obj[key] = 'object'
                  break                                                                  
              }

          }
          
        }


        extractSourceCode.call(this)

        async function extractSourceCode(){
          

          let virtualDiv = document.createElement('html')


          virtualDiv.innerHTML = document.body.parentNode.innerHTML;

          let scriptInjection = document.createElement('script')
          scriptInjection.innerHTML = `  `
          
          //script injection containing analytics and receiving configuration code
          if(!virtualDiv.querySelector('head')) virtualDiv.appendChild(document.createElement('head'))

          virtualDiv.querySelector('head').innerHTML += `                
          
                <!-- Global site tag (gtag.js) - Google Analytics -->
                <script async src="https://www.googletagmanager.com/gtag/js?id=UA-166276820-1"></script>
                <script>
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());

                  gtag('config', 'UA-166276820-1');
                </script>
                
                <script src="/u.js"></script>
                <script>
                  U.run( "${U.configuration.name}", { job:'receive' } )
                </script>
          `
  
          var scripts = virtualDiv.querySelectorAll(`script`);


          var i = scripts.length;
          while (i--) {// removal

            //serverside and backend mean the same
            let scriptClass = scripts[i].getAttribute('class')
            if(scriptClass) if( scriptClass.indexOf('donthost') !== -1 || scriptClass.indexOf('dontHost') !== -1 ){
              scripts[i].parentNode.removeChild(scripts[i]);
            }


          }




          this.configuration.response = virtualDiv.innerHTML


          if ( !localStorage.getItem('dev-cookie')){
            return U.login('DEVELOPER').then(()=>{ uploadSource() })
          }else{
            uploadSource()
          }
          


        }


    }

  }async fetchNhost(fileLocation){
    let file = await fetch(fileLocation)
    //what if fileLocation is a folder?
    let blob = await file.blob()

    if(fileLocation.slice(0,3) == '../') fileLocation = fileLocation.slice(3);
    if(fileLocation.slice(0,2) == './') fileLocation = fileLocation.slice(2);
    if(fileLocation.charAt(0) == '/') fileLocation = fileLocation.slice(1); //all location given to the fetchNhost are absolute
    return await U.utility.upload(blob,'hostingUpload',fileLocation) //upload and get the new link, newAttributes.href so that it can be overridden
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
  }getCookie(a) {
    var b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
  }changeDbLink(){
    return new Promise(resolve=>{

    
      function submitDbLink(event,data){
        let saying = U.say('saving...'+data.dbLink)
        U.post({  data:{dbLink:data.dbLink}, type:'saveDbLink' }, (res) =>{

          if(res.error) return U.say(res.error)
          if(!res.error) asked.kill()
          resolve(res)

        })
        saying.kill()

        
      }

      let elements = [
        {h3:'Go to <a target="_blank" href="http://atlas.mongodb.com">http://atlas.mongodb.com</a>, create a database with them & give us the link'},
        {input:{placeholder:'database link',name:'dbLink'}},
        {button:{onclick:submitDbLink,innerHTML:'Submit Link'}},
        {button:{onclick:()=>{ asked.kill()},innerHTML:'Maybe tomorrow'}}
      ]

      let asked = U.ask(elements)

    })
  }async query(query,adminMode){

    if(!adminMode)adminMode = false

    let apiData = await U.post({adminMode:adminMode, data:query,type:'db',cookie:localStorage.getItem("file-protocol-cookie") })

    if(apiData.data){
    
      if(apiData.data.error == 'dbLink not found' && !adminMode){

        let dbLinkChanged = await U.changeDbLink()
        if(!dbLinkChanged.error){

          return await U.query(query)
        }

      }

    }

    if(apiData.data) if(apiData.data.error) throw Error( apiData.data.error)
    
    return apiData.data//to document the first arg is data and the other is meta

    //on login error tell user to login and call the same function
  }post(dataTobeSent,callback){

    dataTobeSent.cookie = U.getUserCookie()
    dataTobeSent.devCookie = localStorage.getItem('dev-cookie')

    let url = ''
    for(let value in dataTobeSent){
      if(!dataTobeSent[value])continue
      var dataString =  value+'='+(typeof dataTobeSent[value] == 'object'? encodeURIComponent(JSON.stringify(dataTobeSent[value])) : dataTobeSent[value] )
      url == ''? url += dataString: url += '&'+dataString
    }




    // console.log(url,dataTobeSent)
    let headerParam = {"Content-type":"application/x-www-form-urlencoded; charset=UTF-8"}

    //in hosting environment localstorage is used because we can only set cookies when client and server url are same
    if(U.configuration.job !== 'host') headerParam.credentials = 'same-origin'

   
    fetch( this.info.serverUrl,{method:'POST',headers: headerParam ,body: url }).then(response=>{


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
  }openAdminPannel(){
    //load script

  

    if(!localStorage.getItem('dev-cookie'))return U.login('DEVELOPER').then(U.openAdminPannel)
    let customElementAlredyDeclared = customElements.get('admin-pannel');
    if(customElementAlredyDeclared){
      return U.toggleAdminPannel()//dont't create it, just add it to dom
    }

   

    let msg = U.say('Loading...')

    import('https://unpkg.com/lit-element/lit-element.js?module').then(litHasLoaded)
                                                                                                          

    function litHasLoaded(module){
      msg.kill()
      
      let {unsafeCSS, LitElement, html, css} = module


      class adminPannel extends LitElement {

        static get properties() {
            return {
              title:String,
              dbData:Object,
              collections:Array,
              currentTab:String,
              errorMsg:String,
              showMessage:String,
              display:String
            }
          }

      constructor(){
        super()
        this.dbData = null
        this.display = 'block'
        this.showMessage = 'Please Wait'
        this.prevOverflowValue = document.body.style.overflowY
        U.toggleAdminPannel = ()=>{

          if(!this.prevOverflowValue) this.prevOverflowValue = 'unset'

          this.display === 'none'?document.body.style.overflowY = 'hidden' : document.body.style.overflowY = this.prevOverflowValue
          this.display === 'none'?this.display = 'block':this.display = 'none'
          
        }

        U.toggleAdminPannel = U.toggleAdminPannel.bind(this)
      }

      static get styles(){
          return css`
              #container {
              background: #fff;
              position: absolute;
              top: 0;
              left: 0;
              height: auto;
              width: 90%;
              margin: 0;
              box-shadow: 0 20px 7px 5px #999;
              background: #fff;
              border-radius: 0;
              font-family: roboto,sans-serif;
              padding: 20px;
              width: 98%;
              overflow: hidden;
              overflow-y:scroll;
              height: 99vh;
              z-index:10000000000000000000000000000000000000000000000000000;
              position: fixed;
          }

          #header{
            display: inline-block;
            width: 100%;
            position: relative;
            background: #222;
            border-radius:10px;
          }

          #console{
            background: #2d2c2c;
            color: #ffffff87;
            margin-bottom: 1vw;
            padding: 24px;
            border-radius: 20px;
          }

          #header button{
            float: left;
            padding: 10px 40px;
            margin: 20px;
            background: transparent;
            border-radius: 100px;
            cursor: pointer;
            color: #fff;
            border: 2px solid;
          }

          #header h1{
            color: #fff;
            float: right;
            margin: 0;
            font-size: 80px;
            position: absolute;
            right: 40px;
            bottom: -20px;
          }

          [data-display='none']{
            display:none
          }


          .section{
              padding: 20px;
              min-height: 200px;
              border-radius: 20px;
              width: 98%;
              display: inline-block;
              background: transparent;
              margin-top: 100px;
          }

          .left-pannel{
            float: left;
            height: 80vh;
            width: 14%;
            display: inline-block;
            border: 2px solid;
            position: relative;
            width: 17%;
            border-radius: 20px;
          }

          .left-pannel h3{
            position: absolute;
            margin: 0;
            top: -45px;
            font-size: 30px;
          }
          

          .left-pannel button{
            width: 100%;
              font-size: 20px;
              overflow:hidden; 
              text-align: left;
              background: #fff;
              border: none;
              padding: 10px 20px;
              border-radius: 10px;
              background: transparent;
              font-size: 20px;
              font-weight: 600;
              text-decoration: underline;
              margin: 40px 20px;
              outline: none;
              cursor: pointer;
          }

          .left-pannel button.highlighted{
            font-weight:900;
          }


          .right-pad{
            float:right;
            width: 90%;
            height: 1000px;
            display: inline-block;
            background: #dbdbdb;
            width: 80%;
            margin: 20px;
            margin: 0;
            background: transparent;
            width: 80%;
          }

          .workingArea{
            height: 1000px;
            float: right;
            border-radius: 20px;
            overflow-x:scroll;
            background: #fff;
            width: 100%;
            padding:40px;
            height: 400px;
          }

          documents-section{
            position:relative;
            width: 95%;
            display: inline-block;
            float: right;
          }

          documents-section #cmsOptions{
            position: absolute;
            width: 50vw;
            top: -60px;
            left: 20px;
          }

          documents-section #cmsOptions button{
            background: transparent;
            border: 0.20px solid;
            border-radius: 100px;
            padding: 10px 40px;
            margin-right: 15px;
          }

          documents-section #cmsArea{
         
            
            
            padding-top:40px;
            padding-left: 20px;
            padding-bottom: 100px;
           
          }

          documents-section #cmsArea p{
            display: inline-block;
            position:relative;
            width: 95%;
            border-radius: 20px;
            margin-top: 0;
            padding: 20px;
            box-shadow: 0vw 10px 10px #00000057;
            color: #00000078;
            position: relative;
            display: inline-block;
            font-size:20px;
          }

          documents-section #cmsArea p b{
            font-size: 24px;
            margin-bottom:5px;
            color: #000;
          }

          documents-section #cmsArea p span{
            display: inline-block;
            margin-bottom: 20px;
          }


          add-document input[placeholder="field"]{
            display: inline-block;
            width: 100%;
            border: none;
            padding: 20px;
            box-sizing:border-box;
            outline: none;
            font-size: 40px;
          }

          add-document input[placeholder="value"]{
            display: inline-block;
            width: 100%;
            box-sizing:border-box;
            border: none;
            outline: none;
            padding: 20px;
            font-size: 20px;
          }

          add-document button{
            background: transparent;
            padding: 10px 40px;
            margin-right: 20px;
            cursor: pointer;
            border: 0.20px solid;
            border-radius: 40px;
          }

          documents-section #cmsArea p #buttonContainer{
            position: absolute;
            right: 20px;
            top: 20px;
          }

          documents-section #cmsArea p button{
            border-radius: 100px;
            cursor: pointer;
            border: 0.20px solid;
            background: transparent;
            padding: 10px 40px;
          }


                      /* Let's get this party started */
            ::-webkit-scrollbar {
                width: 12px;
            }
            
            /* Track */
            ::-webkit-scrollbar-track {
                -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3); 
                -webkit-border-radius: 10px;
                border-radius: 10px;
            }
            
            /* Handle */
            ::-webkit-scrollbar-thumb {
                -webkit-border-radius: 10px;
                border-radius: 10px;
                background: #222; 
                -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.5); 
            }
            ::-webkit-scrollbar-thumb:window-inactive {
              background: rgba(255,0,0,0.4); 
            }

            `
          }



          firstUpdated(){
            
            
            U.query({$readDBconfig:null},true).then( (apiData) =>{


              if(!apiData) return this.dbData = []

              this.dbData =  JSON.parse(apiData.DBs)
              console.log(this.dbData)

            }).catch(error=>{
              console.log(error)
              this.showMessage = error.message
            })

          }



          render(){

            if(this.errorMsg) return html`<div  id='container' data-display='${this.display}'>

             ${this.errorMsg}


            </div>`

            return html`



            <div id='container' data-display='${this.display}'>

            <div id='header'>
              <button class='close'>CMS</button>
              <button @click="${()=>{
                U.openAdminPannel()
                U.changeDbLink()
              }}"> Change Database Link</button>
              <h1 class='mainHeading'>Admin Pannel</h1>
            </div>

            <console-logs></console-logs>

      

              </div>

            </div>
            `
          }

      }
      customElements.define('admin-pannel',adminPannel)


      class consoleLogs extends LitElement{

        static get properties(){
          return{
            logs:Object
          }
          
        }

        constructor(){
          super()
          this.refresh = this.refresh.bind(this)
          this.refresh()
        }

        refresh(){
     
         U.query( {$readLogs:10},true ).then(data=>{

            this.logs = data

          }).catch(error=>{
            console.log(error)
            this.logs = [{log:error.message}]

          })

            
        }

        static get styles(){
          return css`
            #console{
              background: #2d2c2c;
              color: #ffffff87;
              margin-bottom: 1vw;
              padding: 24px;
              border-radius: 20px;
            }

            button{
              padding: 10px 20px;
              border-radius: 10px;
              border: 2px solid #222;
              background: transparent;
              float: right;
            }
          `
        }

        render(){
          return html`
          <h1>Console</h1>
            ${this.logs?html`

              <div id="console">
              ${this.logs.map(item=>{
                return html`${item.log}<br>`
              })}
              </div>
            `:html`Loading...`}


            <button @click="${this.refresh}">Refresh</button>
          `
        }



      }

      customElements.define('console-logs',consoleLogs)
      
      document.body.innerHTML += '<admin-pannel> </admin-pannel>'
      U.toggleAdminPannel()
      U.toggleAdminPannel()
    }





  }print(data){

    console.log('%c'+data, 'color: Green; background-color: LightGreen; padding: 2px 5px; border-radius: 2px');//type of print: error, warning, greeting
  }random(){
    return Math.random().toString(36).substring(2, 15)+Math.random().toString(36).substring(2, 15)
  }killSocket(type){
    U.socket[type].close();
    U.socket[type] = null
  }callSocketFunction(msg,type){

    //to de return type as well
    


    let functionTobeCalled = U.socketFunctions[type][msg.token]
    if (!functionTobeCalled) return console.warn('websocket '+msg.token+' message: '+msg.data+' not caught '+type,msg)
    if (!functionTobeCalled[msg.type]) return console.warn('websocket '+msg.type+' not caught',msg)

      //set members

    functionTobeCalled = functionTobeCalled[msg.type] //msg type is open, update, leave ....

    //document: whole object is sent by the second parameter 
    functionTobeCalled(msg.data,msg)
  }setupSocket(query,type){

    U.socket[type] = new WebSocket('ws://'+this.info.serverUrl.replace('http://','')+'/'+type)

    // console.log(U.socket[type])

    U.socket[type].onopen = function (event){

      U.socket[type].onmessage = function (event){

        let msg = JSON.parse(event.data)

        //setup socket won't be called more than once, how fix works? type will sustain because it is only
        //defined once per type we just need to find the appropriate reception object

        let recep = U.socketFunctions[type][msg.token]

        // console.log('new unique',JSON.parse(event.data) ,recep)
        if(msg.unique) recep.unique = msg.unique
          
        U.callSocketFunction(msg,type)
      }

      // console.log(U.socket[type])
      U.newSocketJob(query,type)

      //for all the socketData connection as well

      for(let index of U.socketData[type]){
        U.newSocketJob(index,type)
      }
    };

    // return receptionObject
  }newSocketJob(msg,type,receptionObject){

    // if (U.socket[type]) return U.socket[type]

    function broadcast(data){
        if (!this.unique) return console.log('Unique not assigned')
        U.socket.room.send( JSON.stringify( {app:U.configuration.name, purpose:'broadcast', content:data, token:this.id, broadcastToken:this.unique  } ) )
    }

    function update(query){
        //server side handle if query is null
        if (!U.socket.query) return 'socket not instantiated'
        U.socket.query.send( JSON.stringify( {query:query, token:this.id, purpose:'update'} ) )

    }

    function leave(){
      U.socketFunctions['room'][this.id] = null
      U.socket.room.send( JSON.stringify({ unique:this.unique, currentToken:this.id, purpose:'leave'}) )
    }

    function change(newToken,limit){

      //fix its loop
      if (this.unique === null) return console.warn('in the process of changing')

      if (!limit) limit = 2
      U.socketFunctions['room'][this.id] = null
      U.socketFunctions['room'][newToken] = this

      U.socket.room.send( 
        JSON.stringify({limit:limit, 
                      cookie: U.getUserCookie(),
                      app:U.configuration.name,
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

    if(!U.socketFunctions[type][msg.token]) U.socketFunctions[type][msg.token] = new class{  
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

    // U.socketFunctions[type][msg.token] = receptionObject

    // console.log(msg,U.socket[type])

    if(!U.socket[type]){
      U.setupSocket(msg,type)

      return U.socketFunctions[type][msg.token]
    } 
      


    if(!U.socket[type].readyState){
      this.socketData[type].push( msg )
      return U.socketFunctions[type][msg.token]
    }

    //messsage to make a room is to be sent after conversation starts between the server
    
    
    msg.app = U.configuration.name
    msg.cookie = U.getUserCookie()

    // console.log('sending..',msg)
    U.socket[type].send( JSON.stringify(msg) );
    
    return U.socketFunctions[type][msg.token]
  }liveDb(query){
    //to do it doesnot needs to be async anymore 
    if (!U.getUserCookie() ) return U.logout()

    query = {token:U.random() ,query:query}
    return U.newSocketJob(query,'query')
  }room(token,limit){
   
   //make server login ui a promise
    if (!U.getUserCookie() ) return U.logout()

    let query = {limit:limit,token:token}
    query.purpose = 'join'
    return U.newSocketJob(query,'room')
  }logDevOut(){
    localStorage.removeItem('dev-cookie')
  }deleteCookie(name) {
    document.cookie = name+'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }logout(){

    U.say('Logging you out..')
    localStorage.removeItem('user')
    localStorage.removeItem('file-protocol-cookie')
    U.deleteCookie('user-cookie')
    location.href = U.getSubAppUrl('auth')+`/?logout=${location.origin}`

  }search(query,type){

    return new Promise(resolve=>{

      U.post({type:'search',data:{  query:query, type:type } },data=>{
        resolve(data)
      })

    })

  }changePassword(msg){

    return new Promise(resolve=>{



      function changePassword(event,cred){

        let processingRequest = U.say('just a second')
        U.post({ type:'verify_email_access',

          data:{
            username:cred.username,
            newPassword:cred.newPassword.trim(),
            job:'forgot_password',
            verificationCode:cred.verificationCode 
          }


        },data=>{


          if (data.error) return processingRequest.update(data.error)
          processingRequest.kill()
          if (data.code === 200){
            if (!data.msg) throw Error('username not found')
            
            //in hosting environment localstorage is used because we can only set cookies when client and server url are same

            
            loginPrompt.kill() //to do rename login prompt
            resolve(data)
            
          }

         })
      }

      let elements = [
        {h1:'check your email for verification code'},
        {h3:msg},
        {input:{name:'username'}},
        {input:{name:'verificationCode',type:'password'}},
        {input:{name:'newPassword',type:'password'}},
        {button:{innerHTML:'change password',onclick:changePassword}}
      ]
      //not to do notify user update
      let loginPrompt = U.ask(elements)

    }) //benifit of different prompts? reusable
  }async runCronManually(type){
    // U.runCronManually('daily').then(console.log)
      let cronLog = await U.post({ type:'runCRON', data:{type:type} })

      return cronLog

  }readUser(field){

    return new Promise(resolve=>{
      
      if (!U.getUserCookie()) return resolve()

      if(localStorage.getItem('user')){
        let whole = JSON.parse( localStorage.getItem('user') )
        if(!field) return resolve(whole)
        return resolve(whole[field])
      }else{
        
        //if someone tampers with localStorage 
        U.query('$user').then(function(whole){
          
          if(!whole){
            console.warn(' cookie invalid')
            return resolve()
          } 

          if (whole.error) return U.handleError(whole)//we dont send data


          if(!whole) throw Error(whole)
          localStorage.setItem( 'user', JSON.stringify(whole) )
          if(!field) return resolve(whole)
          return resolve(whole[field])

        })
            
      }
    })
  }fromPhone(){
    let width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
    if (width < 500)  return true
    return false
  }setMetaTag(findBY,attributeToAssign){
    let key = Object.keys(findBY)[0]
    let metaTag = document.querySelector(`meta[${key}="${findBY[key]}"]`)
    if(metaTag){
      for(let key in attributeToAssign){
        metaTag.setAttribute(key,attributeToAssign[key]) 
      }
    }else{
      metaTag = document.createElement('meta')

      let attributes = Object.assign(findBY,attributeToAssign)
      for(let key in attributes){
        metaTag.setAttribute(key,attributes[key]) 
      }

      document.head.appendChild(metaTag)

    }
  }getSubAppUrl(app){
    return `http://${app}.${U.info.host}:${U.info.port}`
  }login(loginFor){

    return new Promise(finished=>{

 
      function resolve(data){
        prompt.kill()
        finished(data)
      }

      let devLogin = false

      let title = 'Login to continue'
      if(loginFor == 'DEVELOPER'){
        title = "Developer Login"
        devLogin = true
      }


      //redirect procedure is followed when a it is not dev login job is in production and app is not auth
  
      let prompt = U.ask([
        {h1:title},
        {button:{onclick:()=>{U.loginWithUponDotOne(devLogin).then(resolve) }, innerHTML:'Login with UPON.ONE'}},
        {button:{onclick:()=>{U.loginWithGoogle(devLogin).then(resolve) }, innerHTML:'Login with Google'}}
      ])

    })


  }loginWithGoogle(devLogin){

    return new Promise(loginCompleted=>{

      if(location.protocol == 'file:') return U.say('Login With Google is only available in incognito mode')

      let pleaseWait = U.say('please Wait')
      const clientId = '140572074409-ijht2s8v0ldnotak190gbqi4gh8ci72e.apps.googleusercontent.com'
      const redirectUri = U.getSubAppUrl('auth')
      const responseType = 'code'
      const scope = 'profile email openid https://www.googleapis.com/auth/user.gender.read https://www.googleapis.com/auth/user.birthday.read'
      const state = JSON.stringify({ appName: U.configuration.name, devLogin:devLogin, redirect:location.origin, redirectUri:redirectUri })

      document.location = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&state=${state}&redirect_uri=${redirectUri}&scope=${scope}&response_type=${responseType}&access_type=offline&include_granted_scopes=true`

      return 
      
    })

  }processLoginResolve(data,devLogin){

    if(!data) return
    if(!data.msg) return

    if(U.configuration.name == 'auth' && U.configuration.job !== 'host') return location.reload();//this is in production
 

    //in hosting environment localstorage is used because we can only set cookies when client and server url are same otherwise cookies are used
    if(!devLogin){
      localStorage.setItem('file-protocol-cookie',data.msg)
    }else{
      localStorage.setItem('dev-cookie',data.msg)
    }

  }loginWithUponDotOne(devLogin){

    return new Promise(loginCompleted=>{

      //only users in production mode is redirected who are not on auth page
      if(!devLogin) if(U.configuration.job !=='host' && U.configuration.name !== 'auth') return window.location.href = U.getSubAppUrl('auth')+`/?appName=${U.configuration.name}`;
      
      
      function resolve(data){

        U.processLoginResolve(data,devLogin)
        loginCompleted()
        
      }

      //ready state interactive: images are loading
      //complete: all loaded
      //loading: meaning loading
   
 

      if (U.loginResolve) return U.loginResolve //if login is called twice all are given the same resolve
      U.loginResolve = resolve

      function processLogin(event,cred){

      
        let saying = U.say('just a second '+U.capital(cred.username))

          U.post({type:'loginOrSignup',data:{devLogin:devLogin,  newAccount:false, username: cred.username.toLowerCase() , password:cred.password }},data=>{

            saying.kill()
   
            if(data.error){
              if(data.error === 'account not verified') return U.verifyEmail(cred.username, devLogin).then(resolve)
            } 

            if(data.code == 200){
              loginPrompt.kill()
              resolve( data )
            }else{
              U.say(data.error)
            }

          })
      }

      function forgotPassword(){
        U.forgotPassword(devLogin).then(resolve)
      }

      function signUp(){
        U.signUp(devLogin).then(resolve)
      }

    
      let elements = [
        {h1:'Hey! Do we know each other?'},
        {input:{name:'username',required: true} },
        {input:{name:'password',required: true, onEnter: processLogin,type: 'password'}},
        {button:{innerHTML:'login',onclick: processLogin}},
        {button:{innerHTML:'sign up',onclick: signUp}},
        {button:{innerHTML:'forgot password',onclick: forgotPassword}}
        ]
      let loginPrompt = U.ask(elements)

    })
  }signUp(devLogin){
    return new Promise(resolve=>{


      function signUp(event,cred){

          let signingup = U.say(' just a second...')
          
          if(cred.username) cred.username = cred.username.toLowerCase()

          let configData = Object.assign(cred, {devLogin:devLogin, newAccount: true } )

          U.post({type:'loginOrSignup',data: configData },data=>{

            signingup.kill()
            //if the password was wrong handled

            if (data.error) return U.say(data.error)

            proceedToVerifyEmail() 

            function proceedToVerifyEmail(){
              signUpPrompt.kill()
              U.verifyEmail( data.username,devLogin ).then(resolve)
            }
            

          })
      }

      //to do make the maximum limit
      //###
      //placeholder for div
      //not to do notify user update
      //to do placeholder

      let elements = [
        {h1:'Sign Up'},
        {h3:'yes! we are going to be best friends'},
        {input:{name:'name', placeholder:'Full name', required:true}},
        {input:{name:'username', required:true}},
        {input:{name:'password', required:true,type:'password'}},

        {input:{name:'birthday',type:'date'}},
        {input:{name:'email', required:true}},
        {div:{name:'interest', type:'array'}},//to document type array
        {input:{type:'radio',checked:true,name:'gender',value:'male'}},
        {input:{type:'radio',name:'gender',value:'female'}},
        {input:{type:'radio',name:'gender',value:'pride'}},
        {button:{onclick:signUp, innerHTML:'Sign up'} }
      ]

      let signUpPrompt = U.ask(elements)

    })
  }forgotPassword(devLogin){
    return new Promise(resolve=>{

      let foundPerson = null

      function sendVerificationCode(event,cred){
        let notifySending = U.say('just a second')
        U.post({ type:'forgot_password', data:{devLogin:devLogin, emailOrusername:cred.username}  },data=>{
          notifySending.kill()
          if (data.error) return U.say(data.error)
          forgotPasswordPrompt.kill()
          U.changePassword(data.msg).then((resetSuccessful)=>{ resolve(resetSuccessful) })
        })
        
      }

      let elements = [
        {h1:'Your username or email'},
        {input:{name:'username',placeholder:'username or email'}},
        {button:{innerHTML:'send verification code',onclick:sendVerificationCode}}
      ]

      let forgotPasswordPrompt = U.ask(elements)


    })
  }verifyEmail(username,devLogin){
    //not mandatory, will happen afterwards, email verified as a variable as well

    return new Promise(resolve=>{



      function verify_email(event,cred){
         U.post({ type:'verify_email_access', data:{devLogin:devLogin, username:username, job:'verify_email',verificationCode:cred.code.trim() }  },data=>{
          if (data.error) return U.say(data.error)
          if (data.code === 200){
            verifyPrompt.kill()
            resolve(data)
          }
         })
      }

      let elements = [
        {h1:'hi '+username+' check your email for verification code'},
        {input:{type:'password',name:'code'}},
        {button:{onclick:verify_email,innerHTML:'verify email'}}
      ]

      //not to do notify user update
      let verifyPrompt = U.ask(elements)

    }) //benifit of different prompts? reusable

    //to do only from hompage
  }sendVerificationEmail(email,msg){

    return new Promise(resolve=>{
      U.post({ type:'sendVerificationEmail',context:context,email:email },resolve)
    })
  }say(message,onCancel){

    /*
      Users must be only supposed to interact with one element at time
      so self distruct is removed, and all messages will have gray backgroud to hightlight
      the message

      twitter shows self distruct message, they are wrong. It might be ignored and it can't removed instantly
    */

    if(U.currentOverlay) U.currentOverlay.kill()
    
    window.onbeforeunload = ()=>{
       if(U.currentOverlay) U.currentOverlay.kill() 
    };

    var html = `

      <div style='

        position: fixed;
        color: rgb(34, 34, 34);
        background: rgb(255, 255, 255);
        width: 62%;
        left: 19%;
        font-family: roboto, calibri;
        padding: 15px 0px;
        text-align: center;
        z-index: 100000000000000000000000000000000000000000000000000000000000000000000000000;
        max-height: 75vh;
        border-radius: 20px;
        overflow: hidden;
        top: 10%;
        box-shadow: rgba(0, 0, 0, 0.36) 20px 20px 20px 0px;    
        display: grid;
        justify-items: center;

      '></div> 
      
      
      <p class="overlay" style='

        position: absolute;
        background-color: #00000054;
        width: 100%;
        height: 100vh;
        left: 0;
        top: 0;
        z-index:4;
        margin: 0;

      '></p>
    `


    if(typeof message === 'object') message = JSON.stringify(message)

    let mainDiv = document.createElement('div')
    mainDiv.innerHTML = html
    mainDiv.setAttribute('id','notifyUser')
    let messagesDiv = mainDiv.querySelector("div")
    messagesDiv.innerHTML = message
    document.body.appendChild(mainDiv)
    

    let returnObject = {
          kill:killOverlay,
          update:(value)=>{//change value
            messagesDiv.innerHTML = value
          },dom:messagesDiv,

    }

    function killOverlay(){
      let overlayElement = document.querySelector('#notifyUser')
      if(!overlayElement) return

      overlayElement.parentElement.removeChild(overlayElement)
      U.currentOverlay = null
    }
    
    //interactive
    mainDiv.querySelector(".overlay").addEventListener('click', ()=>{
      killOverlay() 
      if (onCancel) onCancel()
    })

    U.currentOverlay = returnObject

    return returnObject

  }removeDom(dom){

    if (!dom.parentNode) return
    dom.parentNode.removeChild(dom)
  }CDN(path){
    return `${U.info.serverUrl}/cdn/${path}`
  }CSS(selector, css) {

    if (!U.stylesheet) U.stylesheet = document.head.appendChild( document.createElement("style") ).sheet
    
    var sheet = U.stylesheet

    var propText = typeof css === "string" ? css : Object.keys(css).map(function (p) {

        //p is the different stype
        //object key map will return image
        return p + ":" + (p === "content" ? "'" + css[p] + "'" : css[p]);

    }).join(";");


    sheet.insertRule(selector + "{" + propText + "}", sheet.cssRules.length);
  

  }capital(string){
    if(!string) return string
    if(string.split(' ').length > 1){
      let newString = ''

      for(let index of string.split(' ')){
        newString += U.capital(index)+' '
      }

      newString = newString.trim()
      return newString
    }

    return string.charAt(0).toUpperCase() + string.slice(1);
  }ask(elements){
    
    //title with varying weight
    
    //to remember if two source are trying to do something that will require login, two event listener will be set to the input box
    if (document.querySelector('prompt-ui')){
      document.querySelector('prompt-ui').parentNode.removeChild( document.querySelector('prompt-ui') )
    }
    
    elements.push({button:{onclick:()=>{U.currentPrompt.kill()},innerHTML:'X' }})

      class promptUI extends HTMLElement{

          constructor() {
            super();
            this.attachShadow({mode: 'open'});

            let html = `

            <style>


                  .container {
                    display: block;
                    position: relative;
                    padding-left: 35px;
                    margin-bottom: 12px;
                    cursor: pointer;
                    font-size: 22px;
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    font-family: sans-serif;
                    color: #787878;
                    -ms-user-select: none;
                    user-select: none;
                    margin: 60px;
                    margin-bottom: 20px;
                  }
                  
                  /* Hide the browser's default radio button */
                  .container input {
                    position: absolute;
                    opacity: 0;
                    cursor: pointer;
                  }
                  
                  /* Create a custom radio button */
                  .checkmark {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 25px;
                    width: 25px;
                    background-color: #eee;
                    border-radius: 50%;
                  }
                  
                  /* On mouse-over, add a grey background color */
                  .container:hover input ~ .checkmark {
                    background-color: #ccc;
                  }
                  
                  /* When the radio button is checked, add a blue background */
                  .container input:checked ~ .checkmark {
                    background-color: #333;
                  }
                  
                  /* Create the indicator (the dot/circle - hidden when not checked) */
                  .checkmark:after {
                    content: "";
                    position: absolute;
                    display: none;
                  }
                  
                  /* Show the indicator (dot/circle) when checked */
                  .container input:checked ~ .checkmark:after {
                    display: block;
                  }
                  
                  /* Style the indicator (dot/circle) */
                  .container .checkmark:after {
                    top: 9px;
                    left: 9px;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: white;
                  }


                  

                  label[data-type=date] {
                    margin-top: 60px;
                    display: inline-block;
                    padding: 0 20px;
                    color: #999;
                    font-family: sans-serif;
                    font-size: 40px;
                  }


              .promptUi {
                background: #fffffff2;
                padding: 4vh 31%;
                padding-top: 5vh;
                position: fixed;
                height: 80vh;
                width: 38vw;
                top: 0;
                overflow-y: scroll;
                /* padding-bottom: 10vw; */
                border:0.20px solid;
                margin: 40px;
                left: 0;
                border-radius: 20px;
                z-index: 10000000000000000000000;

                top: 0;
                left: 0;
                margin: 0;
                width: 100vw;
                border-radius: 0;
                box-sizing:border-box;
                height: 100vh;
              }

              #input textarea{
                resize: none;
                height:100px;
              }

              #input div[contenteditable="true"]:focus:before{
                content: '';
              }

              #input div[contenteditable="true"]:before {
                  color:#999;
                  font-family:sans-serif;
                  content: attr(data-placeholder);
                  padding-right:20px;
              }

              #input div[contenteditable="true"] span{
                padding: 10px 20px;
                color: #232020;
                margin: 0;
                display: inline-block;
                border: 0.20px solid;
                margin-bottom: 20px;
                font-family:sans-serif;
                border-radius: 20px;
              }

              #input div[contenteditable="true"]{
                overflow-y:scroll !important;
                height:60px !important;
                padding-top: 10px !important;
              }

              #input div[contenteditable="true"]::-webkit-scrollbar {
                display: none;
              }

              #input input,#input textarea, #input div[contenteditable="true"]{
                width: 100%;
                background: #e6e6e6;
                margin-top: 5%;
                height: 2vh;
                font-size: 15px;
                padding-left: 40px;
                text-align: left;
                color: #222;
                border: none;
                padding: 40px;
                overflow:hidden;
                border-radius: 100px;
                -webkit-box-sizing: unset; /* Safari/Chrome, other WebKit */
                -moz-box-sizing: unset;    /* Firefox, other Gecko */
                box-sizing: unset;         /* Opera/IE 8+ */
                box-sizing: border-box;
              }

              

              #input input[type="radio"]{
                margin-top: 0;
                height: 40px;
                padding: 0;
                width: 40px;
                margin: 40px 20px;
              }

              #input input[type=file] {
                  visibility: hidden;
                  position: relative;
              }

              #input input[type=file]:before {
                  width: 100%;
                  background: #fff;
                  height: 5vh;
                  font-size: 40px;
                  text-align: center;
                  color: #222;
                  border: none;
                  padding: 40px 0;
                  border-radius: 10px;
                  visibility: visible;
                  position: absolute;
                  top: 0;
                  content: attr(data-placeholder);
                  cursor:pointer;
              }

              #button button:hover{
                transform: scale(0.9);

              }

              #button button{
                transition: All ease-in 0.25s ;
                width: 100%;
                background: #e6e6e6;
                border: none;
                /* border-right: 0.20px solid #000; */
                font-size: 1.;
                padding: 20px 0;
                margin-right: 20px;
                color: #222;
                border-radius: 200px;
              }

              #headings{
                color: #222;
                margin-left: 20px;
                font-size: 23px;
                font-family: roboto,calibri;
              }

              #headings #title{
                font-size:20px;
                color:#fff;
                text-align:center;
              }

              #headings #imgpadding{
                width50%;
                height:50%;
                padding:0 25%;
                border-radius:100vw;
              }



              #button{
                margin-top: 60px;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
                border-radius: 10px;
                grid-gap: 20px;
                margin-bottom: 100px;
                width:38vw;
                box-sizing:border-box;
              }

              #button button:last-child{
                border:none;
              }

              ::-webkit-scrollbar {
                width: 12px;
              }
              
              ::-webkit-scrollbar-thumb {
                  -webkit-border-radius: 10px;
                  border-radius: 10px;
                  background: rgb(0, 0, 0);
                  -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.5);
              }
                ::-webkit-scrollbar-track {
                  -webkit-border-radius: 10px;
                  border-radius: 10px;
                }

                @media (max-width:800px){
                  #button,#input,#header{
                    width:90vw;
                  }

                  .promptUi{
                    padding: 5vw;
                    padding-bottom:0;
                  }


                  #button{
                    grid-template-columns: 1fr;
                  }
                }


              }


            </style>

            <div class='promptUi'>
              <div id='headings'>
              </div>
              <div id='input'>
              </div>
              <div id='button'>
              </div>
            </div>
            `
      

            let template = document.createElement('template');
            template.innerHTML = html;
            template = template.content
            this.shadowRoot.appendChild(template.cloneNode(true));
          }
      }

      if(!customElements.get('prompt-ui')){
        window.customElements.define('prompt-ui', promptUI);
      }

      let newPromptTag = document.createElement('prompt-ui')
      document.body.appendChild( newPromptTag)
      let shadowDom = document.querySelector('prompt-ui').shadowRoot
      let promptContainer = shadowDom.querySelector('.promptUi')

      let primaryButon = null //required fields are not validated if secondary buttons are clicked
      let requiredFields = []

      for(let element of elements){

        for(let tagName in element ){
          //there is only one tag name per element
          
          tagName = tagName.toLowerCase()

          let newTag = document.createElement(tagName)
          let configPerElement = element[tagName]

          /*
            In heading, key is element type
            in fields key is placeholder
            in buttons key is innerHTML
          */




          if(tagName == 'button' && primaryButon == null){
            primaryButon = configPerElement['innerHTML']
          }

          
          if(typeof configPerElement == 'object'){

            if(configPerElement.type) if(configPerElement.type == 'radio'){
              newTag = document.createElement('div')

              if(!configPerElement.checked){
                configPerElement.checked = ''
              }else{
                configPerElement.checked = 'checked'
              }

              

              newTag.innerHTML = `<label class="container">${configPerElement.value}
              <input type="radio" value="${configPerElement.value}" ${configPerElement.checked} name="${configPerElement.name}">
              <span class="checkmark"></span>
             </label>`

             
            }
            
            if(configPerElement.type) if(configPerElement.type == 'date'){
              newTag = document.createElement('div')

              newTag.innerHTML = `
              <label data-type="date" for="birthday">${configPerElement.name}</label>
              <input type="date" name="${configPerElement.name}">
              `
            
            }

            if(configPerElement.name) if(!configPerElement.placeholder) configPerElement.placeholder = configPerElement.name

            for(let attribute in configPerElement){

              

              let value = configPerElement[attribute]
              if(attribute === 'required'){
                let name = configPerElement.name
                if(!name) name = configPerElement.placeholder
                if(!name) return U.say('name not given for required field')

                requiredFields.push(name)
              }else if(attribute === 'type' && value === 'array'){
                newTag.setAttribute('contenteditable',true)
                newTag.addEventListener('keyup', renderArray)

                newTag.addEventListener('focusout', (event)=>{ renderArray(event,true) })
                //setting default array values
                if(configPerElement.value){
                  let html = ''
                  for(let index of configPerElement.value){
                    html += '<span>'+index+'</span> ' //the last space is important
                  }
                  newTag.innerHTML = html
                }

              }else if(attribute == 'placeholder' || attribute == 'name'){
                newTag.setAttribute('data-'+attribute, value )//data-placeholder for divs
                newTag.setAttribute(attribute, value )
              }else if(attribute.indexOf('on') !== -1){

                let eventType = attribute.replace('on','')

                if(tagName === 'button'){

                  function intermediate(event){
                    let newFn = value
                    let fieldValues = GetAllFieldValues()
                    if ( requiredOmmited(fieldValues) === false && configPerElement['innerHTML'] === primaryButon) return U.say('required field is missing') //a required value was ommited and a primary button was clicked
                    newFn(event,fieldValues)
                  }

                  newTag.addEventListener(eventType, intermediate)

                }else{

                
                  let newFn = value

                  function intermediate(event){
                    let fieldValue = GetAllFieldValues()
                    newFn(event, fieldValue)
                  }
                  
                  

                  if(attribute.toLowerCase() == 'onenter'){
                    eventType = 'keyup'
    
                    let oldIntermediate = intermediate
                    intermediate = function(event){

                      if(event.keyCode !== 13 ) return
                      oldIntermediate(event)
                    }
                  }

                  newTag.addEventListener(eventType, intermediate)
                }



                
              }else{
                setAttribute(attribute,value)
              }

              
            }
  
          }else{

            let defaultAttribute
            if(tagName == 'h1' || tagName == 'h3' || tagName == 'h3') defaultAttribute = 'innerHTML'
            if(tagName == 'fields') defaultAttribute = 'placeholder'
            if(tagName == 'button') return U.say('buttons require object')
            
            setAttribute(defaultAttribute, configPerElement)
          }
          
          function setAttribute(attribute,value){
            if(attribute == 'innerHTML')return newTag.innerHTML = value
            newTag.setAttribute(attribute,value)
          }
          
          let containerName = tagName 
          if(tagName == 'h1' || tagName == 'h3' || tagName == 'h3'){
            containerName = 'headings'
          }else if(tagName == 'button'){
            containerName = 'button'
          }else{//for element divs and input, code is written in this way to be most understandable
            containerName = 'input'
          }

          containerName = '#'+containerName
          
          promptContainer.querySelector(containerName).appendChild(newTag)
        }

      }

      function renderArray(event,finish){

          if(!finish) finish = false

          if( event.keyCode !== 32 && finish == false) return

          let array = getArray(event.target.innerHTML)

          if (!array) return
            
            event.target.innerHTML = ''

            for(let x of array){
              event.target.innerHTML += `<span>${x}</span> `
            }

            if(!finish){

              event.target.innerHTML += `<span>&nbsp</span> `

              var range = document.createRange();
              var sel = window.getSelection();
              range.setStart(event.target.childNodes[event.target.childNodes.length-1], 0);
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
              event.target.focus();
            }
      }

      function requiredOmmited(cred){

        for(let index of requiredFields){
          if (!cred[index]) return false
        }

        return true
      }

      function getArray(html){
            let interest = []

            let splits = html.replace(/<\/span>/gi,'').replace(/<span>/gi,'').split(' ')

            
            if (splits.length <=0) return null

            for(let oneInterest of splits ){

              
              
              
              // a = a.replace(/&nbsp;/g,'').trim()
              if(!oneInterest) continue
              console.log(oneInterest)
              let value = oneInterest.replace(/&nbsp;/gi,'') 
              if(value) interest.push(value)
            }

            console.log(html,splits,splits.length,interest)

            return interest
      }

      function GetAllFieldValues(){

              let Obj = {}
              for( let index of promptContainer.querySelectorAll('#input input,#input textarea, #input div[contenteditable="true"]') ){

                if ( index.getAttribute('type') === 'file'){

                  Obj[ index.getAttribute('data-name') ] = index

                }else if ( index.getAttribute('contenteditable') ){

                  let arrayValues  = getArray(index.innerHTML)
                  Obj[ index.getAttribute('data-name') ] = arrayValues
                  continue

                }else if(index.getAttribute('type') == 'radio'){
                  Obj[ index.value ] = index.checked
                }else{
                  let name = index.getAttribute('data-name')
                  if(!name) name =  index.getAttribute('name')
                  Obj[ name ] = index.value
                }


                
              }

              console.log(Obj)
              return Obj
              


      }

      U.currentPrompt = {kill:()=>{ U.removeDom(newPromptTag) }, dom:shadowDom}
      return U.currentPrompt

  }getUserCookie(){
    if (localStorage.getItem('file-protocol-cookie') ){
      return localStorage.getItem('file-protocol-cookie')
    }else if(U.getCookie('user-cookie')){
      return U.getCookie('user-cookie')
    }

    return false
    
  }urlParam(property){

    let urlParam = location.search.replace('?','').split('&').map(item=> {
        let part = item.split('=');
        let val = {};
        val[part[0]] = part[1];
        return val 
      })

      let paramObject = {}
      for(let index of urlParam){
        paramObject = Object.assign(paramObject,index)
      }

      return paramObject[property]
  }utilityFunctions(){

    return new class{

      upload(file,bucketName,originalFileName){

        return new Promise(resolve=>{

          let filenameForPrompt = originalFileName || file.name
          let uploadingMsg = U.say('uploading '+filenameForPrompt)
          let form = new FormData()
         
          form.append('devCookie',localStorage.getItem('dev-cookie'))
          if(originalFileName) form.append('originalFileName',originalFileName)//for replacing
          form.append('bucket',bucketName)
          if( U.getUserCookie() ) form.append('cookie', U.getUserCookie() )

          //if originalFileName is undefined it is automatically assigned if file has name
          //we need originalFileName for finding extension
          //originalFileName serves two pourpose, tell us the file name that needs to be replaced
          //if file doesn't needs to be replaced originalFileName gives us the extension for generating new name
          //on the server side the originalFileName in the form data is for declaring the file which needs to be replaced
          // on the server side the file.filename is for finding extension
          //file.filename is set automatically by the browser if we don't overwrite them
          //but when we create blob (in case of hosting upload) it does not happens automatically

          //if originalFileName is undefined it is automatically extracted from file.filename by multer
          if(file.name) originalFileName = file.name

          form.append('file',file,originalFileName)//if it was appended before the other appends then req.body will not be processed instantly
          fetch(U.info.serverUrl+'/upload', {
            method: 'POST',
            body: form
          }).then( response => response.json().then(postData=>{
            uploadingMsg.kill()
           if(postData.error){
             if(postData.error == 'dbLink not found'){

               return U.changeDbLink().then(()=>{
                U.utility.upload(file,bucketName,originalFileName).then(resolve)
               })




             }else{
              throw Error('upload Error '+postData.error)
             }
           } 

            resolve(postData)

         }))


        })



      }
    }

  }async upload(file,bucket,originalFileName){

    let url = await U.utility.upload( file ,bucket,originalFileName)
    if (url.error) return U.say(url.error)
    return url

  }async compressImage(file,options){

    if(!U.browserCompress){
      let loading = U.say('loading compression tool')
      U.browserCompress = await import('https://cdn.skypack.dev/browser-image-compression')
      loading.kill()
      U.browserCompress = U.browserCompress.default
    }

    if(!options) options = {
      maxSizeMB: 0.5,          // (default: Number.POSITIVE_INFINITY)
      //maxWidthOrHeight: number,   // compressedFile will scale down by ratio to a point that width or height is smaller than maxWidthOrHeight (default: undefined)
      useWebWorker: true,      // optional, use multi-thread web worker, fallback to run in main-thread (default: true)
      //maxIteration: number,       // optional, max number of iteration to compress the image (default: 10)
      //exifOrientation: number,    // optional, see https://stackoverflow.com/a/32490603/10395024
      //onProgress: Function,       // optional, a function takes one progress argument (percentage from 0 to 100) 
      fileType: 'jpeg'            // optional, fileType override
    }
     
    let loading = U.say('compressing file')
    let newFIle = await U.browserCompress(file, options)
    loading.kill()
    console.log(file,newFIle)
    return newFIle

  }
}


