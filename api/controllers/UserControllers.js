const userService = require("../services/UserService");
const emailValidator = require("email-validator");
const passwordValidator = require("password-validator");
const auth = require('basic-auth');
const bcrypt = require("bcrypt");

const {v4: uuidv4} = require("uuid");

const saltRounds = 10;

let schema = new passwordValidator();

schema
    .is().min(9)
    .is().max(64)
    .has().letters()
    .has().digits()
    .has().not().spaces()


exports.create = function (request, response) {
    if (validateCreateUserRequest(request, response) != null) return;
    const user = {
        id: uuidv4(),
        first_name: request.body.first_name,
        last_name: request.body.last_name,
        username: request.body.username,
        password: getPasswordHash(request.body.password)
    };

    const handleFindByUserNameResponse = (usernameRes) => {
        if (usernameRes != null) {
            response.json({
                status: 400,
                message: "Bad request: Email already exists"
            });
        } else{
            userService.createAccount(user)
                .then(handleCreateUserResponse)
                .catch(handleDbError(response));
        }
    };

    const handleCreateUserResponse = (signUpResponse) => {
        if (signUpResponse != null) {
            response.json(getResponseUser(signUpResponse));
        } else {
            response.json({
                status: 500,
                message: "Server error: Error in creating user account"
            });
        }
    };

    userService.findUserByUserName(user.username)
        .then(handleFindByUserNameResponse)
        .catch(handleDbError(response));
};

exports.handleDbError = (response) => {
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

exports.get = function(request, response) {
    const handleFindByUserNameResponse = (userResponse) => {
        if(userResponse != null && bcrypt.compareSync(credentials.pass, userResponse.password)) {
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
    if(validateUpdateUserRequest(request, response) != null) return;

    const handleUpdateResponse = (upRes) => {
        if(upRes != null) {
            response.json({
                status: 204,
                message: "User details updated Successfully"
            });
        } else {
            response.json({
                status: 500,
                message: "Internal server error: Update failed"
            });
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

exports.getPasswordHash = function (password) {
    const salt = bcrypt.genSaltSync(saltRounds);
    return bcrypt.hashSync(password, salt);
};

exports.getResponseUser = function (user) {
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

exports.setAccessDeniedResponse = function (response) {
    let apiResponse = response.json({
        status: 401,
        message: "Access Denied: Authentication error"
    });
    return apiResponse;
};

exports.validateCreateUserRequest = function (request, response) {
    if (!request.body.first_name || !request.body.last_name || !request.body.username || !request.body.password
        || request.body.first_name.length === 0 || request.body.last_name.length === 0 || request.body.username.length === 0 || request.body.password === 0) {
        response.json({
            status: 400,
            message: "Bad Request: First name, last name, password, username can not be empty!"
        });
        return response;
    }
    if(request.body.account_created != null ||  request.body.account_updated != null || request.body.id != null) {
        response.json({
            status: 400,
            message: "Bad Request: Unexpected params in request"
        });
        return response;
    }
    if(!schema.validate(request.body.password)) {
        response.json({
            status: 400,
            message: "Bad Request: Enter a strong password"
        });
        return response;
    }

    if(!emailValidator.validate(request.body.username)) {
        response.json({
            status: 400,
            message: "Bad Request: Invalid email, username should be an email."
        });
        return response;
    }
    return null;
};

exports.validateUpdateUserRequest = function (request, response) {
    if (!request.body.first_name || !request.body.last_name || !request.body.password
        || request.body.first_name.length === 0 || request.body.last_name.length === 0 ||
        request.body.password.length === 0 || !request.body.username || request.body.username.length === 0) {
        response.json({
            status: 400,
            message: "Bad Request"
        });
        return response;
    }
    if(request.body.account_created != null ||  request.body.account_updated != null || request.body.id != null) {
        response.json({
            status: 400,
            message: "Bad Request"
        });
        return response;
    }
    return null;
};
