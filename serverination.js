(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){
global.Peer = require('peerjs-client')



global.server = new class{
    constructor(){
      this.info={}
      this.configuration={}
      this.files={}
      this.db = {}
      this.request_callbacks={}
      this.listen_callbacks={}
      this.peer = null
      this.hostedCallback = null
      this.loginCallback = null
    }start(...arg){

      this.mode = arg[2].mode
      this.job = arg[2].job

      if (this.job == 'receive'){
        this.launch()
      }else{
        this.job == 'host'
        this.hostStatus = false

        if ( arg[1].indexOf('.json') === -1) {
          this.go(arg)
        }else{

          fetch(arg[1])
          .then( r => r.text() )
          .then( t => {

            try{

              var jsonFile = JSON.parse(t)
              arg[1] = jsonFile[arg[0]]
              console.log(t,jsonFile,arg[1])
              if (!arg[1]) return console.log('cant find password')
              this.go(arg)

            }catch(e){
              console.log(e)
            }

            // arg[1] = t[arg[0]]
            //this.go(arg)
            //
          } )

        }

        
      }
    }api(query,functionR){
      //to do: remove response process json on post
      this.post({  name:this.configuration.name, data:query,type:'db',cookie:localStorage.getItem("hostea") }, response => {

        function receivedAPIdata(apiData){
            if(apiData.error === 'Login required'){
            server.loginCallback = functionR
            server.loginParameter = query
            server.loginUI()
            return
          } 

          functionR(apiData)
        }


        response.json().then(apiData=>{
          

          receivedAPIdata(apiData)




        }).catch((er)=>{

          // response.text().then(apiData=>{
          //   receivedAPIdata(apiData)
          // })

          console.log(er,response)
        })

      }


       )

      //on login error tell user to login and call the same function
    }async go(arg){



            this.configuration.password = arg[1]
            this.configuration.name = arg[0]

            this.configuration.db = this.db
            //make for index of to

            // this.configuration.file = arg[3].fileName
            
            this.configuration.file = '/index'

            this.tmp = {}

            //html
            this.tmp.dom = this.stripScripts(document.body.innerHTML)


            //link tags

            this.tmp.link = []
   
            for(let index of document.querySelectorAll('link[rel="stylesheet"]') ){

              let href = index.getAttribute('href')

              console.log(href)

              if( href.indexOf('http') === -1 ){
                  var localFetch = await fetch(href)
                  var localcssText = await localFetch.text()
                  // console.log(localcssText)
                  this.tmp.css == undefined? this.tmp.css = localcssText: this.tmp.css += localcssText
              }else{
                //to do: load on the receive end
                this.tmp.link.push(href)
              }


            }


            //css
            //to do link tags
            for(let index of document.getElementsByTagName('style') ){
              this.tmp.css == undefined? this.tmp.css = index.innerHTML : this.tmp.css += index.innerHTML
            }

            //js

            let scriptScrap = get_scriptTags.bind(this)

            document.readyState === 'complete'? scriptScrap() : window.onload = scriptScrap

          

            async function get_scriptTags(){

                var js_file = {loads:[],source:''};
                var scriptfiles =  document.getElementsByTagName('script');

                for(let index of scriptfiles){
                  var src = index.getAttribute('src') || ''
                  var id_class = index.getAttribute('class') || ''
                  if( src.indexOf('serverination.js') == -1 && id_class.indexOf('private') == -1){


                    if(src === ""){
                      js_file.source += index.innerHTML
                    }else{

                      if (src.indexOf('http') === -1) {//local file
                        var localJsFetch = await fetch(src)
                        var localJsText = await localJsFetch.text()
                        js_file.source += localJsText

                      }else{ js_file.loads.push(src) }

                    } 
                  }
                }
              
                this.tmp.js = {}
                this.tmp.js = js_file

                this.files[this.configuration.file] = this.tmp
                this.launch()

            }
    }post(dataTobeSent,callback){
          let url = ''
          for(let value in dataTobeSent){
            if(!dataTobeSent[value])continue
            var dataString =  value+'='+(typeof dataTobeSent[value] == 'object'? encodeURIComponent(JSON.stringify(dataTobeSent[value])) : dataTobeSent[value] )
            url == ''? url += dataString: url += '&'+dataString
          }

          // console.log(url,dataTobeSent)
          fetch( this.info.serverUrl,{method:'POST',headers:{"Content-type":"application/x-www-form-urlencoded; charset=UTF-8"},
                body: url }).then(callback)
    }host(){
            var chache_hash = ()=>{
              for (let index in this.files){
                this.post( {data: {url:index,response:this.files[index]} ,type:'chache_hash',configuration:this.configuration}, console.log)
              }
            }
            
            this.post({data:this.configuration,type:'new'},data=>{
                  if (data.code == 400) return console.log(data.msg)//error occured
                  this.print(this.info.serverUrl+"/"+this.configuration.name)
                  this.files['/index'] = this.tmp
                  this.hostedCallback()

                  chache_hash()

                }
              )
    }receive(){
            //server go to host, and it will be chached and server request to get that file
            this.request('/index',this.newpage)
    }msg(data){

      console.log(data,'message connection')
            if(data.type == 'request'){

              let cha = {url: data.url, response:this.files[data.url], type:'response'}
              this.conn.send(cha)

            }else{//if it is a response
              let call = this.request_callbacks[data.url]
              call(data.response)
              this.files[data.url] = data.response
              // compare hash
            }
    }newpage(file_data){

                        console.log('received',file_data)
                        //file data is null
                        if (loader && loader.playing == true) {loader.finish()}

                        function loadScript(src) {
                            return new Promise(function (resolve, reject) {
                                var s;
                                s = document.createElement('script');
                                s.src = src;
                                s.onload = resolve;
                                s.onerror = reject;
                                document.head.appendChild(s);
                            });
                        }

                        async function addScripts(){

                          //html
                          //page abstraction
                          //to do
                          document.body.innerHTML = file_data.dom;


                          //css
                          var nw_css = document.createElement('style')
                          nw_css.innerHTML = file_data.css;
                          document.head.appendChild(nw_css)

                          //js
                          for(index of file_data.js.loads){
                            console.log('loading script')
                            await loadScript(index)
                          }
                  

                          console.log('load finished')


                          var nw_js = document.createElement('script')
                          nw_js.innerHTML = file_data.js.source;
                          document.head.appendChild(nw_js)
                          

                        }


                        addScripts()
                        
                        // this.frontcall[url] execute
    }request(url,callback,oldpeer,error_conn){

          if (error_conn){ console.error(error_conn.message) } 
          //chache file is removing + from db

          if (this.files[url] !== undefined) return callback(this.files[url])


          this.request_callbacks[url] = callback

          // let appName = 
          //a big exception to post request
          this.post({type:'peerFile',pid:this.configuration.peerid,oldpeer:oldpeer,app:this.configuration.name,file:url},response => response.json().then( hoster => {
              let hosterId = hoster.id
              let hoster_chache = hoster.chache

              if (!hoster) return console.log(hoster)

              console.log(hoster)
            
              if (hoster_chache){
                console.log('using chache')
                return this.msg( {url: url, response:JSON.parse(hoster_chache), type:'response'}  )
              }else{
                console.log('using peer:'+hosterId)
              }

              this.peer.on('error', (data)=>{

                console.log(data)
               this.request(url,callback,hosterId,data) 
             })

              if(hosterId) this.conn = this.peer.connect(hosterId)

              //SEND REQ
              this.conn.on('open', ()=>{
                console.log('hey')
                this.conn.send({url:url, type:'request'})
                this.conn.on('data', this.msg.bind(this) )
              })

            }))
    }launch(){
      if (window.location.protocol == 'https:' || window.location.protocol == 'http:') this.configuration.name = window.location.pathname.split('/')[1].split('.')[0]

        if (this.mode == 'testing' || location.host == 'localhost:8080'){//environment difinition
          this.info.host = 'localhost'
          this.info.port = 8080
        }else{
          this.info.host = 'serverination.herokuapp.com'
          this.info.port = 80
        }
        this.info.serverUrl = 'http://'+this.info.host+':'+this.info.port
         
          
        this.job == 'receive'? this.callback = this.receive.bind(this) : this.callback = this.host.bind(this)

        this.newPeer(this.callback,()=>{
          this.peer.on('connection', (conn)=>{
            console.log('connection established',this)
            this.conn = conn;
            this.conn.on('data', this.msg.bind(this) )
          });
        })
    }stripScripts(s){
        var div = document.createElement('div');
        div.innerHTML = s;
        var scripts = div.getElementsByTagName('script');
        var i = scripts.length;
        while (i--) {
          scripts[i].parentNode.removeChild(scripts[i]);
        }
        return div.innerHTML;
    }newPeer(...callback){

      this.peer = new Peer({
          host: this.info.host,
          port: this.info.port,
          path: '/peerjs'
      })


      this.peer.on('open',()=>{

      this.configuration.peerid = this.peer.id
      for(var index of callback){ index() }

      })
    }getUrlVars(){
      var vars = {};
      var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            vars[key] = value;
      });
      return vars;
    }print(data){

      console.log('%c'+data, 'color: Green; background-color: LightGreen; padding: 2px 5px; border-radius: 2px');
    }followOrUn(id){
      //if already follow unfollow
      server.post({type:'follow',cookie:localStorage.getItem('hostea'),receiver:id },response => response.json().then(followData=>{
        notifyUser(followData)
      }))//switch to apis
    }getPerson(id){
    }onStartUp(newfn){

      if(this.job == 'receive'){
         if(document.readyState === "complete") return newfn()
            let pr = window.onload
            window.onload = function(){
                if (pr) pr()
                newfn()
            }
      }else{
        //status hosted

        if(this.hostStatus == true){
          newfn()
        }else{
          let pr = this.hostedCallback
          this.hostedCallback = function(){
              if (pr) pr()
              newfn()
          }
        }

        
      }
    }login(event){

      server.cred = {}
      var loginParent = event.target.parentNode
      var value_array = event.target.parentNode.getElementsByTagName('input')


      for(let index of value_array){
        server.cred[index.name] = index.value
      }

      if (event.key == 'Enter') {


        fetch( server.info.serverUrl , { method: 'POST',headers: {"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"},
                  body: 'data='+JSON.stringify(server.cred)+'&type=knock' }).then(function(response){

                    if (response.code == 400 ){
                      return console.log('wrong password')
                    }

                    //why this is not available here, cause it is being called from function
                    function openDoor(data){
                      localStorage.setItem("hostea", data)
                      loginParent.parentNode.removeChild(loginParent)
                      server.api(server.loginParameter,server.loginCallback)
                    }

                    response.json().then( (data)=>{
                      data.code == 200? openDoor(data.msg) : console.error(data.msg)
                    })

                  } )
      }
    }loginUI(){
      var html = `
            <div id='loginUI' style='
                position: absolute;
                height: 100%;
                width: 100%;
                top: 0;
                left: 0;'>
            <input type="text" name="username" placeholder="username">
            <input type="password" name="password" onKeyup="server.login(event)" placeholder="password" >

            </div>
            `
      var loginUiHolder = document.createElement('template')
      loginUiHolder.innerHTML = html

      console.log(  loginUiHolder.content.querySelector("div") )
      document.body.appendChild(  document.importNode(loginUiHolder.content.querySelector("div") , true) )
    }notifyUser(message){
      var html = `<h3 class='notifyUser' style='
                      position:absolute; 
                      width:50%; 
                      left:25%; 
                      top:25%;'
                      ></h3>`

      function deleteThis(event){
        event.target.parentNode.removeChild(event.target)
      }

      let template = document.createElement('template')
      template.innerHTML = html
      let item = template.content.querySelector("h3")
      let a = document.importNode(item, true)
      a.innerHTML = message
      a.addEventListener('click',deleteThis)

      document.body.appendChild(a)

      setTimeout(function(){
        if (!a) return
        if (!a.parentNode) return
        a.parentNode.removeChild(a)
      },9000 )
    }
}
//to do test notifyUser
//add random, date, hash
//how to descover people, make the home app
//to do new receiver, seprate code for receiver and hoster
let ScTag = document.getElementsByClassName('hostea')[0]
  if (ScTag){

    server.start(null,null,{mode:ScTag.getAttribute("mode"),job:ScTag.getAttribute("job")})
    //why we need to make it global as we should not allow client to mess up anything, because we  want to give them api support on start 
    // if( ScTag.getAttribute("mode") == 'testing')global.TST = server
}


  


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"peerjs-client":9}],2:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @api private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {Mixed} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Boolean} exists Only check if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Remove the listeners of a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {Mixed} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
         listeners.fn === fn
      && (!once || listeners.once)
      && (!context || listeners.context === context)
    ) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
           listeners[i].fn !== fn
        || (once && !listeners[i].once)
        || (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {String|Symbol} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],3:[function(require,module,exports){
var BufferBuilder = require('./bufferbuilder').BufferBuilder;
var binaryFeatures = require('./bufferbuilder').binaryFeatures;

var BinaryPack = {
  unpack: function(data){
    var unpacker = new Unpacker(data);
    return unpacker.unpack();
  },
  pack: function(data){
    var packer = new Packer();
    packer.pack(data);
    var buffer = packer.getBuffer();
    return buffer;
  }
};

module.exports = BinaryPack;

function Unpacker (data){
  // Data is ArrayBuffer
  this.index = 0;
  this.dataBuffer = data;
  this.dataView = new Uint8Array(this.dataBuffer);
  this.length = this.dataBuffer.byteLength;
}

Unpacker.prototype.unpack = function(){
  var type = this.unpack_uint8();
  if (type < 0x80){
    var positive_fixnum = type;
    return positive_fixnum;
  } else if ((type ^ 0xe0) < 0x20){
    var negative_fixnum = (type ^ 0xe0) - 0x20;
    return negative_fixnum;
  }
  var size;
  if ((size = type ^ 0xa0) <= 0x0f){
    return this.unpack_raw(size);
  } else if ((size = type ^ 0xb0) <= 0x0f){
    return this.unpack_string(size);
  } else if ((size = type ^ 0x90) <= 0x0f){
    return this.unpack_array(size);
  } else if ((size = type ^ 0x80) <= 0x0f){
    return this.unpack_map(size);
  }
  switch(type){
    case 0xc0:
      return null;
    case 0xc1:
      return undefined;
    case 0xc2:
      return false;
    case 0xc3:
      return true;
    case 0xca:
      return this.unpack_float();
    case 0xcb:
      return this.unpack_double();
    case 0xcc:
      return this.unpack_uint8();
    case 0xcd:
      return this.unpack_uint16();
    case 0xce:
      return this.unpack_uint32();
    case 0xcf:
      return this.unpack_uint64();
    case 0xd0:
      return this.unpack_int8();
    case 0xd1:
      return this.unpack_int16();
    case 0xd2:
      return this.unpack_int32();
    case 0xd3:
      return this.unpack_int64();
    case 0xd4:
      return undefined;
    case 0xd5:
      return undefined;
    case 0xd6:
      return undefined;
    case 0xd7:
      return undefined;
    case 0xd8:
      size = this.unpack_uint16();
      return this.unpack_string(size);
    case 0xd9:
      size = this.unpack_uint32();
      return this.unpack_string(size);
    case 0xda:
      size = this.unpack_uint16();
      return this.unpack_raw(size);
    case 0xdb:
      size = this.unpack_uint32();
      return this.unpack_raw(size);
    case 0xdc:
      size = this.unpack_uint16();
      return this.unpack_array(size);
    case 0xdd:
      size = this.unpack_uint32();
      return this.unpack_array(size);
    case 0xde:
      size = this.unpack_uint16();
      return this.unpack_map(size);
    case 0xdf:
      size = this.unpack_uint32();
      return this.unpack_map(size);
  }
}

Unpacker.prototype.unpack_uint8 = function(){
  var byte = this.dataView[this.index] & 0xff;
  this.index++;
  return byte;
};

Unpacker.prototype.unpack_uint16 = function(){
  var bytes = this.read(2);
  var uint16 =
    ((bytes[0] & 0xff) * 256) + (bytes[1] & 0xff);
  this.index += 2;
  return uint16;
}

Unpacker.prototype.unpack_uint32 = function(){
  var bytes = this.read(4);
  var uint32 =
     ((bytes[0]  * 256 +
       bytes[1]) * 256 +
       bytes[2]) * 256 +
       bytes[3];
  this.index += 4;
  return uint32;
}

Unpacker.prototype.unpack_uint64 = function(){
  var bytes = this.read(8);
  var uint64 =
   ((((((bytes[0]  * 256 +
       bytes[1]) * 256 +
       bytes[2]) * 256 +
       bytes[3]) * 256 +
       bytes[4]) * 256 +
       bytes[5]) * 256 +
       bytes[6]) * 256 +
       bytes[7];
  this.index += 8;
  return uint64;
}


Unpacker.prototype.unpack_int8 = function(){
  var uint8 = this.unpack_uint8();
  return (uint8 < 0x80 ) ? uint8 : uint8 - (1 << 8);
};

Unpacker.prototype.unpack_int16 = function(){
  var uint16 = this.unpack_uint16();
  return (uint16 < 0x8000 ) ? uint16 : uint16 - (1 << 16);
}

Unpacker.prototype.unpack_int32 = function(){
  var uint32 = this.unpack_uint32();
  return (uint32 < Math.pow(2, 31) ) ? uint32 :
    uint32 - Math.pow(2, 32);
}

Unpacker.prototype.unpack_int64 = function(){
  var uint64 = this.unpack_uint64();
  return (uint64 < Math.pow(2, 63) ) ? uint64 :
    uint64 - Math.pow(2, 64);
}

Unpacker.prototype.unpack_raw = function(size){
  if ( this.length < this.index + size){
    throw new Error('BinaryPackFailure: index is out of range'
      + ' ' + this.index + ' ' + size + ' ' + this.length);
  }
  var buf = this.dataBuffer.slice(this.index, this.index + size);
  this.index += size;

    //buf = util.bufferToString(buf);

  return buf;
}

Unpacker.prototype.unpack_string = function(size){
  var bytes = this.read(size);
  var i = 0, str = '', c, code;
  while(i < size){
    c = bytes[i];
    if ( c < 128){
      str += String.fromCharCode(c);
      i++;
    } else if ((c ^ 0xc0) < 32){
      code = ((c ^ 0xc0) << 6) | (bytes[i+1] & 63);
      str += String.fromCharCode(code);
      i += 2;
    } else {
      code = ((c & 15) << 12) | ((bytes[i+1] & 63) << 6) |
        (bytes[i+2] & 63);
      str += String.fromCharCode(code);
      i += 3;
    }
  }
  this.index += size;
  return str;
}

Unpacker.prototype.unpack_array = function(size){
  var objects = new Array(size);
  for(var i = 0; i < size ; i++){
    objects[i] = this.unpack();
  }
  return objects;
}

Unpacker.prototype.unpack_map = function(size){
  var map = {};
  for(var i = 0; i < size ; i++){
    var key  = this.unpack();
    var value = this.unpack();
    map[key] = value;
  }
  return map;
}

Unpacker.prototype.unpack_float = function(){
  var uint32 = this.unpack_uint32();
  var sign = uint32 >> 31;
  var exp  = ((uint32 >> 23) & 0xff) - 127;
  var fraction = ( uint32 & 0x7fffff ) | 0x800000;
  return (sign == 0 ? 1 : -1) *
    fraction * Math.pow(2, exp - 23);
}

Unpacker.prototype.unpack_double = function(){
  var h32 = this.unpack_uint32();
  var l32 = this.unpack_uint32();
  var sign = h32 >> 31;
  var exp  = ((h32 >> 20) & 0x7ff) - 1023;
  var hfrac = ( h32 & 0xfffff ) | 0x100000;
  var frac = hfrac * Math.pow(2, exp - 20) +
    l32   * Math.pow(2, exp - 52);
  return (sign == 0 ? 1 : -1) * frac;
}

Unpacker.prototype.read = function(length){
  var j = this.index;
  if (j + length <= this.length) {
    return this.dataView.subarray(j, j + length);
  } else {
    throw new Error('BinaryPackFailure: read index out of range');
  }
}

function Packer(){
  this.bufferBuilder = new BufferBuilder();
}

Packer.prototype.getBuffer = function(){
  return this.bufferBuilder.getBuffer();
}

Packer.prototype.pack = function(value){
  var type = typeof(value);
  if (type == 'string'){
    this.pack_string(value);
  } else if (type == 'number'){
    if (Math.floor(value) === value){
      this.pack_integer(value);
    } else{
      this.pack_double(value);
    }
  } else if (type == 'boolean'){
    if (value === true){
      this.bufferBuilder.append(0xc3);
    } else if (value === false){
      this.bufferBuilder.append(0xc2);
    }
  } else if (type == 'undefined'){
    this.bufferBuilder.append(0xc0);
  } else if (type == 'object'){
    if (value === null){
      this.bufferBuilder.append(0xc0);
    } else {
      var constructor = value.constructor;
      if (constructor == Array){
        this.pack_array(value);
      } else if (constructor == Blob || constructor == File) {
        this.pack_bin(value);
      } else if (constructor == ArrayBuffer) {
        if(binaryFeatures.useArrayBufferView) {
          this.pack_bin(new Uint8Array(value));
        } else {
          this.pack_bin(value);
        }
      } else if ('BYTES_PER_ELEMENT' in value){
        if(binaryFeatures.useArrayBufferView) {
          this.pack_bin(new Uint8Array(value.buffer));
        } else {
          this.pack_bin(value.buffer);
        }
      } else if (constructor == Object){
        this.pack_object(value);
      } else if (constructor == Date){
        this.pack_string(value.toString());
      } else if (typeof value.toBinaryPack == 'function'){
        this.bufferBuilder.append(value.toBinaryPack());
      } else {
        throw new Error('Type "' + constructor.toString() + '" not yet supported');
      }
    }
  } else {
    throw new Error('Type "' + type + '" not yet supported');
  }
  this.bufferBuilder.flush();
}


Packer.prototype.pack_bin = function(blob){
  var length = blob.length || blob.byteLength || blob.size;
  if (length <= 0x0f){
    this.pack_uint8(0xa0 + length);
  } else if (length <= 0xffff){
    this.bufferBuilder.append(0xda) ;
    this.pack_uint16(length);
  } else if (length <= 0xffffffff){
    this.bufferBuilder.append(0xdb);
    this.pack_uint32(length);
  } else{
    throw new Error('Invalid length');
  }
  this.bufferBuilder.append(blob);
}

Packer.prototype.pack_string = function(str){
  var length = utf8Length(str);

  if (length <= 0x0f){
    this.pack_uint8(0xb0 + length);
  } else if (length <= 0xffff){
    this.bufferBuilder.append(0xd8) ;
    this.pack_uint16(length);
  } else if (length <= 0xffffffff){
    this.bufferBuilder.append(0xd9);
    this.pack_uint32(length);
  } else{
    throw new Error('Invalid length');
  }
  this.bufferBuilder.append(str);
}

Packer.prototype.pack_array = function(ary){
  var length = ary.length;
  if (length <= 0x0f){
    this.pack_uint8(0x90 + length);
  } else if (length <= 0xffff){
    this.bufferBuilder.append(0xdc)
    this.pack_uint16(length);
  } else if (length <= 0xffffffff){
    this.bufferBuilder.append(0xdd);
    this.pack_uint32(length);
  } else{
    throw new Error('Invalid length');
  }
  for(var i = 0; i < length ; i++){
    this.pack(ary[i]);
  }
}

Packer.prototype.pack_integer = function(num){
  if ( -0x20 <= num && num <= 0x7f){
    this.bufferBuilder.append(num & 0xff);
  } else if (0x00 <= num && num <= 0xff){
    this.bufferBuilder.append(0xcc);
    this.pack_uint8(num);
  } else if (-0x80 <= num && num <= 0x7f){
    this.bufferBuilder.append(0xd0);
    this.pack_int8(num);
  } else if ( 0x0000 <= num && num <= 0xffff){
    this.bufferBuilder.append(0xcd);
    this.pack_uint16(num);
  } else if (-0x8000 <= num && num <= 0x7fff){
    this.bufferBuilder.append(0xd1);
    this.pack_int16(num);
  } else if ( 0x00000000 <= num && num <= 0xffffffff){
    this.bufferBuilder.append(0xce);
    this.pack_uint32(num);
  } else if (-0x80000000 <= num && num <= 0x7fffffff){
    this.bufferBuilder.append(0xd2);
    this.pack_int32(num);
  } else if (-0x8000000000000000 <= num && num <= 0x7FFFFFFFFFFFFFFF){
    this.bufferBuilder.append(0xd3);
    this.pack_int64(num);
  } else if (0x0000000000000000 <= num && num <= 0xFFFFFFFFFFFFFFFF){
    this.bufferBuilder.append(0xcf);
    this.pack_uint64(num);
  } else{
    throw new Error('Invalid integer');
  }
}

Packer.prototype.pack_double = function(num){
  var sign = 0;
  if (num < 0){
    sign = 1;
    num = -num;
  }
  var exp  = Math.floor(Math.log(num) / Math.LN2);
  var frac0 = num / Math.pow(2, exp) - 1;
  var frac1 = Math.floor(frac0 * Math.pow(2, 52));
  var b32   = Math.pow(2, 32);
  var h32 = (sign << 31) | ((exp+1023) << 20) |
      (frac1 / b32) & 0x0fffff;
  var l32 = frac1 % b32;
  this.bufferBuilder.append(0xcb);
  this.pack_int32(h32);
  this.pack_int32(l32);
}

Packer.prototype.pack_object = function(obj){
  var keys = Object.keys(obj);
  var length = keys.length;
  if (length <= 0x0f){
    this.pack_uint8(0x80 + length);
  } else if (length <= 0xffff){
    this.bufferBuilder.append(0xde);
    this.pack_uint16(length);
  } else if (length <= 0xffffffff){
    this.bufferBuilder.append(0xdf);
    this.pack_uint32(length);
  } else{
    throw new Error('Invalid length');
  }
  for(var prop in obj){
    if (obj.hasOwnProperty(prop)){
      this.pack(prop);
      this.pack(obj[prop]);
    }
  }
}

Packer.prototype.pack_uint8 = function(num){
  this.bufferBuilder.append(num);
}

Packer.prototype.pack_uint16 = function(num){
  this.bufferBuilder.append(num >> 8);
  this.bufferBuilder.append(num & 0xff);
}

Packer.prototype.pack_uint32 = function(num){
  var n = num & 0xffffffff;
  this.bufferBuilder.append((n & 0xff000000) >>> 24);
  this.bufferBuilder.append((n & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((n & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((n & 0x000000ff));
}

Packer.prototype.pack_uint64 = function(num){
  var high = num / Math.pow(2, 32);
  var low  = num % Math.pow(2, 32);
  this.bufferBuilder.append((high & 0xff000000) >>> 24);
  this.bufferBuilder.append((high & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((high & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((high & 0x000000ff));
  this.bufferBuilder.append((low  & 0xff000000) >>> 24);
  this.bufferBuilder.append((low  & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((low  & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((low  & 0x000000ff));
}

Packer.prototype.pack_int8 = function(num){
  this.bufferBuilder.append(num & 0xff);
}

Packer.prototype.pack_int16 = function(num){
  this.bufferBuilder.append((num & 0xff00) >> 8);
  this.bufferBuilder.append(num & 0xff);
}

Packer.prototype.pack_int32 = function(num){
  this.bufferBuilder.append((num >>> 24) & 0xff);
  this.bufferBuilder.append((num & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((num & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((num & 0x000000ff));
}

Packer.prototype.pack_int64 = function(num){
  var high = Math.floor(num / Math.pow(2, 32));
  var low  = num % Math.pow(2, 32);
  this.bufferBuilder.append((high & 0xff000000) >>> 24);
  this.bufferBuilder.append((high & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((high & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((high & 0x000000ff));
  this.bufferBuilder.append((low  & 0xff000000) >>> 24);
  this.bufferBuilder.append((low  & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((low  & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((low  & 0x000000ff));
}

function _utf8Replace(m){
  var code = m.charCodeAt(0);

  if(code <= 0x7ff) return '00';
  if(code <= 0xffff) return '000';
  if(code <= 0x1fffff) return '0000';
  if(code <= 0x3ffffff) return '00000';
  return '000000';
}

function utf8Length(str){
  if (str.length > 600) {
    // Blob method faster for large strings
    return (new Blob([str])).size;
  } else {
    return str.replace(/[^\u0000-\u007F]/g, _utf8Replace).length;
  }
}

},{"./bufferbuilder":4}],4:[function(require,module,exports){
var binaryFeatures = {};
binaryFeatures.useBlobBuilder = (function(){
  try {
    new Blob([]);
    return false;
  } catch (e) {
    return true;
  }
})();

binaryFeatures.useArrayBufferView = !binaryFeatures.useBlobBuilder && (function(){
  try {
    return (new Blob([new Uint8Array([])])).size === 0;
  } catch (e) {
    return true;
  }
})();

module.exports.binaryFeatures = binaryFeatures;
var BlobBuilder = module.exports.BlobBuilder;
if (typeof window != 'undefined') {
  BlobBuilder = module.exports.BlobBuilder = window.WebKitBlobBuilder ||
    window.MozBlobBuilder || window.MSBlobBuilder || window.BlobBuilder;
}

function BufferBuilder(){
  this._pieces = [];
  this._parts = [];
}

BufferBuilder.prototype.append = function(data) {
  if(typeof data === 'number') {
    this._pieces.push(data);
  } else {
    this.flush();
    this._parts.push(data);
  }
};

BufferBuilder.prototype.flush = function() {
  if (this._pieces.length > 0) {
    var buf = new Uint8Array(this._pieces);
    if(!binaryFeatures.useArrayBufferView) {
      buf = buf.buffer;
    }
    this._parts.push(buf);
    this._pieces = [];
  }
};

BufferBuilder.prototype.getBuffer = function() {
  this.flush();
  if(binaryFeatures.useBlobBuilder) {
    var builder = new BlobBuilder();
    for(var i = 0, ii = this._parts.length; i < ii; i++) {
      builder.append(this._parts[i]);
    }
    return builder.getBlob();
  } else {
    return new Blob(this._parts);
  }
};

module.exports.BufferBuilder = BufferBuilder;

},{}],5:[function(require,module,exports){
module.exports.RTCSessionDescription = window.RTCSessionDescription ||
	window.mozRTCSessionDescription;
module.exports.RTCPeerConnection = window.RTCPeerConnection ||
	window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
module.exports.RTCIceCandidate = window.RTCIceCandidate ||
	window.mozRTCIceCandidate;

},{}],6:[function(require,module,exports){
var util = require('./util');
var EventEmitter = require('eventemitter3');
var Negotiator = require('./negotiator');
var Reliable = require('reliable');

/**
 * Wraps a DataChannel between two Peers.
 */
function DataConnection(peer, provider, options) {
    if (!(this instanceof DataConnection)) return new DataConnection(peer, provider, options);
    EventEmitter.call(this);

    this.options = util.extend({
        serialization: 'binary',
        reliable: false
    }, options);

    // Connection is not open yet.
    this.open = false;
    this.type = 'data';
    this.peer = peer;
    this.provider = provider;

    this.id = this.options.connectionId || DataConnection._idPrefix + util.randomToken();

    this.label = this.options.label || this.id;
    this.metadata = this.options.metadata;
    this.serialization = this.options.serialization;
    this.reliable = this.options.reliable;

    // Data channel buffering.
    this._buffer = [];
    this._buffering = false;
    this.bufferSize = 0;

    // For storing large data.
    this._chunkedData = {};

    if (this.options._payload) {
        this._peerBrowser = this.options._payload.browser;
    }

    util.log("startConnection from DataConnection");
    Negotiator.startConnection(
        this,
        this.options._payload || {
            originator: true
        }
    );
}

util.inherits(DataConnection, EventEmitter);

DataConnection._idPrefix = 'dc_';

/** Called by the Negotiator when the DataChannel is ready. */
DataConnection.prototype.initialize = function (dc) {
    this._dc = this.dataChannel = dc;
    this._configureDataChannel();
}

DataConnection.prototype._configureDataChannel = function () {
    var self = this;
    if (util.supports.sctp) {
        this._dc.binaryType = 'arraybuffer';
    }
    this._dc.onopen = function () {
        util.log('Data channel connection success');
        self.open = true;
        self.emit('open');
    }

    // Use the Reliable shim for non Firefox browsers
    if (!util.supports.sctp && this.reliable) {
        this._reliable = new Reliable(this._dc, util.debug);
    }

    if (this._reliable) {
        this._reliable.onmessage = function (msg) {
            self.emit('data', msg);
        };
    } else {
        this._dc.onmessage = function (e) {
            self._handleDataMessage(e);
        };
    }
    this._dc.onclose = function (e) {
        util.log('DataChannel closed for:', self.peer);
        self.close();
    };
}

// Handles a DataChannel message.
DataConnection.prototype._handleDataMessage = function (e) {
    var self = this;
    var data = e.data;
    var datatype = data.constructor;
    if (this.serialization === 'binary' || this.serialization === 'binary-utf8') {
        if (datatype === Blob) {
            // Datatype should never be blob
            util.blobToArrayBuffer(data, function (ab) {
                data = util.unpack(ab);
                self.emit('data', data);
            });
            return;
        } else if (datatype === ArrayBuffer) {
            data = util.unpack(data);
        } else if (datatype === String) {
            // String fallback for binary data for browsers that don't support binary yet
            var ab = util.binaryStringToArrayBuffer(data);
            data = util.unpack(ab);
        }
    } else if (this.serialization === 'json') {
        data = JSON.parse(data);
    }

    // Check if we've chunked--if so, piece things back together.
    // We're guaranteed that this isn't 0.
    if (data.__peerData) {
        var id = data.__peerData;
        var chunkInfo = this._chunkedData[id] || { data: [], count: 0, total: data.total };

        chunkInfo.data[data.n] = data.data;
        chunkInfo.count += 1;

        if (chunkInfo.total === chunkInfo.count) {
            // Clean up before making the recursive call to `_handleDataMessage`.
            delete this._chunkedData[id];

            // We've received all the chunks--time to construct the complete data.
            data = new Blob(chunkInfo.data);
            this._handleDataMessage({ data: data });
        }

        this._chunkedData[id] = chunkInfo;
        return;
    }

    this.emit('data', data);
}

/**
 * Exposed functionality for users.
 */

/** Allows user to close connection. */
DataConnection.prototype.close = function () {
    if (!this.open) {
        return;
    }
    this.open = false;
    Negotiator.cleanup(this);
    this.emit('close');
}

/** Allows user to send data. */
DataConnection.prototype.send = function (data, chunked) {
    if (!this.open) {
        this.emit('error', new Error('Connection is not open. You should listen for the `open` event before sending messages.'));
        return;
    }
    if (this._reliable) {
        // Note: reliable shim sending will make it so that you cannot customize
        // serialization.
        this._reliable.send(data);
        return;
    }
    var self = this;
    if (this.serialization === 'json') {
        this._bufferedSend(JSON.stringify(data));
    } else if (this.serialization === 'binary' || this.serialization === 'binary-utf8') {
        var blob = util.pack(data);

        // For Chrome-Firefox interoperability, we need to make Firefox "chunk"
        // the data it sends out.
        var needsChunking = util.chunkedBrowsers[this._peerBrowser] || util.chunkedBrowsers[util.browser];
        if (needsChunking && !chunked && blob.size > util.chunkedMTU) {
            this._sendChunks(blob);
            return;
        }

        // DataChannel currently only supports strings.
        if (!util.supports.sctp) {
            util.blobToBinaryString(blob, function (str) {
                self._bufferedSend(str);
            });
        } else if (!util.supports.binaryBlob) {
            // We only do this if we really need to (e.g. blobs are not supported),
            // because this conversion is costly.
            util.blobToArrayBuffer(blob, function (ab) {
                self._bufferedSend(ab);
            });
        } else {
            this._bufferedSend(blob);
        }
    } else {
        this._bufferedSend(data);
    }
}

DataConnection.prototype._bufferedSend = function (msg) {
    if (this._buffering || !this._trySend(msg)) {
        this._buffer.push(msg);
        this.bufferSize = this._buffer.length;
    }
}

// Returns true if the send succeeds.
DataConnection.prototype._trySend = function(msg) {
    var self = this;        
    function buffering() {
        self._buffering = true;
        setTimeout(function() {
            // Try again.
            self._buffering = false;
            self._tryBuffer();
        }, 100);
        return false;
    }
    if (self._dc.bufferedAmount > 15 * 1024 * 1024) {
        return buffering();
    } else {
        try {
            this._dc.send(msg);
        } catch (e) {
            return buffering();
        }
        return true;
    }        
}

DataConnection.prototype._tryBuffer = function () {
    if (this._buffer.length === 0) {
        return;
    }

    var msg = this._buffer[0];

    if (this._trySend(msg)) {
        this._buffer.shift();
        this.bufferSize = this._buffer.length;
        this._tryBuffer();
    }
}

DataConnection.prototype._sendChunks = function (blob) {
    var blobs = util.chunk(blob);
    for (var i = 0, ii = blobs.length; i < ii; i += 1) {
        var blob = blobs[i];
        this.send(blob, true);
    }
}

DataConnection.prototype.handleMessage = function (message) {
    var payload = message.payload;

    switch (message.type) {
        case 'ANSWER':
            this._peerBrowser = payload.browser;

            // Forward to negotiator
            Negotiator.handleSDP(message.type, this, payload.sdp);
            break;
        case 'CANDIDATE':
            Negotiator.handleCandidate(this, payload.candidate);
            break;
        default:
            util.warn('Unrecognized message type:', message.type, 'from peer:', this.peer);
            break;
    }
}

module.exports = DataConnection;
},{"./negotiator":8,"./util":11,"eventemitter3":2,"reliable":12}],7:[function(require,module,exports){
var util = require('./util');
var EventEmitter = require('eventemitter3');
var Negotiator = require('./negotiator');

/**
 * Wraps the streaming interface between two Peers.
 */
function MediaConnection(peer, provider, options) {
  if (!(this instanceof MediaConnection)) return new MediaConnection(peer, provider, options);
  EventEmitter.call(this);

  this.options = util.extend({}, options);

  this.open = false;
  this.type = 'media';
  this.peer = peer;
  this.provider = provider;
  this.metadata = this.options.metadata;
  this.localStream = this.options._stream;

  this.id = this.options.connectionId || MediaConnection._idPrefix + util.randomToken();
  if (this.localStream) {
    Negotiator.startConnection(
      this,
      {_stream: this.localStream, originator: true}
    );
  }
};

util.inherits(MediaConnection, EventEmitter);

MediaConnection._idPrefix = 'mc_';

MediaConnection.prototype.addStream = function(remoteStream) {
  util.log('Receiving stream', remoteStream);

  this.remoteStream = remoteStream;
  this.emit('stream', remoteStream); // Should we call this `open`?

};

MediaConnection.prototype.handleMessage = function(message) {
  var payload = message.payload;

  switch (message.type) {
    case 'ANSWER':
      // Forward to negotiator
      Negotiator.handleSDP(message.type, this, payload.sdp);
      this.open = true;
      break;
    case 'CANDIDATE':
      Negotiator.handleCandidate(this, payload.candidate);
      break;
    default:
      util.warn('Unrecognized message type:', message.type, 'from peer:', this.peer);
      break;
  }
}

MediaConnection.prototype.answer = function(stream) {
  if (this.localStream) {
    util.warn('Local stream already exists on this MediaConnection. Are you answering a call twice?');
    return;
  }

  this.options._payload._stream = stream;

  this.localStream = stream;
  Negotiator.startConnection(
    this,
    this.options._payload
  )
  // Retrieve lost messages stored because PeerConnection not set up.
  var messages = this.provider._getMessages(this.id);
  for (var i = 0, ii = messages.length; i < ii; i += 1) {
    this.handleMessage(messages[i]);
  }
  this.open = true;
};

/**
 * Exposed functionality for users.
 */

/** Allows user to close connection. */
MediaConnection.prototype.close = function() {
  if (!this.open) {
    return;
  }
  this.open = false;
  Negotiator.cleanup(this);
  this.emit('close')
};

module.exports = MediaConnection;

},{"./negotiator":8,"./util":11,"eventemitter3":2}],8:[function(require,module,exports){
var util = require('./util');
var RTCPeerConnection = require('./adapter').RTCPeerConnection;
var RTCSessionDescription = require('./adapter').RTCSessionDescription;
var RTCIceCandidate = require('./adapter').RTCIceCandidate;

/**
 * Manages all negotiations between Peers.
 */
var Negotiator = {
    pcs: {
        data: {},
        media: {}
    }, // type => {peerId: {pc_id: pc}}.
    //providers: {}, // provider's id => providers (there may be multiple providers/client.
    queue: [] // connections that are delayed due to a PC being in use.
}

Negotiator._idPrefix = 'pc_';

/** Returns a PeerConnection object set up correctly (for data, media). */
Negotiator.startConnection = function (connection, options) {
    var pc = Negotiator._getPeerConnection(connection, options);

    // Set the connection's PC.
    connection.pc = connection.peerConnection = pc;

    if (connection.type === 'media' && options._stream) {
        // Add the stream.
        pc.addStream(options._stream);
    }

    // What do we need to do now?
    if (options.originator) {
        if (connection.type === 'data') {
            // Create the datachannel.
            var config = {};
            // Dropping reliable:false support, since it seems to be crashing
            // Chrome.
            /*if (util.supports.sctp && !options.reliable) {
              // If we have canonical reliable support...
              config = {maxRetransmits: 0};
            }*/
            // Fallback to ensure older browsers don't crash.
            if (!util.supports.sctp) {
                config = { reliable: options.reliable };
            }
            var dc = pc.createDataChannel(connection.label, config);
            connection.initialize(dc);
        }

        if (!util.supports.onnegotiationneeded) {
            //Negotiator._makeOffer(connection);
            // firefox
            setTimeout(function () {
                Negotiator._makeOffer(connection);
            }, 0);
        }
    } else {
        Negotiator.handleSDP('OFFER', connection, options.sdp);
    }
}

Negotiator._getPeerConnection = function (connection, options) {
    if (!Negotiator.pcs[connection.type]) {
        util.error(connection.type + ' is not a valid connection type. Maybe you overrode the `type` property somewhere.');
    }

    if (!Negotiator.pcs[connection.type][connection.peer]) {
        Negotiator.pcs[connection.type][connection.peer] = {};
    }
    var peerConnections = Negotiator.pcs[connection.type][connection.peer];

    var pc;
    // Not multiplexing while FF and Chrome have not-great support for it.
    /*if (options.multiplex) {
      ids = Object.keys(peerConnections);
      for (var i = 0, ii = ids.length; i < ii; i += 1) {
        pc = peerConnections[ids[i]];
        if (pc.signalingState === 'stable') {
          break; // We can go ahead and use this PC.
        }
      }
    } else */
    if (options.pc) { // Simplest case: PC id already provided for us.
        pc = Negotiator.pcs[connection.type][connection.peer][options.pc];
    }

    if (!pc || pc.signalingState !== 'stable') {
        pc = Negotiator._startPeerConnection(connection);
    }
    return pc;
}

/*
Negotiator._addProvider = function(provider) {
  if ((!provider.id && !provider.disconnected) || !provider.socket.open) {
    // Wait for provider to obtain an ID.
    provider.on('open', function(id) {
      Negotiator._addProvider(provider);
    });
  } else {
    Negotiator.providers[provider.id] = provider;
  }
}*/


/** Start a PC. */
Negotiator._startPeerConnection = function (connection) {
    util.log('Creating RTCPeerConnection.');

    var id = Negotiator._idPrefix + util.randomToken();
    var optional = {};

    if (connection.type === 'data' && !util.supports.sctp) {
        optional = { optional: [{ RtpDataChannels: true }] };
    } else if (connection.type === 'media') {
        // Interop req for chrome.
        optional = { optional: [{ DtlsSrtpKeyAgreement: true }] };
    }

    var pc = new RTCPeerConnection(connection.provider.options.config, optional);
    Negotiator.pcs[connection.type][connection.peer][id] = pc;

    Negotiator._setupListeners(connection, pc, id);

    return pc;
}

/** Set up various WebRTC listeners. */
Negotiator._setupListeners = function (connection, pc, pc_id) {
    var peerId = connection.peer;
    var connectionId = connection.id;
    var provider = connection.provider;

    // ICE CANDIDATES.
    util.log('Listening for ICE candidates.');
    pc.onicecandidate = function (evt) {
        var candidate = evt.candidate || evt;

        if (!candidate || candidate.candidate === null) {
            util.log('ICE candidates gathering complete for:', connection.peer);
        } else {
            util.log('Generated ICE candidate for:', connection.peer, candidate);
            provider.socket.send({
                type: 'CANDIDATE',
                payload: {
                    candidate: {
                        sdpMid: candidate.sdpMid,
                        sdpMLineIndex: candidate.sdpMLineIndex,
                        candidate: candidate.candidate
                    },
                    type: connection.type,
                    connectionId: connection.id
                },
                dst: peerId
            });
        }
    };

    pc.oniceconnectionstatechange = function () {
        switch (pc.iceConnectionState) {
            case 'failed':
                util.log('iceConnectionState is disconnected, closing connections to ' + peerId);
                connection.close();
                break;
            case 'completed':
                pc.onicecandidate = util.noop;
                break;
        }
    };

    // Fallback for older Chrome impls.
    pc.onicechange = pc.oniceconnectionstatechange;

    // ONNEGOTIATIONNEEDED
    if (util.supports.onnegotiationneeded) {
        util.log('Listening for `negotiationneeded`');
        pc.onnegotiationneeded = function () {
            util.log('`negotiationneeded` triggered');
            // prevent error for FF42+
            // Took measures Because the ignition timing of onnegotiationneeded has changed.
            if (pc.signalingState == 'stable' && !connection.options.connectionId) {
                //setTimeout(function(ev){
                // prevent error for FF40. When callee, before handling remoteDescription, calling _makeOffer makes error
                // cause localDescription set. Delaying calls make it fix above mismatch.
                //  Negotiator._makeOffer(connection);
                //}, 1);
                Negotiator._makeOffer(connection);
            } else {
                util.log('onnegotiationneeded triggered when not stable. Is another connection being established?');
            }
        };
    }

    // DATACONNECTION.
    util.log('Listening for data channel');
    // Fired between offer and answer, so options should already be saved
    // in the options hash.
    pc.ondatachannel = function (evt) {
        util.log('Received data channel');
        var dc = evt.channel || evt;
        var connection = provider.getConnection(peerId, connectionId);
        connection.initialize(dc);
    };

    // MEDIACONNECTION.
    util.log('Listening for remote stream');
    pc.onaddstream = function (evt) {
        util.log('Received remote stream');
        var stream = evt.stream || evt;
        var connection = provider.getConnection(peerId, connectionId);
        // 10/10/2014: looks like in Chrome 38, onaddstream is triggered after
        // setting the remote description. Our connection object in these cases
        // is actually a DATA connection, so addStream fails.
        // TODO: This is hopefully just a temporary fix. We should try to
        // understand why this is happening.
        if (connection.type === 'media') {
            connection.addStream(stream);
        }
    };
}

Negotiator.cleanup = function (connection) {
    util.log('Cleaning up PeerConnection to ' + connection.peer);

    var pc = connection.pc;

    if (!!pc && (pc.readyState !== 'closed' || pc.signalingState !== 'closed')) {
        pc.close();
        connection.pc = null;
    }
}

Negotiator._makeOffer = function (connection) {
    var pc = connection.pc;

    if (!!pc.remoteDescription && !!pc.remoteDescription.type) return;

    pc.createOffer(function (offer) {
        util.log('Created offer.');

        if (!util.supports.sctp && connection.type === 'data' && connection.reliable) {
            offer.sdp = Reliable.higherBandwidthSDP(offer.sdp);
        }

        pc.setLocalDescription(offer, function () {
            util.log('Set localDescription: offer', 'for:', connection.peer);
            connection.provider.socket.send({
                type: 'OFFER',
                payload: {
                    sdp: {
                        type: offer.type,
                        sdp: offer.sdp
                    },
                    type: connection.type,
                    label: connection.label,
                    connectionId: connection.id,
                    reliable: connection.reliable,
                    serialization: connection.serialization,
                    metadata: connection.metadata,
                    browser: util.browser
                },
                dst: connection.peer
            });
        }, function (err) {
            connection.provider.emitError('webrtc', err);
            util.log('Failed to setLocalDescription, ', err);
        });
    }, function (err) {
        connection.provider.emitError('webrtc', err);
        util.log('Failed to createOffer, ', err);
    }, connection.options.constraints);
}

Negotiator._makeAnswer = function (connection) {
    var pc = connection.pc;

    pc.createAnswer(function (answer) {
        util.log('Created answer.');

        if (!util.supports.sctp && connection.type === 'data' && connection.reliable) {
            answer.sdp = Reliable.higherBandwidthSDP(answer.sdp);
        }

        pc.setLocalDescription(answer, function () {
            util.log('Set localDescription: answer', 'for:', connection.peer);
            connection.provider.socket.send({
                type: 'ANSWER',
                payload: {
                    sdp: {
                        type: answer.type,
                        sdp: answer.sdp
                    },
                    type: connection.type,
                    connectionId: connection.id,
                    browser: util.browser
                },
                dst: connection.peer
            });
        }, function (err) {
            connection.provider.emitError('webrtc', err);
            util.log('Failed to setLocalDescription, ', err);
        });
    }, function (err) {
        connection.provider.emitError('webrtc', err);
        util.log('Failed to create answer, ', err);
    });
}

/** Handle an SDP. */
Negotiator.handleSDP = function (type, connection, receivedSdp) {
    var sdp = new RTCSessionDescription({
        type: receivedSdp.type,
        sdp: receivedSdp.sdp
    });
    var pc = connection.pc;

    util.log('Setting remote description', sdp);
    pc.setRemoteDescription(sdp, function () {
        util.log('Set remoteDescription:', type, 'for:', connection.peer);

        if (type === 'OFFER') {
            Negotiator._makeAnswer(connection);
        }
    }, function (err) {
        connection.provider.emitError('webrtc', err);
        util.log('Failed to setRemoteDescription, ', err);
    });
}

/** Handle a candidate. */
Negotiator.handleCandidate = function (connection, ice) {
    /*change log*/
    // if ice is empty, ignore
    if (!ice) {
        return;
    }

    var candidate = ice.candidate;
    var sdpMLineIndex = ice.sdpMLineIndex;
    //var sdpMid = ice.sdpMid;
    connection.pc.addIceCandidate(new RTCIceCandidate({
        sdpMLineIndex: sdpMLineIndex,
        candidate: candidate
    }));
    util.log('Added ICE candidate for:', connection.peer);
}

module.exports = Negotiator;
},{"./adapter":5,"./util":11}],9:[function(require,module,exports){
var util = require('./util');
var EventEmitter = require('eventemitter3');
var Socket = require('./socket');
var MediaConnection = require('./mediaconnection');
var DataConnection = require('./dataconnection');

/**
 * A peer who can initiate connections with other peers.
 */
function Peer(id, options) {
  if (!(this instanceof Peer)) return new Peer(id, options);
  EventEmitter.call(this);

  // Deal with overloading
  if (id && id.constructor == Object) {
    options = id;
    id = undefined;
  } else if (id) {
    // Ensure id is a string
    id = id.toString();
  }
  //

  // Configurize options
  options = util.extend({
    debug: 0, // 1: Errors, 2: Warnings, 3: All logs
    host: util.CLOUD_HOST,
    port: util.CLOUD_PORT,
    key: 'peerjs',
    path: '/',
    token: util.randomToken(),
    config: util.defaultConfig
  }, options);
  this.options = options;
  // Detect relative URL host.
  if (options.host === '/') {
    options.host = window.location.hostname;
  }
  // Set path correctly.
  if (options.path[0] !== '/') {
    options.path = '/' + options.path;
  }
  if (options.path[options.path.length - 1] !== '/') {
    options.path += '/';
  }

  // Set whether we use SSL to same as current host
  if (options.secure === undefined && options.host !== util.CLOUD_HOST) {
    options.secure = util.isSecure();
  }
  // Set a custom log function if present
  if (options.logFunction) {
    util.setLogFunction(options.logFunction);
  }
  util.setLogLevel(options.debug);
  //

  // Sanity checks
  // Ensure WebRTC supported
  if (!util.supports.audioVideo && !util.supports.data ) {
    this._delayedAbort('browser-incompatible', 'The current browser does not support WebRTC');
    return;
  }
  // Ensure alphanumeric id
  if (!util.validateId(id)) {
    this._delayedAbort('invalid-id', 'ID "' + id + '" is invalid');
    return;
  }
  // Ensure valid key
  if (!util.validateKey(options.key)) {
    this._delayedAbort('invalid-key', 'API KEY "' + options.key + '" is invalid');
    return;
  }
  // Ensure not using unsecure cloud server on SSL page
  if (options.secure && options.host === '0.peerjs.com') {
    this._delayedAbort('ssl-unavailable',
      'The cloud server currently does not support HTTPS. Please run your own PeerServer to use HTTPS.');
    return;
  }
  //

  // States.
  this.destroyed = false; // Connections have been killed
  this.disconnected = false; // Connection to PeerServer killed but P2P connections still active
  this.open = false; // Sockets and such are not yet open.
  //

  // References
  this.connections = {}; // DataConnections for this peer.
  this._lostMessages = {}; // src => [list of messages]
  //

  // Start the server connection
  this._initializeServerConnection();
  if (id) {
    this._initialize(id);
  } else {
    this._retrieveId();
  }
  //
}

util.inherits(Peer, EventEmitter);

// Initialize the 'socket' (which is actually a mix of XHR streaming and
// websockets.)
Peer.prototype._initializeServerConnection = function() {
  var self = this;
  this.socket = new Socket(this.options.secure, this.options.host, this.options.port, this.options.path, this.options.key);
  this.socket.on('message', function(data) {
    self._handleMessage(data);
  });
  this.socket.on('error', function(error) {
    self._abort('socket-error', error);
  });
  this.socket.on('disconnected', function() {
    // If we haven't explicitly disconnected, emit error and disconnect.
    if (!self.disconnected) {
      self.emitError('network', 'Lost connection to server.');
      self.disconnect();
    }
  });
  this.socket.on('close', function() {
    // If we haven't explicitly disconnected, emit error.
    if (!self.disconnected) {
      self._abort('socket-closed', 'Underlying socket is already closed.');
    }
  });
};

/** Get a unique ID from the server via XHR. */
Peer.prototype._retrieveId = function(cb) {
  var self = this;
  var http = new XMLHttpRequest();
  var protocol = this.options.secure ? 'https://' : 'http://';
  var url = protocol + this.options.host + ':' + this.options.port +
    this.options.path + this.options.key + '/id';
  var queryString = '?ts=' + new Date().getTime() + '' + Math.random();
  url += queryString;

  // If there's no ID we need to wait for one before trying to init socket.
  http.open('get', url, true);
  http.onerror = function(e) {
    util.error('Error retrieving ID', e);
    var pathError = '';
    if (self.options.path === '/' && self.options.host !== util.CLOUD_HOST) {
      pathError = ' If you passed in a `path` to your self-hosted PeerServer, ' +
        'you\'ll also need to pass in that same path when creating a new ' +
        'Peer.';
    }
    self._abort('server-error', 'Could not get an ID from the server.' + pathError);
  };
  http.onreadystatechange = function() {
    if (http.readyState !== 4) {
      return;
    }
    if (http.status !== 200) {
      http.onerror();
      return;
    }
    self._initialize(http.responseText);
  };
  http.send(null);
};

/** Initialize a connection with the server. */
Peer.prototype._initialize = function(id) {
  this.id = id;
  this.socket.start(this.id, this.options.token);
};

/** Handles messages from the server. */
Peer.prototype._handleMessage = function(message) {
  var type = message.type;
  var payload = message.payload;
  var peer = message.src;
  var connection;

  switch (type) {
    case 'OPEN': // The connection to the server is open.
      this.emit('open', this.id);
      this.open = true;
      break;
    case 'ERROR': // Server error.
      this._abort('server-error', payload.msg);
      break;
    case 'ID-TAKEN': // The selected ID is taken.
      this._abort('unavailable-id', 'ID `' + this.id + '` is taken');
      break;
    case 'INVALID-KEY': // The given API key cannot be found.
      this._abort('invalid-key', 'API KEY "' + this.options.key + '" is invalid');
      break;

    //
    case 'LEAVE': // Another peer has closed its connection to this peer.
      util.log('Received leave message from', peer);
      this._cleanupPeer(peer);
      break;

    case 'EXPIRE': // The offer sent to a peer has expired without response.
      this.emitError('peer-unavailable', 'Could not connect to peer ' + peer);
      break;
    case 'OFFER': // we should consider switching this to CALL/CONNECT, but this is the least breaking option.
      var connectionId = payload.connectionId;
      connection = this.getConnection(peer, connectionId);

      if (connection) {
        util.warn('Offer received for existing Connection ID:', connectionId);
        //connection.handleMessage(message);
      } else {
        // Create a new connection.
        if (payload.type === 'media') {
          connection = new MediaConnection(peer, this, {
            connectionId: connectionId,
            _payload: payload,
            metadata: payload.metadata
          });
          this._addConnection(peer, connection);
          this.emit('call', connection);
        } else if (payload.type === 'data') {
          connection = new DataConnection(peer, this, {
            connectionId: connectionId,
            _payload: payload,
            metadata: payload.metadata,
            label: payload.label,
            serialization: payload.serialization,
            reliable: payload.reliable
          });
          this._addConnection(peer, connection);
          this.emit('connection', connection);
        } else {
          util.warn('Received malformed connection type:', payload.type);
          return;
        }
        // Find messages.
        var messages = this._getMessages(connectionId);
        for (var i = 0, ii = messages.length; i < ii; i += 1) {
          connection.handleMessage(messages[i]);
        }
      }
      break;
    default:
      if (!payload) {
        util.warn('You received a malformed message from ' + peer + ' of type ' + type);
        return;
      }

      var id = payload.connectionId;
      connection = this.getConnection(peer, id);

      if (connection && connection.pc) {
        // Pass it on.
        connection.handleMessage(message);
      } else if (id) {
        // Store for possible later use
        this._storeMessage(id, message);
      } else {
        util.warn('You received an unrecognized message:', message);
      }
      break;
  }
};

/** Stores messages without a set up connection, to be claimed later. */
Peer.prototype._storeMessage = function(connectionId, message) {
  if (!this._lostMessages[connectionId]) {
    this._lostMessages[connectionId] = [];
  }
  this._lostMessages[connectionId].push(message);
};

/** Retrieve messages from lost message store */
Peer.prototype._getMessages = function(connectionId) {
  var messages = this._lostMessages[connectionId];
  if (messages) {
    delete this._lostMessages[connectionId];
    return messages;
  } else {
    return [];
  }
};

/**
 * Returns a DataConnection to the specified peer. See documentation for a
 * complete list of options.
 */
Peer.prototype.connect = function(peer, options) {
  if (this.disconnected) {
    util.warn('You cannot connect to a new Peer because you called ' +
      '.disconnect() on this Peer and ended your connection with the ' +
      'server. You can create a new Peer to reconnect, or call reconnect ' +
      'on this peer if you believe its ID to still be available.');
    this.emitError('disconnected', 'Cannot connect to new Peer after disconnecting from server.');
    return;
  }
  var connection = new DataConnection(peer, this, options);
  this._addConnection(peer, connection);
  return connection;
};

/**
 * Returns a MediaConnection to the specified peer. See documentation for a
 * complete list of options.
 */
Peer.prototype.call = function(peer, stream, options) {
  if (this.disconnected) {
    util.warn('You cannot connect to a new Peer because you called ' +
      '.disconnect() on this Peer and ended your connection with the ' +
      'server. You can create a new Peer to reconnect.');
    this.emitError('disconnected', 'Cannot connect to new Peer after disconnecting from server.');
    return;
  }
  if (!stream) {
    util.error('To call a peer, you must provide a stream from your browser\'s `getUserMedia`.');
    return;
  }
  options = options || {};
  options._stream = stream;
  var call = new MediaConnection(peer, this, options);
  this._addConnection(peer, call);
  return call;
};

/** Add a data/media connection to this peer. */
Peer.prototype._addConnection = function(peer, connection) {
  if (!this.connections[peer]) {
    this.connections[peer] = [];
  }
  this.connections[peer].push(connection);
};

/** Retrieve a data/media connection for this peer. */
Peer.prototype.getConnection = function(peer, id) {
  var connections = this.connections[peer];
  if (!connections) {
    return null;
  }
  for (var i = 0, ii = connections.length; i < ii; i++) {
    if (connections[i].id === id) {
      return connections[i];
    }
  }
  return null;
};

Peer.prototype._delayedAbort = function(type, message) {
  var self = this;
  util.setZeroTimeout(function(){
    self._abort(type, message);
  });
};

/**
 * Destroys the Peer and emits an error message.
 * The Peer is not destroyed if it's in a disconnected state, in which case
 * it retains its disconnected state and its existing connections.
 */
Peer.prototype._abort = function(type, message) {
  util.error('Aborting!');
  if (!this._lastServerId) {
    this.destroy();
  } else {
    this.disconnect();
  }
  this.emitError(type, message);
};

/** Emits a typed error message. */
Peer.prototype.emitError = function(type, err) {
  util.error('Error:', err);
  if (typeof err === 'string') {
    err = new Error(err);
  }
  err.type = type;
  this.emit('error', err);
};

/**
 * Destroys the Peer: closes all active connections as well as the connection
 *  to the server.
 * Warning: The peer can no longer create or accept connections after being
 *  destroyed.
 */
Peer.prototype.destroy = function() {
  if (!this.destroyed) {
    this._cleanup();
    this.disconnect();
    this.destroyed = true;
  }
};


/** Disconnects every connection on this peer. */
Peer.prototype._cleanup = function() {
  if (this.connections) {
    var peers = Object.keys(this.connections);
    for (var i = 0, ii = peers.length; i < ii; i++) {
      this._cleanupPeer(peers[i]);
    }
  }
  this.emit('close');
};

/** Closes all connections to this peer. */
Peer.prototype._cleanupPeer = function(peer) {
  var connections = this.connections[peer];
  for (var j = 0, jj = connections.length; j < jj; j += 1) {
    connections[j].close();
  }
};

/**
 * Disconnects the Peer's connection to the PeerServer. Does not close any
 *  active connections.
 * Warning: The peer can no longer create or accept connections after being
 *  disconnected. It also cannot reconnect to the server.
 */
Peer.prototype.disconnect = function() {
  var self = this;
  util.setZeroTimeout(function(){
    if (!self.disconnected) {
      self.disconnected = true;
      self.open = false;
      if (self.socket) {
        self.socket.close();
      }
      self.emit('disconnected', self.id);
      self._lastServerId = self.id;
      self.id = null;
    }
  });
};

/** Attempts to reconnect with the same ID. */
Peer.prototype.reconnect = function() {
  if (this.disconnected && !this.destroyed) {
    util.log('Attempting reconnection to server with ID ' + this._lastServerId);
    this.disconnected = false;
    this._initializeServerConnection();
    this._initialize(this._lastServerId);
  } else if (this.destroyed) {
    throw new Error('This peer cannot reconnect to the server. It has already been destroyed.');
  } else if (!this.disconnected && !this.open) {
    // Do nothing. We're still connecting the first time.
    util.error('In a hurry? We\'re still trying to make the initial connection!');
  } else {
    throw new Error('Peer ' + this.id + ' cannot reconnect because it is not disconnected from the server!');
  }
};

/**
 * Get a list of available peer IDs. If you're running your own server, you'll
 * want to set allow_discovery: true in the PeerServer options. If you're using
 * the cloud server, email team@peerjs.com to get the functionality enabled for
 * your key.
 */
Peer.prototype.listAllPeers = function(cb) {
  cb = cb || function() {};
  var self = this;
  var http = new XMLHttpRequest();
  var protocol = this.options.secure ? 'https://' : 'http://';
  var url = protocol + this.options.host + ':' + this.options.port +
    this.options.path + this.options.key + '/peers';
  var queryString = '?ts=' + new Date().getTime() + '' + Math.random();
  url += queryString;

  // If there's no ID we need to wait for one before trying to init socket.
  http.open('get', url, true);
  http.onerror = function(e) {
    self._abort('server-error', 'Could not get peers from the server.');
    cb([]);
  };
  http.onreadystatechange = function() {
    if (http.readyState !== 4) {
      return;
    }
    if (http.status === 401) {
      var helpfulError = '';
      if (self.options.host !== util.CLOUD_HOST) {
        helpfulError = 'It looks like you\'re using the cloud server. You can email ' +
          'team@peerjs.com to enable peer listing for your API key.';
      } else {
        helpfulError = 'You need to enable `allow_discovery` on your self-hosted ' +
          'PeerServer to use this feature.';
      }
      cb([]);
      throw new Error('It doesn\'t look like you have permission to list peers IDs. ' + helpfulError);
    } else if (http.status !== 200) {
      cb([]);
    } else {
      cb(JSON.parse(http.responseText));
    }
  };
  http.send(null);
};

module.exports = Peer;

},{"./dataconnection":6,"./mediaconnection":7,"./socket":10,"./util":11,"eventemitter3":2}],10:[function(require,module,exports){
var util = require('./util');
var EventEmitter = require('eventemitter3');

/**
 * An abstraction on top of WebSockets and XHR streaming to provide fastest
 * possible connection for peers.
 */
function Socket(secure, host, port, path, key) {
    if (!(this instanceof Socket)) return new Socket(secure, host, port, path, key);

    EventEmitter.call(this);

    // Disconnected manually.
    this.disconnected = false;
    this._queue = [];

    var httpProtocol = secure ? 'https://' : 'http://';
    var wsProtocol = secure ? 'wss://' : 'ws://';
    this._httpUrl = httpProtocol + host + ':' + port + path + key;
    this._wsUrl = wsProtocol + host + ':' + port + path + 'peerjs?key=' + key;
}

util.inherits(Socket, EventEmitter);


/** Check in with ID or get one from server. */
Socket.prototype.start = function (id, token) {
    this.id = id;

    this._httpUrl += '/' + id + '/' + token;
    this._wsUrl += '&id=' + id + '&token=' + token;

    // this._startXhrStream();
    this._startWebSocket();
}


/** Start up websocket communications. */
Socket.prototype._startWebSocket = function (id) {
    var self = this;

    if (this._socket) {
        return;
    }

    this._socket = new WebSocket(this._wsUrl);

    this._socket.onmessage = function (event) {
        try {
            var data = JSON.parse(event.data);
        } catch (e) {
            util.log('Invalid server message', event.data);
            return;
        }
        self.emit('message', data);
    };

    // Take care of the queue of connections if necessary and make sure Peer knows
    // socket is open.
    this._socket.onopen = function () {
        if (self._timeout) {
            clearTimeout(self._timeout);
            setTimeout(function () {
                self._http.abort();
                self._http = null;
            }, 5000);
        }
        if (util.supportsKeepAlive) {
            self._setWSTimeout();
        }
        self._sendQueuedMessages();
        util.log('Socket open');
    };

    this._socket.onerror = function (err) {
        util.error('WS error code ' + err.code);
    }

    // Fall back to XHR if WS closes
    this._socket.onclose = function (msg) {
        util.error("WS closed with code " + msg.code);
        if (!self.disconnected) {
            // self._startXhrStream();
        }
    }
}

/** Start XHR streaming. */
Socket.prototype._startXhrStream = function (n) {
    try {
        var self = this;
        this._http = new XMLHttpRequest();
        this._http._index = 1;
        this._http._streamIndex = n || 0;
        this._http.open('post', this._httpUrl + '/id?i=' + this._http._streamIndex, true);
        this._http.onerror = function () {
            // If we get an error, likely something went wrong.
            // Stop streaming.
            clearTimeout(self._timeout);
            self.emit('disconnected');
        }
        this._http.onreadystatechange = function () {
            if (this.readyState == 2 && this.old) {
                this.old.abort();
                delete this.old;
            } else if (this.readyState > 2 && this.status === 200 && this.responseText) {
                self._handleStream(this);
            }
        };
        this._http.send(null);
        this._setHTTPTimeout();
    } catch (e) {
        util.log('XMLHttpRequest not available; defaulting to WebSockets');
    }
}


/** Handles onreadystatechange response as a stream. */
Socket.prototype._handleStream = function (http) {
    // 3 and 4 are loading/done state. All others are not relevant.
    var messages = http.responseText.split('\n');

    console.log(messages);

    // Check to see if anything needs to be processed on buffer.
    if (http._buffer) {
        while (http._buffer.length > 0) {
            var index = http._buffer.shift();
            var bufferedMessage = messages[index];
            try {
                bufferedMessage = JSON.parse(bufferedMessage);
            } catch (e) {
                http._buffer.shift(index);
                break;
            }
            this.emit('message', bufferedMessage);
        }
    }

    var message = messages[http._index];
    if (message) {
        http._index += 1;
        // Buffering--this message is incomplete and we'll get to it next time.
        // This checks if the httpResponse ended in a `\n`, in which case the last
        // element of messages should be the empty string.
        if (http._index === messages.length) {
            if (!http._buffer) {
                http._buffer = [];
            }
            http._buffer.push(http._index - 1);
        } else {
            try {
                message = JSON.parse(message);
            } catch (e) {
                util.log('Invalid server message', message);
                return;
            }
            this.emit('message', message);
        }
    }
}

Socket.prototype._setHTTPTimeout = function () {
    var self = this;
    this._timeout = setTimeout(function () {
        var old = self._http;
        if (!self._wsOpen()) {
            // self._startXhrStream(old._streamIndex + 1);
            self._http.old = old;
        } else {
            old.abort();
        }
    }, 25000);
}

Socket.prototype._setWSTimeout = function () {
    var self = this;
    this._wsTimeout = setTimeout(function () {
        if (self._wsOpen()) {
            self._socket.close();
            util.error('WS timed out');
        }
    }, 45000)
}

/** Is the websocket currently open? */
Socket.prototype._wsOpen = function () {
    return this._socket && this._socket.readyState == 1;
}

/** Send queued messages. */
Socket.prototype._sendQueuedMessages = function () {
    for (var i = 0, ii = this._queue.length; i < ii; i += 1) {
        this.send(this._queue[i]);
    }
}

/** Exposed send for DC & Peer. */
Socket.prototype.send = function (data) {
    if (this.disconnected) {
        return;
    }

    // If we didn't get an ID yet, we can't yet send anything so we should queue
    // up these messages.
    if (!this.id) {
        this._queue.push(data);
        return;
    }

    if (!data.type) {
        this.emit('error', 'Invalid message');
        return;
    }

    var message = JSON.stringify(data);
    if (this._wsOpen()) {
        this._socket.send(message);
    } else if (data.type !== 'PONG') {
        var http = new XMLHttpRequest();
        var url = this._httpUrl + '/' + data.type.toLowerCase();
        http.open('post', url, true);
        http.setRequestHeader('Content-Type', 'application/json');
        http.send(message);
    }
}

Socket.prototype.sendPong = function () {
    if (this._wsOpen()) {
        this.send({ type: 'PONG' });
        if (this._wsTimeout) {
            clearTimeout(this._wsTimeout);
        }
        this._setWSTimeout();
    }
}

Socket.prototype.close = function () {
    if (!this.disconnected) {
        this.disconnected = true;
        if (this._wsOpen()) {
            this._socket.close();
        }
        if (this._http) {
            this._http.abort();
        }
        clearTimeout(this._timeout);
    }
}

module.exports = Socket;
},{"./util":11,"eventemitter3":2}],11:[function(require,module,exports){
var defaultConfig = {'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }]};
var dataCount = 1;

var BinaryPack = require('js-binarypack');
var RTCPeerConnection = require('./adapter').RTCPeerConnection;

var util = {
  noop: function() {},

  CLOUD_HOST: '0.peerjs.com',
  CLOUD_PORT: 9000,

  // Browsers that need chunking:
  chunkedBrowsers: {'Chrome': 1},
  chunkedMTU: 16300, // The original 60000 bytes setting does not work when sending data from Firefox to Chrome, which is "cut off" after 16384 bytes and delivered individually.

  // Logging logic
  logLevel: 0,
  setLogLevel: function(level) {
    var debugLevel = parseInt(level, 10);
    if (!isNaN(parseInt(level, 10))) {
      util.logLevel = debugLevel;
    } else {
      // If they are using truthy/falsy values for debug
      util.logLevel = level ? 3 : 0;
    }
    util.log = util.warn = util.error = util.noop;
    if (util.logLevel > 0) {
      util.error = util._printWith('ERROR');
    }
    if (util.logLevel > 1) {
      util.warn = util._printWith('WARNING');
    }
    if (util.logLevel > 2) {
      util.log = util._print;
    }
  },
  setLogFunction: function(fn) {
    if (fn.constructor !== Function) {
      util.warn('The log function you passed in is not a function. Defaulting to regular logs.');
    } else {
      util._print = fn;
    }
  },

  _printWith: function(prefix) {
    return function() {
      var copy = Array.prototype.slice.call(arguments);
      copy.unshift(prefix);
      util._print.apply(util, copy);
    };
  },
  _print: function () {
    var err = false;
    var copy = Array.prototype.slice.call(arguments);
    copy.unshift('PeerJS: ');
    for (var i = 0, l = copy.length; i < l; i++){
      if (copy[i] instanceof Error) {
        copy[i] = '(' + copy[i].name + ') ' + copy[i].message;
        err = true;
      }
    }
    err ? console.error.apply(console, copy) : console.log.apply(console, copy);
  },
  //

  // Returns browser-agnostic default config
  defaultConfig: defaultConfig,
  //

  // Returns the current browser.
  browser: (function() {
    if (window.mozRTCPeerConnection) {
      return 'Firefox';
    } else if (window.webkitRTCPeerConnection) {
      return 'Chrome';
    } else if (window.RTCPeerConnection) {
      return 'Supported';
    } else {
      return 'Unsupported';
    }
  })(),
  //

  // Lists which features are supported
  supports: (function() {
    if (typeof RTCPeerConnection === 'undefined') {
      return {};
    }

    var data = true;
    var audioVideo = true;

    var binaryBlob = false;
    var sctp = false;
    var onnegotiationneeded = !!window.webkitRTCPeerConnection;

    var pc, dc;
    try {
      pc = new RTCPeerConnection(defaultConfig, {optional: [{RtpDataChannels: true}]});
    } catch (e) {
      data = false;
      audioVideo = false;
    }

    if (data) {
      try {
        dc = pc.createDataChannel('_PEERJSTEST');
      } catch (e) {
        data = false;
      }
    }

    if (data) {
      // Binary test
      try {
        dc.binaryType = 'blob';
        binaryBlob = true;
      } catch (e) {
      }

      // Reliable test.
      // Unfortunately Chrome is a bit unreliable about whether or not they
      // support reliable.
      var reliablePC = new RTCPeerConnection(defaultConfig, {});
      try {
        var reliableDC = reliablePC.createDataChannel('_PEERJSRELIABLETEST', {});
        sctp = reliableDC.reliable;
      } catch (e) {
      }
      reliablePC.close();
    }

    // FIXME: not really the best check...
    if (audioVideo) {
      audioVideo = !!pc.addStream;
    }

    // FIXME: this is not great because in theory it doesn't work for
    // av-only browsers (?).
    if (!onnegotiationneeded && data) {
      // sync default check.
      var negotiationPC = new RTCPeerConnection(defaultConfig, {optional: [{RtpDataChannels: true}]});
      negotiationPC.onnegotiationneeded = function() {
        onnegotiationneeded = true;
        // async check.
        if (util && util.supports) {
          util.supports.onnegotiationneeded = true;
        }
      };
      negotiationPC.createDataChannel('_PEERJSNEGOTIATIONTEST');

      setTimeout(function() {
        negotiationPC.close();
      }, 1000);
    }

    if (pc) {
      pc.close();
    }

    return {
      audioVideo: audioVideo,
      data: data,
      binaryBlob: binaryBlob,
      binary: sctp, // deprecated; sctp implies binary support.
      reliable: sctp, // deprecated; sctp implies reliable data.
      sctp: sctp,
      onnegotiationneeded: onnegotiationneeded
    };
  }()),
  //

  // Ensure alphanumeric ids
  validateId: function(id) {
    // Allow empty ids
    return !id || /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.exec(id);
  },

  validateKey: function(key) {
    // Allow empty keys
    return !key || /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.exec(key);
  },


  debug: false,

  inherits: function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  },
  extend: function(dest, source) {
    for(var key in source) {
      if(source.hasOwnProperty(key)) {
        dest[key] = source[key];
      }
    }
    return dest;
  },
  pack: BinaryPack.pack,
  unpack: BinaryPack.unpack,

  log: function () {
    if (util.debug) {
      var err = false;
      var copy = Array.prototype.slice.call(arguments);
      copy.unshift('PeerJS: ');
      for (var i = 0, l = copy.length; i < l; i++){
        if (copy[i] instanceof Error) {
          copy[i] = '(' + copy[i].name + ') ' + copy[i].message;
          err = true;
        }
      }
      err ? console.error.apply(console, copy) : console.log.apply(console, copy);
    }
  },

  setZeroTimeout: (function(global) {
    var timeouts = [];
    var messageName = 'zero-timeout-message';

    // Like setTimeout, but only takes a function argument.	 There's
    // no time argument (always zero) and no arguments (you have to
    // use a closure).
    function setZeroTimeoutPostMessage(fn) {
      timeouts.push(fn);
      global.postMessage(messageName, '*');
    }

    function handleMessage(event) {
      if (event.source == global && event.data == messageName) {
        if (event.stopPropagation) {
          event.stopPropagation();
        }
        if (timeouts.length) {
          timeouts.shift()();
        }
      }
    }
    if (global.addEventListener) {
      global.addEventListener('message', handleMessage, true);
    } else if (global.attachEvent) {
      global.attachEvent('onmessage', handleMessage);
    }
    return setZeroTimeoutPostMessage;
  }(window)),

  // Binary stuff

  // chunks a blob.
  chunk: function(bl) {
    var chunks = [];
    var size = bl.size;
    var start = index = 0;
    var total = Math.ceil(size / util.chunkedMTU);
    while (start < size) {
      var end = Math.min(size, start + util.chunkedMTU);
      var b = bl.slice(start, end);

      var chunk = {
        __peerData: dataCount,
        n: index,
        data: b,
        total: total
      };

      chunks.push(chunk);

      start = end;
      index += 1;
    }
    dataCount += 1;
    return chunks;
  },

  blobToArrayBuffer: function(blob, cb){
    var fr = new FileReader();
    fr.onload = function(evt) {
      cb(evt.target.result);
    };
    fr.readAsArrayBuffer(blob);
  },
  blobToBinaryString: function(blob, cb){
    var fr = new FileReader();
    fr.onload = function(evt) {
      cb(evt.target.result);
    };
    fr.readAsBinaryString(blob);
  },
  binaryStringToArrayBuffer: function(binary) {
    var byteArray = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      byteArray[i] = binary.charCodeAt(i) & 0xff;
    }
    return byteArray.buffer;
  },
  randomToken: function () {
    return Math.random().toString(36).substr(2);
  },
  //

  isSecure: function() {
    return location.protocol === 'https:';
  }
};

module.exports = util;

},{"./adapter":5,"js-binarypack":3}],12:[function(require,module,exports){
var util = require('./util');

/**
 * Reliable transfer for Chrome Canary DataChannel impl.
 * Author: @michellebu
 */
function Reliable(dc, debug) {
  if (!(this instanceof Reliable)) return new Reliable(dc);
  this._dc = dc;

  util.debug = debug;

  // Messages sent/received so far.
  // id: { ack: n, chunks: [...] }
  this._outgoing = {};
  // id: { ack: ['ack', id, n], chunks: [...] }
  this._incoming = {};
  this._received = {};

  // Window size.
  this._window = 1000;
  // MTU.
  this._mtu = 500;
  // Interval for setInterval. In ms.
  this._interval = 0;

  // Messages sent.
  this._count = 0;

  // Outgoing message queue.
  this._queue = [];

  this._setupDC();
};

// Send a message reliably.
Reliable.prototype.send = function(msg) {
  // Determine if chunking is necessary.
  var bl = util.pack(msg);
  if (bl.size < this._mtu) {
    this._handleSend(['no', bl]);
    return;
  }

  this._outgoing[this._count] = {
    ack: 0,
    chunks: this._chunk(bl)
  };

  if (util.debug) {
    this._outgoing[this._count].timer = new Date();
  }

  // Send prelim window.
  this._sendWindowedChunks(this._count);
  this._count += 1;
};

// Set up interval for processing queue.
Reliable.prototype._setupInterval = function() {
  // TODO: fail gracefully.

  var self = this;
  this._timeout = setInterval(function() {
    // FIXME: String stuff makes things terribly async.
    var msg = self._queue.shift();
    if (msg._multiple) {
      for (var i = 0, ii = msg.length; i < ii; i += 1) {
        self._intervalSend(msg[i]);
      }
    } else {
      self._intervalSend(msg);
    }
  }, this._interval);
};

Reliable.prototype._intervalSend = function(msg) {
  var self = this;
  msg = util.pack(msg);
  util.blobToBinaryString(msg, function(str) {
    self._dc.send(str);
  });
  if (self._queue.length === 0) {
    clearTimeout(self._timeout);
    self._timeout = null;
    //self._processAcks();
  }
};

// Go through ACKs to send missing pieces.
Reliable.prototype._processAcks = function() {
  for (var id in this._outgoing) {
    if (this._outgoing.hasOwnProperty(id)) {
      this._sendWindowedChunks(id);
    }
  }
};

// Handle sending a message.
// FIXME: Don't wait for interval time for all messages...
Reliable.prototype._handleSend = function(msg) {
  var push = true;
  for (var i = 0, ii = this._queue.length; i < ii; i += 1) {
    var item = this._queue[i];
    if (item === msg) {
      push = false;
    } else if (item._multiple && item.indexOf(msg) !== -1) {
      push = false;
    }
  }
  if (push) {
    this._queue.push(msg);
    if (!this._timeout) {
      this._setupInterval();
    }
  }
};

// Set up DataChannel handlers.
Reliable.prototype._setupDC = function() {
  // Handle various message types.
  var self = this;
  this._dc.onmessage = function(e) {
    var msg = e.data;
    var datatype = msg.constructor;
    // FIXME: msg is String until binary is supported.
    // Once that happens, this will have to be smarter.
    if (datatype === String) {
      var ab = util.binaryStringToArrayBuffer(msg);
      msg = util.unpack(ab);
      self._handleMessage(msg);
    }
  };
};

// Handles an incoming message.
Reliable.prototype._handleMessage = function(msg) {
  var id = msg[1];
  var idata = this._incoming[id];
  var odata = this._outgoing[id];
  var data;
  switch (msg[0]) {
    // No chunking was done.
    case 'no':
      var message = id;
      if (!!message) {
        this.onmessage(util.unpack(message));
      }
      break;
    // Reached the end of the message.
    case 'end':
      data = idata;

      // In case end comes first.
      this._received[id] = msg[2];

      if (!data) {
        break;
      }

      this._ack(id);
      break;
    case 'ack':
      data = odata;
      if (!!data) {
        var ack = msg[2];
        // Take the larger ACK, for out of order messages.
        data.ack = Math.max(ack, data.ack);

        // Clean up when all chunks are ACKed.
        if (data.ack >= data.chunks.length) {
          util.log('Time: ', new Date() - data.timer);
          delete this._outgoing[id];
        } else {
          this._processAcks();
        }
      }
      // If !data, just ignore.
      break;
    // Received a chunk of data.
    case 'chunk':
      // Create a new entry if none exists.
      data = idata;
      if (!data) {
        var end = this._received[id];
        if (end === true) {
          break;
        }
        data = {
          ack: ['ack', id, 0],
          chunks: []
        };
        this._incoming[id] = data;
      }

      var n = msg[2];
      var chunk = msg[3];
      data.chunks[n] = new Uint8Array(chunk);

      // If we get the chunk we're looking for, ACK for next missing.
      // Otherwise, ACK the same N again.
      if (n === data.ack[2]) {
        this._calculateNextAck(id);
      }
      this._ack(id);
      break;
    default:
      // Shouldn't happen, but would make sense for message to just go
      // through as is.
      this._handleSend(msg);
      break;
  }
};

// Chunks BL into smaller messages.
Reliable.prototype._chunk = function(bl) {
  var chunks = [];
  var size = bl.size;
  var start = 0;
  while (start < size) {
    var end = Math.min(size, start + this._mtu);
    var b = bl.slice(start, end);
    var chunk = {
      payload: b
    }
    chunks.push(chunk);
    start = end;
  }
  util.log('Created', chunks.length, 'chunks.');
  return chunks;
};

// Sends ACK N, expecting Nth blob chunk for message ID.
Reliable.prototype._ack = function(id) {
  var ack = this._incoming[id].ack;

  // if ack is the end value, then call _complete.
  if (this._received[id] === ack[2]) {
    this._complete(id);
    this._received[id] = true;
  }

  this._handleSend(ack);
};

// Calculates the next ACK number, given chunks.
Reliable.prototype._calculateNextAck = function(id) {
  var data = this._incoming[id];
  var chunks = data.chunks;
  for (var i = 0, ii = chunks.length; i < ii; i += 1) {
    // This chunk is missing!!! Better ACK for it.
    if (chunks[i] === undefined) {
      data.ack[2] = i;
      return;
    }
  }
  data.ack[2] = chunks.length;
};

// Sends the next window of chunks.
Reliable.prototype._sendWindowedChunks = function(id) {
  util.log('sendWindowedChunks for: ', id);
  var data = this._outgoing[id];
  var ch = data.chunks;
  var chunks = [];
  var limit = Math.min(data.ack + this._window, ch.length);
  for (var i = data.ack; i < limit; i += 1) {
    if (!ch[i].sent || i === data.ack) {
      ch[i].sent = true;
      chunks.push(['chunk', id, i, ch[i].payload]);
    }
  }
  if (data.ack + this._window >= ch.length) {
    chunks.push(['end', id, ch.length])
  }
  chunks._multiple = true;
  this._handleSend(chunks);
};

// Puts together a message from chunks.
Reliable.prototype._complete = function(id) {
  util.log('Completed called for', id);
  var self = this;
  var chunks = this._incoming[id].chunks;
  var bl = new Blob(chunks);
  util.blobToArrayBuffer(bl, function(ab) {
    self.onmessage(util.unpack(ab));
  });
  delete this._incoming[id];
};

// Ups bandwidth limit on SDP. Meant to be called during offer/answer.
Reliable.higherBandwidthSDP = function(sdp) {
  // AS stands for Application-Specific Maximum.
  // Bandwidth number is in kilobits / sec.
  // See RFC for more info: http://www.ietf.org/rfc/rfc2327.txt

  // Chrome 31+ doesn't want us munging the SDP, so we'll let them have their
  // way.
  var version = navigator.appVersion.match(/Chrome\/(.*?) /);
  if (version) {
    version = parseInt(version[1].split('.').shift());
    if (version < 31) {
      var parts = sdp.split('b=AS:30');
      var replace = 'b=AS:102400'; // 100 Mbps
      if (parts.length > 1) {
        return parts[0] + replace + parts[1];
      }
    }
  }

  return sdp;
};

// Overwritten, typically.
Reliable.prototype.onmessage = function(msg) {};

module.exports = Reliable;

},{"./util":13}],13:[function(require,module,exports){
var BinaryPack = require('js-binarypack');

var util = {
  debug: false,
  
  inherits: function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  },
  extend: function(dest, source) {
    for(var key in source) {
      if(source.hasOwnProperty(key)) {
        dest[key] = source[key];
      }
    }
    return dest;
  },
  pack: BinaryPack.pack,
  unpack: BinaryPack.unpack,
  
  log: function () {
    if (util.debug) {
      var copy = [];
      for (var i = 0; i < arguments.length; i++) {
        copy[i] = arguments[i];
      }
      copy.unshift('Reliable: ');
      console.log.apply(console, copy);
    }
  },

  setZeroTimeout: (function(global) {
    var timeouts = [];
    var messageName = 'zero-timeout-message';

    // Like setTimeout, but only takes a function argument.	 There's
    // no time argument (always zero) and no arguments (you have to
    // use a closure).
    function setZeroTimeoutPostMessage(fn) {
      timeouts.push(fn);
      global.postMessage(messageName, '*');
    }		

    function handleMessage(event) {
      if (event.source == global && event.data == messageName) {
        if (event.stopPropagation) {
          event.stopPropagation();
        }
        if (timeouts.length) {
          timeouts.shift()();
        }
      }
    }
    if (global.addEventListener) {
      global.addEventListener('message', handleMessage, true);
    } else if (global.attachEvent) {
      global.attachEvent('onmessage', handleMessage);
    }
    return setZeroTimeoutPostMessage;
  }(this)),
  
  blobToArrayBuffer: function(blob, cb){
    var fr = new FileReader();
    fr.onload = function(evt) {
      cb(evt.target.result);
    };
    fr.readAsArrayBuffer(blob);
  },
  blobToBinaryString: function(blob, cb){
    var fr = new FileReader();
    fr.onload = function(evt) {
      cb(evt.target.result);
    };
    fr.readAsBinaryString(blob);
  },
  binaryStringToArrayBuffer: function(binary) {
    var byteArray = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      byteArray[i] = binary.charCodeAt(i) & 0xff;
    }
    return byteArray.buffer;
  },
  randomToken: function () {
    return Math.random().toString(36).substr(2);
  }
};

module.exports = util;

},{"js-binarypack":3}]},{},[1]);
