const questionService = require("../services/QuestionService");
const userService = require("../services/UserService");
const db = require("../models");
const Question = db.question;
const Category =  db.categories;

const {v4: uuidv4} = require("uuid");
const auth = require('basic-auth');
const bcrypt = require("bcrypt");



// exports.createQuestion = function (request, response) {
//     let question_id = "";
// // Validate Question Request
//
//     if(request.body.question_text === null || request.body.question_text.length === 0) {
//         console.log("error creating question");
//         response.json({
//             status: 400,
//             message: "Bad request: Question text cannot be empty"
//         });
//     }
//
//     const question = {
//         question_id: uuidv4(),
//         question_text: request.body.question_text,
//         user_id: ""
//     };
//
//     const handleFindAllCats = (allCatRes) => {
//         console.log(" Find All cats" + allCatRes);
//         if (allCatRes != null) {
//            let filterCats =  catService.filterCategories(allCatRes, request.body.categories);
//            if(filterCats.length === 0) {
//                catService.addAllQuestionCategoryIds(request.body.categories, question_id)
//                    .then(() => {
//                        response.status(200);
//                        response.json({
//                            status: 200,
//                            message: "OK"
//                        })
//                        return response;
//                    })
//                    .catch(handleDbError(response));
//            }else{
//                catService.insertNonExistCategory(filterCats)
//                 .then(() => {
//                     catService.addAllQuestionCategoryIds(request.body.categories, question_id);
//                     response.status(200);
//                     response.json({
//                         status: 200,
//                         message: "OK"
//                     })
//                     return response;
//                 });
//            }
//         }
//     };
//
//     const handleCreateQuestionResponse = (successResponse) => {
//         if (successResponse != null) {
//             console.log("^^^success creating question", successResponse);
//             question_id = successResponse.question_id;
//             if(!request.body.categories || request.body.categories.length === 0) {
//                 response.status(200);
//                 response.json(successResponse);
//                 return response;
//             }
//             console.log("findCats");
//             catService.findAll()
//                 .then(handleFindAllCats)
//                 .catch(handleDbError(response));
//         } else {
//             console.log("error creating question");
//             response.json({
//                 status: 500,
//                 message: "Server error: Error in creating user account"
//             });
//             return response;
//         }
//     };
//
//     const handleFindByUserNameResponse = (userResponse) => {
//         if(userResponse != null && bcrypt.compareSync(credentials.pass, userResponse.password)) {
//             question.user_id = userResponse.id;
//             console.log("*****", request.body.categories);
//             questionService.addQuestion(question)
//                 .then(handleCreateQuestionResponse)
//                 .catch(handleDbError(response));
//         } else{
//             setAccessDeniedResponse(userResponse);
//             return userResponse;
//         }
//     };
//
//     let credentials = auth(request);
//     if(credentials === undefined) {
//         setAccessDeniedResponse(response);
//         return response;
//     } else {
//         userService.findUserByUserName(credentials.name)
//             .then(handleFindByUserNameResponse)
//             .catch(handleDbError(response));
//     }
// };
//
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
                    questionService.addQuestion_(question)
                        .then((successResponse) => {
                            let questionPayload = questionService.get(question.question_id);
                            let prom = questionPayload._promise;
                            let _question = questionPayload._question;
                            let out = {};
                            prom.then((object) => {
                                    out.question_id = _question.question_id;
                                    out.created_timestamp = _question.createdAt;
                                    out.updated_timestamp = _question.updatedAt;
                                    out.user_id = _question.user_id;
                                    out.question_text = _question.question_text;
                                    out.categories = object;
                                    response.status(200);
                                    response.write(JSON.stringify(out));
                            }).catch(() => console.log("in map's catch"));
                            return response;
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
    if(!request.params.question_id || request.params.question_id === null) {
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
        categories: []
    };

    const handleQuestionResponse = (dbQuestion) => {
        if (dbQuestion != null) {
           if(dbQuestion.user_id === updateQuestion.user_id) {

           } else{
               response.status(401);
               response.json({
                   status: 401,
                   message: "Access Denied: Authentication error"
               });
               return response;
           }
        } else {
            response.status(400);
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
