const dbConfig = require("../config/dbconfig.js");
const mysql = require('mysql2/promise');

const Sequelize = require("sequelize");
console.log("node env", process.env.NODE_ENV);
if(process.env.NODE_ENV !== "production") {
    console.log("node env", process.env.NODE_ENV);
    mysql.createConnection({
        host: dbConfig.HOST,
        port: dbConfig.PORT,
        user     : dbConfig.USER ,
        password : dbConfig.PASSWORD,

    }).then( connection => {
        connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.DB};`).then((res) => {
            console.info("Database create or successfully checked");
        })
    });
}
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
    dialectOptions: {
        ssl: 'Amazon RDS'
    }
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

