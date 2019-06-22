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
  tags:[String]
})

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
  dbName:{ 
      type: String,
      required: true,
      unique: true,
    },
  app_name:String,
  v_1:String,
  v_2:String,
  v_3:String,
  v_4:String,
  v_5:String,

})
//it is the best decision to keep the hash and chache seprately
module.exports = {
	apps: mongoose.model('apps', appSchema),
	peers: mongoose.model('peers', peerSchema),
  chache: mongoose.model('chache', chacheSchema),
  hash: mongoose.model('hash', hashSchema),
  users: mongoose.model('user',userschema),
  vDb: mongoose.model('virtualDB',virtualDB)
}

