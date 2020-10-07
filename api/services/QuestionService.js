/* Question related services create question, get question*/
const db = require("../models");
const Question = db.question;
const Category = db.categories;
const Answer = db.answer;
const Question_Category = db.question_category;
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
        let categoryNames = categories.map(category =>category.category);
        console.log("inside findAllQuestionCategoryIds", categories);
        db.sequelize.query('SELECT category_id, category FROM categories WHERE category in (?)',
            { replacements: [categoryNames], type: db.sequelize.QueryTypes.SELECT }
        ).then(function(categories) {
            let values = "";
            categories.forEach(cat => {
                values += "(" + "'" + questionId + "'" + "," + " ";
                values += "'" + cat.category_id+ "'" + "," + " ";
                values += "'" + cat.category + "'" + ")";
                values += ",";
            });
            values = values.substr(0, values.length-1);
            let prefix = "INSERT INTO `question_categories` (question_id, category_id, category) VALUES ";
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
    // let out = {};
    // let getQuestionById = function (id) {
    //     return Question.findOne({
    //         where: {question_id: id}
    //     });
    // };
    // let handleQuestion = function(question) {
    //     return db.sequelize.query("select cat.category_id, cat.category from `categories` cat inner join `question_categories` " +
    //         "qcat on cat.category_id = qcat.category_id where qcat.question_id = " + "'" + question.question_id + "'",
    //         { replacements: [], type: db.sequelize.QueryTypes.SELECT });
    // };
    //
    // getQuestionById(id).then(questionDb => {
    //     const res = handleQuestion(questionDb).then( obj => {
    //         out.question_id = questionDb.question_id;
    //         out.created_timestamp = questionDb.created_at;
    //         out.updated_timestamp = questionDb.updated_at;
    //         out.user_id = questionDb.user_id;
    //         out.question_text = questionDb.question_text;
    //         out.categories = obj;
    //         console.log("out out ", out);
    //         return res;
    //
    //     })});
    let q = {};
    Question.findOne({
        where: {question_id: id}
            })
        .then(question => {q=question; db.sequelize.query("select cat.category_id, cat.category from `categories` cat inner join `question_categories` " +
                "qcat on cat.category_id = qcat.category_id where qcat.question_id = " + "'" + question.question_id + "'",
                { replacements: [], type: db.sequelize.QueryTypes.SELECT })})
        .then(obj => {
                    let out = {};
                    out.question_id = q.question_id;
                    out.created_timestamp = q.created_at;
                    out.updated_timestamp = q.updated_at;
                    out.user_id = q.user_id;
                    out.question_text = q.question_text;
                    out.categories = obj;
                    console.log("out out ", out);
                    return out;
                })
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

exports.updateQuestionCategories = async function (question, categories) {
    console.log("question", question);
    if (categories.length === 0) {
        //delete all existing categories of question from question category
        await Question_Category.destroy({
            where:{question_id: question.question_id}
        })
    } else{
        let allCatRes = await Category.findAll({
            raw: true
        });
        let incomingCats = categories.map(cat => cat.category);
        let allCategoryNames = allCatRes.map(cat => cat.category);
        let filterCats = incomingCats.filter(e => !allCategoryNames.includes(e));
        //cats to be added
        if(filterCats.length !== 0) {
            let records = [];
            filterCats.map(cat => {
                records.push({
                    category_id: uuidv4(),
                    category: cat
                });
            });
            let addToCats = await Category.bulkCreate(records);
        }
        if(allCatRes.length !== 0) {
            let catsToBeRemoved = allCatRes.filter(cat => !incomingCats.includes(cat.category)).map(cat => cat.category_id);
            await Question_Category.destroy({
                where:{category_id: catsToBeRemoved}
            })
        }
        // Add new entries to QC table
        console.log("question", question);
        let allQC = await Question_Category.findAll({
            where:{question_id: question.question_id},
            raw: true
        });
        allQC = allQC.map(e => e.category);
        let filterQC = allCategoryNames.filter(e => !allQC.includes(e));
        console.log("AllCats ", allQC);
        console.log("FilterCats ", filterQC);
        console.log("incomingCats", incomingCats);
        let records = [];
        let categoriesToBeInserted = await Category.findAll({
            where:{category: filterQC}
        })
        categoriesToBeInserted.map(cat => {
            records.push({
                question_id: question.question_id,
                category_id: cat.category_id,
                category: cat.category
            });
        });
        let addToCats = await Question_Category.bulkCreate(records);
        return addToCats;
    }
};

exports.deleteQuestion = async function(question_id) {
    await Question_Category.destroy({
        where:{question_id: question_id}
    });
    const promise = Question.destroy({
        where:{question_id: question_id}
    });
    return promise;
};

exports.getQuestionByID = function (question_id) {
    const promise = Question.get({
        where:{question_id: question_id}
    });
    return promise;
};

exports.getQuestion = async function (question_id) {
    let out = {};
    let question = await Question.findOne({
        where:{question_id: question_id}
    });
    let questionCategories = await Question_Category.findAll({
        where:{question_id: question_id}
    });
    if(questionCategories.length > 0) {
        questionCategories = questionCategories.map(e => e.category_id);
    }
     let categories = await Category.findAll({
        where:{category_id: questionCategories}
    });
    question.categories = categories;
    let answers = await Answer.findAll({
        where:{question_id: question_id}
    });
    question.answers = answers;
    out.question_id = question.question_id;
    out.created_timestamp = question.created_timestamp;
    out.updated_timestamp = question.updated_timestamp;
    out.user_id = question.user_id;
    out.question_text = question.question_text;
    out.categories = categories;
    out.answers = answers;
    return out;
};

