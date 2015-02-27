var express = require('express')
  , app = express() // Web framework to handle routing requests
  , cons = require('consolidate') // Templating library adapter for Express
  , MongoClient = require('mongodb').MongoClient // Driver for connecting to MongoDB
  , routes = require('./routes'); // Routes for our application

  //CSS & jQuery path setup
  var path = require('path');
  
  //Favicon
  //var favicon = require('serve-favicon');
  
MongoClient.connect('mongodb://localhost:27017/truckstop', function(err, db) {
    "use strict";
    if(err) throw err;

    // Register our templating engine
    app.engine('html', cons.swig);
    app.set('view engine', 'html');
    app.set('views', __dirname + '/views');
	
	//Favicon
	//app.use(favicon(__dirname + '/views/img/favicon.ico'));

    // Express middleware to populate 'req.cookies' so we can access cookies
    app.use(express.cookieParser());

    // Express middleware to populate 'req.body' so we can access POST variables
    app.use(express.bodyParser());
	
	//CSS & jQuery path setup
	app.use(express.static(path.join(__dirname, 'views')));
	
	
    // Application routes
    routes(app, db);

    app.listen(3000);
    console.log('Express server listening on port 3000');
});