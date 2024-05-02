create database payment;
use payment;
create table payments (
id INT AUTO_INCREMENT PRIMARY KEY,
transaction_id VARCHAR(255),
customer_id VARCHAR(255),
transaction_date VARCHAR(255),
amount INT,
status VARCHAR(50),
payment_method VARCHAR(50),
currency VARCHAR(50)
);