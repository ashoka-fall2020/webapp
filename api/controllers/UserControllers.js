const db = require("../models");
const userService = require("../services/UserService");
const validator = require("email-validator");
const passwordValidator = require("password-validator");
const uuid = require("uuid");
const auth = require('basic-auth');
const bcrypt = require("bcrypt");

const { v4: uuidv4 } = require("uuid");

const saltRounds = 10;

var schema = new passwordValidator();

schema
    .is().min(8)                                    // Minimum length 8
    .is().max(64)                                   // Maximum length 64
    .has().not([/(.)\1{9,}/])                   //avoid repeating characters
    .has().not().spaces()                           // Should not have spaces


exports.create = function (request, response) {
    if (!request.body.first_name || !request.body.last_name || !request.body.username || !request.body.password) {
        response.json({
            status: 400,
            message: "Bad Request: First name, last name, password, username can not be empty!"
        });
        return;
    }

    if(!schema.validate(request.body.password)) {
        response.json({
            status: 400,
            message: "Enter a strong password"
        });
        return;
    }

    if(!validator.validate(request.body.username)) {
        response.json({
            status: 400,
            message: "Invalid email"
        });
        return;
    }

//     if (!isValidPassword(request.body.password)){
        //         response.json({
        //             status: 400,
        //             message: "Bad request: Please enter a strong password"
        //          });
        //     }
    console.log("before create");
    const user = {
        id: uuidv4(),
        first_name: request.body.first_name,
        last_name: request.body.last_name,
        username: request.body.username,
        password: getPasswordHash(request.body.password)
    };

    const resolve = (res) => {
        if (res != null) {
            response.json({
                status: 400,
                message: "Email already exists"
            });
        } else{
            userService.createAccount(user)
                .then(resolveSignUp)
                .catch(renderErrorResponse(response));
        }

    }
    const resolveSignUp = (signUpResponse) => {
        console.log("signup response");
        if (signUpResponse != null) {
            console.log("success");
            response.json({
                status: 200,
                user: signUpResponse,
                message: "User created successfully"
            });
        } else {
            console.log("error");
            response.json({
                status: 400,
                message: "Error in creating user account"
            });
        }
    };
    console.log("create user");

    userService.findUserByUserName(user.username)
        .then(resolve)
        .catch(renderErrorResponse(response));
};

// error function
let renderErrorResponse = (response) => {
    const errorCallback = (error) => {
        if (error) {
            console.log(error.message);
            console.log(error.code);
            response.status(500);
            response.json({
                message: error.message
            });
        }
    };
    return errorCallback;
};

exports.get = function(request, response) {
    const getResponse = (userResponse) => {
        if(userResponse !== null) {
            response.json({
                status: 200,
                id: userResponse.id,
                first_name: userResponse.first_name,
                last_name: userResponse.last_name,
                username: userResponse.username,
                account_created: userResponse.account_created,
                account_updated: userResponse.account_updated
            });
        } else{
            response.json({
                status: 401,
                message: "Access Denied: Authentication error"
            });
        }
    };
    let credentials = auth(request);
    if(credentials == undefined) {
        response.json({
            status: 401,
            message: "Access Denied: Authentication error"
        });
        return;
    } else {
        userService.findUserByUserName(credentials.name)
        .then(getResponse)
        .catch(renderErrorResponse(response));
    }
};

exports.update = function(request, response) {
    if (!request.body.first_name || !request.body.last_name || !request.body.username || !request.body.password) {
        response.json({
            status: 400,
            message: "Bad Request: First name, last name, password, username can not be empty!"
        });
        return;
    }
    if(!validator.validate(request.body.username)) {
        response.json({
            status: 400,
            message: "Invalid email"
        });
        return;
    }
    const updateResponse = (upRes) => {
        if(upRes != null) {
            response.json({
                status: 200,
                message: "Update Successfully"
            });
        } else {
            response.json({
                status: 400,
                message: "Update failed"
            });
        }
    };

    const getResponse = (userResponse) => {
        if(userResponse !== null) {
            userService.updateUserDetails(request, userResponse.id)
                .then(updateResponse)
                .catch(renderErrorResponse(response));
        } else{
            response.json({
                status: 401,
                message: "Access Denied: Authentication error"
            });
        }
    };
    let credentials = auth(request);
    if(credentials == undefined) {
        response.json({
            status: 401,
            message: "Access Denied: Authentication error"
        });
        return;
    } else {
        userService.findUserByUserName(credentials.name)
            .then(getResponse)
            .catch(renderErrorResponse(response));
    }
};

function isValidPassword(password) {
    let passwordRegex = "/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{9,}$/";
    if (password.match(passwordRegex) != null) {
        return true;
    }
    return false;
}

function getPasswordHash(password) {
    const salt = bcrypt.genSaltSync();
    return bcrypt.hashSync(password, salt);
}