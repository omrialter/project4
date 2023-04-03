const express = require("express");
const http = require("http");
const path = require("path");
const { routesInit } = require("./routes/configRoutes")

require("./db/mongoConnect")

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

routesInit(app);
app.get('*', function (req, res) {
    res.status(404).sendfile(path.join(__dirname, "public", "page404.html"));
})



const server = http.createServer(app);
let port = process.env.PORT || 3002;
server.listen(port);



