/* Question related services create question, get question*/
const db = require("../models");
const Question = db.question;
const Category = db.categories;
const Answer = db.answer;
const File = db.file;
const Question_Category = db.question_category;
const {v4: uuidv4} = require("uuid");
const s3 = require('../config/s3config');
const sdc = require('../config/statsd');

exports.addQuestion = async function (question) {
    const newQuestion = new Question(question);
    console.log("incoming question", question);
    let dbTimer = new Date();
    await newQuestion.save();
    sdc.timing('addQuestionQuery.timer', dbTimer);
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
        let catDbTimer = new Date();
        await Category.bulkCreate(records);
        sdc.timing('createCategoriesQuery.timer', catDbTimer);
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
    let qcatDbTimer = new Date();
    await Question_Category.bulkCreate(records);
    sdc.timing('createQuestionCategoriesQuery.timer', qcatDbTimer);
    return exports.getQuestion(question.question_id);
};

// This is for just fetching question without any categories
exports.findQuestionById = function (id) {
    let dbTimer = new Date();
    const promise = Question.findOne({
        where:{question_id: id}
    });
    sdc.timing('findQuestionByIdQuery.timer', dbTimer);
    return promise;
};


exports.updateQuestion = function(question) {
    let dbTimer = new Date();
    const promise = Question.update({
        question_text: question.question_text
    }, {
        where:{question_id: question.question_id}
    });
    sdc.timing('updateQuestion.timer', dbTimer);
    return promise;
};

exports.updateQuestionCategories = async function (question, categoriesInPayload) {
    console.log(question);
    console.log("categoriesInPayload", categoriesInPayload);
    if (categoriesInPayload.length === 0) {
        return Question_Category.destroy({
            where:{question_id: question.question_id}
        });
    }
    let promise = Category.findAll({
        raw: true
    }).then((allCategoriesInDB) => {
        let payloadMinusDb = [];
        let categoryNamesInPayload = categoriesInPayload.map(cat => cat.category);
        let allCategoryNames = [];
        if(allCategoriesInDB.length !== 0) {
            allCategoryNames = allCategoriesInDB.map(cat => cat.category);
            console.log("allCategoryNames", allCategoryNames);
            payloadMinusDb = categoryNamesInPayload.filter(e => !allCategoryNames.includes(e));
        }
        else{
            payloadMinusDb = categoryNamesInPayload;
        }
        console.log("payloadMinusDb", payloadMinusDb);
        let records = [];
        if(payloadMinusDb.length !== 0) {
            payloadMinusDb.map(cat => {
                records.push({
                    category_id: uuidv4(),
                    category: cat
                });

            });
        }
        let qCatdbTimer = new Date();
        Category.bulkCreate(records).then(() => {
            sdc.timing('createCategoryQuery.timer', qCatdbTimer);
            console.log("ia m in then");
            Question_Category.findAll({where:{question_id: question.question_id},raw: true})
                .then((allCategoriesInQuestionCategoryDbForQuestion) => {
                    console.log("allCategoriesInQuestionCategoryDbForQuestion", allCategoriesInQuestionCategoryDbForQuestion);
                    let allCategoryIdsInQuestionCategoryDbForQuestion = allCategoriesInQuestionCategoryDbForQuestion.map(x => x.category_id);
                    Category.findAll({where:{category_id: allCategoryIdsInQuestionCategoryDbForQuestion}})
                        .then((categoryNamesForQuestionCategories) => {
                            console.log("categoryNamesForQuestionCategories", categoryNamesForQuestionCategories);
                            let categoryIdsToBeRemoved = categoryNamesForQuestionCategories.filter(cat => !categoryNamesInPayload.includes(cat.category)).map(cat => cat.category_id);
                            console.log("categoryIdsToBeRemoved", categoryIdsToBeRemoved);
                            Question_Category.destroy({
                                where:{question_id: question.question_id, category_id: categoryIdsToBeRemoved}
                            }).then(() => {
                                Question_Category.findAll({
                                    where:{question_id: question.question_id},
                                    raw: true
                                }).then((allCategoriesInQuestionCategoryDbForQuestionV2) => {
                                    console.log("allCategoriesInQuestionCategoryDbForQuestionV2 ", allCategoriesInQuestionCategoryDbForQuestionV2);
                                    allCategoryIdsInQuestionCategoryDbForQuestion = allCategoriesInQuestionCategoryDbForQuestionV2.map(e => e.category_id);
                                    console.log("allCategoryIdsInQuestionCategoryDbForQuestion ", allCategoryIdsInQuestionCategoryDbForQuestion);
                                    Category.findAll({
                                        where:{category_id: allCategoryIdsInQuestionCategoryDbForQuestion},
                                        raw: true
                                    }).then((allQCNames) => {
                                        console.log("allQCNamesa", allQCNames);
                                        let allQCategoryNames = allQCNames.map(e => e.category);
                                        console.log("allQCategoryNames", allQCategoryNames);
                                        let categoryNamesNewInPayload = categoryNamesInPayload.filter(e => !allQCategoryNames.includes(e));
                                        console.log("categoryNamesNewInPayload", categoryNamesNewInPayload);
                                        let records = [];
                                        Category.findAll({
                                            where:{category: categoryNamesNewInPayload}
                                        }).then((categoriesToBeInserted) => {
                                            console.log("categoriesToBeInserted", categoriesToBeInserted);
                                            categoriesToBeInserted.map(cat => {
                                                records.push({
                                                    question_id: question.question_id,
                                                    category_id: cat.category_id
                                                });
                                            });
                                            return Question_Category.bulkCreate(records, {returning: true});
                                        });
                                    });
                                });
                            });
                        });
                });
        });
    });
    return promise;
};

exports.deleteQuestion = async function(question_id) {
    let dbTimer = new Date();
    await Question_Category.destroy({
        where:{question_id: question_id}
    });
    sdc.timing('deleteQuestion.timer', dbTimer);
    let files = await File.findAll({
        where:{question_id: question_id, answer_id: null},
    });
    if(files.length > 0) {
        let objects = [];
        for(let k in files){
            objects.push({Key : files[k].s3_object_name});
        }
        let options = {
            Bucket:s3.bucketName,
            Delete: {
                Objects: objects
            }
        };
        let s3timer = new Date();
        await s3.s3.deleteObjects(options).promise();
        sdc.timing('deleteQuestionS3ObjectDelete.timer', s3timer);
         s3timer = new Date();
        await File.destroy({
            where:{question_id: question_id, answer_id: null}
        });
        sdc.timing('deleteQuestionFileDbDeleteQuery.timer', s3timer);
    }
    let timer = new Date();
    const promise = Question.destroy({
        where:{question_id: question_id}
    });
    sdc.timing('deleteQuestionQuery.timer', timer);
    return promise;
};

exports.getQuestionByID = async function (question_id) {
    let timer = new Date();
    const promise = await Question.findOne({
        where:{question_id: question_id}
    });
    sdc.timing('getQuestionByIDQuery.timer', timer);
    return promise;
};

exports.getQuestion = async function (question_id) {
    let timer = new Date();
    let out = {};
    let question = await Question.findOne({
        where:{question_id: question_id}
    });
    if(question === null || question === undefined){
        return question;
    }
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
    let questionAnswers = [];
    let answers = await Answer.findAll({
        where:{question_id: question_id}
    });
    if(answers.length > 0) {
        let answerIds = answers.map(e => e.answer_id);
        let answerAttachments = await File.findAll({
            where:{answer_id: answerIds},
            attributes: { exclude: ['updatedAt', 'question_id', 'user_id'] }
        });
        for (let answer of answers) {
            let outAnswer = {};
            answer.attachments = answerAttachments.filter(function(item) {
                return item.answer_id === answer.answer_id;
            });
            outAnswer.answer_id = answer.answer_id;
            outAnswer.answer_text = answer.answer_text;
            outAnswer.question_id = answer.question_id;
            outAnswer.user_id = answer.user_id;
            outAnswer.created_timestamp = answer.created_timestamp;
            outAnswer.updated_timestamp = answer.updated_timestamp;
            outAnswer.attachments = answer.attachments;
            questionAnswers.push(outAnswer);
        }
        for (let answer of questionAnswers) {
            if(answer.attachments.length > 0){
                for (let file of answer.attachments) {
                    delete file.dataValues.answer_id;
                }
            }
        }
    }
    let attachments = await File.findAll({
        where:{question_id: question_id, answer_id: null},
        attributes: { exclude: ['updatedAt', 'question_id', 'answer_id', 'user_id', 'e_tag', 'content_type', 'content_length', 'accept_ranges'] }
    });
    question.answers = answers;
    out.question_id = question.question_id;
    out.created_timestamp = question.created_timestamp;
    out.updated_timestamp = question.updated_timestamp;
    out.user_id = question.user_id;
    out.question_text = question.question_text;
    out.categories = categories;
    out.answers = questionAnswers;
    out.attachments = attachments;
    sdc.timing('getQuestionDetailsQuery.timer', timer);
    return out;
};

exports.getQuestions = async function () {
    let timer = new Date();
    let qc = "SELECT " +
        "q.question_id, " +
        "q.question_text, " +
        "q.user_id, " +
        "q.created_timestamp, " +
        "q.updated_timestamp, " +
        "c.category_id, " +
        "c.category " +
        "FROM " +
        "`questions` as q " +
        "left join " +
        "`question_categories` as qc " +
        "on " +
        "q.question_id = qc.question_id " +
        "left join " +
        "`categories` as c " +
        "on " +
        "qc.category_id = c.category_id";
    let questCat = await db.sequelize.query(qc, { type: db.sequelize.QueryTypes.SELECT });
    sdc.timing('getQuestionsQuery.timer', timer);
    console.log("questcat", questCat);

    let qf = "SELECT " +
        "q.question_id, "+
        "f.file_id, " +
        "f.file_name, " +
        "f.s3_object_name, " +
        "f.created_date " +
        "FROM " +
        "`questions` as q " +
        "left join " +
        "`files` as f " +
        "on " +
        "q.question_id = f.question_id " +
        "and f.answer_id is NULL" ;
    timer = new Date();
    let questFile = await db.sequelize.query(qf, { type: db.sequelize.QueryTypes.SELECT });
    sdc.timing('getQuestionsQuestAndFileJoinQuery.timer', timer);
    console.log("questfile ", qf);

     let qa = "SELECT q.question_id, "+
    "a.answer_id, " +
    "a.user_id, " +
    "a.answer_text, " +
    "a.created_timestamp,  " +
    "a.updated_timestamp FROM `questions` as q left join `answers` as a on q.question_id = a.question_id" ;
    timer = new Date();
    let questAnswer = await db.sequelize.query(qa, { type: db.sequelize.QueryTypes.SELECT });
    sdc.timing('getQuestionsQuestAndAnswerJoinQuery.timer', timer);
    let af = "SELECT " +
        "a.answer_id, "+
        "f.file_id, " +
        "f.file_name, " +
        "f.s3_object_name, " +
        "f.created_date " +
        "FROM " +
        "`answers` as a " +
        "left join " +
        "`files` as f " +
        "on " +
        "a.answer_id = f.answer_id";
    timer = new Date();
    let answerFile = await db.sequelize.query(af, { type: db.sequelize.QueryTypes.SELECT });
    sdc.timing('getQuestionsAnswerAndFileJoinQuery.timer', timer);
    let map = new Map();
    let answerMap = new Map();
    let mySet = new Set();
    let questionCategoryjoin = questCat;
    let questionFileJoin = questFile;
    let questionAnswerjoin = questAnswer;
    let answerFileJoin = answerFile;

    for (let i=0; i<questionCategoryjoin.length; i++) {
        let result = questionCategoryjoin[i];
        map[result.question_id] = {question_id: result.question_id,question_text: result.question_text, user_id: result.user_id,
            created_timestamp: result.created_timestamp, updated_timestamp: result.updated_timestamp};
        map[result.question_id].categories = [];
        map[result.question_id].answers = [];
        map[result.question_id].attachments = [];
    }

    for (let i=0; i<answerFileJoin.length; i++) {
        let result = answerFileJoin[i];
        answerMap[result.answer_id] = {};
        answerMap[result.answer_id].attachments = [];
    }

    for (let i=0; i<questionCategoryjoin.length; i++) {
        let result = questionCategoryjoin[i];
        mySet.add(result.question_id);
        if(result.category_id !== null) {
            map[result.question_id].categories.push({category_id: result.category_id, category: result.category});
        }
    }

    for (let i=0; i<questionFileJoin.length; i++) {
        let result = questionFileJoin[i];
        if(result.file_id !== null) {
            map[result.question_id].attachments.push({file_id: result.file_id,  file_name: result.file_name, s3_object_name: result.s3_object_name,
                created_date: result.created_date});
        }
    }

    for (let i=0; i<answerFileJoin.length; i++) {
        let result = answerFileJoin[i];
        if(result.file_id !== null) {
            console.log("answer file result", result);
            answerMap[result.answer_id].attachments.push({file_id: result.file_id,  file_name: result.file_name, s3_object_name: result.s3_object_name,
                created_date: result.created_date});
        }
    }

    for (let i=0; i<questionAnswerjoin.length; i++) {
        let result = questionAnswerjoin[i];
        if(result.answer_id !== null) {
            let answer = {answer_id: result.answer_id,  question_id: result.question_id, answer_text: result.answer_text, user_id: result.user_id,
                created_timestamp: result.created_timestamp, updated_timestamp: result.updated_timestamp, attachments: answerMap[result.answer_id].attachments};
            map[result.question_id].answers.push(answer);
        }
    }

    let payload = [];
    for (let item of mySet) {
        payload.push(map[item]);
    }
    console.log("payload" + payload);
    return payload;
};