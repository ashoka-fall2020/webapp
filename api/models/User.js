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
    }, { indexes: [{name: 'username', unique: true, fields: ['username']}],
        createdAt: "account_created",
        updatedAt: "account_updated"
    });
    return User;

};
