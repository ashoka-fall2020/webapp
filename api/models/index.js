const dbConfig = require("../config/dbconfig.js");

const Sequelize = require("sequelize");
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
    logging: true
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.user = require("./User.js")(sequelize, Sequelize);
db.question = require("./Question.js")(sequelize, Sequelize);
db.answer = require("./Answer.js")(sequelize, Sequelize);
db.categories = require("./Category.js")(sequelize, Sequelize);
//db.question_category = require("./Question_Category")(sequelize, Sequelize);


db.question.belongsToMany(db.categories, { through: 'Question_Category' , as: 'categories', foreignKey: 'category_id'});
db.categories.belongsToMany(db.question, { through: 'Question_Category', as: 'questions', foreignKey: 'question_id' });




module.exports = db;