* No API key needed
* Not a single line of code needed to log user in
* Server environment not Mandatory (except routing is needed)


Features: Auth, No-SQL DB, Real-time DB, Room, Payment, cron-job, indexing(so that content created with js can be crawled)

<h3>Hosting</h3>

```
<script src="http://source.upon.one"></script><script class="private">
one.deploy(uniqueAppName)
</script>

```

Save it and run it as an HTML file from anywhere and your app will be hosted on “yourAppName”.upon.one

This library is designed in a way to make server side rendering obselete

<h3>Database</h3> (service comes with already integrated DB )

Setting up DB (Chat app example)
 
notice values, required, default & unique (they do what they sound like)

```


	one.db['YourCollectionName'] = {

		schema:{
	  		chatHistory:Array,
	  		chatId:'unique',
	  		person1: {required:true,type:String, default:'$user.id'},
	  		person2:{required:true,type:String},
	  		notSeenBy:String
	 		},
	 	intermediates:{

		  update:{
		   $or:[ {$equal:['$user.id','$field.person1'] } , {$equal: ['$user.id','$field.person2'] } ]
		  },

		  read:{
		   $or:[ {$equal:['$user.id','$field.person1'] } , {$equal: ['$user.id','$field.person2'] } ]
		  }

		 }
		 
	}


// above code belongs to private script tag & above one.run


```
"Intermediates" will be processed every time a user tries to interact with the database (Update, Read or Write), the logic inside intermediate allows you to check permission and make additional query.


<h3> Understanding the logic </h3> 

In $field.person $field is a environment object containing all field which is to be updated our read

Here $equal is a baked in function which takes an array as a parameter

for example

`$equal:['$field.writer','$user.id']`

I call this logic Object Logic you can tinker with it inside objLogic.js

Built in function list

Equal, greaterThan, smallerThan, multiply, add, divide, substract, select, function, let, read, write, update

Querying DB supports the same syntax. one.query(logic) for example

```
//for reading
one.query({$read:{on:’messages’, where:{chatId:uniqueId} } },console.log)

//for writing
one.query({$write:{on:’messages’, put:{chatId:uniqueId, person2:'chaplin251'}}},console.log)

//for update
one.query({$update:{on:’messages’, where:{chatId:uniqueId}}},console.log)

//even code
one.query({$update:{on:’messages’, where:{chatId: {$add:[60,9]} }}},console.log)
```

Example project: <a href="https://github.com/itsarnavsingh/rubbit">Rubbit</a>

<h3> Live Database </h3> 

To listen for changes to the database you just say one.liveDb(query) 

query could be: {on:’messages’, where:{chatId:uniqueId} } 

so whenever chat ’messages’ collection updates. you can listen for them through 

```
let aYoungObject = one.liveDb(query) 
aYoungObject.on(‘data’, callback) 
```
you can also listen for error 
aYoungObject.on(‘error’, errorCallback) 


<h3> Room API </h3> 

Suppose you want to make an online multiplayer game. Player needs to update their location on the network fast, In this case, writing and reading from a database is very time expensive. The industry standard way of dealing with it, is web sockets, what happens is unlike conventional TCP, Websocket connection doesn’t close (thus the name socket) and it is bi-directional so data can flow in both direction and it's really fast

All chat systems rely on WebSockets.

let’s say you want to make a Battle Royal game. we will the idea of the room, it is a network in which everyone can send data to everyone when a room full a new room is created.

How to create a room

```
let myRoom = one.room(name,capacity)
```

The name could be anything, untill unless all members have it (by default capacity is 2)

To receive data

```
let myRoom = one.room(name,capacity)
myRoom.on('data',callaback)
```

similarly you can check for creation of room
```
myRoom.on('open',callaback)
```

set callback for when members join and leave
```
myRoom.on('join',callaback)

myRoom.on('leave',callaback)
```

How to send data to all other members

```
myRoom.broadcast('player position or anything')
```

How to change room

```
myRoom.change('the new rooms name')
```
There is a list of things we didn’t cover, please leave a note on what you are interested

    payment api + fees api
    prompt api
    cron job
    notification + like + follow apis
    Or a new feature? right?
   
   
<h3>CMS</h3> 
 By pressing Ctrl + Alt + A Admin pannel can be engaged, It provides CMS and Statistics Of all your apps
    
<h3>Best Practises</h3> 
	* Javascript should not affect HTML before deployment otherwise processed HTML will be deployed
	  one.onReady = callback provides this facility, Obsiously It must be declared outside backend script tag
	* Script tag containing DB schema and simmilar sensitive configation must be attributed with 'backend' class
	
<h3>Precautions</h3> 
* Never put one.run outside of a serverside class if file is being hosted otherwise when the hosted application will be run then file will keep on reloading source code but there is a precautionary measure implemented in the code. putting one.run outside of a script attributed with a serverside class is allowed if file is not being hosted like if you are developing a chrome extension where there is no need of hosting

<h3>FAQ</h3> 	
	* How is ownership decided?
	ANS: When making first deployment, the user id used is assigned as the owner
	
<h3>Side Tips</h3>
	* Always use breakpoint to inspect your code, It should be the first action to take even in cases where hit and trial method seems practical.

<h3>Email: arnav010singh@gmail.com </h3> 


<h3>Setting up repo in local environment</h3>

* Create .env file (by default windows saves .env as env.txt you have to choose no extension in extension list)
* Go to c:\windows\system32\drivers\etc\hosts change localhost to localhost.com because shared cookies can't be set on domanins without extension, line starting with # are comments, add the line: 

```
127.0.0.1    localhost.com

127.0.0.1    subdomainYouWantToWorkOn.localhost.com 
````

everytime you have to test a new subdomain locally you will have to add that subdomain to the host file as windows host file does not supports wildcard subdomain

#development

nodemon offers inspect but it is not able to exclude node js internal parts

Instead, use node js debug, for that launch.json is setup. this way you can add breakpoint from within vscode. click on setup configuration in the debug tab in vscode.

from now on vscode will handle starting the server and debuging. It is better than nodemon --inspect
but it has a problem server won't restart on making changes to the server
for that add following config to launch.json inside .vscode folder

{
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Launch Program",
            "skipFiles": [
                "<node_internals>/**"
            ],
            "program": "${workspaceFolder}\\index.js",
            "runtimeExecutable": "nodemon",
            "restart": true,
            "console": "integratedTerminal",
            "internalConsoleOptions": "neverOpen"
        }
    ]
}

but note, for this you need nodemon installed globally for this to work

note you will have to read error in terminal, dubug console is secondary

you can't run child process with fork while with nodemon that was the reason behind
switching to vscode debugger



#Indexing

Wildcard Indexes are the new cool feature in MongoDB, which allows you to index
unpredictable data, https://www.youtube.com/watch?v=mUWZPdHopYs
