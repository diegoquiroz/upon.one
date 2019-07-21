let mongoose = require('./mongo_config.js')

let appSchema = new mongoose.Schema({
  name:{
    type: String,
    required: true,
    unique: true,
  },
  version: String,
  password: String,
  seed:String,
  about:String,
  searchable:{
        type: Boolean,
        default: true},
  tags:[String]
})

//set default value for search

let userschema = new mongoose.Schema({
  userName:{
    type: String,
    required: true,
    unique: true,
  },
  password: String,
  email: String,
  phone: String,
  cookie:String,
  about:String,
  apps:[String]
})


appSchema.index({name: 'text', about: 'text',tags:'text'});


let peerSchema = new mongoose.Schema({

    peerId:{ 
      type: String,
      required: true,
      unique: true,
    },
    version: String,
    files: [String]

})

let chacheSchema = new mongoose.Schema({
  url:{ 
      type: String,
      required: true,
      unique: true,
    },
  data:String
})

//for speed they are seprate
let hashSchema = new mongoose.Schema({
  url:{ 
      type: String,
      required: true,
      unique: true,
    },
  data:String
})

let virtualDB = new mongoose.Schema({
  dbName:String,//db name appname+dbname
  writer:{
      type: String,
      required: true,
      unique: true,
  },
  unique:{
      type: String,
      required: true,
      unique: true,
  },
  N_0:Number,
  N_1:Number,
  N_2:Number,
  N_3:Number,
  N_4:Number,
  N_5:Number,
  S_0:String,
  S_1:String,
  S_2:String,
  S_3:String,
  S_4:String,
  S_5:String,
  A_0:[String],
  created_at:{type: Date, required: true, default: Date.now },
  updated_at:{type: Date, required: true, default: Date.now }
})


//only sender can delete the row
let action = new mongoose.Schema({
  appid:String,//db name appname+dbname
  sender:String,
  receiver:String,
  reference:String,
  message:String,
  type:String,//notification(addid,sender),like(addid,sender,receiver,reference),follow(appid,receiver,sender)
  created_at:{type: Date, required: true, default: Date.now },
})



let lawSchema = new mongoose.Schema({
  app:{
      type: String,
      required: true,
      unique: true,
    },
  DBs:String,
  cron:String

})



let tasks = new mongoose.Schema({
  app:{
      type: String,
      required: true,
      unique: true,
    },
  query:String,
  when:String,//daily,weekly,monthly,quaterly
})

// deleteOne, to unfollow

//it is the best decision to keep the hash and chache seprately
module.exports = {
	apps: mongoose.model('apps', appSchema),
	peers: mongoose.model('peers', peerSchema),
  chache: mongoose.model('chache', chacheSchema),
  hash: mongoose.model('hash', hashSchema),
  users: mongoose.model('user',userschema),
  vDb: mongoose.model('virtualDB',virtualDB),
  law: mongoose.model('law',lawSchema),
  tasks: mongoose.model('tasks',tasks),
  action: mongoose.model('action',action)
}

