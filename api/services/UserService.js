/* User related services create account, get user details, update user details*/
const db = require("../models");
const User = db.user;

exports.createAccount = function (user) {
    const newUser = new User(user);
    const promise = newUser.save();
    return promise;
};

exports.findUserByUserName = function (username) {
    const promise = User.findOne({
        where:{username: username}
    });
    return promise;
};

exports.updateUserDetails = function(request, userResponse) {
    console.log("request update")
    const promise = User.update({
        password: request.body.password,
        first_name: request.body.first_name,
        last_name: request.body.last_name
    }, {
        where: {username: userResponse.username}
        }
    );
    return promise;
};
