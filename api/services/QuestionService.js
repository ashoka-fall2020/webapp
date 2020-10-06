/* Question related services create question, get question*/
const db = require("../models");
const Question = db.question;

exports.addQuestion = function (question) {
    const newQuestion = new Question(question);
    let save = newQuestion.save();
    return save;
};