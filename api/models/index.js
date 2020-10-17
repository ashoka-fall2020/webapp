const dbConfig = require("../config/dbconfig.js");
const mysql = require('mysql2/promise');

const Sequelize = require("sequelize");

mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || "3306",
    user     : process.env.DB_USER || "root",
    password : process.env.DB_PASSWORD || "bellevue1@",
}).then( connection => {
    connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.DB};`).then((res) => {
        console.info("Database create or successfully checked");
    })
});

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    operatorsAliases: 0,
    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
    },
    // logging: true
});
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.user = require("./User.js")(sequelize, Sequelize);
db.question = require("./Question.js")(sequelize, Sequelize);
db.answer = require("./Answer.js")(sequelize, Sequelize);
db.categories = require("./Category.js")(sequelize, Sequelize);
db.question_category = require("./Question_Category")(sequelize, Sequelize);
db.file = require("./File")(sequelize, Sequelize);

module.exports = db;

