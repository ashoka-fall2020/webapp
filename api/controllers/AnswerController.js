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
            logger.info("Create answer success");
            sendSNSMessage(userCredentials.name, request.params.question_id, answerResponse);
            response.status(200);
            response.json(answerResponse);
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

    const handleUpdateResponse = (updateAnswer) => {
        sdc.timing('updateAnswerAPI.timer', apiTimer);
        if(updateAnswer != null) {
            logger.info("Answer updated successfully");
            response.status(204);
            response.json({
                status: 204,
                message: "Answer updated successfully"
            });
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

    const handleDeleteResponse = (deleteAnswer) => {
        sdc.timing('deleteAnswerAPI.timer', apiTimer);
        if(deleteAnswer != null) {
            logger.info("Answer deleted successfully");
            response.status(200);
            response.json({
                status: 200,
                message: "Answer deleted successfully"
            });
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

exports.sendSNSMessage = function (email, question_id, answer) {
        logger.info("Sending sns.......................");
        let message = "QuestionId: "  + question_id + "posted by " + email + "just got answered. AnswerId: " + answer.answer_id +
        "Text: " + answer.answer_text + "Please click here to view your question: "
        + "api.dev.aashok.me/v1/"+question_id + "Please click here to view your answer:  api.dev.aashok.me/v1/" +question_id +"/answer/"+answer_id ;
        logger.info("SNS MESSAGE -----------------", message);
        let params = {
            Email: email,
            Message: message,
            Subject: "Answer posted",
            TopicArn: "arn:aws:sns:us-east-1:825807991620:email-service-topic"
        };
    awsConfig.sns.publish(params, function(err, data) {
        if (err) {
            logger.error(err);
        } else {
            logger.info("published sns successfully");
            logger.info("sns publish success" + data);
        }
    });
};