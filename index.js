const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const flash = require("connect-flash");
const ejs = require("ejs");
const path = require("path");

const app = express();
const port = 3000;

const users = [
  { id: 1, username: "user1", password: "password1" },
  { id: 2, username: "user2", password: "password2" },
];

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "payment",
});

connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL");
});

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "your-secret-key",
    resave: true,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

passport.use(
  new LocalStrategy(function (username, password, done) {
    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      return done(null, user);
    } else {
      return done(null, false, { message: "Incorrect username or password" });
    }
  })
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  const user = users.find((u) => u.id === id);
  done(null, user);
});

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "Please log in to access this page");
  res.redirect("/login");
};

app.get("/user/make-payment", isAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/public/payment-form.html");
});

app.get("/admin/payment", isAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/public/admin-payment.html");
});

app.get("/admin/successful-payments", isAuthenticated, (req, res) => {
  const selectQuery = `SELECT * FROM payments WHERE status = 'success'`;
  connection.query(selectQuery, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.post("/user/make-payment", isAuthenticated, (req, res) => {
  const {
    accountNumber,
    ifscCode,
    customerId,
    amount,
    paymentMethod,
    currency,
  } = req.body;

  const transactionId = generateTransactionId();
  const transactionDate = new Date()
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  const insertQuery = `
    INSERT INTO payments (transaction_id, customer_id, transaction_date, amount, status, payment_method, currency)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  connection.query(
    insertQuery,
    [
      transactionId,
      customerId,
      transactionDate,
      amount,
      "success",
      paymentMethod,
      currency,
    ],
    (err, result) => {
      if (err) throw err;
      console.log("Payment recorded in the database");
    }
  );
  console.log("New Payment:", {
    transactionId,
    customerId,
    transactionDate,
    amount,
    paymentMethod,
    currency,
  });

  res.send("Payment successful!");
});

app.get("/login", (req, res) => {
  res.render("login", { message: req.flash("error") });
});
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
function generateTransactionId() {
  return Math.random().toString(36).substring(7);
}
