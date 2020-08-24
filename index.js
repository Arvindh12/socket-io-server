const express = require("express");
const bodyParser = require("body-parser");
const socketIo = require("socket.io");
const http = require("http");
require("dotenv").config();
const mongodb = require("mongodb");
const cors = require("cors");
const bcrypt = require("bcrypt");
const app = express();
app.use(bodyParser.json());
app.use(cors({}));
const port = 7070

const server = http.createServer(app);
const io = socketIo(server);

let buttonstat = "enable";
io.on("connection", (socket) => {
    console.log("New client connected");

    socket.emit("connection", buttonstat)
    socket.on("enable" , () => {
        io.sockets.emit("enable","e")
        buttonstat = "enable"
        console.log('enable')
    })
    socket.on("disable" , () => {
        io.sockets.emit("disable","e")
        console.log('disable')
        buttonstat = "disable"
    })
    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

app.post("/login", async (req, res) => {
    try {
      const client = await mongodb.connect(process.env.DBURL);
      const db = client.db("socketio");
      const data = await db
        .collection("users")
        .findOne({ email: req.body.email });
      console.log(data);
      await client.close();
      if (data) {
        var match = await bcrypt.compare(req.body.password, data.password);
        if (match) {
          res.json({ message: "login successful" , data : data  });
        } else {
          res.status(400).json({
            message: "password did not match",
          });
        }
      } else {
        res.status(400).json({
          message: "Email not found",
        });
      }
    } catch (err) {
      console.log(err);
      res.status(400).json({ message: "failed" });
    }
  });
  app.post("/register", async (req, res) => {
    var user = req.body;
    var hash = await bcrypt.hash(user.password, 10);
    user.password = hash;
    try {
      const client = await mongodb.connect(process.env.DBURL);
      const db = client.db("socketio");
      var data1 = await db
        .collection("users")
        .find({ email: req.body.email }).toArray();
    if(data1.length === 0){
        const data = await db.collection("users").insertOne(user);
      await client.close();
      res.json({ message: "registration successful" , data : data });
    }
    else {
        res.json({ message: "User Already exists" });
        await client.close();
    }
    } catch (err) {
      console.log(err);
      res.json({ message: "failed" });
      await client.close();
    }
  });
  
server.listen(port, () => console.log(`Listening on port ${port}`));

