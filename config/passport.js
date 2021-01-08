const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
let oracledb=require('oracledb');
let db2 = require('../database/config').getDb;
let USER_EMAIL;
let USER_PASSWORD;

// Load User model
//const User = require('../models/User');

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      // Match user
      // User.findOne({
      //   email: email
      // })
    console.log(email)
    const user_email=email.toLowerCase();
    console.log(user_email)
    const connection=db2();
    connection.query(`select * from LOGIN where EMAIL=:b`,{ b: user_email },
    {
      type:oracledb.STRING
    })
      .then(result => {
       console.log(result);
       
        if (result.lenght<0) {
          return done(null, false, { message: 'That email is not registered' });
        }

        // Match password
        bcrypt.compare(password,result[0]['PASSWORD'], (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            return done(null, result);
          } else {
            return done(null, false, { message: 'Password incorrect' });
          }
        });
      });
    })
  );

  passport.serializeUser(function(result, done) {
    console.log("serial")
    console.log(result);
    done(null, result[0]['ID']);
    
  });

  passport.deserializeUser(function(id, done) {
    const connection=db2();
    connection.query(`select NAME from LOGIN where ID=:b`,{ b: id },
    {
      type:oracledb.STRING
    })
      .then(result => {
    // User.findById(id, function(err, result) {
     done(null,result[0]['NAME']);
     console.log(result[0]['NAME'])
    // });
  },
  err=>{
    done(err,null);
  });

 });
};
