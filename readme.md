* No API key needed
* Not a single line of code needed to log user in
* Server environment not Mandatory (except routing is needed)


Features: Auth, No-SQL DB, Real-time DB, Room, Payment, cron-job, indexing(so that content created with js can be crawled)

<h3>Hosting</h3>

```
<script src="http://source.upon.one"></script><script class="private">
server.start(uniqueAppName)
</script>

```

Save it and run it as an HTML file from anywhere and your app will be hosted on “yourAppName”.upon.one

This library is designed in a way to make server side rendering obselete

<h3>Database</h3> (service comes with already integrated DB )

Setting up DB (Chat app example)
 
notice values, required, default & unique (they do what they sound like)

```


	server.db['YourCollectionName'] = {

				schema:{
			  		chatHistory:Array,
			  		chatId:'unique',
			  		person1: {required:true,type:String, default:'$user.id'},
			  		person2:{required:true,type:String},
			  		notSeenBy:String
			 		},
			 	permission:{

				  update:{
				   $or:[ {$equal:['$user.id','$field.person1'] } , {$equal: ['$user.id','$field.person2'] } ]
				  },

				  read:{
				   $or:[ {$equal:['$user.id','$field.person1'] } , {$equal: ['$user.id','$field.person2'] } ]
				  }

				 }
				 
			}


// above code belongs to private script tag & above server.start


```
Permissions will be processed every time a user tries to interact with the database (Update, Read or Write), This allows developers to query DB from client side without a serverside intermediate. 

<h3> Understanding the logic </h3> 

In $field.person $field is a environment object containing all field which is to be updated our read

Here $equal is a baked in function which takes an array as a parameter

for example

`$equal:['$field.writer','$user.id']`

I call this logic Object Logic you can tinker with it inside objLogic.js

Built in function list

Equal, greaterThan, smallerThan, multiply, add, divide, substract, select, function, let, read, write, update

Querying DB supports the same syntax. Server.api(logic) for example

```
//for reading
server.api({$read:{on:’messages’, where:{chatId:uniqueId} } },console.log)

//for writing
server.api({$write:{on:’messages’, put:{chatId:uniqueId, person2:'chaplin251'}}},console.log)

//for update
server.api({$update:{on:’messages’, where:{chatId:uniqueId}}},console.log)

//even code
server.api({$update:{on:’messages’, where:{chatId: {$add:[60,9]} }}},console.log)
```

Example project: <a href="https://github.com/itsarnavsingh/rubbit">Rubbit</a>

<h3> Live Database </h3> 

To listen for changes to the database you just say server.liveDb(query) 

query could be: {on:’messages’, where:{chatId:uniqueId} } 

so whenever chat ’messages’ collection updates. you can listen for them through 

```
let aYoungObject = server.liveDb(query) 
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
let myRoom = server.room(name,capacity)
```

The name could be anything, untill unless all members have it (by default capacity is 2)

To receive data

```
let myRoom = server.room(name,capacity)
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


</h3>     Email: arnav010singh@gmail.com </h3> 