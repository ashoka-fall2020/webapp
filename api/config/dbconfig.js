require('dotenv').config();
require('mysql');
module.exports = {
    HOST: process.env.DATABASE_HOST_NAME,
    USER: process.env.DATABASE_USER_NAME,
    PASSWORD: process.env.DATABASE_PASSWORD,
    DB: process.env.DATABASE_NAME,
    PORT: process.env.DATABASE_PORT,
    dialect: 'mysql' ,
    dialectOptions: {
        ssl: 'Amazon RDS'
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};