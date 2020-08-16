let mongoConfig = require('./mongo_config.js')
let mainMongooseInstance = mongoConfig.mainMongooseInstance
let mongoose = mongoConfig.mongoose

// mongoose.set('debug', true);//decativated

let apps = new mongoose.Schema({
  name:{
    type: String,
    required: true,
    unique: true,
  },
  hash:String,
  description:String,
  owner:String,
  about:String,
  meta:String,
  source:String,
  fees:String,
  loginBeforeEntry:{
    type:Boolean,
    default:true,
  },
  routes:Object,
  searchable:{
        type: Boolean,
        default: true},
  tags:[String]
})

apps.index({name: 1});
apps.index({name: 'text', about: 'text',tags:'text'});
//we dont need to store the location of icon or manifest.json or apple touch icon cause there location are permanent

//set default value for search

let users = new mongoose.Schema({
  username:{
    type: String,
    required: true,
    unique: true,
  },
  password: String,
  email:{
    type: String,
    required: true,
    unique: true,
  },
  googleId:String,
  googleAuthToken:String,
  profile:String,
  name:String,
  verified:Boolean,
  verificationCode:String,
  phone: String,
  birthday:{type: Date, required: true, default: Date.now },
  gender:String,
  about:String,
  tags:[String]
})
users.index({username: 1});
users.index({name: 'text', about: 'text',tags:'text',username:'text'});



//data.$** is not supported for search index
//there are two kinds of searches $text search and search inside aggregation
//$search be aggregation is really powerful as it is powered by mongoDB 4.2 full text search released in 2019
//It is the fourth tab in atlas
///read doc here: https://docs.atlas.mongodb.com/atlas-search/



let law = new mongoose.Schema({
  app:{
      type: String,
      required: true,
      unique: true,
    },
  DBs:String,
  bucket:String,
  preCode:String,
  daily:String,
  weekly:String,
  quaterly:String,
  yearly:String,
  monthly:String,
  backendFunctions:String,
  dbLink:String,
})

//fields are string because mongoose can't allow putting dollar sign

//cron job
let tasks = new mongoose.Schema({
  app:{
      type: String,
      required: true,
      unique: true,
    },
  query:String,
  when:String,//daily,weekly,monthly,quaterly
})




let logs = new mongoose.Schema({
  app:{
      type: String,
      required: true,
    },
  log:Object,
  createdAt:{ type: Date, required: true, default: Date.now },
})


//to do: delete scrap, files, action

module.exports = {
	apps: mainMongooseInstance.model('apps', apps),
  users: mainMongooseInstance.model('user',users),
  law: mainMongooseInstance.model('law',law),
  tasks: mainMongooseInstance.model('tasks',tasks),
  logs: mainMongooseInstance.model('logs',logs),
  mainMongooseInstance: mainMongooseInstance,
  mongoose:mongoose
}

