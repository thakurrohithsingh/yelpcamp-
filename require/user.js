var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
mongoose.connect("mongodb+srv://rohithsingh:geethasingh@10@cluster0-vciis.mongodb.net/test?retryWrites=true",{useNewUrlParser: true} );
var UserSchema = new mongoose.Schema({
      username : {type : String, unique : true, required : true} ,
      password : String,
      firstName : String,
      lastName : String,
      email : {type : String, unique : true, required : true},
      resetPasswordToken : String,
      resetPasswordExpires : Date
});
UserSchema.plugin(passportLocalMongoose);
 var User = module.exports = mongoose.model('User', UserSchema);
//console.log(UserSchema.plugin(passportlocalmongoose));
//var User = mongoose.model("User",UserSchema);
//module.exports = User;