var mongoose = require("mongoose");
var Campground = require("./require/campgrounds");
var Comment = require("./require/comments");
function seed()
{
   Campground.remove({},function(err,removed)
   {
      if(err)
      {
          console.log(err);
      }
      else
      {
          console.log("Campground removed");

       }
   });
}
         /* Campground.create
          ({
               name : "Summer camp",
               image : "data:image/jpeg;base64,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" ,
               description : "“It’s Stephen, actually,” said the world’s most controversial physicist in his crisp-yet-droll British accent. In another life, the creator of Wolfram Alpha would have made an excellent BBC Radio News announcer. “No one under the age of 50 calls me Steve,” he added.",

           },function(err,Campgroundcreated)
             {
                 if(err)
                 {
                     console.log(err);
                 }
                 else
                 {
                      console.log("Campground created");
                      Comment.create
                      ({
                           text : "this is a beautiful image",
                           author : "rohithsingh"
                       },function(err,commentcreated)
                         {
                             if(err)
                             {
                             	 console.log(err);
                             }
                             else
                             {
                             	Campgroundcreated.comments.push(commentcreated);
                             	Campgroundcreated.save(function(err,saved)
                             	{
                                     if(err)
                                     {
                                         console.log(err);
                                     }
                                     else
                                     {
                                         console.log("created");
                                       
                                      }
                             	});
                             }
                         });
                 }
             });
            }
});

}
 */

module.exports = seed;