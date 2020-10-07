let Question = require("./Question");
let Category = require('./Category');
module.exports = (sequelize, Sequelize) => {
    const question_category = sequelize.define('question_category', {
        question_id: {
            type: Sequelize.STRING.BINARY,
            primaryKey: true,
        },
        category_id: {
            type: Sequelize.STRING.BINARY,
            primaryKey: true,
        },
        category: {
            type: Sequelize.STRING,
            allowNull: false
        }
    }, { timestamps: false });
    return question_category;
};
