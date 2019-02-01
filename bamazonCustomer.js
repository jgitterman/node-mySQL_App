// import dependencies
const mysql = require("mysql");
const inquirer = require("inquirer");
const cTable = require('console.table');
require('dotenv').config();

// set up DB configuration
const db = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: process.env.password,
  database: "bamazon"
});

// establish connection to DB
db.connect(err => {
  if (err) {
    throw err;
  }

  console.log("You connected to the DB!");

  // send user to inquirer prompt
  start();
});

function start() {
  // query the database for all items being auctioned
  db.query("SELECT * FROM products", function (err, results) {
    if (err) throw err;

    // console log the table
    console.table(results)

    // run the inquirer prompt
    inquirer.prompt([{
        name: "options",
        type: "list",
        message: "Which item would you like to purchase?",
        choices: results.map(item => item.product_name)
      },
      {
        name: "purchased",
        type: "input",
        message: "How many would you like to purchase?",
        validate: function (input) {
          return !isNaN(input);
        },
        filter: function (input) {
          return parseInt(input);
        }
      }
    ]).then(({
      options,
      purchased
    }) => {

      // target the item they want to purchase
      const itemPicked = results.find(item => item.product_name === options);

      // console log said item
      console.log(itemPicked)

      // set if statement to see if theres enough stock of requeted item
      if (purchased > itemPicked.stock_quantity) {

        // console log if purchase doesnt go through and return to start
        console.log(":( I'm sorry, we don't have enough in stock to supply that order...")
        return start()
      }

      // console log if purchase goes through
      console.log(":) Thank you for your purchase!")

      // update the quantity
      const updatedQuantity = {
        stock_quantity: itemPicked.stock_quantity - purchased
      };

      // create object for the WHERE clause in our sql statement
      const updateWhere = {
        id: itemPicked.id
      };

      // run update statement on item
      const query = db.query("UPDATE products SET ? WHERE ?", [
        updatedQuantity, updateWhere
      ], function (err, dbResponse) {

        if (err) {
          throw err;
        }
        start();
      });
    })
  })
}