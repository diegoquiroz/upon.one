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
  merkle_tree:String

})

let peerSchema = new mongoose.Schema({

    peerId:{ 
      type: String,
      required: true,
      unique: true,
    },
    version: String,
    app:String

})

module.exports = {
	apps: mongoose.model('apps', appSchema),
	peers: mongoose.model('peers', peerSchema)
}