module.exports = (sequelize, Sequelize) => {
    const Category = sequelize.define("category", {
        category_id: {
            type: Sequelize.STRING.BINARY,
            primaryKey: true,
        },
        category: {
            type: Sequelize.STRING,
            allowNull: false
        }
    }, { indexes: [{name: 'category', unique: true, fields: ['category']}], timestamps: false});
    return Category;
};