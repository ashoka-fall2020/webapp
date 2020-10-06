module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("user", {
        id: {
            type: Sequelize.STRING.BINARY,
            primaryKey: true,
        },
        first_name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        last_name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false
        },
        username: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        account_created: {
            type: Sequelize.STRING,
            field: "createdAt"
        },
        account_updated: {
            type: Sequelize.STRING,
            field: "updatedAt"
        }
    }, { indexes: [{name: 'username', unique: true, fields: ['username']}]});
    return User;

};
