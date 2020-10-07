const questionService = require("../services/QuestionService");
const userService = require("../services/UserService");
const answerService = require("../services/AnswerService");
const db = require("../models");
const Question = db.question;
const Category =  db.categories;

const {v4: uuidv4} = require("uuid");
const auth = require('basic-auth');
const bcrypt = require("bcrypt");



const handleDbError = (response) => {
    const errorCallBack = (error) => {
        if (error) {
            response.status(500);
            response.json({
                status: 500,
                message: error.message
            });
        }
    };
    return errorCallBack;
};

exports.addQuestion = function (request, response) {

    if(request.body.question_text === null || request.body.question_text.length === 0) {
        console.log("error creating question");
        response.json({
            status: 400,
            message: "Bad request: Question text cannot be empty"
        });
        return;
    }

    const question = {
        question_id: uuidv4(),
        question_text: request.body.question_text,
        user_id: "",
        categories: []
    };

    let credentials = auth(request);
    if(credentials === undefined) {
        response.status(401);
        response.json({
            status: 401,
            message: "Access Denied: Authentication error"
        });
        return response;
    } else {
        userService.findUserByUserName(credentials.name)
            .then((userResponse) => {
                if(userResponse != null && bcrypt.compareSync(credentials.pass, userResponse.password)) {
                    question.user_id = userResponse.id;
                    question.categories = request.body.categories;
                    questionService.addQuestion(question)
                        .then((successResponse) => {
                            if(successResponse !== null) {
                                response.status(200);
                                response.json(successResponse);
                                return response;
                            }
                            else{
                                console.log("iam here");
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
                    console.log("iam here");
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
    if(request.body.question_text === null || request.body.question_text.length === 0) {
        console.log("error updating question");
        response.json({
            status: 400,
            message: "Bad request: Question text cannot be empty"
        });
        return;
    }
    if(!request.params.question_id) {
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

    const updateQuestionCategories = (updatedQuestion) => {
        if (updatedQuestion != null) {
            if(request.body.categories !== undefined) {
                questionService.updateQuestionCategories(updateQuestion, request.body.categories)
                response.status(200);
                response.json({
                    status: 200,
                    message: "Update success"
                });
                return response;
            } else{
                response.status(200);
                response.json({
                    status: 200,
                    message: "Update success"
                });
            }
        } else {
            response.status(404);
            response.json({
                status: 404,
                message: "Not found"
            });
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
               response.status(401);
               response.json({
                   status: 401,
                   message: "Access Denied: Authentication error"
               });
               return response;
           }
        } else {
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
                    console.log("iam here");
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

exports.deleteQuestion = function (request, response) {
    if(!request.params.question_id) {
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request"
        });
        return response;
    }

    const deleteQResponse = (deleteRes) => {
        if(deleteRes != null) {
            response.status(204);
            response.json({
                status: 204,
                message: "Success"
            });
            return response;
        } else{
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
            response.status(401);
            response.json({
                status: 401,
                message: "Access Denied: Authentication error"
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
                response.status(401);
                response.json({
                    status: 401,
                    message: "Access Denied: Authentication error"
                });
                return response;
            }
        } else {
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

exports.getQuestionById = function (request, response) {
    if(!request.params.question_id) {
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request"
        });
        return response;
    }

    const getResponse = (questionRes) => {
        if(questionRes !== null) {
            response.status(200);
            response.json(questionRes);
            return response;
        } else{
            response.status(400);
            response.json({
                status: 400,
                message: "Bad Request"
            });
            return response;
        }
    };

    questionService.getQuestion(request.params.question_id)
        .then(getResponse)
        .catch(handleDbError(response));
};

exports.getQuestions = function (request, response) {
    const questionsRes = (questionRes) => {
        if(questionRes !== null) {
            console.log("res", questionRes);
            response.status(200);
            response.json(questionRes);
            return response;
        } else{
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