const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
let oracledb=require('oracledb');


// Load User model
//const User = require('../models/User');
let db2 = require('../database/config').getDb;
const { forwardAuthenticated } = require('../config/auth');
const connection=db2();


// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('register'));

// Forget Password
router.get('/forgotpassword', forwardAuthenticated, (req, res) => res.render('forgotpassword'));

// Register
router.post('/register', (req, res) => {
  const user_email=req.body.email.toLowerCase();
  console.log(user_email);
  const { name, email, password, password2 } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      password,
      password2
    });
  } else {
    const connection=db2();
    connection.query(`select EMAIL from LOGIN where EMAIL=:b`,[user_email],
    {
      outFormat:oracledb.OBJECT
    })
    .then(result => {
      console.log(result);
      if (result.length>0) {
        errors.push({ msg: 'Email already exists' });
        res.render('register', {
          errors,
          name,
          email,
          password,
          password2
        });
      } else {
        //var today = new Date();
        var today = new Date();
        var B = today.toString(); 
        
        // var dateString = today.getDate()+"/"+today
        var users={
          "NAME":req.body.name,
          "EMAIL":user_email,
          "PASSWORD":req.body.password,
          "RDATE":B
      }
        console.log(users);
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(users.PASSWORD, salt, (err, hash) => {
            if (err) throw err;
            users.PASSWORD = hash;
            // var user_data = [users.NAME,users.EMAIL,users.PASSWORD,users.RDATE]
            // console.log(user_data)
            const connection=db2();
            connection.execute(`INSERT INTO login (NAME,EMAIL,PASSWORD,RDATE) 
            VALUES(:NAME,:EMAIL,:PASSWORD,:RDATE)`,{
              "NAME":req.body.name,
              "EMAIL":user_email,
              "PASSWORD":hash,
              "RDATE":B
          },
            {
                outFormat:oracledb.OBJECT,
                autoCommit:true
            })
              .then(result => {
                req.flash(
                  'success_msg',
                  'You are now registered and can log in'
                );
                res.redirect('/users/login');
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
  }
});

//Update Password 

router.post('/forgotpassword', (req, res) => {
  const user_email=req.body.email.toLowerCase();
  console.log(user_email);
  const { email, password, password2 } = req.body;
  let errors = [];

  if (!email || !password || !password2) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('forgotpassword', {
      errors,
      email,
      password,
      password2
    });
  } else {
    const connection=db2();
    connection.query(`select EMAIL from LOGIN where EMAIL=:b`,[user_email],
    {
      outFormat:oracledb.OBJECT
    })
    .then(result => {
      console.log(result);
      if (result.length<1) {
        errors.push({ msg: 'Please verify Email does not exists' });
        res.render('forgotpassword', {
          errors,
          email,
          password,
          password2
        });
      } else {
        //var today = new Date();
        var today = new Date();
        var B = today.toString(); 
        
        // var dateString = today.getDate()+"/"+today
        var users={
          "EMAIL":user_email,
          "PASSWORD":req.body.password,
          "RDATE":B
      }
        console.log(users);
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(users.PASSWORD, salt, (err, hash) => {
            if (err) throw err;
            users.PASSWORD = hash;
            // var user_data = [users.NAME,users.EMAIL,users.PASSWORD,users.RDATE]
            // console.log(user_data)
            const connection=db2();
            connection.execute(`UPDATE login SET PASSWORD = :PASSWORD, RDATE= :RDATE WHERE EMAIL = :EMAIL`,{
              "PASSWORD":hash,
              "RDATE":B,
              "EMAIL":user_email
          },
            {
                outFormat:oracledb.OBJECT,
                autoCommit:true
            })
              .then(result => {
                req.flash(
                  'success_msg',
                  'Password changed now you can log in with new password '
                );
                res.redirect('/users/login');
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
  }
});

// Login
router.post('/login', (req, res, next) => {
  const User_mail=req.body.email;
  const admin_mail='admin@gmail.com'
  if(User_mail==admin_mail)
    {
      passport.authenticate('local', {
        successRedirect: '/admin',
        failureRedirect: '/users/login',
        failureFlash: true
      })(req, res, next);
    }
    else
    {
    passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);}
});

// Logout
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});

module.exports = router;
