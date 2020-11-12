const questionService = require("../services/QuestionService");
const userService = require("../services/UserService");
const answerService = require("../services/AnswerService");

const {v4: uuidv4} = require("uuid");
const auth = require('basic-auth');
const bcrypt = require("bcrypt");
const logger = require('../config/winston');
const sdc = require('../config/statsd');

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

exports.addQuestion = function (request, response) {
    let apiTimer = new Date();
    sdc.increment('addQuestion.counter');
    if(request.body.question_text === null || request.body.question_text === undefined || request.body.categories === undefined || request.body.question_text.length === 0) {
        logger.info("Bad request");
        response.status(400);
        response.json({
            status: 400,
            message: "Bad request"
        });
        return response;
    }

    const question = {
        question_id: uuidv4(),
        question_text: request.body.question_text,
        user_id: "",
        categories: []
    };

    let credentials = auth(request);
    if(credentials === undefined) {
        logger.info("Authentication error");
        response.status(401);
        response.json({
            status: 401,
            message: "Access Denied: Authentication error"
        });
        return response;
    } else {
        let returnEarly = false;
        request.body.categories.forEach(cat => {
            if(cat === undefined || cat === null || cat.category === null || cat.category.length === 0) {
                returnEarly = true;
                logger.info("Category cannot be empty");
                response.status(400);
                response.json({
                    status: 400,
                    message: "Category cannot be empty"
                });
            }
        });
        if (returnEarly)
        {
            return response;
        }
        request.body.categories.forEach(cat => cat.category = cat.category.toLowerCase());
        userService.findUserByUserName(credentials.name)
            .then((userResponse) => {
                if(userResponse != null && bcrypt.compareSync(credentials.pass, userResponse.password)) {
                    question.user_id = userResponse.id;
                    question.categories = request.body.categories;
                    questionService.addQuestion(question)
                        .then((successResponse) => {
                            sdc.timing('addQuestion.timer', apiTimer);
                            if(successResponse !== null) {
                                logger.info("Add question success");
                                response.status(200);
                                response.json(successResponse);
                                return response;
                            }
                            else{
                                sdc.timing('addQuestion.timer', apiTimer);
                                logger.info("Resource not found");
                                response.status(400);
                                response.json({
                                    status: 400,
                                    message: "Resource not found"
                                });
                                return response;
                            }

                        })
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
    };
};

exports.updateQuestion = function (request, response) {
    let apiTimer = new Date();
    sdc.increment('updateQuestion.counter');
    if(request.body.question_text === null || request.body.question_text === undefined || request.body.categories === undefined || request.body.question_text.length === 0) {
        logger.info("Bad request");
        response.status(400);
        response.json({
            status: 400,
            message: "Bad request"
        });
        return response;
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
    const updateQuestion = {
        question_id: request.params.question_id,
        question_text: request.body.question_text,
        user_id: "",
        categories: request.body.categories
    };

    const updateCatResponse = (updateResponse) => {
        logger.info("Update success");
        response.status(204);
        response.json({
            status: 204,
            message: "Update success"
        });
        return response;
    };

    const updateQuestionCategories = (updatedQuestion) => {
        sdc.timing('updateQuestion.timer', apiTimer);
        if (updatedQuestion != null) {
            if(request.body.categories !== undefined) {
                request.body.categories.forEach(cat => {
                    if(cat === undefined || cat === null || cat.category === null || cat.category.length === 0) {
                        logger.info("Category cannot be empty");
                        response.status(400);
                        response.json({
                            status: 400,
                            message: "Category cannot be empty"
                        });
                        return response;
                    }
                });
                request.body.categories.forEach(cat => cat.category = cat.category.toLowerCase());
                questionService.updateQuestionCategories(updateQuestion, request.body.categories)
                    .then(updateCatResponse)
                    .catch(handleDbError(response));
            } else{
                logger.info("Update success");
                response.status(204);
                response.json({
                    status: 204,
                    message: "Update success"
                });
                return response;
            }
        } else {
            logger.info("Question not found");
            response.status(404);
            response.json({
                status: 404,
                message: "Question not found"
            });
            return response;
        }
    };

    const handleQuestionResponse = (dbQuestion) => {
        if (dbQuestion != null) {
           if(dbQuestion.user_id === updateQuestion.user_id) {
                //update question_text and categories
               questionService.updateQuestion(updateQuestion)
                   .then(updateQuestionCategories)
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
                    //fetch question and validate if it is the user's
                    updateQuestion.user_id = userResponse.id;
                    questionService.findQuestionById(updateQuestion.question_id)
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

exports.deleteQuestion = function (request, response) {
    let apiTimer = new Date();
    sdc.increment('deleteQuestion.counter');
    if(!request.params.question_id) {
        logger.info("deleteQuestion: Bad Request");
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request"
        });
        return response;
    }

    const deleteQResponse = (deleteRes) => {
        sdc.timing('deleteQuestion.timer', apiTimer);
        if(deleteRes != null) {
            logger.info("Delete Question Success");
            response.status(204);
            response.json({
                status: 204,
                message: "Success"
            });
            return response;
        } else{
            logger.info("Not found");
            response.status(404);
            response.json({
                status: 404,
                message: "Not found"
            });
            return response;
        }
    };
    const allAnswerResponse = (answers) => {
        if(answers !== undefined && answers.length === 0) {
            questionService.deleteQuestion(request.params.question_id)
                .then(deleteQResponse)
                .catch(handleDbError(response));
        }else{
            logger.info("Questions with multiple answers cannot be deleted");
            response.status(400);
            response.json({
                status: 400,
                message: "Unsupported operation: Questions with multiple answers cannot be deleted"
            });
            return response;
        }
    };

    let userId = "";
    const handleGetSingleQuestionResponse = (dbQuestion) => {
        if (dbQuestion != null) {
            if(dbQuestion.user_id === userId) {
                // if more than one answer can't delete
                answerService.findAnswerByQuestionId(request.params.question_id)
                    .then(allAnswerResponse)
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
        } else {
            logger.info("Not found");
            response.status(404);
            response.json({
                status: 404,
                message: "Not found"
            });
            return response;
        }
    } ;
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
                    //fetch question and validate if it is the user's
                    userId = userResponse.id;
                    questionService.findQuestionById(request.params.question_id)
                        .then(handleGetSingleQuestionResponse)
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

exports.getQuestionById = function (request, response) {
    let apiTimer = new Date();
    sdc.increment('getQuestionById.counter');
    if(!request.params.question_id) {
        logger.info("Bad Request");
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request"
        });
        return response;
    }

    const getResponse = (questionRes) => {
        sdc.timing('getQuestion.timer', apiTimer);
        if(questionRes !== null) {
            logger.info("Get Question Success");
            response.status(200);
            response.json(questionRes);
            return response;
        } else{
            logger.info("Bad Request");
            response.status(400);
            response.json({
                status: 400,
                message: "Bad Request"
            });
            return response;
        }
    };

    const questionExistResponse = (questionRes) => {
        if(questionRes !== null) {
            questionService.getQuestion(request.params.question_id)
                .then(getResponse)
                .catch(handleDbError(response));
        } else{
            logger.info("Question not found");
            response.status(404);
            response.json({
                status: 404,
                message: "Question not found"
            });
            return response;
        }
    };
    questionService.findQuestionById(request.params.question_id)
        .then(questionExistResponse)
        .catch(handleDbError(response));

};

exports.getQuestions = function (request, response) {
    let apiTimer = new Date();
    sdc.increment('getQuestions.counter');
    const questionsRes = (questionRes) => {
        sdc.timing('getQuestions.timer', apiTimer);
        if(questionRes !== null) {
            logger.info("Get Questions Success");
            response.status(200);
            response.json(questionRes);
            return response;
        } else{
            logger.info("Bad request");
            response.status(400);
            response.json({
                status: 400,
                message: "Bad Request"
            });
            return response;
        }
    };
    questionService.getQuestions()
        .then(questionsRes)
        .catch(handleDbError(response));
};