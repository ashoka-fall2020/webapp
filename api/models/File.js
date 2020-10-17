module.exports = (sequelize, Sequelize) => {
    const File = sequelize.define("file", {
        file_id: {
            type: Sequelize.STRING.BINARY,
            primaryKey: true,
        },
        file_name: {
            type: Sequelize.STRING,
            primaryKey: true,
        },
        s3_object_name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        answer_id: {
            type: Sequelize.STRING,
            allowNull: false
        },
        question_id: {
            type: Sequelize.STRING,
            allowNull: false
        }
    }, {
        createdAt: "created_date"
    });
    return File;
};