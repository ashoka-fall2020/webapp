const db = require("../models");
const User = db.user;

exports.createAccount = function (user) {
    const newUser = new User(user);
    const promise = newUser.save();
    return promise;
};

exports.findUserEmail = function (user) {
    const promise = User.findOne({
        where:{email_address: user.email_address}
    });
    return promise;
}
