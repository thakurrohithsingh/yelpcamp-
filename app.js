var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    passport    = require("passport"),
    cookieParser = require("cookie-parser"),
    LocalStrategy = require("passport-local"),
    flash        = require("connect-flash"),
    session = require("express-session"),
    seedDB      = require("./seeds"),
    geocoder = require('geocoder');
    Campground  = require("./models/campground"),
    Comment     = require("./models/comment"),
    User        = require("./models/user"),
   passportlocalmongoose = require("passport-local-mongoose"),
    methodOverride = require("method-override"),
     async = require("async"),
     nodemailer = require("nodemailer"),
    crypto         = require("crypto")
// configure dotenv
//require('dotenv').load();
require('dotenv').config();

//mongoose.connect("mongodb+srv://rohithsingh:geethasingh@10@cluster0-vciis.mongodb.net/test?retryWrites=true",{useMongoClient: true} );
//mongoose.connect('mongodb://localhost:27017/advisorDemoTestDB', { useMongoClient: true });
 mongoose.connect("mongodb://localhost:27017/yelp_camp11", { useNewUrlParser: true });
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(methodOverride('_method'));
//app.use(cookieParser('secret'));
//require moment
app.locals.moment = require('moment');
// seedDB(); //seed the database

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next();
});



app.get("/",function(req,res){
  res.render("landing");
});

/*function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};*/

//INDEX - show all campgrounds
app.get("/campgrounds", function(req, res){
  /*if(req.query.search && req.xhr) {
      const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      // Get all campgrounds from DB
      Campground.find({name: regex}, function(err, allCampgrounds){
         if(err){
            console.log(err);
         } else {
            res.status(200).json(allCampgrounds);
         }
      });
  } else {*/
      // Get all campgrounds from DB
      Campground.find({}, function(err, allCampgrounds){
         if(err){
             console.log(err);
         } else {
                res.render("campgrounds/index",{campgrounds: allCampgrounds});
           /* if(req.xhr) {
              res.json(allCampgrounds);
            } else {
              res.render("campgrounds/index",{campgrounds: allCampgrounds, page: 'campgrounds'});
            }*/
         }
     });
 // } //
});

app.get("/campgrounds/new",  function(req, res){
   res.render("campgrounds/new"); 
});
//CREATE - add new campground to DB
app.post("/campgrounds", function(req, res){
  // get data from form and add to campgrounds array
  var name = req.body.name;
  var image = req.body.image;
  var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  var cost = req.body.cost;
    //var lat = data.results[0].geometry.location.lat;
    //var lng = data.results[0].geometry.location.lng;
    //var location = data.results[0].formatted_address;
    var newCampground = {name: name, image: image, description: desc, cost: cost, author:author};
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            res.redirect("/campgrounds");
        }
    });
});

// SHOW - shows more info about one campground
app.get("/campgrounds/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
          console.log(err);
        } else {
          //render show template with that campground
          //console.log(foundCampground);
          //console.log("============================================================");
          res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

app.get("/campgrounds/:id/edit", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            //render show template with that campground
            res.render("campgrounds/edit", {campground: foundCampground});
        }
    });
});

app.put("/campgrounds/:id", function(req, res){
    //var lat = data.results[0].geometry.location.lat;
    //var lng = data.results[0].geometry.location.lng;
    //var location = data.results[0].formatted_address;
    var newData = {name: req.body.name, image: req.body.image, description: req.body.description, cost: req.body.cost};
    Campground.findByIdAndUpdate(req.params.id, newData, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

app.delete("/campgrounds/:id", function(req, res) {
  Campground.findByIdAndRemove(req.params.id, function(err, campground) {
    if(err){
      res.redirect("/campgrounds/"+req.params.id);
    }
    else{
      res.redirect("/campgrounds");
    }
    /*Comment.remove({
      _id: {
        $in: campground.comments
      }
    }, function(err, comments) {
      req.flash('error', campground.name + ' deleted!');
      res.redirect('/campgrounds');
    })*/
  });
});




app.get("/campgrounds/:id/comments/new",  function(req, res){
    // find campground by id
    //console.log(req.params.id);
    Campground.findById(req.params.id, function(err, campground){
        if(err){
             req.flash("error","Something Went Wrong!!");
            res.redirect("/campgrounds/"+req.params.id);
        } else {
             res.render("comments/new", {campground: campground});
        }
    });
});


app.post("/campgrounds/:id/comments", function(req, res)
{
   var id1 = req.params.id;
   var text = req.body.text;
   var author = {
        id : req.user._id,
        username : req.user.username
   }
   var comments = {text : text,author : author};
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
                  req.flash("error","Something Went Wrong11!!");
                  res.redirect("/campgrounds/"+id1);
              }
              else
              {   //console.log(commentcreated);
                console.log("=================================================");
                 campground.comments.push(commentcreated);
                 //console.log(campground);
                 console.log("=========================================");
                  campground.save(function(err,commentsaved){
                              console.log(commentsaved);
                              if(err)
                               {
                                  req.flash("error","Something Went Wrong12!!");
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
});




//Comments Create

app.get("/campgrounds/:id/comments/:comment_id/edit", function(req,res){
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

app.put("/campgrounds/:id/comments/:commentid",function(req,res){
  var id1 = req.params.id;
      var text = req.body.text;
       var newComment = {text:text};
       Comment.findByIdAndUpdate(req.params.commentid,newComment,function(err,commentupdated){
                      if(err){
                         res.redirect("/campgrounds/"+id1);
                      }
                      else{

                         res.redirect("/campgrounds/"+id1);
                      }
                         });                     
});


app.delete("/campgrounds/:id/comments/:comment_id", function(req,res){
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


app.get("/register", function(req, res){
   res.render("register"); 
});

// handle sign up logic
app.post("/register", function(req, res){
    var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar
      });

    if(req.body.adminCode === 'secretcode123') {
      newUser.isAdmin = true;
    }

    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
           req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
           res.redirect("/campgrounds"); 
        });
    });
});

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

// logout route
app.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "See you later!");
   res.redirect("/campgrounds");
});

// forgot password
app.get('/forgot', function(req, res) {
  res.render('forgot');
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
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
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
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
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
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        console.log("user == "+ user.setPassword);
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
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
      var mailOptions = {
        to: user.email,
        from: 'learntocodeinfo@mail.com',
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

// USER PROFILE
app.get("/users/:id", function(req, res) {
  User.findById(req.params.id, function(err, foundUser) {
    if(err) {
      req.flash("error", "Something went wrong.");
      res.redirect("/");
    }
    Campground.find().where('author.id').equals(foundUser._id).exec(function(err, campgrounds) {
      if(err) {
        req.flash("error", "Something went wrong.");
        res.redirect("/");
      }
      res.render("users/show", {user: foundUser, campgrounds: campgrounds});
    })
  });
});





app.listen(80, function(){
   console.log("The YelpCamp Server Has Started! at 80!!");
});