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
        values += "'" + cat + "'" + ")";
        values += ",";
    });
    values = values.substr(0, values.length-1);
    let prefix = "INSERT INTO `categories` (category_id, category) VALUES ";
    console.log(values);
    let query = prefix + values;
    return db.sequelize.query(query, () => "Adding values to category table!");
};


exports.filterCategories = function(dbCategories, newCategories) {
    dbCategories = dbCategories.map(category => category.category);
    newCategories = newCategories.map(category => category.category);
    let catsToBeAdded = newCategories.filter(e => !dbCategories.includes(e));
    console.log("Cats to be added" + catsToBeAdded);
    return catsToBeAdded;
};

exports.addAllQuestionCategoryIds = function (categories, questionId) {
    categories = categories.map(category =>category.category);
    console.log("inside findAllQuestionCategoryIds", categories);
    db.sequelize.query('SELECT category_id FROM categories WHERE category in (?)',
        { replacements: [categories], type: db.sequelize.QueryTypes.SELECT }
    ).then(function(categories) {
        let categoryIds = categories.map(cat => cat.category_id);
        let values = "";
        categoryIds.forEach(cat => {
            values += "(" + "'" + questionId + "'" + "," + " ";
            values += "'" + cat + "'" + ")";
            values += ",";
        });
        values = values.substr(0, values.length-1);
        let prefix = "INSERT INTO `question_categories` (question_id, category_id) VALUES ";
        console.log(values);
        let query = prefix + values;
        return db.sequelize.query(query, () => "Adding values to question_category table!");
    })
};