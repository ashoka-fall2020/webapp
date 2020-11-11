const userService = require("../services/UserService");
const emailValidator = require("email-validator");
const passwordValidator = require("password-validator");
const auth = require('basic-auth');
const bcrypt = require("bcrypt");
const logger = require('../config/winston');
const sdc = require('../config/statsd');

const {v4: uuidv4} = require("uuid");

const saltRounds = 10;

let schema = new passwordValidator();

schema
    .is().min(9)
    .is().max(64)
    .has().letters()
    .has().digits()
    .has().symbols()

exports.validateCreateUserRequest = function (request, response) {
    if (!request.body.first_name || !request.body.last_name || !request.body.username || !request.body.password
        || request.body.first_name.length === 0 || request.body.last_name.length === 0 || request.body.username.length === 0 || request.body.password.length === 0) {
        logger.info("First name, last name, password, username can not be empty");
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request: First name, last name, password, username can not be empty!"
        });
        return response;
    }
    if(request.body.account_created != null ||  request.body.account_updated != null || request.body.id != null) {
        logger.info("Unexpected params in request");
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request: Unexpected params in request"
        });
        return response;
    }
    if(!schema.validate(request.body.password)) {
        logger.info("Entered password does not meet the minimum standards");
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request: Entered password does not meet the minimum standards"
        });
        return response;
    }
    if(!emailValidator.validate(request.body.username)) {
        logger.info("Invalid email, username should be an email.");
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request: Invalid email, username should be an email."
        });
        return response;
    }
    return null;
};

exports.create = function (request, response) {
    let apiTimer = new Date();
    sdc.increment('createUser.counter');
    if (exports.validateCreateUserRequest(request, response) != null) return;
    const user = {
        id: uuidv4(),
        first_name: request.body.first_name,
        last_name: request.body.last_name,
        username: request.body.username,
        password: getPasswordHash(request.body.password)
    };
    const handleFindByUserNameResponse = (usernameRes) => {
        if (usernameRes != null) {
            logger.info("Email already exists");
            response.status(400);
            response.json({
                status: 400,
                message: "Bad request: Email already exists"
            });
            return response;
        } else{
            userService.createAccount(user)
                .then(handleCreateUserResponse)
                .catch(handleDbError(response));
        }
    };

    const handleCreateUserResponse = (signUpResponse) => {
        sdc.timing('createUser.timer', apiTimer);
        if (signUpResponse != null) {
            logger.info("Sign up success");
            response.json(getResponseUser(signUpResponse));
        } else {
            logger.info("Failed to save user to db");
            response.status(400);
            response.json({
                status: 400,
                message: "Unable to perform operation at this time"
            });
            return response;
        }
    };
    userService.findUserByUserName(user.username)
        .then(handleFindByUserNameResponse)
        .catch(handleDbError(response));
};

const handleDbError = (response) => {
    const errorCallBack = (error) => {
        if (error) {
            logger.error(error);
            response.status(400);
            response.json({
                status: 400,
                message: "Unable to perform operation"
            });
            return response;
        }
    };
    return errorCallBack;
};

exports.get = function(request, response) {
    let apiTimer = new Date();
    sdc.increment('getUserByAuth.counter');
    const handleFindByUserNameResponse = (userResponse) => {
        sdc.timing('getUserAPI.timer', apiTimer);
        if(userResponse != null && bcrypt.compareSync(credentials.pass, userResponse.password)) {
            logger.info("Get user success");
            response.json(getResponseUser(userResponse));
        } else{
            setAccessDeniedResponse(response);
        }
    };
    let credentials = auth(request);
    if(credentials === undefined) {
        setAccessDeniedResponse(response);
    } else {
        userService.findUserByUserName(credentials.name)
        .then(handleFindByUserNameResponse)
        .catch(handleDbError(response));
    }
};

exports.update = function(request, response) {
    let apiTimer = new Date();
    sdc.increment('updateUser.counter');
    if(validateUpdateUserRequest(request, response) != null) return;

    const handleUpdateResponse = (upRes) => {
        sdc.timing('updateUserAPI.timer', apiTimer);
        if(upRes != null) {
            logger.info("User details updated Successfully");
            response.status(204);
            response.json({
                status: 204,
                message: "User details updated Successfully"
            });
            return response;
        } else {
            logger.info("User Not found");
            response.status(404);
            response.json({
                status: 404,
                message: "Not found"
            });
            return response;
        }
    };

    const handleFindByUserNameResponse = (userResponse) => {
        if(userResponse !== null && bcrypt.compareSync(credentials.pass, userResponse.password)) {
            request.body.password = getPasswordHash(request.body.password);
            userService.updateUserDetails(request, userResponse)
                .then(handleUpdateResponse)
                .catch(handleDbError(response));
        } else{
            setAccessDeniedResponse(response);
        }
    };

    let credentials = auth(request);
    if(credentials === undefined || credentials.name !== request.body.username) {
        setAccessDeniedResponse(response);
   } else {
        userService.findUserByUserName(credentials.name)
            .then(handleFindByUserNameResponse)
            .catch(handleDbError(response));
    }
};

let getPasswordHash = function (password) {
    const salt = bcrypt.genSaltSync(saltRounds);
    return bcrypt.hashSync(password, salt);
};

let getResponseUser = function (user) {
     let apiResponse = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        account_created: user.account_created,
        account_updated: user.account_updated
    };
     return apiResponse;
};

let setAccessDeniedResponse = function (response) {
    logger.info("Authentication error");
    response.status(401);
    let apiResponse = response.json({
        status: 401,
        message: "Access Denied: Authentication error"
    });
    return apiResponse;
};

let validateUpdateUserRequest = function (request, response) {
    if (!request.body.first_name || !request.body.last_name || !request.body.password
        || request.body.first_name.length === 0 || request.body.last_name.length === 0 ||
        request.body.password.length === 0 || !request.body.username || request.body.username.length === 0) {
        logger.info("Bad Request");
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request"
        });
        return response;
    }
    if(request.body.account_created != null ||  request.body.account_updated != null || request.body.id != null) {
        logger.info("Bad Request");
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request"
        });
        return response;
    }
    if(!schema.validate(request.body.password)) {
        logger.info("Entered password does not meet the minimum standards");
        response.status(400);
        response.json({
            status: 400,
            message: "Bad Request: Entered password does not meet the minimum standards"
        });
        return response;
    }
    return null;
};

//Get user by id without authentication
exports.getByUserId = function(request, response) {
    let apiTimer = new Date();
    sdc.increment('getUserByID.counter');
    if(!request.params.user_id) {
        logger.info("User not found");
        response.status(404);
        response.json({
            status: 404,
            message: "Not found"
        });
        return response;
    }

    const handleResponse = (userResponse) => {
        sdc.timing('getUserByUserId.timer', apiTimer);
        if(userResponse != null ) {
            logger.info("getUserByID success");
            response.json(getUseryUserId(userResponse));
            return response;
        } else{
            logger.info("User not found");
            response.status(404);
            response.json({
                status: 404,
                message: "User not found"
            });
            return response;
        }
    };

    let getUseryUserId = function (user) {
        let apiResponse = {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            account_created: user.account_created,
            account_updated: user.account_updated
        };
        return apiResponse;
    };
    userService.findUserByUserId(request.params.user_id)
        .then(handleResponse)
        .catch(handleDbError(response));
};