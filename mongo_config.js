const mongoose = require('mongoose')

mongoose.set('runValidators', true);
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true)

//connect-vs-createconnection
//My understanding on the official documentation is that generally when there is only one connection mongoose.connect() is use, whereas if there is multiple instance of connection mongoose.createConnection() is used.


let mainMongooseInstance = mongoose.createConnection('mongodb+srv://itsarnav:Alliswell@010@cluster0-zijxk.mongodb.net/test?retryWrites=true',
 {
    useNewUrlParser: true ,
    useUnifiedTopology:true,
    poolSize: 10 // Can now run 10 operations at a time
})



 //tutorial to setup gfs,https://niralar.com/mongodb-gridfs-using-mongoose-on-nodejs/
 // gfs will be used for reading files






module.exports = {mainMongooseInstance:mainMongooseInstance,mongoose:mongoose}