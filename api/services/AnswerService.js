const db = require("../models");
const Answer = db.answer;
const File = db.file;
const s3 = require('../config/s3config');
const sdc = require('../config/statsd');

exports.createAnswer = async function (answer) {
    const newAnswer = new Answer(answer);
    let timer = new Date();
    const dbAnswer = await newAnswer.save();
    sdc.timing('createQuestionQuery.timer', timer);
    return exports.findAnswerByAnswerId(dbAnswer.answer_id);
};

exports.updateAnswer = function (answer_text, answer_id) {
    let timer = new Date();
    const promise = Answer.update({
            answer_text: answer_text
        }, {
            where: {answer_id: answer_id}
        }
    );
    sdc.timing('updateQuestionQuery.timer', timer);
    return promise;
};

exports.deleteAnswer = async function (answer_id) {
    let files = await File.findAll({
        where:{answer_id: answer_id}
    });
    if (files !== null && files !== undefined && files.length > 0) {
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
        await s3.s3.deleteObjects(options).promise();
        await File.destroy({
            where:{answer_id: answer_id}
        });
    }
    let timer = new Date();
    const deleteRes = Answer.destroy({
        where: {answer_id: answer_id}
    });
    sdc.timing('deleteAnswerQuery.timer', timer);
    return deleteRes;
};

exports.findAnswerByAnswerId = async function (answer_id) {
    let out = {};
    let timer = new Date();
    let answer = await Answer.findOne({
        where:{answer_id: answer_id}
    });
    sdc.timing('findAnswerQuery.timer', timer);
    if(answer !== null && answer !== undefined) {
        let attachments = await File.findAll({
            where:{answer_id: answer_id},
            attributes: { exclude: ['updatedAt', 'question_id', 'answer_id', 'user_id', 'e_tag', 'content_type', 'content_length', 'accept_ranges'] }
        });
        out.answer_id = answer.answer_id;
        out.answer_text = answer.answer_text;
        out.question_id = answer.question_id;
        out.user_id = answer.user_id;
        out.created_timestamp = answer.created_timestamp;
        out.updated_timestamp = answer.updated_timestamp;
        out.attachments = attachments;
        return out;
    } else{
        return answer;
    }
};

exports.findAnswerByQuestionId = function (question_id) {
    let timer = new Date();
    const promise = Answer.findAll({
        where:{question_id: question_id}
    });
    sdc.timing('findAnswerByQuestionIdQuery.timer', timer);
    return promise;
};