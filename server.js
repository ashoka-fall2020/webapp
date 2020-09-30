const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./api/models");

function main () {
    const app = express();
    // set port, listen for requests
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}.`);
    });

    app.use(cors());

    // parse requests of content-type - application/json
     app.use(bodyParser.json());

    let routes = require('./api/routes/Routes');
    routes(app); //register the route

    db.sequelize.sync();
}
main();




