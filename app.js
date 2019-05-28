

var express               = require("express");
var app = express();
var bodyparser           = require("body-parser");
 var mongoose             = require("mongoose");
 var passport             = require("passport");
 var cookieParser = require("cookie-parser");
 var passportlocal         = require("passport-local");
 var flash                = require("connect-flash");
var Campground           = require("./require/campgrounds");
var Comment              = require("./require/comments");
 var User                 = require("./require/user");
var session        = require("express-session");
var seed                 = require("./seed");
var methodOverride       = require("method-override");
var passportlocalmongoose = require("passport-local-mongoose");
var async = require("async");
var nodemailer  = require("nodemailer");
var crypto = require("crypto");
require("dotenv").config();
 //seed();
 //mongoose.connect("mongodb://localhost:27017/campground", { useNewUrlParser: true });
 mongoose.connect("mongodb+srv://rohithsingh:geethasingh@10@cluster0-vciis.mongodb.net/test?retryWrites=true",{useNewUrlParser: true} );
 //mongoose.connect("mongodb+srv://rohithsingh:geethasingh@10@cluster0-vciis.gcp.mongodb.net/test?retryWrites=true", { useNewUrlParser: true });
 app.use(bodyparser.urlencoded({extended:true}));
 app.set("view engine","ejs");
  app.use(express.static("public"));
  app.use(methodOverride("_method"));
app.use(cookieParser('secret'));
 app.locals.moment = require('moment');
    app.use(require("express-session")({
      secret : "rusty is a dog!!!!!!",
      resave : false,
       saveUninitialized : false
}));

   //==================================================
   //               Use of Flash
   //==================================================
   app.use(flash());

   //===============================================================
   // use of moment js
  //================================================================
   

 //=================================================
 //             passport authorization
 //=================================================
 
app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportlocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//==================================================
//       TO use PUT and DELETE Route
//=================================================

//=================================================
//      middle Ware to access users in any routes
//=================================================
app.use(function(req,res,next){
    
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
     
    next();
});



//======================================================================================================================================================
//                                                            Campground routes
//======================================================================================================================================================
 app.get("/",function(req,res){
	res.render("landing");
});
//==================================================
//             Index route displays all campgrounds
//==================================================
app.get("/campgrounds", function(req,res){
          Campground.find({},function(err,allCampgrounds){
                 if(err){
                  req.flash("error","Something Went Wrong!!");
                 	res.redirect("/campgrounds");
               
                 }else{
                         res.render("campgrounds/index",{campgrounds:allCampgrounds});
                 }
          });
});

//======================================================
//      New route displays a form to Add Campgrounds
//======================================================

app.get("/campgrounds/new",IsLoggedIn1, function(req,res){
      res.render("campgrounds/new");
});
//====================================================================================
//     Post route Creates a new Campgronds add to database and redirects to index Route
//=====================================================================================
app.post("/campgrounds", IsLoggedIn ,function(req,res){
	var name = req.body.name;
	var image = req.body.image;
  var price = req.body.price;
	var desc = req.body.description;
  var author = {
    id :  req.user._id,
    username : req.user.username
  }
  var newCampground = {name: name, image: image,price: price ,description: desc,author : author};
	Campground.create(newCampground,function(err,newlycreatedcampground){
               if(err){
               	req.flash("error","Something Went Wrong!!");
                  res.redirect("/campgrounds");
               }
               else{
                  req.flash("success","Congralutations You created a new Campground!!");
                     res.redirect("/campgrounds");
               }
	});
	}
);

//==============================================================
// Show route displays a complete details of each campground
//===============================================================
app.get("/campgrounds/:id",function(req,res){
	var id = req.params.id;
        Campground.findById(id).populate("comments").exec(function(err,campgroundid){
              if(err){
              	req.flash("error","Something Went Wrong!!");
                  res.redirect("/campgrounds");
              }
              else{
              	res.render("campgrounds/show",{campground:campgroundid});
              }
        });
});

//===============================================================================================
// Edit route displays a form to edit the campgrrounds and send the updated data to PUT Route
//===============================================================================================

app.get("/campgrounds/:id/edit",  IsLoggedIn ,function(req,res){
  var id1 = req.params.id;
  Campground.findById(id1,function(err,campgroundfound){
         if(err){
         req.flash("error","Campground not found!!");
                  res.redirect("/campgrounds/"+id1+"/edit");
         }
         else{
          if(campgroundfound.author.id.equals(req.user._id)){

            res.render("campgrounds/edit",{campground:campgroundfound});
          }
          else{
            res.redirect("/campgrounds/"+ id1);
          }
         }
  });     
});

//====================================================================================================
// PUT route Accepts the Updated data from Edit Route , saves in database and Redirects to show Route
//====================================================================================================

app.put("/campgrounds/:id",  IsLoggedIn ,function(req,res){
     var id1 = req.params.id;
     var name = req.body.name;
     var image = req.body.image;
     var price = req.body.price;
     var desc = req.body.description;
     var newCampground = {name:name, image:image,price:price, description:desc};
     Campground.findByIdAndUpdate(id1,newCampground,function(err,updated){
            if(err){
              req.flash("error","Something Went Wrong!!");
                  res.redirect("/campgrounds/"+id1);
            }
            else{
              if(updated.author.id.equals(req.user._id)){
                req.flash("success","Yaa Hooo You updated the Campground!!");
                 res.redirect("/campgrounds/"+id1);
              }
              else{
                res.redirect("/campgrounds/"+id1);
              }
            }
     });
});

//=================================================================================================
// Delete Route Deletes the campground from database and redirects to index page
//=================================================================================================

app.delete("/campgrounds/:id",IsLoggedIn,function(req,res){
        var id1 = req.params.id;
        Campground.findById(id1,function(err,campgroundfound){
          if(err){
            req.flash("error","Campground not found!!");
                  res.redirect("/campgrounds/"+id1);
          }
          else{
            if(campgroundfound.author.id.equals(req.user._id)){
                 Campground.findByIdAndRemove(id1,function(err,campgroundremoves){
                    if(err){
                     req.flash("error","Something Went Wrong!!");
                  res.redirect("/campgrounds/"+id1);
                    }
                    else{
                      req.flash("error","You Deleted The Campground");
                        res.redirect("/campgrounds");
                    }
               });
            }
            else{
              res.redirect("/campgrounds/"+id1);
            }
          }
        });   
});

//=======================================================================================================================================================
//                                                                    Comments Routes
//=======================================================================================================================================================

//=============================================================================
// New Route which displays a form to add comment to a particular campground
//=============================================================================
app.get("/campgrounds/:id/comments/new",function IsLoggedIn1(req,res,next){
                                        if(req.isAuthenticated()){
                                             Campground.findById(req.params.id,function(err,commentid){
                                                                                                if(err){
                                                                                                       req.flash("error","Something Went Wrong!!");
                                                                                res.redirect("/campgrounds/"+req.params.id);
                                                                                                       }
                                                                                                  else{
                   
                                                                                     res.render("comments/new",{campground : commentid});
                                                                                                        }
                                                                                                     });
                                                                         }
                                        else{
                                          req.flash("error","You need to be Logged in to do that!!");
                                           res.redirect("/campgrounds/"+req.params.id);
                                          }
                });
      
//==============================================================================================================
// Post Route which Accepts the data from Edit New route , creates a new comment to a particular campground
//==============================================================================================================
app.post("/campgrounds/:id/comments",IsLoggedIn,function(req,res)
{
   var id1 = req.params.id;
   var text = req.body.text;
   var comments = {text : text};
   Campground.findById(id1,function(err,campground)
   {
      if(err)
      {
         req.flash("error","Campground not found!!");
                  res.redirect("/campgrounds/"+id1);
      }
      else
      {
          Comment.create(comments,function(err,commentcreated)
          {
              if(err)
              {
                  req.flash("error","Something Went Wrong!!");
                  res.redirect("/campgrounds/"+id1);
              }
              else
              {    commentcreated.author.id = req.user._id;
                    commentcreated.author.username = req.user.username;
                     //commentcreated.author.username = author;
                    commentcreated.save(function(err,commentcreated){
                      if(err){
                        req.flash("error","Something Went Wrong!!");
                  res.redirect("/campgrounds/"+id1);
                      }
                      else
                      {
                           campground.comments.push(commentcreated);
                           campground.save(function(err,commentsaved)
                           {
                              if(err)
                               {
                                  req.flash("error","Something Went Wrong!!");
                                      res.redirect("/campgrounds/"+id1);
                                }
                                else
                                {
                                   res.redirect("/campgrounds/"+ id1);
                                 }
                           });
                      }  
                                              });
               }
          });
      }
    }); 
});

//====================================================================================
// Edit Route displays a form to edit a comment
//====================================================================================

app.get("/campgrounds/:id/comments/:comment_id/edit", IsLoggedIn,function(req,res){
          var commentid = req.params.comment_id;
          var id1 = req.params.id;
          Campground.findById(id1,function(err,campgroundfound){
                   if(err){
                    req.flash("error","Campground not found!!");
                  res.redirect("/campgrounds");
                   }
                   else{

                             Comment.findById(commentid,function(err,commentfound){
                                if(err){
                                        req.flash("error","Something Went Wrong!!");
                                              res.redirect("/campgrounds/"+id1);
                                         }
                                     else{
                                           if(commentfound.author.id.equals(req.user._id)){

                                              res.render("comments/edit",{comment:commentfound,campground:campgroundfound});
                                           }
                                           else{
                                            res.redirect("/campgrounds/"+id1);
                                           }
                                       }
                                     });
                        }
          });
         

});
//=============================================================================================================================
//   PUT route Accepts the comment-data from Edit Route, updates and save the comments in database and redirect to show route  
// ============================================================================================================================ 
app.put("/campgrounds/:id/comments/:comment_id", IsLoggedIn,function(req,res){
  var id1 = req.params.id;
      var text = req.body.text;
       var newComment = {text:text};
       Comment.findByIdAndUpdate(req.params.comment_id,newComment,function(err,commentupdated){
                      if(err){
                         res.redirect("/campgrounds/"+id1);
                      }
                      else{

                         res.redirect("/campgrounds/"+id1);
                      }
                         });                      
});
//===========================================================================================
// Delete Route Deletes the comment from database and redirects to show Route
//===========================================================================================
app.delete("/campgrounds/:id/comments/:comment_id", IsLoggedIn,function(req,res){
  var id1 = req.params.id;
         Comment.findById(req.params.comment_id,function(err,commentfound){
                if(err){
                 req.flash("error","Comment not found!!");
                  res.redirect("/campgrounds/"+id1);
                }
                else{
                  if(commentfound.author.id.equals(req.user._id)){
                    Comment.findByIdAndRemove(req.params.comment_id,function(err,commentupdated){
                      if(err){
                      
                         res.redirect("/campgrounds/"+id1);
                      }
                      else{
                        req.flash("error","You Deleted The Comment!!");
                         res.redirect("/campgrounds/"+id1);
                      }
                         });                      
                  }
                  else{
                    res.redirect("/campgrounds/"+id1);
                  }
                }
       });    
});
//============================================================================================================================================================
//                                                                      Authentication Routes
//============================================================================================================================================================

//==============================================================================
// Register Route which displays a form to create a new Username and Password
//==============================================================================
app.get("/register",function(req,res){
     res.render("register");
});

//==============================================================================
// POST Register Route which saves the details of new Username and Password
//==============================================================================
app.post("/register",function(req,res){
    var username = req.body.username;
    var password = req.body.password;
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var email = req.body.email;
    var newUser = new User({username : username,firstName : firstName,lastName : lastName,email : email});
    User.register(newUser,password,function(err,data){
            if(err){
              req.flash("error","User already Registered!!");
              res.redirect("/register");
            }
          
              passport.authenticate("local")(req,res, function(){
                req.flash("success","WelCome to YelpCamp "+data.username);
                res.redirect("/login");
              });
            
    });
});

//==================================================================================
// Login Route which displays a form to enter the Registered Username and Password
//===================================================================================
//show login form
app.get("/login", function(req, res){
   res.render("login"); 
});

// handling login logic
app.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login",
        failureFlash: true,
        successFlash: 'Welcome to YelpCamp!'
    }), function(req, res){
});


//===================================================================
// Logout Route which removes all login credentials from all Routes
//===================================================================
app.get("/logout",function(req,res){
       req.logout();
       req.flash("success","You logged out!!");
       res.redirect("/campgrounds");
});


app.get("/forgot",function(req,res){
     res.render("forgot");
});


app.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      console.log("req.body.email = " + req.body.email);
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        user.save(function(err){
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'rohithsinghthakur3@gmail.com',
          pass: process.env.GMAILPW
        }
        
      });
      console.log( "process.env.GMAILPW = " + process.env.GMAILPW);
      var mailOptions = {
        to: user.email,
        from: 'rohithsinghthakur3@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

app.get('/reset/:token', function(req, res) {
  console.log("req.params.token = "+req.params.token);
  User.find({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user){
   //console.log("resetPasswordExpires = "+resetPasswordExpires);
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

app.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      console.log("User == "+ User);
      User.find({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user){
        console.log("user = "+ user.setPassword);
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.password = req.body.password;
         // user.resetPasswordToken = undefined;
           // user.resetPasswordExpires = undefined;
          // user.save(function(err,usersaved){
             //done(err, usersaved);
              /*req.logIn(user, function(err){
                done(err, user);
              });*/
           // });
           //user.setPassword()
          user.setPassword(req.body.password, function(err,passwordreset){
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

           user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          });
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'rohithsinghthakur3@gmail.com',
          pass: process.env.GMAILPW
        }
        
      });
      console.log("process.env.GMAILPW22 = "+ process.env.GMAILPW);
      var mailOptions = {
        to: user.email,
        from: 'rohithsinghthakur3@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/campgrounds');
  });
});


//====================================
// Middle-Ware which is responsible for all login credentials in all Routes
//=========================================================================== 
function IsLoggedIn(req,res,next){
         if(req.isAuthenticated()){
          return next();
         }
         else{
          req.flash("error","Please login first!!!");
          res.redirect("/login");
         }
};

function IsLoggedIn1(req,res,next){
         if(req.isAuthenticated()){
          return next();
         }
         else{
                req.flash("error","You need to be logged in to do that!");
                res.redirect("/campgrounds");
         }
         
};

//=======================================================
// starts the program 
//=======================================================
 app.listen(80,function(req,res){
        console.log("server started at port 80");
 });











































































 /*var friends = ["rohith","rajesh","mahesh","pramod","rushikesh"];
 app.get("/",function(req,res){
     res.render("home");
 });
 
 app.get("/friends",function(req,res){
       res.render("friends");
 });
 
 app.post("/addfriends",function(req,res){
    var newfriends = req.body.newfriend;
    console.log(newfriends);
    friends.push(newfriends);
    res.render("addfriends",{friends:friends});
 });*/