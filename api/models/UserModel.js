module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("user", {
        id: {
            type: Sequelize.STRING.BINARY,
            primaryKey: true
        },
        first_name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        last_name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        email_address: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false
        },
        username: {
            type: Sequelize.STRING,
            allowNull: false
        },
        account_created: {
            type: Sequelize.STRING,
            field: "account_created"
        },
        account_updated: {
            type: Sequelize.STRING,
            field: "account_updated"
        }
    }, { indexes: [{name: 'email_address', unique: true, fields: ['email_address']}]});

    return User;
};