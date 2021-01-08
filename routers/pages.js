let express = require('express');
let session = require('express-session');
let route = express.Router();
let db = require('../database/config').getDb;
let db2 = require('../database/configSpatial').getDb2;
let db3 = require('../database/analytics').getDb3;
var js2xmlparser = require("js2xmlparser");
let oracledb=require('oracledb');
var convert = require('xml-js');
const X2JS=require("x2js");
//var parser = require('xml2json');
var parser = require('fast-xml-parser');
const fetch = require('node-fetch');
const ORDS=require('request');
var cart=[];
let randomStatusCounter=0;
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
// var osm = require('osm');

// Welcome Page
route.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

// Dashboard
route.get('/home', ensureAuthenticated, (req, res) =>{
  //console.log(req);
  res.render('home', {
    user: req.user
  })
 
} 
);

route.get('/admin', ensureAuthenticated, (req, res) =>{
  //console.log(req);
  res.render('admin', {
    user: req.user
  })
}
);

/*route.get('/api/products/:pid',(req,res)=>{
  const connection=db();
  
  let pids = req.params.pid;
  // if(pids=="und")

  console.log(pids);
  let finalArrayOfProducts=[];
  connection.query(`SELECT a.product_document from products A where (a.product_document.pid) = :a`,[pids],
    {
        outFormat:oracledb.OBJECT
    })
    .then(result=>{
      //console.log("working data",result);
      result.forEach(obj=>{
      //console.log(JSON.parse(obj.PRODUCT_DOCUMENT))
        finalArrayOfProducts.push(JSON.parse(obj.PRODUCT_DOCUMENT));
      })
      if (finalArrayOfProducts.length > 0 ) 
      {
            res.send({user: req.user,finalArrayOfProducts});
            fetch('http://localhost:3000/api/products/487')
            .then(response => response.json())
            .then(data => {
              console.log(data)
            })
      } else
      {
            res.send({user: req.user, message: `Productid ${pids} doesn't exist`})
      }
    })
    .catch(err=>{
      console.log(err)}); 
});*/



route.get('/map',ensureAuthenticated,(req,res)=>{
  const connection=db2();
  console.log(req.query.area)
  let areaSelected=req.query.area;
  if (areaSelected===undefined){
    areaSelected="MICHIGAN"
  }
  let finalArrayOfProducts=[];
  let options;
  connection.query(`select distinct area_name from store_loc`,[],
    {
        outFormat:oracledb.OBJECT
    })
    .then(result=>{
       options=result.map(o=>o.AREA_NAME)
	if(!options.includes(areaSelected)){
          areaSelected="MICHIGAN";
         }
      connection.query(`select STORE_ID,
      STORE_NAME,
      CENTER_LONG,
      CENTER_LAT,
      POSTAL_CODE from store_loc where AREA_NAME=:a`,[areaSelected],
    {
        outFormat:oracledb.OBJECT
    }).then(result=>{
      console.log(result)
      res.render('finalMaps',{user: req.user,options:options,title: 'Maps',data:result,selectedArea:areaSelected});
    })
    })
})

route.get('/products',(req,res)=>{
  const connection=db();
  let finalArrayOfProducts=[];
  connection.query(`SELECT a.product_document from products A`,[],
    {
        outFormat:oracledb.OBJECT
    })
    .then(result=>{
      console.log("working data",result);
      result.forEach(obj=>{
        console.log(JSON.parse(obj.PRODUCT_DOCUMENT))
        finalArrayOfProducts.push(JSON.parse(obj.PRODUCT_DOCUMENT));
      })
    res.json(finalArrayOfProducts)
    })
    .catch(err=>{
      console.log(err)});
  
})

route.get('/shop',ensureAuthenticated,(req,res)=>{
  console.log(req.query)
  const searchText=req.query.searchText;
  console.log(searchText);
  const connection=db();
  let finalArrayOfProducts=[];
  connection.query(`SELECT a.product_document from products A where lower(a.product_document.category) like '%'||:s||'%' or lower(a.product_document.title) like '%'||:s||'%' fetch first 10 rows only`,[searchText],
    {
        outFormat:oracledb.OBJECT
    })
    .then(result=>{
      console.log("working data",searchText,result);
      result.forEach(obj=>{
        console.log(JSON.parse(obj.PRODUCT_DOCUMENT))
        finalArrayOfProducts.push(JSON.parse(obj.PRODUCT_DOCUMENT));
      })
    res.render('products', {user: req.user,title: 'Shop', products: finalArrayOfProducts});
    })
    .catch(err=>{
      console.log(err)});
})


route.get('/product/:product',ensureAuthenticated, function(req, res) {
  let products=[];
  const connection=db();
  connection.query(`SELECT a.product_document from products a where a.product_document.pid=:PID`,[req.params.product],
  {
      outFormat:oracledb.OBJECT
  }).then(result=>{
    result.forEach(product=>{
      products.push(JSON.parse(product.PRODUCT_DOCUMENT));
    })
    console.log(products)

    res.render('product', {user: req.user,title: 'Product', products: products})
  });
});

route.get('/add-to-cart/:product',ensureAuthenticated, (req, res,next)=> {
  let selectedPid=req.params.product;
  console.log("SELECTED PID IS ",selectedPid)
  console.log("cart length:",cart.length)
    const connection=db();
    connection.query(`SELECT a.product_document from products a where a.product_document.pid=:PID`,[selectedPid],
    {
        outFormat:oracledb.OBJECT
    })
    .then(result=>{
      let tempObj=JSON.parse(result[0].PRODUCT_DOCUMENT)
      let productObj={...tempObj,quantity:1}
      if(cart.length===0){
        cart.push(productObj);
      }
      else if(cart.length>0){
        let foundCartItem=cart.find(cartItem=>cartItem.pid==selectedPid)
        if(foundCartItem!==undefined){
          foundCartItem.quantity+=1;
        }
        else{
          cart.push(productObj)
        }
      }
      let returningCart=[...cart];
        let stringifyCart=JSON.stringify(returningCart);
        console.log("STRINGIFY CART",stringifyCart)
        connection.execute(`UPDATE user_cart SET cart_document=:stringifyCart`,[stringifyCart],
        {
            outFormat:oracledb.OBJECT,
            autoCommit:true
        }).then(result=>{
          console.log(result)
          res.render('cart', {user: req.user,title: 'Cart', products: returningCart });        })
        .catch(err=>{
          console.log(err)
        })
    })
    .catch(err=>{
      console.log(err)
    }) 
});

route.get('/remove-from-cart/:pid', ensureAuthenticated,function(req, res) {
  let products = req.cookies.node_express_ecommerce;
  const connection=db();
  let deletePid = req.params.pid;
  let newCartArray=cart.filter(product=>product.pid!=deletePid);
  cart=[...newCartArray];
  let stringifyCart=JSON.stringify(cart);
 connection.execute(`UPDATE user_cart SET cart_document=:stringifyCart`,[stringifyCart],
 {
     outFormat:oracledb.OBJECT,
     autoCommit:true
 })
 .then(result=>{
   res.redirect('/cart');
 })
});

route.get('/empty-cart', ensureAuthenticated, function(req, res) {
  let products = [];
  const connection=db();
  cart=[];
  let stringifyCart=JSON.stringify(cart);
 connection.execute(`UPDATE user_cart SET cart_document=:stringifyCart`,[stringifyCart],
 {
     outFormat:oracledb.OBJECT,
     autoCommit:true
 })
 .then(result=>{
   res.redirect('/cart');
 })
});

route.get('/cart', ensureAuthenticated,function(req, res) {

    res.render('cart', {user: req.user,title: 'Cart', products: cart});

});

route.post('/update-cart', ensureAuthenticated,function(req, res) {
  const connection=db();
  console.log("IN update cart",cart,req.body.qnt[0]);
  cart.forEach(function(product, index) {
    product.quantity =parseInt(req.body.qnt[index]);
  });
  console.log("after update cart",cart,req.body.qnt[0]);
  let stringifyCart=JSON.stringify(cart);
  connection.execute(`UPDATE user_cart SET cart_document=:stringifyCart`,[stringifyCart],
        {
            outFormat:oracledb.OBJECT,
            autoCommit:true
        })
        .then(result=>{
          res.redirect('/cart');
        })
});

route.get('/checkout', ensureAuthenticated,function(req, res) {
  //res.send('<h1>About page</h1>');
  res.render('order', {user: req.user,title: 'Checkout'});
});

route.post('/orderdetail', ensureAuthenticated,function(req, res) {
  //res.send('<h1>About page</h1>');
  console.log("status page",req.body)
  const {name,email,phone,address,city}=req.body;
  let orderDoc={};
  console.log(req);
  orderDoc.user=req.user;
  orderDoc.id=req.id;
  orderDoc.products=cart;
  orderDoc.userDetails=req.body;
  orderDoc=js2xmlparser.parse("order", orderDoc)
  console.log(orderDoc)
  const connection=db();
  let plsql=`DECLARE
  v_xml   SYS.XMLTYPE;
  v_doc   CLOB;
  cnt number;
BEGIN
  v_doc := :a;
  v_xml := SYS.XMLTYPE.createXML(v_doc);
  select count(*) into cnt from orders;
  if cnt=0 then
  INSERT INTO orders (order_document) VALUES (v_xml);
  else
  UPDATE orders SET order_document=v_xml;
  end if;
  END;`
  connection.execute(plsql,[orderDoc],
  {
      outFormat:oracledb.OBJECT,
      autoCommit:true
  }).then(result=>{
    console.log(result);
    
  })

  res.render('order-details', {user: req.user,title: 'Order Status'});
});

route.get('/orderstatus',ensureAuthenticated,(req,res)=>{
randomStatusCounter++;
  if(randomStatusCounter>3){
    randomStatusCounter=3;
  }
  let status;
  
  if(randomStatusCounter==1){
    status="Shipped"
  }
  else if(randomStatusCounter ==2){
    status="In Transit"
  }else{
    status="Delivered";
  }
  const connection=db();
  let sql=`SELECT a.order_document.getStringVal() xmldata
    FROM   orders a`;
    connection.execute(sql,[],
      {
          outFormat:oracledb.OBJECT,
          autoCommit:true
      }).then(result=>{
        //console.log(result.rows[0])
       
       // xml to json
      // var options = {
       // object: true,
       // coerce: false,
       // sanitize: true,
       // trim: true
      // };
      var options = {
        trimValues: true,
        arrayMode: false, 
       };
       var json = parser.parse(result.rows[0].XMLDATA,options);
       console.log("to json -> %s", json);
	let productsArr=[];
       if(json.order.products.length>1){
        productsArr=[...json.order.products];  
       }
       else{
        productsArr.push(json.order.products)
       }
       console.log(productsArr)
     res.render('order-status',{user:req.user,status:status,title: 'Order Status',products:productsArr,userData:json.order.userDetails})
      //  res.send(json)
      // var json = parser.toJson(result.rows[0].XMLDATA,options);
      // console.log("to json -> %s", json);
      // console.log(json.order.products)
      // res.render('order-status',{status:status,title: 'Order Status',products:json.order.products,userData:json.order.userDetails})
      //  res.send(json)
      })
})

route.get('/chart', ensureAuthenticated,function (req, res) {
  let Total=[];
  let xlable = [];
  let data = [];
  let piechart = [];
  let price = [];
  let pricecount = [];
  let piePrice = [];
  let SALES_TYPE_NAME = [];
  let MCOUNTS = [];
  let FCOUNTS = [];
  let SALE_DATE = [];
  let VALUE_OF_ORDERS = [];

   
      ORDS({method:'GET',url:'http://150.136.48.126:9090/ords/apppdb/appnodejs/app/app1/'},function(err,response,bodyORDS){
         if (err) throw err;
         let result = JSON.parse(bodyORDS)
         result.items.forEach(obj=>{
          //console.log(obj['CATEGORY']);
           xlable.push(obj['category']);
           data.push(obj['counts']); 
           piechart.push([obj['category'],obj['counts']]);
          });
        
      ORDS({method:'GET',url:'http://150.136.48.126:9090/ords/apppdb/appnodejs/app/app2/'},function(err,response,bodyORDS){
          if (err) throw err;
          //console.log(JSON.stringify(bodyORDS));
          let result = JSON.parse(bodyORDS)
          result.items.forEach(obj=>{
          //console.log("working data",result);
            Total.push(obj['total']);
          });
           
      ORDS({method:'GET',url:'http://150.136.48.126:9090/ords/apppdb/appnodejs/app/app3/'},function(err,response,bodyORDS){
          if (err) throw err;
          //console.log(JSON.stringify(bodyORDS));
          let result = JSON.parse(bodyORDS)
          result.items.forEach(obj=>{
  
          price.push(obj['price']+"$");
          pricecount.push(obj['pricecounts']);
          piePrice.push([obj['price']+"$",obj['pricecounts']]);
          });
                  
      ORDS({method:'GET',url:'http://150.136.48.126:9090/ords/apppdb/analytics/ana/ana1/'},function(err,response,bodyORDS){
          if (err) throw err;
          //console.log(JSON.stringify(bodyORDS));
          let result = JSON.parse(bodyORDS);
          result.items.forEach(obj=>{
          
          //console.log(obj['sales_type_name']);
          SALES_TYPE_NAME.push(obj['sales_type_name']);
          MCOUNTS.push(obj['mcounts']);
          FCOUNTS.push(obj['fcounts']);
                        
          });
      
      ORDS({method:'GET',url:'http://150.136.48.126:9090/ords/apppdb/analytics/ana/ana2/'},function(err,response,bodyORDS){
          if (err) throw err;
          //console.log(JSON.stringify(bodyORDS));
          let result1 = JSON.parse(bodyORDS);
          // result.items.forEach(obj=>{
          
          // top5.push(result.items);
          //console.log("working ANS",result1.items);
          // NUMBER_OF_ORDERS.push(obj['number_of_orders']);
          // TOTAL_VALUE.push(obj['total_value']);
          // });
  
      
      ORDS({method:'GET',url:'http://150.136.48.126:9090/ords/apppdb/analytics/ana/ana3/'},function(err,response,bodyORDS){
          if (err) throw err;
          //console.log(JSON.stringify(bodyORDS));
          let result = JSON.parse(bodyORDS);
          result.items.forEach(obj=>{
    
          SALE_DATE.push(obj['sale_date']);
          VALUE_OF_ORDERS.push(obj['value_of_orders']);
                       
          });
                             
         res.render('dashboard', {user: req.user,title: 'dashboard',SALE_DATE: SALE_DATE,VALUE_OF_ORDERS: VALUE_OF_ORDERS,top5: result1.items,SALES_TYPE_NAME: SALES_TYPE_NAME, MCOUNTS: MCOUNTS, FCOUNTS: FCOUNTS, xlable: xlable, data: data, Total: Total, piechart: piechart, price: price, pricecount: pricecount, piePrice: piePrice});
      })
      })
      })
      })
      })
      })
  })
  
  route.get('/about', function(req, res) {
    //res.send('<h1>About page</h1>');
    res.render('page', {title: 'About'});
  });
  
  route.get('/contact', function(req, res) {
    res.render('page', {title: 'Contact'});
  });
  
  module.exports = route;
  