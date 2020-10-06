const db = require("../models");
const Answer = db.answer;

exports.createAnswer = function (answer) {
    const newAnswer = new Answer(answer);
    const promise = newAnswer.save();
    return promise;
};

exports.updateAnswer = function (answer_text, answer_id) {
    const promise = Answer.update({
            answer_text: answer_text
        }, {
            where: {answer_id: answer_id}
        }
    );
    return promise;
};


exports.deleteAnswer = function (answer_id) {
    const deleteRes = Answer.destroy({
        where: {answer_id: answer_id}
    });
    return deleteRes;
};

exports.findAnswerByAnswerId = function (answer_id) {
    const promise = Answer.findOne({
        where:{answer_id: answer_id}
    });
    return promise;
};
