let mongoose = require('mongoose')

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

mongoose.connect('mongodb+srv://itsarnav:00000000@cluster0-zijxk.mongodb.net/test?retryWrites=true', {useNewUrlParser: true})

module.exports = mongoose