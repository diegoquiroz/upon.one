<p align="center">
    <img src='http://home.upon.one/favicon.png'>
</p>
<p align="center">UPON.ONE</p>

It is not an alternative to Firebase.  Firebase is an amazing tool, we all love it, it is feature rich and easy, but it does have a few shortcomings. upon.one is an effort to further simplify few of its offerings and correct some of its shortcomings such as schema validation <b> It is an alternative to API(s).</b>

# What problems can upon.one solve?
* Host without setting up a local server environment, it hosts your app by scraping its code and removing script tag with "dontHost" class
* Login users with only one line of code ```U.login()```
* Abstracts popular mongoose API to front-end with permission system that is very similar to Firebase.

# How to host?

```
<script  class='dontHost' src="http://source.upon.one"></script>
<script class='dontHost'>
	U.run(<App name>,options)
</script>
```
Step1: Include the above code in the HTML file after the body tag of the web app you want to host. <br>
Step2: Save the file, and open the HTML file, the server environment is not necessary for this initial step.<br>
Step3: After opening, you will be asked to create an account, or sign in. This Account will be used to ensure no one else, can change your app's source code<br>

Note: You will have to use login with upon.one in file://protocol, Google login will not work with file:// protocol, 

Step4: On successful login, a message shall appear saying "Deploying", once it disappears, open inspect by f12 (key). It shall provide you the link to your hosted App.<br>

## options

host: true | false //default is true

# How to host multiple files like sub-pages or App's logo?

```
<script  class='dontHost' src="http://source.upon.one"></script>
<script class='dontHost'>
	U.staticFiles = ['about.html','favicon.ico']
	U.run(<App name>,options)
</script>
```
Step1: Stepup a server environment, recommended: VS code's Live Server extension 
Step2: Add a line about U.run mentioning the files that need to be hosted
Step3: You will be asked an online link to your MongoDB database. We recommend MongoDB atlas offering as it provides a built-in dynamic search in 500mb free. We use MongoDB GridFS to store binary files, it divides the file into chunks and saves it into the DB, you provided
Step4: Create a cluster on Atlas
Step5: 

Note: After creating a db in Atlas go to "Network access" in the left panel, select "add IP Address" & then select "Access from Anywhere" 

# Login users.
```U.login()```

This is the only piece of code needed to log in users,  at this moment 2 options are provided login with Google and log in with Upon.one.

# How to check if a user has logged in?

```
U.readUser('username')
//returns a Promise

//if not logged in, null will be returned
```

# How to create a collection

```
  U.db['posts'] = {
	schema:<mongoose like schema>},
    updatable:<when can a user update a document of this collection>,
   	findable:<when can a user read from this collection>,
    writable:<when can a user write to this collection>,
    onWrite:<do something on successful write>,
    onUpdate:<do somehting on successful update>,
    onFind:<do something on successful find>
  }

```
Default values for findable, updatable & writable is false just like Firebase.
A javascript function is expected as input<br><br>

For example 
```
updatable:function(){ user.username == 'pinkyPony'? true : false }
//Now only pinkyPony can update the corresponding collection
```
upon.one applies toString() method on the given function and stores it, whenever a user tries to update this collection code is initialized into a virtual sandboxed environment where it is executed

user is a serverside variable, only available when a user is logged in
user variable has following fields: username, name & id 



| Serverside variables  | Description |
| --- | --- |
| `put` | Available in case of update and write|
| `field` | available in case of read and update, field is an object that refers to the object which is requested to be read or updated|
| `user` | Always available when user is logged in|

* Default attribute inside schema also supports, function
* You can specify updatable, findable & writable, attribute to specific fields as well, default values for them are true
* You will be asked link to MongoDB instance if not already provided

# How to compare a field of document
```
        function rule(){
            user.id == field.todoOf? true : false
        }
```

field is a serverside variable just like user, it contains all the fields of document which is supposed to be updated of read

# How to query Database?
It is also mongoose like
```
U.collection('collectionName').find(<where query>,<options>)
//returns a Promise
```
note: all collection methods return promise

| Methods | Description |
| --- | --- |
| `write(object)` | Adds document to collection|
| `find(object,options)` | Finds documents, options example: {sort:{fieldA:'descending'}, limit:10 } |
| `update(object,object)` | Similar to mongoose updateOne, updates the first document that matches where query |
| `delete(object)` | Deletes the first document that matches the object |
| `search(object, { fields:[fieldA,fieldB] } )` | Searches documents based on atlas-search, read more about it here: https://docs.atlas.mongodb.com/atlas-search/ ,you need to enable this feature from the search indexes tab in Atlas |

# How to implement a payment system or a Machine Learning integration

In this case, you will have to start a serverless instance with Amazon lamda or Google cloud functions, user data can be accessed by following code in a serverlesss environment

```
fetch(
    `<link to your app on upon.one>`,
    {
      method: 'POST',
      body: JSON.stringify({
        data:'$user',
        type:'db',
        cookie:req.cookie['user-cookie']
      })
    }
  )

```

Step1: Start a serverless instance with Google or Amazon
Step2: use the above code to identify user, it will return user data
```
{username:<>,name:<>,id:<>}

```

Step3: Setup account with payment provider
Step4: Setup mongoose

# How to host and run node.js code

```
U.cloudFunctions['functionName'] = (argument)=>{ //do something }
```

Step1: Add the above live before U.run
Step2: Host your app
Step3: to run the declared function execute the following code

```
 U.runCloudFunction('functionName',argument)
 //returns promise

```

Note: function executes like above will not need to go through fidable, readable & writable functions

Note: There is a problem with these cloud functions, you can't add break points. You can console.log, it
will appear in the Admin Panel which can be opened by using CTRL + SHIFT + A & you can't install NPM libraries.
It is intended for simple use cases. For complex use cases use of third party serverless platform like AWS Lamda or Google Cloud Functions 

# How to compress & upload images?

```
  U.bucket['profileImages'] = {
    updatable:true,
    findable:true,
    writable:true
  }

```
Step1: Add above code before U.run, it defines who can read, write and update content of bucket
Step2: Call ``` U.upload(file,bucketName) ``` example is below

```
    async upload(event){

      let file = event.target.files[0]
      let compressedFile = await U.compressImage(file,{maxSizeMB:0.5})
      let image = await U.upload(compressedFile,'profileImages',this.pageData.DPlink)
      await U.query({ $update: {on:'pages', where:{ title: this.title }, put:{DPlink:image.url} } })
      this.refresh()
      
    }

```

Understanding options U.compressImage(file,options)

```
options = {
      maxSizeMB: 0.5,             // (default: Number.POSITIVE_INFINITY)
      maxWidthOrHeight: number,   // compressedFile will scale down by ratio to a point that width or height is smaller than maxWidthOrHeight (default: undefined)
      useWebWorker: true,         // optional, use multi-thread web worker, fallback to run in main-thread (default: true)
      maxIteration: number,       // optional, max number of iteration to compress the image (default: 10)
      exifOrientation: number,    // optional, see https://stackoverflow.com/a/32490603/10395024
      onProgress: Function,       // optional, a function takes one progress argument (percentage from 0 to 100) 
      fileType: 'jpeg'            // optional, fileType override
    }

```

# Complete example of a To-Do App

```
    <script class="dontHost" src="http://source.upon.one"></script>
    <script class="dontHost">

        let defaulValue_commitmentOf = ()=>{return user.id}

        let todoSchema = {
            whatToDo: {type:String, required:true},
            commitmentOf:{default:defaulValue_commitmentOf, type:String }
        }

        function rule(){
            user.id == field.todoOf? true : false
        }

        U.db['toDo'] = {

            schema:todoSchema,
            writable:true,
            updatable:rule,
            findable:rule
        }

        U.run('notToDO')

    </script>
```

# Priciples behind the choices of UPON.ONE

* Firestore is schema-less, it makes firebase flexible but also introduces new problems, For creating a new Field you have to set up a cloud function. 
* Vendor Lock-in is not awesome, where your MongoDB instance lives is up to you.
* As app scales, expense increases and migration becomes more challenging. In the case of UPON.ONE all the data lives in MongoDB so you don't need to do any migration if at any time you decide to ditch us. upon.one is open source so if your app becomes too big you can just spin your instance of UPON.ONE
* We encourage using UPON.ONE with serverless services provided by Googel and Amazon, To find the identity of user use 