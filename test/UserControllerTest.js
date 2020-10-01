let describe = require("mocha").describe;
const assert = require('assert');

let controller = require("../api/controllers/UserControllers");

describe("Validate Create User Request", function() {
    it("validate first_name", function() {
        let request = {
            body: {
                "first_name": "",
                "last_name": "Doe",
                "password": "testPassword1!",
                "username": "a@b.com"
            }
        };
        const response = {
            _status: "",
            _message: "",
            json: function (val) {
                this._status = val.status;
                this._message = val.message;
            },
            status: () => {}
        };
        controller.validateCreateUserRequest(request, response);
        assert.equal(response._message, "Bad Request: First name, last name, password, username can not be empty!");
        assert.equal(response._status, "400");
    });

    it("validate last_name", function() {
        let request = {
            body: {
                "first_name": "Jane",
                "last_name": "",
                "password": "testPassword1!",
                "username": "a@b.com"
            }
        };
        const response = {
            _status: "",
            _message: "",
            json: function (val) {
                this._status = val.status;
                this._message = val.message;
            },
            status: () => {}
        };
        controller.validateCreateUserRequest(request, response);
        assert.equal(response._message, "Bad Request: First name, last name, password, username can not be empty!");
        assert.equal(response._status, "400");
    });

    it("validate password too short", function() {
        let request = {
            body: {
                "first_name": "Jane",
                "last_name": "Doe",
                "password": "password",
                "username": "a@b.com"
            }
        };
        const response = {
            _status: "",
            _message: "",
            json: function (val) {
                this._status = val.status;
                this._message = val.message;
            },
            status: () => {}
        };
        controller.validateCreateUserRequest(request, response);
        assert.equal(response._message, "Bad Request: Entered password does not meet the minimum standards");
        assert.equal(response._status, "400");
    });

    it("validate password no numbers / special characters", function() {
        let request = {
            body: {
                "first_name": "Jane",
                "last_name": "Doe",
                "password": "goodoldnormalpassword",
                "username": "a@b.com"
            }
        };
        const response = {
            _status: "",
            _message: "",
            json: function (val) {
                this._status = val.status;
                this._message = val.message;
            },
            status: () => {}
        };
        controller.validateCreateUserRequest(request, response);
        assert.equal(response._message, "Bad Request: Entered password does not meet the minimum standards");
        assert.equal(response._status, "400");
    });

    it("validate username", function() {
        let request = {
            body: {
                "first_name": "Jane",
                "last_name": "Doe",
                "password": "testPassword1!",
                "username": "a@b"
            }
        };
        const response = {
            _status: "",
            _message: "",
            json: function (val) {
                this._status = val.status;
                this._message = val.message;
            },
            status: () => {}
        };
        controller.validateCreateUserRequest(request, response);
        assert.equal(response._message, "Bad Request: Invalid email, username should be an email.");
        assert.equal(response._status, "400");
    });
});
