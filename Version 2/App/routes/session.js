var UsersDAO = require('../users').UsersDAO
  , SessionsDAO = require('../sessions').SessionsDAO;

/* The SessionHandler must be constructed with a connected db */
function SessionHandler (db) {
    "use strict";

    var users = new UsersDAO(db);
    var sessions = new SessionsDAO(db);

    this.isLoggedInMiddleware = function(req, res, next) {
       var session_id = req.cookies.session;
       sessions.getUsername(session_id, function(err, userInfo) {
           "use strict";

           if (!err && userInfo.username) {
               req.username = userInfo.username;
               req.userLatitude = userInfo.latitude;
               req.userLongitude = userInfo.longitude;
           }
           return next();
       });
   }

    this.displayLoginPage = function(req, res, next) {
        "use strict";
        return res.render("login", {emailID:"", passwd:"", login_error:"", username_error:""})
    }

	this.displayWelcome = function(req,res,next){ //Login function
	
	var firstName = req.body.firstName;
	var lastName = req.body.lastName;
	var emailAddress= req.body.emailAddress;
	var password = req.body.password;
	var radio = req.body.truckOwner;
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
	var currentLatitude = req.body.currentlatitude;
    var currentLongitude = req.body.currentlongitude;
    console.log(req.body);
	
	console.log(radio);
	var emailID = req.body.emailID;
	var passwd = req.body.passwd;
	
	if(firstName == null && lastName == null && emailAddress == null && password == null)
	{
		var username = req.body.emailID;
        var password = req.body.passwd;

        console.log("user submitted username: " + username + " pass: " + password);

        users.validateLogin(username, password, function(err, user) {
            "use strict";

            if (err) {
			
                if (err.no_such_user) {
                                     return res.render("FirstPage", {emailID:username, passwd:"", username_error:"No such user"}); //changed 'login' to 'FirstPage'
                }
                else if (err.invalid_password) {
                    return res.render("FirstPage", {emailID:username, passwd:"", login_error:"Invalid password"});
                }
                else {
                    // Some other kind of error
                    return next(err);
                }
            }
			
            sessions.startSession(user['_id'],currentLatitude, currentLongitude, function(err, session_id) {
                "use strict";

                if (err) return next(err);
                res.cookie('session', session_id);
				
				var isItTruckUser = user['truckOwner'];
				if(isItTruckUser == "Yes")
				{
					return res.redirect('/truckOwnerDashboard');
				}
				else
				{
					console.log("In DisplayWelcome Users current lat and longi are:"+ latitude +" "+ longitude );
                    users.updateCurrentLocationforUser(req.username, currentLatitude, currentLongitude, function (err, user) {
                        "use strict";

                        return res.redirect('/userDashboard');
                    });
				}
            });
        });

	}
	if(emailID == null && passwd == null)
	{
		var errors = {'email': emailAddress}
        if (validateSignup(firstName, lastName, emailAddress, password, radio, errors)) {
            users.addUser(firstName, lastName, emailAddress, password, radio, latitude, longitude, function(err, user) {
                "use strict";

                if (err) {
                    // this was a duplicate
                    if (err.code == '11000') {
                        errors['email_error'] = "This Email Address is already Signed Up!!";
                        return res.render("FirstPage", errors);
                    }
                    // this was a different error
                    else {
                        return next(err);
                    }
                }

                sessions.startSession(user['_id'], latitude, longitude, function(err, session_id) {
                    "use strict";

                    if (err) return next(err);

                    res.cookie('session', session_id);

                     if(radio=="No")
                        return res.redirect('/userEditProfile');
                    else  
						return res.redirect('/truckOwnerSignUp');
                });
            });
        }
        else {
            console.log("user did not validate");
            return res.render("FirstPage", errors);
        }
	}
	}
	
	
    this.displayLogoutPage = function(req, res, next) {
        "use strict";

        var session_id = req.cookies.session;
        sessions.endSession(session_id, function (err) {
            "use strict";
            // Even if the user wasn't logged in, redirect to home
            res.cookie('session', '');
            return res.redirect('/');
        });
    }

    function validateSignup(firstName, lastName, emailAddress, password, radio, errors) {
        "use strict";
		
		var FIRST_RE = /^[a-zA-Z_]{3,20}$/
        var LAST_RE = /^[a-zA-Z]{3,20}$/;
		var EMAIL_RE = /^[\S]+@[\S]+\.[\S]+$/;
        var PASS_RE = /^.{3,20}$/;
        

        errors['firstname_error'] = "";
		errors['lastname_error'] = "";
		errors['email_error'] = "";
        errors['password_error'] = "";
		errors['radio_error'] = "";
		
        
        if (!FIRST_RE.test(firstName)) {
            errors['firstname_error'] = "invalid first name. try just letters and numbers";
            return false;
        }
		
		if (!LAST_RE.test(lastName)) {
            errors['lastname_error'] = "invalid last name. try just letters and numbers";
            return false;
        }
		
		if (emailAddress != "") {
            if (!EMAIL_RE.test(emailAddress)) {
                errors['email_error'] = "invalid email address";
                return false;
            }
        }

        if (!PASS_RE.test(password)) {
            errors['password_error'] = "invalid password.";
            return false;
        }
		
		if(radio == null)
		{
			errors['radio_error'] = "Select Yes or No";
		}
				
        return true;
    }

    this.displayWelcomePage = function(req, res, next) {
        "use strict";

        if (!req.username) {
            console.log("welcome: can't identify user...redirecting to signup");
            return res.redirect("/truckstop");
        }

        return res.render("welcome", {'username':req.username})
    }
	
	this.displayTruckOwnerDashboard = function (req, res, next) {
	"use strict";
	var userID = req.username;
	var foodTruckName = req.body.FoodTruckName;
	var licenseNumber = req.body.LicenseNumber;
	var specialityCuisineYouServe= req.body.SpecialityCuisineYouServe;
	var SpecialityCuisineILike = req.body.SpecialityCuisineILike;
	var aboutMe = req.body.AboutMe;
	var profileImage = req.files.image;
	var currentLatitude = req.userLatitude;
    var currentLongitude = req.userLongitude;
	
	var operatingHours = " Weekday = " + req.body.WeekdayFromH + req.body.WeekdayFromM + " " +req.body.WeekdayFromAP + " To " + req.body.WeekdayToH + req.body.WeekdayToM + " " +req.body.WeekdayToAP + " Weekend = " + req.body.WeekendFromH + req.body.WeekendFromM + " " +req.body.WeekendFromAP + " To "+ req.body.WeekendToH + req.body.WeekendToM + " " +req.body.WeekendToAP ; 

	users.addTruckUserProfile(userID, foodTruckName, licenseNumber, specialityCuisineYouServe, SpecialityCuisineILike, operatingHours, aboutMe, profileImage, currentLatitude, currentLongitude, function(err, user) {
                "use strict";

                if (err) {
                    // this was a duplicate
                    if (err.code == '11000') {
                        errors['email_error'] = "This Email Address is already Signed Up!!";
                        return res.render("truckOwnerSignUp", errors);
                    }
                    // this was a different error
                    else {
                        return next(err);
                    }
                }

		return res.redirect("/truckOwnerDashboard");
		});
	}


    this.EditProfile = function (req, res, next) {
    "use strict";
    console.log("EditProfile");
      
        var userID=req.username;
        var WhatILike = req.body.WhatILike;
        var Distance = req.body.Distance;
        var profileImage = req.files.image;
        console.log(req);
    
        console.log(userID);
        users.EditProfile(userID, WhatILike, Distance,profileImage, function(err, user) {
                "use strict";

                if (err) {
                    // this was a duplicate
                    if (err.code == '11000') {
                        errors['email_error'] = "Error";
                        return res.render("truckstop", errors);
                    }
                    // this was a different error
                    else {
                        return next(err);
                    }
                }
              

        return res.redirect('/userProfile');
        });
    }
    
	
	this.truckOwnerEditProfile = function (req, res, next) {
    "use strict";
    console.log("truckOwnerEditProfile");
      
        var userID=req.username;
        var WhatILike = req.body.SpecialityCuisineILike;
		var foodTruckName = req.body.FoodTruckName;
		var whatiserve = req.body.SpecialityCuisineYouServe;
		var aboutMe = req.body.AboutMe;
		var operatingHours = "Weekday = " + req.body.WeekdayFromH + req.body.WeekdayFromM + " " +req.body.WeekdayFromAP + " To " + req.body.WeekdayToH + req.body.WeekdayToM + " " +req.body.WeekdayToAP + "Weekend = " + req.body.WeekendFromH + req.body.WeekendFromM + " " +req.body.WeekendFromAP + " To "+ req.body.WeekendToH + req.body.WeekendToM + " " +req.body.WeekendToAP ; 

        var profileImage = req.files.image;
        console.log(req);
    
        console.log(userID);
        users.truckOwnerEditProfile(userID, WhatILike, foodTruckName, whatiserve, aboutMe, operatingHours, profileImage, function(err, user) {
                "use strict";

                if (err) {
                    // this was a duplicate
                    if (err.code == '11000') {
                        errors['email_error'] = "Error";
                        return res.render("truckstop", errors);
                    }
                    // this was a different error
                    else {
                        return next(err);
                    }
                }
              

        return res.redirect('/truckOwnerProfile');
        });
    }

	this.showProfile = function (req, res, next) {
	"use strict";
		var id = "kunal"
		users.showProfile(id, function(err, user) {
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
				
			return res.render("index2", {'foodTruckName': user._id, 'licenseNumber': user.license_number, 'specialityCuisine': user.speciality_cuisine, 'operatingHours': user.operatin_hours, 'aboutMe': user.about_me})
	});
	}
	
	this.serveToday = function(req, res,next) {
	"use strict";
	console.log(req.cookies.session);
    users.getFoodTruckName(req.username, function(err, foodTruckName){
        users.addTodaysInformation(req.username, foodTruckName ,req.body.todaysMenu, req.body.todaysMenuTags, req.body.latitudeText, req.body.longitudeText, function (err, todaysInfo) {
            if (err) {
                // this was a duplicate
                if (err.code == '11000') {
                    errors['email_error'] = "This Email Address is already Signed Up!!";
                    return res.render("FirstPage", errors);





                }
                // this was a different error
                else {
                    return next(err);
                }
            }
            res.redirect('/truckOwnerDashboard');
        });
      });
	}
	
	this.displayUnsuscribePageForTruckOwner = function(req, res, next) {
	console.log(req.cookies.session);
	console.log("Hellooooooooo")
	users.unsubscribe( req.username, req.body.userSubscription, function (err, unsubscribed )
	{
		if (err) {
                    // this was a duplicate
                    if (err.code == '11000') {
                        errors['email_error'] = "This Email Address is already Signed Up!!";
                        return res.render("FirstPage", errors);
                    }
                    // this was a different error
                    else {
                        return next(err);
                    }
                }
		res.redirect('/truckOwnerDashboard');
		});
		}
	
	this.displayUnsuscribePageForUser = function(req, res, next) {
	console.log("HiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiHellooooooo"+req.body.userSubscription);
	users.unsubscribe( req.username, req.body.userSubscription, function (err, unsubscribed )
	{
		if (err) {
                    // this was a duplicate
                    if (err.code == '11000') {
                        errors['email_error'] = "This Email Address is already Signed Up!!";
                        return res.render("FirstPage", errors);
                    }
                    // this was a different error
                    else {
                        return next(err);
                    }
                }
		res.redirect('/userDashboard');
		});
	}
		
		this.searchTrucksForUser = function (req, res, next) {
        "use strict";
        console.log("Inside SearchTruckForUser");
        var userID = req.username;
        var searchString = req.body.searchbar;

        var words = searchString.split(" ");
        console.log("Printing words Array " + words)
        users.findLocation(userID,function(err,user){
            users.getTrucks(100,user.latitude,user.longitude, function(err,results){
                var count = 0;
                var finalArray = [];
                results.forEach(function (doc) {
                    console.log("Printing document inside results forEach loop " + doc)
                    var tagsString = doc.todaysTags;
                    console.log("Printing tagString inside results forEach loop " + tagsString);
                    var menuString = doc.todaysMenu;
                    console.log("Printing tagString inside results forEach loop " + menuString);
                    var isTruckAddedOnce = false;
                    words.forEach(function (keyword) {
                        if (tagsString.indexOf(keyword) > 0 && isTruckAddedOnce == false) {
                            finalArray.push(doc);
                            console.log("Printing document name that has been pushed into final Array " + doc.name);
                            isTruckAddedOnce = true;
                            console.log("Printing final Array inside for Each " + finalArray);
                        }
                        else if (menuString.indexOf(keyword) > 0 && isTruckAddedOnce == false) {
                            finalArray.push(doc);
                            isTruckAddedOnce = true;
                            console.log("Printing document name that has been pushed into final Array " + doc.name);
                            console.log("Printing final Array inside for Each " + finalArray);
                        }
                        count++;
                        console.log("Printing count " + count);
                        console.log("Printing count of words" + words.length);
                        console.log("Printing count of results" + results.length);
                        if (count == (words.length * results.length)) {
                            console.log("Printing  inside the count if loop final Array " + finalArray);
                            return res.render("userDashboard", {'latitude': user.latitude, 'longitude': user.longitude, 'locations':finalArray})
                        }
                    });
                });
            });
        });
    }
}
module.exports = SessionHandler;