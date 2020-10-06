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
        created_at: {
            type: Sequelize.STRING,
            field: "createdAt"
        },
        updated_at: {
            type: Sequelize.STRING,
            field: "updatedAt"
        },
        user_id: {
            type: Sequelize.STRING.BINARY,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    });
    return Question;
};