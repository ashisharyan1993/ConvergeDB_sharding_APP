/**
 * Create express object.
 */
var express = require('express');
/**
 * Session object declear
 */
var session = require('express-session');
/**
 * Cookie object declear
 */
var cookieParser = require('cookie-parser');
/**
 * Create app object & assign express object.
 */
const expressLayouts = require('express-ejs-layouts');
const passport = require('passport');
const flash = require('connect-flash');

var cookieParser = require('cookie-parser');
var osm = require('osm');
const Dbconnect=require('./database/config').Dbconnect;
const getDb=require('./database/config').getDb;
const Dbconnect2=require('./database/configSpatial').Dbconnect2;
const getDb2=require('./database/configSpatial').getDb2;
const Dbconnect3=require('./database/analytics').Dbconnect3;
const getDb3=require('./database/analytics').getDb3;
var app = express();
/**
 * Create reload object.
 */
var reload = require('reload');

// Passport Config
require('./config/passport')(passport);

/**
 * For set port or default 7000 posr.
 */

/**
 * Set view engine & point a view folder.
 */
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', 'views');
app.engine('html', require('ejs').renderFile);



// Express body parser
app.use(express.urlencoded({ extended: true }));
/**
 * Register cookie
 */
app.use(cookieParser());
/**
 * Register session with secret key
 */

/**
 * Add & register body parser
 */
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
/**
 * Set site title.
 */
app.locals.siteTitle = 'Ecommerce';
/**
 * set public folder is static to use any where.
 * Public folder contents js, css, images
 */
app.use(express.static('public'));
/**
 * Add routes.
 */
//app.use(require('./routers/pages'));


Dbconnect().then(res=>{
  console.log(res);
  Dbconnect2().then(res=>{
    console.log(res);
    Dbconnect3().then(res=>{
      console.log(res);
    var server=app.listen(3000,()=>{
      console.log('working')
  })
 })
})
})
 .catch(err=>console.log(err))

 // Express body parser
app.use(express.urlencoded({ extended: true }));

//Express session
app.use(
  session({
    key: 'user_id',
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);

// app.use(session({
//   key: 'user_id',
//   secret: 'krehcerghgqawjh',
//   resave: false,
//   saveUninitialized: false,
//   //rolling:true,
//   cookie: {
//       domain:'localhost',
//       path:'/',
//       httpOnly:true,
//       secure:false,
//       //maxAge: 300*1000
//   }}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', require('./routers/pages.js'));
app.use('/users', require('./routers/users.js'));



const PORT = process.env.PORT || 4000;

app.listen(PORT, console.log(`Server started on port ${PORT}`));

/**
 * Auto reload server.
 */
// reload(server, app);