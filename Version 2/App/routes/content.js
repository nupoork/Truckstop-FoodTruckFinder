var sanitize = require('validator').sanitize; // Helper to sanitize form input
var UsersDAO = require('../users').UsersDAO;
var distance = require('google-distance-matrix');

/* The ContentHandler must be constructed with a connected db */
function ContentHandler (db) {
    "use strict";
    var users = new UsersDAO(db);

    this.displayMainPage = function(req, res, next) {
        "use strict";

		return res.render("FirstPage");
    }
	
	this.displayTruckSignupPage = function(req, res, next) {
        "use strict";
		if(req.cookies.session.length!=0)
		{
			return res.render('truckOwnerSignUp');
		}
		else
		{
			return res.redirect('/');
		}
    }
	
	this.displayTruckOwnerDashboardPage = function(req, res, next) {
        "use strict";
		if(req.cookies.session.length!=0)
		{
			users.getSubscriptions(req.username, function(err, subscriptions) {
			if (err) {
                    // this was a duplicate
                    if (err.code == '11000') {
                        errors['email_error'] = "This Email Address is already Signed Up!!";
                        return res.render("truckstop", errors);
                    }
                    // this was a different error
                    else {
                        return next(err);
                    }
                }
			users.findLocation(req.username, function(err, user) {
                    if (err) {
                        if (err.code == '11000') {
                            errors['email_error'] = "This Email Address is already Signed Up!!";
                            return res.render("truckstop", errors);
                        }

                        else {

                            return next(err);
                        }
                    }
                    console.log("Printing the user detials " + user.firstName + " " + user.latitude);
                    users.getTrucks(5,user.latitude, user.longitude, function(err, results) {
                        console.log("Printing results Array "+results);
                        return res.render("truckOwnerDashboard", {'latitude': user.latitude, 'longitude': user.longitude, 'locations':results, 'userSubscriptions' : subscriptions['subscription']})
                    });
                });
            });
		}
		else
		{
			return res.redirect('/');
		}
    }

	this.displaySearchPage = function(req, res, next) {
        "use strict";
		if(req.cookies.session.length!=0)
		{
			return res.render('truckOwnerDashboard');
		}
		else
		{
			return res.redirect('/');
		}
    }
	
	this.displayTruckOwnerSubscriptionPage = function(req, res, next) {
        "use strict";
		if(req.cookies.session.length!=0)
		{
			console.log("Hiiiiiiiiiiiiiiiiiiiiii")
		users.getSubscriptions(req.username, function(err, subscriptions) {
			if (err) {
                    // this was a duplicate
                    if (err.code == '11000') {
                        errors['email_error'] = "This Email Address is already Signed Up!!";
                        return res.render("truckstop", errors);
                    }
                    // this was a different error
                    else {
                        return next(err);
                    }
                }
				//var subscriptionLength = subscriptions.subscription.length;
				if(subscriptions.subscription == null)
				{
					return res.render('truckOwnerSubscriptions', {'noSubscription' : "You Dont have any subscriptions!! Add Now"});
				}
				else 
				{
                    if(subscriptions.subscription.length == 0)
                    {
                        return res.render('truckOwnerSubscriptions', {'noSubscription' : "You Dont have any subscriptions!! Add Now"});
                    }
                    else{
                        return res.render('truckOwnerSubscriptions', {'userSubscriptions' : subscriptions['subscription']});
                    }

				}
			});
			}
		else
		{
			return res.redirect('/');
		}
	}
	
	this.displayUserSubscriptionPage = function(req, res, next) {
        "use strict";
		if(req.cookies.session.length!=0)
		{
		users.getSubscriptions(req.username, function(err, subscriptions) {
			if (err) {
                    // this was a duplicate
                    if (err.code == '11000') {
                        errors['email_error'] = "This Email Address is already Signed Up!!";
                        return res.render("truckstop", errors);
                    }
                    // this was a different error
                    else {
                        return next(err);
                    }
                }
				//var subscriptionLength = subscriptions.subscription.length;
				if(subscriptions.subscription == null)
				{
					return res.render('userSubscriptions', {'noSubscription' : "You Dont have any subscriptions!! Add Now"});
				}
				else 
				{
                    if(subscriptions.subscription.length == 0)
                    {
                        return res.render('userSubscriptions', {'noSubscription' : "You Dont have any subscriptions!! Add Now"});
                    }
                    else{
                        return res.render('userSubscriptions', {'userSubscriptions' : subscriptions['subscription']});
                    }

				}
			});
			}
		else
		{
			return res.redirect('/');
		}
	}


   

	this.displayServeTodayPage = function(req, res, next) {
        "use strict";
		if(req.cookies.session.length!=0)
		{
				return res.render('truckOwnerServeToday',{'latitude': req.userLatitude, 'longitude': req.userLongitude});
		}
		else
		{
			return res.redirect('/');
		}
    }

    

    var us= db.collection('user');
    this.displayEditProfilePage = function(req, res, next) {
        "use strict";


         var userID= req.username;
          us.findOne({ '_id' : userID}, function(err, user) {
            "use strict"; 

        return res.render('userEditProfile',{'firstName': user.firstName, 'lastName': user.lastName, 'emailAddress' : user._id});
    });
    }


    //var users= db.collection('user');
    this.displayProfile = function(req, res, next) {
        "use strict";

         var userID= req.username;
          us.findOne({ '_id' : userID}, function(err, user) {
            "use strict";   

            console.log(user.Distance);
            return res.render('userProfile',{'firstName':user.firstName,'lastName': user.lastName,'EmailAddress': user._id,'WhatILike': user.whatilike,'Distance':user.Distance});

        });

    }

    this.showImage= function(req, res, next) {
        "use strict";
        users.getFoodTruckOwnerImage(req.username, function(err, resultImage) {
            console.log("hello");
            if(resultImage==null)
            {

                users.getFoodTruckOwnerImage("admin@admin.com", function(err, noImage){
                    res.end(noImage.image.buffer);
                
            });
            }
            else
            {
            res.end(resultImage.image.buffer, "binary");
            }
        });
    }


    

    this.displayUserDashboardPage = function(req, res, next) {
        "use strict";
        console.log("In user dash")
		if(req.cookies.session.length!=0)
		{
            console.log("In user dash if")

        users.findLocation(req.username, function(err, user) {
            if (err) {
                if (err.code == '11000') {
                    errors['email_error'] = "This Email Address is already Signed Up!!";
                    return res.render("truckstop", errors);
                }

                else {


                    return next(err);
                }
            }
            console.log("In user dash above get trucks")
            users.getTrucks(5,user.latitude, user.longitude, function(err, results) {
                console.log("Printing results Array "+results);
                users.findResults(req.username, function(err, userRecommendations) {
               "use strict";
               var whatILike = user.whatilike;
               var likes = whatILike.split(" ");
               var result= [];
               var count = 0;
               var finalArray = [];
               users.findAllTrucks(function(err, trucks){
                   console.log("1");
                       trucks.forEach(function(doc){
                           
                       //if(doc['truckOwner'] == "Yes")
                           var cuisine = doc['whatyouserve'];
                       //console.log(cuisine);
                       var isTruckAdded = false;
                       likes.forEach(function (word){
                           if(cuisine.indexOf(word) >= 0 && isTruckAdded == false){
                               finalArray.push(doc['food_truck_name']);
                               console.log(doc['foodtruck_name']);
                               //console.log(doc);
                               isTruckAdded = true;
                           }
                       count++;
               if(count == (trucks.length * likes.length))
               {   
                    console.log(finalArray);
				return res.render("userDashboard", {'latitude': user.latitude, 'longitude': user.longitude, 'locations':results, 'userSubscriptions':user.subscription, 'finalArray' : finalArray})
				}
           });
       });
                   });
           });
		});
       });
	}
		else
		{
			return res.redirect('/');
		}
    }
	
	this.displayFoodtruck = function(req, res, next){
	"use strict";
		if(req.cookies.session.length!=0)
		{
		users.getFoodTruckInfo(req.params.foodTruckName, function (err, foodTruckInfo) {
			if (err) {
					if (err.code == '11000') {
						errors['email_error'] = "This Email Address is already Signed Up!!";
						return res.render("truckstop", errors);
					}
					else {
						return next(err);
					}
				}
					var foodTruckOwnerName = foodTruckInfo['firstName'] + " " + foodTruckInfo['lastName']
					console.log("Printing users locatitude and longitude " + req.userLatitude + " " + req.userLongitude);
				console.log("Display Food Truck "+foodTruckInfo['_id']);
					return res.render('foodTruck', {'foodTruckName' : foodTruckInfo['food_truck_name'], 'foodTruckOwner': foodTruckOwnerName, 'aboutMe': foodTruckInfo['about_me'], 'cuisine': foodTruckInfo['whatyouserve'], 'operatingHours': foodTruckInfo['operating_hours'], 'foodTruckUserID': foodTruckInfo['_id'], 'userLatitude' : req.userLatitude, 'userLongitude' : req.userLongitude, 'truckLatitude' : foodTruckInfo['latitude'] , 'truckLongitude' : foodTruckInfo['longitude']});
			});
		}
		else
		{
			return res.redirect('/');
		}
	}
	
	this.displayImage = function(req, res, next){
		users.getFoodTruckOwnerImage(req.params.userID, function(err, resultImage) {
			res.end(resultImage.image.buffer, "binary");
		});
	}
	
	this.displayTruckOwnerProfile = function(req, res, next) {
		var userID= req.username;
         us.findOne({ '_id' : userID}, function(err, user) {
           "use strict";   

           //console.log(user.Distance);
           return res.render('truckOwnerProfile',{'firstName':user.firstName,'lastName': user.lastName,'EmailAddress': user._id,'WhatILike': user.whatilike,'WhatYouServe': user.whatyouserve, 'OperatingHours' : user.operating_hours, 'AboutMe': user.about_me, 'FoodTruckName': user.food_truck_name, 'licenseNumber':user.license_number});

       });
	}
	
	this.displaytruckOwnerProfilePage = function(req, res, next) {
       "use strict";
	   
        var userID= req.username;
         us.findOne({ '_id' : userID}, function(err, user) {
           "use strict"; 

       return res.render('truckOwnerEditProfile',{'firstName': user.firstName, 'lastName': user.lastName, 'EmailAddress' : user._id, 'licenseNumber': user.license_number});
   });
   }
	
	this.displayRedirection = function(req, res, next) {
		"use strict";
		var userID = req.username;
		var foodTruckName = req.body.foodTruckName;
		console.log("hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii" + foodTruckName);
		users.addTruckSubscription(userID, foodTruckName, function(err, user){
				us.findOne({ '_id' : userID}, function(err, user) {
					var isItTruckUser = user['truckOwner'];
					console.log("FoooooooodTruckkkkkk "+isItTruckUser);
					if(isItTruckUser == "Yes")
					{
						return res.redirect('/truckOwnerDashboard');
					}
					else
					{
						return res.redirect('/userDashboard');
					}
				});
					});
				}
	
	this.displayHomeScreen = function(req, res, next) {
		var userID = req.username;
		us.findOne({ '_id' : userID}, function(err, user) {
					var isItTruckUser = user['truckOwner'];
					console.log("FoooooooodTruckkkkkk "+isItTruckUser);
					if(isItTruckUser == "Yes")
					{
						return res.redirect('/truckOwnerDashboard');
					}
					else
					{
						return res.redirect('/userDashboard');
					}
				});
	}
}

module.exports = ContentHandler;