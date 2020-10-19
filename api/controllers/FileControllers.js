const fileService = require("../services/FileService");
const questionService = require("../services/QuestionService");
const userService = require("../services/UserService");
const answerService = require("../services/AnswerService");
const {v4: uuidv4} = require("uuid");
const auth = require('basic-auth');
const bcrypt = require("bcrypt");

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

exports.uploadFileForQuestion = function (request, response) {
    if(!request.params.question_id) {
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request"
        });
        return response;
    }
    let credentials = auth(request);
    if(credentials === undefined) {
        response.status(401);
        response.json({
            status: 401,
            message: "Access Denied: Authentication error"
        });
        return response;
    }
    const file = {
        question_id: request.params.question_id,
        user_id: "",
        file_name: "",
        s3_object_name: "",
        file_id: uuidv4()
    };

    const handleSuccess = (result) => {
        if(result === undefined || result === null)  {
            response.status(400);
            response.json({
                status: 400,
                message: "S3 upload failed"
            });
        } else{
            response.status(200);
            response.json({
                status: 200,
                message: "File upload successfully"
            });
        }
        return response;
    };

    const s3UploadSuccessResponse = (result) => {
        if(result === undefined || result === null)  {
            response.status(400);
            response.json({
                status: 400,
                message: "S3 upload failed"
            });
            return response;
        } else {
            fileService.uploadFileForQuestion(request, file)
                .then(handleSuccess)
                .catch(handleDbError(response));
        }
    };

    const handleQuestionResponse = (dbQuestion) => {
        if (dbQuestion != null) {
            if(dbQuestion.user_id === file.user_id) {
                //upload file
                console.log("upload file");
                fileService.uploadFileToS3(request)
                    .then(s3UploadSuccessResponse)
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
                message: "Question not found"
            });
            return response;
        }
    };
    userService.findUserByUserName(credentials.name)
        .then((userResponse) => {
            if(userResponse != null && bcrypt.compareSync(credentials.pass, userResponse.password)) {
                //fetch question and validate if it is the user's
                file.user_id = userResponse.id;
                questionService.findQuestionById(file.question_id)
                    .then(handleQuestionResponse)
                    .catch(handleDbError(response));
            } else {
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

exports.deleteFileForQuestion = function (request, response) {
    if(!request.params.question_id) {
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request: Question not found"
        });
        return response;
    }
    if(!request.params.file_id) {
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request: File not found"
        });
        return response;
    }
    let credentials = auth(request);
    if(credentials === undefined) {
        response.status(401);
        response.json({
            status: 401,
            message: "Access Denied: Authentication error"
        });
        return response;
    }

    var tempFile = {
        question_id: request.params.question_id,
        user_id: "",
        file_name: "",
        s3_object_name: "",
        file_id: uuidv4()
    };

    const deleteFileSuccess = (result) => {
        if(result !== null) {
            console.log(" file delete success");
            response.status(200);
            response.json({
                status: 200,
                message: "File deleted successfully"
            });
        } else {
            response.status(400);
            response.json({
                status: 400,
                message: "Error in deleting file"
            });
        }
        return response;
    };

    const deleteFileS3Success = (result) => {
        if(result !== null) {
            console.log("delete s3 success");
            fileService.deleteFileDetails(tempFile)
                .then(deleteFileSuccess)
                .catch(handleDbError(response));
        } else {
            response.status(400);
            response.json({
                status: 400,
                message: "Error in deleting file"
            });
            return response;
        }
    };

    const getFileSuccess = (dbFile) => {
        if(dbFile !== null || dbFile !== undefined) {
            if(dbFile.user_id === tempFile.user_id && dbFile.question_id === tempFile.question_id) {
                // delete file from s3 and db;
                tempFile = dbFile;
                console.log("dbFile", dbFile);
                fileService.deleteFileFromS3(dbFile)
                    .then(deleteFileS3Success)
                    .catch(handleDbError(response));
            } else{
                response.status(404);
                response.json({
                    status: 404,
                    message: "File not found"
                });
                return response;
            }
        } else{
            response.status(404);
            response.json({
                status: 404,
                message: "File not found"
            });
            return response;
        }
    };
    const handleQuestionResponse = (dbQuestion) => {
        if (dbQuestion != null) {
            if(dbQuestion.user_id === tempFile.user_id) {
                //upload file
                tempFile.question_id = dbQuestion.question_id;
                console.log("get file details");
                fileService.getFileDetails(request)
                    .then(getFileSuccess)
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
                message: "Question not found"
            });
            return response;
        }
    };
    userService.findUserByUserName(credentials.name)
        .then((userResponse) => {
            if(userResponse != null && bcrypt.compareSync(credentials.pass, userResponse.password)) {
                //fetch question and validate if it is the user's
                tempFile.user_id = userResponse.id;
                questionService.findQuestionById(tempFile.question_id)
                    .then(handleQuestionResponse)
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

exports.uploadFileForAnswer = function (request, response) {
    if(!request.params.question_id) {
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request"
        });
        return response;
    }
    if(!request.params.answer_id) {
            response.status(400);
            response.json({
                status: 400,
                message: "Bad Request"
            });
            return response;
    }
    let credentials = auth(request);
    if(credentials === undefined) {
        response.status(401);
        response.json({
            status: 401,
            message: "Access Denied: Authentication error"
        });
        return response;
    }

    const file = {
        question_id: request.params.question_id,
        user_id: "",
        file_name: "",
        s3_object_name: "",
        file_id: uuidv4()
    };

    const handleSuccess = (result) => {
        if(result === undefined || result === null)  {
            response.status(400);
            response.json({
                status: 400,
                message: "S3 upload failed"
            });
        } else{
            response.status(200);
            response.json({
                status: 200,
                message: "File uploaded successfully"
            });
        }
        return response;
    };

    const s3UploadSuccessResponse = (result) => {
            if(result === undefined || result === null)  {
                response.status(400);
                response.json({
                    status: 400,
                    message: "S3 upload failed"
                });
                return response;
            } else {
                fileService.uploadFileForAnswer(request, file)
                    .then(handleSuccess)
                    .catch(handleDbError(response));
            }
    };

    const getAnswerResponse = (dbAnswer) => {
        if(dbAnswer != null) {
            if (dbAnswer.question_id === request.params.question_id) {
                file.question_id = dbAnswer.question_id;
                file.answer_id = dbAnswer.answer_id;
                fileService.uploadFileToS3(request)
                    .then(s3UploadSuccessResponse)
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
                message: "Answer not found"
            });
            return response;
        }
    };

    const handleQuestionResponse = (dbQuestion) => {
        if (dbQuestion != null) {
            if(dbQuestion.user_id === file.user_id) {
                //Get Answer
                console.log("get answer");
                console.log("request.params.answer_id");
                answerService.findAnswerByAnswerId(request.params.answer_id)
                    .then(getAnswerResponse)
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
                message: "Question not found"
            });
            return response;
        }
    };

    userService.findUserByUserName(credentials.name)
        .then((userResponse) => {
            if(userResponse != null && bcrypt.compareSync(credentials.pass, userResponse.password)) {
                //fetch question and validate if it is the user's
                file.user_id = userResponse.id;
                questionService.findQuestionById(file.question_id)
                    .then(handleQuestionResponse)
                    .catch(handleDbError(response));
            } else {
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



//  let credentials = auth(request);
//      if(credentials === undefined) {
//          response.status(401);
//          response.json({
//              status: 401,
//              message: "Access Denied: Authentication error"
//          });
//          return response;
//      }
//
// };
//
// exports.deleteFileForAnswer = function (request, response) {
//     if(!request.params.question_id) {
//         response.status(400);
//         response.json({
//             status: 400,
//             message: "Bad Request"
//         });
//         return response;
//     }
//     if(!request.params.answer_id) {
//             response.status(400);
//             response.json({
//                 status: 400,
//                 message: "Bad Request"
//             });
//             return response;
//     }
//     let credentials = auth(request);
//      if(credentials === undefined) {
//          response.status(401);
//          response.json({
//              status: 401,
//              message: "Access Denied: Authentication error"
//          });
//          return response;
//      }
//
//
// };