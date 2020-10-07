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
    let incomingCats = question.categories.map(cat => cat.category);;
    let allCategories = [];
    let filterCats = [];
    if(allCatRes.length !== 0) {
        allCategories  =  allCatRes.map(cat => cat.category);
        filterCats = incomingCats.filter(e => !allCategories.includes(e));
    }
    else{
        filterCats = incomingCats;
    }
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
        console.log("no cats");
        //delete all existing categories of question from question category
        return Question_Category.destroy({
            where:{question_id: question.question_id}
        })
    } else{
        let allCatRes = await Category.findAll({
            raw: true
        });
        let filterCats = [];
        let incomingCats = categories.map(cat => cat.category);
        let allCategoryNames = [];
        if(allCatRes.length !== 0) {
            allCategoryNames = allCatRes.map(cat => cat.category);
            console.log("incomingCats", incomingCats);
            console.log("allCategoryNames", allCategoryNames);
            filterCats = incomingCats.filter(e => !allCategoryNames.includes(e));
        }
        else{
            filterCats = incomingCats;
        }
        console.log("filterCats", filterCats);
        //cats to be added
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
        // Category table add / updates are done
        if(allCatRes.length !== 0) {
            let catsToBeRemoved = allCatRes.filter(cat => !incomingCats.includes(cat.category)).map(cat => cat.category_id);
            console.log("catsToBeRemoved************", catsToBeRemoved);

            const numAffectedRows = await Question_Category.destroy({
            truncate : true, cascade: false
            });
            console.log("catsToBeRemoved************", numAffectedRows);
        }
        // Add new entries to QC table
        let allQC = await Question_Category.findAll({
            where:{question_id: question.question_id},
            raw: true
        });
        console.log("AllCats ", allQC);
        allQC = allQC.map(e => e.category_id);
        console.log("AllCats ", allQC);
        let allQCNames = await Category.findAll({
            where:{category_id: allQC},
            raw: true
        });
        allQCNames = allQCNames.map(e => e.category);
        console.log("allQCNames ", allQCNames);
        let filterQC = allCategoryNames.filter(e => !allQCNames.includes(e));
        console.log("AllCats ", allQC);
        console.log("FilterCats ", filterQC);
        console.log("incomingCats", incomingCats);
        let records = [];
        let categoriesToBeInserted = await Category.findAll({
            where:{category: filterQC}
        });
        console.log("categoriesToBeInserted", categoriesToBeInserted);
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

exports.getQuestions = async function () {

    let qc = "SELECT q.question_id, " +
        "q.question_text, " +
        "q.user_id, q" +
        ".created_timestamp, " +
        "q.updated_timestamp, " +
        "c.category_id, " +
        "c.category FROM `questions` as q left join `question_categories` as qc on q.question_id = qc.question_id " +
        "left join " +
        "`categories` as c on qc.category_id = c.category_id";

    let questCat = await db.sequelize.query(qc);
     let qa = "SELECT q.question_id, "+
    "a.answer_id, " +
    "a.user_id, " +
    "a.answer_text, " +
    "a.created_timestamp,  " +
    "a.updated_timestamp FROM `questions` as q left join `answers` as a on q.question_id = a.question_id" ;

    let questAnswer = await db.sequelize.query(qa);
    let map = new Map();
    let mySet = new Set();
    let questionCategoryjoin = questCat[0];
    let questionAnswerjoin = questAnswer[0];
    for (let i=0; i<questionCategoryjoin.length; i++) {
        let result = questionCategoryjoin[i];
        map[result.question_id] = {question_id: result.question_id, user_id: result.user_id,
            created_timestamp: result.created_timestamp, updated_timestamp: result.updated_timestamp};
    }
    for (let i=0; i<questionCategoryjoin.length; i++) {

        let result = questionCategoryjoin[i];
        mySet.add(result.question_id);
        if(!map.has(result.question_id)) {
            map[result.question_id].categories = [];
            map[result.question_id].answers = [];
        }
        if(result.category_id !== null) {
            map[result.question_id].categories.push({category_id: result.category_id, category: result.category});
        }
    }
    for (let i=0; i<questionAnswerjoin.length; i++) {
        let result = questionAnswerjoin[i];
        if(result.answer_id !== null) {
            map[result.question_id].answers.push({answer_id: result.answer_id,  question_id: result.question_id, answer_text: result.answer_text, user_id: result.user_id,
                created_timestamp: result.created_timestamp, updated_timestamp: result.updated_timestamp});
        }
    }
    let payload = [];
    for (let i=0; i<questionAnswerjoin.length; i++) {
        console.log("Map value", map[questionAnswerjoin[i].question_id]);
        payload.push(map[questionAnswerjoin[i].question_id]);
    }
    for (let item of mySet) {
        payload.push(map[item]);
    }
    console.log("payload" + payload);
    return payload;
};