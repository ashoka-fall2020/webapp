module.exports = (sequelize, Sequelize) => {
    const File = sequelize.define("file", {
        file_id: {
            type: Sequelize.STRING.BINARY,
            primaryKey: true,
        },
        file_name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        s3_object_name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        answer_id: {
            type: Sequelize.STRING,
            allowNull: true
        },
        question_id: {
            type: Sequelize.STRING,
            allowNull: false
        },
        user_id: {
            type: Sequelize.STRING,
            allowNull: false
        },
        accept_ranges: {
            type: Sequelize.STRING,
            allowNull: false
        },
        content_length: {
            type: Sequelize.STRING,
            allowNull: false
        },
        e_tag: {
            type: Sequelize.STRING,
            allowNull: false
        },
        content_type: {
            type: Sequelize.STRING,
            allowNull: false
        }
    }, {
        createdAt: "created_date"
    });
    return File;
};