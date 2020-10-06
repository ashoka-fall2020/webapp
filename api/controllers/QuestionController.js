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

let setAccessDeniedResponse = function (response) {
    response.status(401);
    let apiResponse = response.json({
        status: 401,
        message: "Access Denied: Authentication error"
    });
    return apiResponse;
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
        setAccessDeniedResponse(response);
        return response;
    } else {
        userService.findUserByUserName(credentials.name)
            .then((userResponse) => {
                if(userResponse != null && bcrypt.compareSync(credentials.pass, userResponse.password)) {
                    question.user_id = userResponse.id;
                    question.categories = request.body.categories;
                    questionService.addQuestion_(question)
                        .then((successResponse) => {
                            response.status(200);
                            response.json(successResponse);
                            return response;
                        })
                        .catch(handleDbError(response));
                } else{
                    setAccessDeniedResponse(userResponse);
                    return userResponse;
                }
            })
            .catch(handleDbError(response));
    };
}