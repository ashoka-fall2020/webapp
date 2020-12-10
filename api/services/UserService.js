/* User related services create account, get user details, update user details*/
const db = require("../models");
const User = db.user;
const sdc = require('../config/statsd');
const logger = require('../config/winston');

exports.createAccount = function (user) {
    const newUser = new User(user);
    let dbTimer = new Date();
    const promise = newUser.save();
    sdc.timing('createUserQuery.timer', dbTimer);
    db.sequelize.query("SHOW STATUS LIKE 'Ssl_cipher'", { type: db.sequelize.QueryTypes.SELECT })
        .then((result) => {
            logger.info("SSL Validation:  Result value  " + JSON.stringify(result));
        });
    return promise;
};

exports.findUserByUserName = function (username) {
    let dbTimer = new Date();
    const promise = User.findOne({
        where:{username: username}
    });
    sdc.timing('findUserByUserNameQuery.timer', dbTimer);
    return promise;
};

exports.updateUserDetails = function(request, userResponse) {
    let dbTimer = new Date();
    const promise = User.update({
        password: request.body.password,
        first_name: request.body.first_name,
        last_name: request.body.last_name
    }, {
        where: {username: userResponse.username}
        }
    );
    sdc.timing('updateUserQuery.timer', dbTimer);
    return promise;
};


exports.findUserByUserId = async function (user_id) {
    let dbTimer = new Date();
    const promise = await User.findOne({
        where:{id: user_id}
    });
    sdc.timing('findUserByUserId.timer', dbTimer);
    return promise;
};
