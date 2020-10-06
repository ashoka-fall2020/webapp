module.exports = (sequelize, Sequelize) => {
    const Answer = sequelize.define("answer", {
        answer_id: {
            type: Sequelize.STRING.BINARY,
            primaryKey: true,
        },
        question_text: {
            type: Sequelize.STRING,
            allowNull: false
        },
        created_timestamp: {
            type: Sequelize.STRING,
            field: "createdAt"
        },
        updated_timestamp: {
            type: Sequelize.STRING,
            field: "updatedAt"
        },
        user_id: {
            type: Sequelize.STRING.BINARY,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        question_id: {
            type: Sequelize.STRING.BINARY,
            references: {
                model: 'questions',
                key: 'question_id'
            }
        }
    });
    return Answer;

};