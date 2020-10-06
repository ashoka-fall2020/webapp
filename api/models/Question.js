module.exports = (sequelize, Sequelize) => {
    const Question = sequelize.define("question", {
        question_id: {
            type: Sequelize.STRING.BINARY,
            primaryKey: true,
        },
        question_text: {
            type: Sequelize.STRING,
            allowNull: false
        },
        user_id: {
            type: Sequelize.STRING.BINARY,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    }, {
        createdAt: "created_at",
        updatedAt: "updated_at"
    });
    return Question;
};