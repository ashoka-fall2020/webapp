const db = require("../models");
const Category = db.categories;
const {v4: uuidv4} = require("uuid");


exports.createCategory = function (category) {
    const newCategory = new Category(category);
    const promise = newCategory.save();
    return promise;
};

exports.findCategory = function (categoryName) {
    const promise = Category.findOne({
        where:{category: categoryName}
    });
    return promise;
};

exports.findAll = function () {
    let getAllCats =  Category.findAll({
        attributes: ["category"], raw: true
    });
    return getAllCats;
};

exports.insertNonExistCategory = function (categories) {
    let values = "";
    categories.forEach(cat => {
        values += "(" + "'" + uuidv4() + "'" + "," + " ";
        values += "'" + cat + "'" + "," + " ";
        values += "CURRENT_TIMESTAMP" + "," + " ";
        values += "CURRENT_TIMESTAMP" + ")";
        values += ",";
    });
    values = values.substr(0, values.length-1);
    let prefix = "INSERT INTO `categories` VALUES ";
    console.log(values);
    let query = prefix + values;
    return db.sequelize.query(query, () => "will this shit print ?");
};


exports.filterCategories = function(dbCategories, newCategories) {
    dbCategories = dbCategories.map(category => category.category);
    newCategories = newCategories.map(category => category.category);
    let catsToBeAdded = newCategories.filter(e => !dbCategories.includes(e));
    console.log("Cats to be added" + catsToBeAdded);
    return catsToBeAdded;
};