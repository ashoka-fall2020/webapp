module.exports = (sequelize, Sequelize) => {
    const Answer = sequelize.define("answer", {
        answer_id: {
            type: Sequelize.STRING.BINARY,
            primaryKey: true,
        },
        answer_text: {
            type: Sequelize.STRING,
            allowNull: false
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
    } , {
        createdAt: "created_timestamp",
        updatedAt: "updated_timestamp"
    });
    return Answer;
};