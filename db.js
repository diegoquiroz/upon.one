let mongoose = require('./mongo_config.js')

// mongoose.set('debug', true);//decativate

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
  fees:String,
  searchable:{
        type: Boolean,
        default: true},
  tags:[String],
  logs:[String],

})

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
  profile:String,
  name:String,
  verified:Boolean,
  verificationCode:String,
  phone: String,
  cookie:String,
  about:String,
  tags:[String]
})

users.index({name: 'text', about: 'text',tags:'text',username:'text'});

let scrap = new mongoose.Schema({
  url:{
    type: String,
    required: true,
    unique: true,
  },
  heading:String,
  text:String,
  html:String,
  head:String
})

scrap.index({heading: 'text', text: 'text'});



let stats = new mongoose.Schema({
  app:String,
  Totalhits:Number,
  dailyHits:String,
  launchDate:String,
  CurrentlyOnline:String,
  users:[String],
})

//meta data define if this was a fees, do price plus fees 
//u2u, u2a, u2uIndirect 
//how to do recurring payments

//how should we save fees data?

//to do unify appid and app
let transactions = new mongoose.Schema({
  sender:String,
  receiver:String,
  app:String,
  isFees:Boolean,
  orderID:{ //why it exist? because of paypal without it a user can ask to verify a order more than once
    type:String,
    unique:true,
    required:true
  },
  fees:Number,
  meta:String,
  amount:Number,
  sandboxed:Boolean,
  type:String,
  date:String,
  status:String,
  signed:Boolean
})

//to do conversion of string object to variable in main .js with backward compatality
let virtualDB = new mongoose.Schema({
  dbName:String,//db name appname+dbname
  registered_writer_field:{
      type: String,
      required: true,
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
  N_6:Number,
  N_7:Number,
  N_8:Number,
  N_9:Number,
  N_10:Number,
  S_0:String,
  S_1:String,
  S_2:String,
  S_3:String,
  S_4:String,
  S_5:String, 
  S_6:String,
  S_7:String,
  S_8:String,
  S_9:String,
  S_10:String,
  A_0:[String],
  A_1:[String],
  A_2:[String],
  A_3:[String],
  A_4:[String],
  A_5:[String],//why have array? because we can read it just like we read string
  created_at:{type: Date, required: true, default: Date.now },
  updated_at:{type: Date, required: true, default: Date.now }
})

virtualDB.index({"$**":"text"})

// virtualDB.index({S_0: 'text', S_1: 'text',S_2:'text',S_3: 'text', S_4: 'text',S_5:'text'});

// virtualDB.index({'$**': 'text'});

 // sender+contentid a sender can send only once and action action:user:contentid, for follow -> follow:user:following  for unique
//only sender can delete the row

let action = new mongoose.Schema({
  app:String,//db name appname+dbname
  actionId:{ 
      type: String,
      required: true,
      unique: true,
    },
  sender:String,
  receiver:String,
  reference:String,
  referenceDb:String,
  magnitude:Number,
  message:String,
  official:{type:Boolean, default:false}, //sent by app
  seen:{
    type:Boolean, 
    default:false},
  type:String,//notification(addid,sender),like(addid,sender,receiver,reference),follow(appid,receiver,sender)
  created_at:{type: Date, required: true, default: Date.now },
})



let law = new mongoose.Schema({
  app:{
      type: String,
      required: true,
      unique: true,
    },
  DBs:String,
  preCode:String,
  daily:String,
  weekly:String,
  quaterly:String,
  yearly:String,
  monthly:String
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

var files = new mongoose.Schema({
  data:Buffer,
  filetype:String,
  owner:{type:String, required:true},//make it a required variable
  app:String,
  path:String,
  size:Number,
  filename:{
      type: String,
      required: true,
      unique: true,
    },
  encoding:String//daily,weekly,monthly,quaterly
})

let appSource = new mongoose.Schema({
  url:{ 
      type: String,
      required: true,
      unique: true,
    },
  hash:String,
  data:String
})

module.exports = {
	apps: mongoose.model('apps', apps),
  appSource: mongoose.model('appSource', appSource),
  users: mongoose.model('user',users),
  scrap: mongoose.model('scrap',scrap),
  files: mongoose.model('files',files),
  vDb: mongoose.model('virtualDB',virtualDB),
  law: mongoose.model('law',law),
  tasks: mongoose.model('tasks',tasks),
  action: mongoose.model('action',action),
  transactions: mongoose.model('transactions',transactions)
}

