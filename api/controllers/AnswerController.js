const questionService = require("../services/QuestionService");
const userService = require("../services/UserService");
const answerService = require("../services/AnswerService");
const {v4: uuidv4} = require("uuid");
const auth = require('basic-auth');
const bcrypt = require("bcrypt");
const db = require("../models");
const sdc = require('../config/statsd');
const Answer = db.answer;
const logger = require('../config/winston');
const awsConfig = require('../config/s3config');

const handleDbError = (response) => {
    const errorCallBack = (error) => {
        if (error) {
            logger.error(error);
            response.status(400);
            response.json({
                status: 400,
                message: "Unable to perform operation"
            });
        }
    };
    return errorCallBack;
};

exports.addAnswer = function (request, response) {
    let apiTimer = new Date();
    sdc.increment('addAnswer.counter');
    if(request.body.answer_text === null || request.body.answer_text === undefined || request.body.answer_text.length === 0 ) {
        logger.info("Answer text cannot be empty");
        response.status(400);
        response.json({
            status: 400,
            message: "Bad request: Answer text cannot be empty"
        });
        return;
    }
    if(!request.params.question_id) {
        logger.info("Bad request");
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request"
        });
        return response;
    }
    let userCredentials = auth(request);
    const answer = {
        answer_id: uuidv4(),
        answer_text: request.body.answer_text,
        user_id: "",
        question_id: request.params.question_id
    };
    const handleAnswerResponse = (answerResponse) => {
        sdc.timing('createAnswerAPI.timer', apiTimer);
        if(answerResponse != null) {
            response.status(200);
            response.json(answerResponse);
            logger.info("Create answer success");
            logger.info("Constructing message.......................");
            logger.info("question-id" + answerResponse.question_id);
            let userEmail = getEmailOfQuestionUser(answerResponse.question_id);
            let message = "QuestionId: "  + answerResponse.question_id + " posted by " + userEmail + " just got answered. AnswerId: " + answerResponse.answer_id +
                " Text: " + answerResponse.answer_text + " Please click here to view your question: "
                + "http://api.dev.aashok.me/v1/question/"+answerResponse.question_id + " Please click here to view your answer:  http://api.dev.aashok.me/v1/question/" +answerResponse.question_id +"/answer/"+answerResponse.answer_id ;
            logger.info("SNS MESSAGE -----" + message);
            let payload = {
                default: 'Hello World',
                data: {
                    Email: userEmail,
                    Answer: answerResponse,
                    Message: message,
                    Subject: "Answer Posted for Question"
                }
            };
            payload.data = JSON.stringify(payload.data);
            payload = JSON.stringify(payload);
            sendSNSMessage(answerResponse, payload);
            return response;
        } else{
            logger.info("Failed to save answer to db");
            response.status(400);
            response.json({
                status: 400,
                message: "Internal error"
            });
            return response;
        }
    };

    const handleQuestionResponse = (dbQuestion) => {
        if (dbQuestion != null) {
            answerService.createAnswer(answer)
                .then(handleAnswerResponse)
                .catch(handleDbError);
        } else {
            logger.info("Question not found");
            response.status(404);
            response.json({
                status: 404,
                message: "Question not found"
            });
            return response;
        }
    } ;

    if(userCredentials === undefined) {
        logger.info("Authentication error");
        response.status(401);
        response.json({
            status: 401,
            message: "Access Denied: Authentication error"
        });
        return response;
    } else {
        userService.findUserByUserName(userCredentials.name)
            .then((userResponse) => {
                if(userResponse != null && bcrypt.compareSync(userCredentials.pass, userResponse.password)) {
                    answer.user_id = userResponse.id;
                    questionService.findQuestionById(answer.question_id)
                        .then(handleQuestionResponse)
                        .catch(handleDbError(response));
                } else{
                    logger.info("Authentication error");
                    response.status(401);
                    response.json({
                        status: 401,
                        message: "Access Denied: Authentication error"
                    });
                    return response;
                }
            })
            .catch(handleDbError(response));
    }
};

exports.updateAnswer = function (request, response) {
    let apiTimer = new Date();
    sdc.increment('updateAnswer.counter');
    if(!request.params.question_id) {
        logger.info("Question id is required");
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request: Question id is required"
        });
        return response;
    }
    if(!request.params.answer_id) {
        logger.info("Answer id is required");
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request: Answer id is required"
        });
        return response;
    }
    if(request.body.answer_text === null || request.body.answer_text === undefined|| request.body.answer_text.length === 0) {
        logger.info("Answer text cannot be empty");
        response.status(400);
        response.json({
            status: 400,
            message: "Bad request: Answer text cannot be empty"
        });
        return;
    }
    let tempAnswer;
    const handleUpdateResponse = (updateAnswer) => {
        sdc.timing('updateAnswerAPI.timer', apiTimer);
        if(updateAnswer != null) {
            logger.info("Answer updated successfully");
            response.status(204);
            response.json({
                status: 204,
                message: "Answer updated successfully"
            });
            logger.info("Constructing message.......................");
            logger.info("question-id", tempAnswer.question_id);
            let userEmail = getEmailOfQuestionUser(tempAnswer.question_id);
            let message = "QuestionId: "  + tempAnswer.question_id + " posted by " + userEmail + ". AnswerId: " + tempAnswer.answer_id +
                " Text: " + tempAnswer.answer_text + " Please click here to view your question: "
                + "http://api.dev.aashok.me/v1/question/"+tempAnswer.question_id + " Please click here to view your answer:  http://api.dev.aashok.me/v1/question/"
                + tempAnswer.question_id
                +"/answer/"+tempAnswer.answer_id ;
            logger.info("SNS MESSAGE -----" + message);
            let payload = {
                default: 'Hello World',
                data: {
                    Email: userEmail,
                    Answer: updateAnswer,
                    Message: message,
                    Subject: "Answer Updated"
                }
            };
            payload.data = JSON.stringify(payload.data);
            payload = JSON.stringify(payload);
            sendSNSMessage(updateAnswer, payload);
            return response;
        } else {
            logger.info("Error in updating answer");
            response.status(400);
            response.json({
                status: 400,
                message: "Error in updating answer"
            });
            return response;
        }
    };

    const getAnswerResponse = (answerResponse) => {
        if(answerResponse != null) {
            tempAnswer = answerResponse;
            if (answerResponse.question_id === request.params.question_id) {
                let userCredentials = auth(request);
                if(userCredentials === undefined) {
                    logger.info("Authentication error");
                    response.status(401);
                    response.json({
                        status: 401,
                        message: "Access Denied: Authentication error"
                    });
                    return response;
                } else {
                    userService.findUserByUserName(userCredentials.name)
                        .then((userResponse) => {
                            if(userResponse != null && bcrypt.compareSync(userCredentials.pass, userResponse.password)) {
                                if(userResponse.id === answerResponse.user_id) {
                                    answerService.updateAnswer(request.body.answer_text, answerResponse.answer_id)
                                        .then(handleUpdateResponse)
                                        .catch(handleDbError(response));
                                } else{
                                    logger.info("Authentication error");
                                    response.status(401);
                                    response.json({
                                        status: 401,
                                        message: "Access Denied: Authentication error"
                                    });
                                    return response;
                                }
                            } else{
                                logger.info("Authentication error");
                                response.status(401);
                                response.json({
                                    status: 401,
                                    message: "Access Denied: Authentication error"
                                });
                                return response;
                            }
                        })
                        .catch(handleDbError(response));
                };
            } else{
                logger.info("Answer does not belong to given question");
                response.status(400);
                response.json({
                    status: 400,
                    message: "Bad request: Answer does not belong to given question"
                });
                return response;
            }
        } else{
            logger.info("Answer not found");
            response.status(404);
            response.json({
                status: 404,
                message: "Answer not found"
            });
            return response;
        }
    };
    answerService.findAnswerByAnswerId(request.params.answer_id)
        .then(getAnswerResponse)
        .catch(handleDbError(response));
};

exports.deleteAnswer = function (request, response) {
    let apiTimer = new Date();
    sdc.increment('deleteAnswer.counter');
    if(!request.params.question_id) {
        logger.info("Question id is required");
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request: Question id is required"
        });
        return response;
    }
    if(!request.params.answer_id) {
        logger.info("Answer id is required");
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request: Answer id is required"
        });
        return response;
    }

    let tempAnswer;

    const handleDeleteResponse = (deleteAnswer) => {
        sdc.timing('deleteAnswerAPI.timer', apiTimer);
        if(deleteAnswer != null) {
            logger.info("Answer deleted successfully");
            response.status(200);
            response.json({
                status: 200,
                message: "Answer deleted successfully"
            });
            logger.info("Constructing message.......................");
            logger.info("question-id", tempAnswer.question_id);
            let userEmail = getEmailOfQuestionUser(tempAnswer.question_id);
            let message = "QuestionId: "  + tempAnswer.question_id + " posted by " + userEmail + ". AnswerId: " + tempAnswer.answer_id +
                " Text: " + tempAnswer.answer_text + " Please click here to view your question: "
                + "http://api.dev.aashok.me/v1/question/"+tempAnswer.question_id + " Please click here to view your answer:  http://api.dev.aashok.me/v1/question/"
                + tempAnswer.question_id
                +"/answer/"+tempAnswer.answer_id ;
            logger.info("SNS MESSAGE -----" + message);
            let payload = {
                default: 'Hello World',
                data: {
                    Email: userEmail,
                    Answer: tempAnswer,
                    Message: message,
                    Subject: "Answer Updated"
                }
            };
            payload.data = JSON.stringify(payload.data);
            payload = JSON.stringify(payload);
            sendSNSMessage(tempAnswer, payload);
            return response;
        } else {
            logger.info("Answer not found");
            response.status(404);
            response.json({
                status: 404,
                message: "Answer: Not found"
            });
            return response;
        }
    };

    const getAnswerResponse = (answerResponse) => {
        if(answerResponse != null) {
            tempAnswer = answerResponse;
            if (answerResponse.question_id === request.params.question_id) {
                let userCredentials = auth(request);
                if(userCredentials === undefined) {
                    logger.info("Authentication error");
                    response.status(401);
                    response.json({
                        status: 401,
                        message: "Access Denied: Authentication error"
                    });
                    return response;
                } else {
                    userService.findUserByUserName(userCredentials.name)
                        .then((userResponse) => {
                            if(userResponse != null && bcrypt.compareSync(userCredentials.pass, userResponse.password)) {
                                if(userResponse.id === answerResponse.user_id) {
                                    answerService.deleteAnswer(answerResponse.answer_id)
                                        .then(handleDeleteResponse)
                                        .catch(handleDbError(response));
                                } else{
                                    logger.info("Authentication error");
                                    response.status(401);
                                    response.json({
                                        status: 401,
                                        message: "Access Denied: Authentication error"
                                    });
                                    return response;
                                }
                            } else{
                                logger.info("Authentication error");
                                response.status(401);
                                response.json({
                                    status: 401,
                                    message: "Access Denied: Authentication error"
                                });
                                return response;
                            }
                        })
                        .catch(handleDbError(response));
                };
            } else{
                logger.info("Answer does not belong to given question");
                response.status(401);
                response.json({
                    status: 401,
                    message: "Access denied: Answer does not belong to given question"
                });
                return response;
            }
        } else{
            logger.info("Answer not found");
            response.status(404);
            response.json({
                status: 404,
                message: "Answer not found"
            });
            return response;
        }
    };
    answerService.findAnswerByAnswerId(request.params.answer_id)
        .then(getAnswerResponse)
        .catch(handleDbError(response));
};

exports.getAnswer = function (request, response) {
    let apiTimer = new Date();
    sdc.increment('getAnswer.counter');
    if(!request.params.question_id) {
        logger.info("Question id is required");
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request: Question id is required"
        });
        return response;
    }
    if(!request.params.answer_id) {
        logger.info("Answer id is required");
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request: Answer id is required"
        });
        return response;
    }

    const getResponse = (answerRes) => {
        sdc.timing('getAnswerAPI.timer', apiTimer);
        if(answerRes != null) {
            console.log(answerRes.question_id === request.params.question_id);
            if(answerRes.question_id.toString().trim() === request.params.question_id.toString().trim()) {
                logger.info("Get answer successfully");
                response.status(200);
                response.json(answerRes);
                return response;
            } else {
                logger.info("Not found");
                response.status(404);
                response.json({
                    status: 404,
                    message: "Not found"
                });
                return response;
            }
        } else {
            logger.info("Answer Not found");
            response.status(404);
            response.json({
                status: 404,
                message: "Answer not found"
            });
            return response;
        }
    };

    answerService.findAnswerByAnswerId(request.params.answer_id)
        .then(getResponse)
        .catch(handleDbError(response));
};

function getEmailOfQuestionUser(question_id) {
    logger.info("questionid----"+question_id);
    questionService.getQuestion(question_id)
        .then((question) => {
            logger.info("question----"+question);
            userService.findUserByUserId(question.user_id)
                .then((user) => {
                    return user.email;
                })
                .catch(logger.info("unable to find user"));
        })
        .catch(logger.info("unable to find question"));
}

function sendSNSMessage (answer, message) {
        logger.info("Sending sns.......................");
        logger.info("SNS MESSAGE -----------------", message);
        let params = {
            Message: message,
            Subject: "Answer posted",
            TopicArn: process.env.TOPICARN
        };
    awsConfig.sns.publish(params, function(err, data) {
        if (err) {
            logger.error(err);
        } else {
            logger.info("published sns successfully");
            logger.info("sns publish success" + data);
        }
        return;
    });
}