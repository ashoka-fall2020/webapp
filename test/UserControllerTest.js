let expect    = require("chai");
let controller = require("../api/controllers/UserControllers");

describe("Create, get, update user", function() {
    // specification code
    describe("Validate request", function() {
        // specification for RGB to HEX converter
        it("validate create user request", function() {
            let request = {
                body: {
                    "first_name": "appu",
                    "last_name": "appu",
                    "password": "awsdqwdsqwd1212",
                    "username": "d@d.com"
                }
            };

            controller.validateCreateUserRequest(request);
        });

        it("validate update user request", function() {
            let request = {
                body: {
                    "first_name": "appu",
                    "last_name": "appu",
                    "password": "awsdqwdsqwd1212",
                    "username": "d@d.com"
                }
            };
            controller.validateUpdateUserRequest(request);
        });
    });
});