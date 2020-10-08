const questionService = require("../services/QuestionService");
const userService = require("../services/UserService");
const answerService = require("../services/AnswerService");
const {v4: uuidv4} = require("uuid");
const auth = require('basic-auth');
const bcrypt = require("bcrypt");
const db = require("../models");
const Answer = db.answer;

const handleDbError = (response) => {
    const errorCallBack = (error) => {
        if (error) {
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
    if(request.body.answer_text === null || request.body.answer_text === undefined || request.body.answer_text.length === 0 ) {
        console.log("error creating answer");
        response.json({
            status: 400,
            message: "Bad request: Answer text cannot be empty"
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

    const answer = {
        answer_id: uuidv4(),
        answer_text: request.body.answer_text,
        user_id: "",
        question_id: request.params.question_id
    };
    const handleAnswerResponse = (answerResponse) => {
        console.log("answer created");
        if(answerResponse != null) {
            console.log("answer created");
            response.status(200);
            response.json(answerResponse);
            return response;
        } else{
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
            console.log("valid question id");
            answerService.createAnswer(answer)
                .then(handleAnswerResponse)
                .catch(handleDbError);
        } else {
            console.log("invalid question");
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
                    console.log("user response: " + userResponse.id);
                    answer.user_id = userResponse.id;
                    questionService.findQuestionById(answer.question_id)
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

exports.updateAnswer = function (request, response) {
    if(!request.params.question_id) {
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request: Question id is required"
        });
        return response;
    }
    if(!request.params.answer_id) {
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request: Answer id is required"
        });
        return response;
    }
    if(request.body.answer_text === null || request.body.answer_text === undefined|| request.body.answer_text.length === 0) {
        console.log("error creating answer");
        response.json({
            status: 400,
            message: "Bad request: Answer text cannot be empty"
        });
        return;
    }

    const handleUpdateResponse = (updateAnswer) => {
        if(updateAnswer != null) {
            response.status(204);
            response.json({
                status: 204,
                message: "Answer updated successfully"
            });
            return response;
        } else {
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
                                    response.status(401);
                                    response.json({
                                        status: 401,
                                        message: "Access Denied: Authentication error"
                                    });
                                    return response;
                                }
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
            } else{
                response.status(400);
                response.json({
                    status: 400,
                    message: "Bad request: Answer does not belong to given question"
                });
                return response;
            }
        } else{
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
    if(!request.params.question_id) {
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request: Question id is required"
        });
        return response;
    }
    if(!request.params.answer_id) {
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request: Answer id is required"
        });
        return response;
    }

    const handleDeleteResponse = (deleteAnswer) => {
        if(deleteAnswer != null) {
            response.status(200);
            response.json({
                status: 200,
                message: "Answer deleted successfully"
            });
            return response;
        } else {
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
                                    response.status(401);
                                    response.json({
                                        status: 401,
                                        message: "Access Denied: Authentication error"
                                    });
                                    return response;
                                }
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
            } else{
                response.status(401);
                response.json({
                    status: 401,
                    message: "Access denied: Answer does not belong to given question"
                });
                return response;
            }
        } else{
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
    if(!request.params.question_id) {
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request: Question id is required"
        });
        return response;
    }
    if(!request.params.answer_id) {
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request: Answer id is required"
        });
        return response;
    }

    const getResponse = (answerRes) => {
        if(answerRes != null) {
            if(answerRes.question_id === request.params.question_id) {
                response.status(200);
                response.json(answerRes);
                return response;
            } else{
                response.status(404);
                response.json({
                    status: 404,
                    message: "Not found"
                });
                return response;
            }
            response.status(204);
            response.json({
                status: 204,
                message: "Answer deleted successfully"
            });
            return response;
        } else {
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