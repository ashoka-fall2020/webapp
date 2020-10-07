module.exports = (sequelize, Sequelize) => {
    const question_category = sequelize.define('question_category', {
        question_id: {
            type: Sequelize.STRING.BINARY,
            primaryKey: true,
        },
        category_id: {
            type: Sequelize.STRING.BINARY,
            primaryKey: true,
        }
    }, { timestamps: false });
    return question_category;
};
