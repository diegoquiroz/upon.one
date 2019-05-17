let mongoose = require('mongoose')

mongoose.connect('mongodb+srv://itsarnav:00000000@cluster0-zijxk.mongodb.net/test?retryWrites=true', {useNewUrlParser: true})

let appSchema = new mongoose.Schema({
  name:{
    type: String,
    required: true,
    unique: true,
  },
  version: String,
  password: String,
  seed:String

})

let peerSchema = new mongoose.Schema({

    peerId:String,
    version: String,
    apps:{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'apps'
	},



})

module.exports = {
	apps: mongoose.model('apps', appSchema),
	peers: mongoose.model('peers', peerSchema)
}