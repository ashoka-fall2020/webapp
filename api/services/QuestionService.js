/* Question related services create question, get question*/
const db = require("../models");
const Question = db.question;
const Category = db.categories;
const {v4: uuidv4} = require("uuid");

exports.addQuestion = function (question) {
    const newQuestion = new Question(question);
    let save = newQuestion.save();
    return save;
};

exports.addQuestion_ = function (question) {
    let addAllQuestionCategoryIds = function (categories, questionId) {
        if (!categories || categories.length === 0) {
            return;
        }
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

    let insertNonExistCategory = function (categories) {
        let values = "";
        categories.forEach(cat => {
            values += "(" + "'" + uuidv4() + "'" + "," + " ";
            values += "'" + cat + "'" + ")";
            values += ",";
        });
        values = values.substr(0, values.length-1);
        let prefix = "INSERT INTO `categories` (category_id, category) VALUES ";
        let query = prefix + values;
        return db.sequelize.query(query, () => "Adding values to category table!");
    };

    const newQuestion = new Question(question);
    console.log("incoming question", question);
    let save = newQuestion.save();
    save.then(() => console.log("question created!"));
    let allCatRes = [];
    Category.findAll({
        attributes: ["category"], raw: true
    }).then((results) => {
        allCatRes = results;
    });
    let incomingCats = question.categories.map(cat => cat.category);
    console.log("cats", incomingCats);
    console.log("allcatRes", allCatRes);
    let filterCats = incomingCats.filter(e => !allCatRes.includes(e));
    console.log("filter cats: ", filterCats);
    if(filterCats.length !== 0) {
        insertNonExistCategory(filterCats);
    }
    addAllQuestionCategoryIds(question.categories, question.question_id);
    return save;
    };

exports.get = function (id) {
    let getQuestionById = function (id) {
            return Question.findOne({
                where: {question_id: id}
            });
    };

    let handleQuestion = function(question) {
        console.log("***question", question);
        return db.sequelize.query("select cat.category_id, cat.category from `categories` cat inner join `question_categories` " +
            "qcat on cat.category_id = qcat.category_id where qcat.question_id = " + "'" + question.question_id + "'",
            { replacements: [], type: db.sequelize.QueryTypes.SELECT });
    };

    getQuestionById(id).then(questionDb => {
        return  {_question: questionDb, _promise: handleQuestion(questionDb)};
    }).catch(() => {});
};

// This is for just fetching question without any categories
exports.findQuestionById = function (id) {
    const promise = Question.findOne({
        where:{question_id: id}
    });
    return promise;
};


exports.updateQuestion = function(question) {
    const promise = Question.update({
        question_text: question.question_text
    }, {
        where:{question_id: question.question_id}
    });
    return promise;
};

exports.deleteQuestion = function(question_id) {
    const promise = Question.delete({
        where:{question_id: question_id}
    });
    return promise;
};