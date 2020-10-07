/* Question related services create question, get question*/
const db = require("../models");
const Question = db.question;
const Category = db.categories;
const Answer = db.answer;
const Question_Category = db.question_category;
const {v4: uuidv4} = require("uuid");

exports.addQuestion = async function (question) {
    const newQuestion = new Question(question);
    console.log("incoming question", question);
    await newQuestion.save();
    let allCatRes = await Category.findAll({
        attributes: ["category"], raw: true
    });
    let incomingCats = question.categories.map(cat => cat.category);
    let filterCats = incomingCats.filter(e => !allCatRes.includes(e));
    console.log("filter cats: ", filterCats);
    if(filterCats.length !== 0) {
        let records = [];
        filterCats.map(cat => {
            records.push({
                category_id: uuidv4(),
                category: cat
            });
        });
        await Category.bulkCreate(records);
    }
    let allCats = await Category.findAll({
        where:{category: incomingCats},
        raw: true
    });
    allCats = allCats.map(e => e.category_id);
    let records = [];
    allCats.map(cat => {
        records.push({
            question_id: question.question_id,
            category_id: cat
        });
    });
    await Question_Category.bulkCreate(records);
    return exports.getQuestion(question.question_id);
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

