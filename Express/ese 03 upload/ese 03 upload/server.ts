import express from "express";
import * as fs from "fs";
import * as http from "http";
import * as body_parser from "body-parser";
import * as mongodb from "mongodb";
import cors from "cors";
import fileUpload, { UploadedFile } from "express-fileupload";
import ENVIRONMENT from "./environment.json";
import cloudinary, { UploadApiResponse } from "cloudinary";

cloudinary.v2.config({
  cloud_name: ENVIRONMENT.CLOUDINARY.CLOUD_NAME,
  api_key: ENVIRONMENT.CLOUDINARY.API_KEY,
  api_secret: ENVIRONMENT.CLOUDINARY.API_SECRET,
  // secure:true // https
});

const mongoClient = mongodb.MongoClient;

/*
const CONNECTION_STRING =
  "mongodb://admin:admin@cluster0-shard-00-00.zarz7.mongodb.net:27017,cluster0-shard-00-01.zarz7.mongodb.net:27017,cluster0-shard-00-02.zarz7.mongodb.net:27017/test?replicaSet=atlas-bgntwo-shard-0&ssl=true&authSource=admin";
*/
const DB_NAME = "5B";


let port: number = parseInt(process.env.PORT) || 1337;
let app = express();

let server = http.createServer(app);

server.listen(port, function () {
  console.log("Server in ascolto sulla porta " + port)

  init();
});
const whitelist = [
  "https://luca-dellavalle-crud-server.herokuapp.com",
  "http://luca-dellavalle-crud-server.herokuapp.com",
  "http://localhost:1337",
  "http://localhost:4200"
];




let paginaErrore = "";
function init() {
  fs.readFile("./static/error.html", function (err, data) {
    if (!err) {
      paginaErrore = data.toString();
    }
    else {
      paginaErrore = "<h2>Risorsa non trovata</h2>";
    }
  });
}


//****************************************************************
//elenco delle routes di tipo middleware
//****************************************************************
// 1.log 
app.use("/", function (req, res, next) {
  console.log("---->" + req.method + ":" + req.originalUrl);
  next();
});

// 2.static route
//il next lo fa automaticamente quando non trova la risorsa
app.use("/", express.static("./static"));

// 3.route lettura parametri post con impostazione del limite immagini base64
app.use("/", body_parser.json({"limit":"10mb"}));
app.use("/", body_parser.urlencoded({ "extended": true, "limit":"10mb" }));

// 4.log parametri
app.use("/", function (req, res, next) {
  if (Object.keys(req.query).length > 0) {
    console.log("Parametri GET: ", req.query);
  }
  if (Object.keys(req.body).length > 0) {
    console.log("Parametri BODY: ", req.body);
  }
  next();
})

// 5. cors 
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin)
      return callback(null, true);
    if (whitelist.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not ' +
        'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    else
      return callback(null, true);
  },
  credentials: true
};
app.use("/", cors(corsOptions) as any);

// 6. binary fileUpload
app.use(fileUpload({
  "limits ": { "fileSize ": (10 * 1024 * 1024) } // 10 MB
}));



//****************************************************************
//elenco delle routes di risposta al client
//****************************************************************
// middleware di apertura della connessione
app.use("/", (req, res, next) => {
  mongoClient.connect(process.env.MONGODB_URI || ENVIRONMENT.CONNECTION_STRING, (err, client) => {
    if (err) {
      res.status(503).send("Db connection error");
    } else {
      console.log("Connection made");
      req["client"] = client;
      next();
    }
  });
});

// listener specifici: 
//listener GET
app.get("/api/images", (req, res, next) => {
  let db = req["client"].db(DB_NAME) as mongodb.Db;
  let collection = db.collection("images");
  let request = collection.find().toArray();
  request.then((data) => {
    res.send(data);
  });
  request.catch((err) => {
    res.status(503).send("Sintax error in the query");
  });
  request.finally(() => {
    req["client"].close();
  });
})

app.post("/api/uploadBinary", (req, res, next) => {
  if (!req.files || Object.keys(req.files).length == 0 || !req.body.username)
    res.status(400).send('Manca immagine o username');
  else {
    let file = req.files.img as UploadedFile;
    file.mv('./static/img/' + file["name"], function (err) {
      if (err)
        res.status(500).json(err.message);
      else {
        //insert nel DB
        let db = req["client"].db(DB_NAME) as mongodb.Db;
        let collection = db.collection("images");
        let user = {
          "username": req.body.username,
          "img": file.name
        }
        let request = collection.insertOne(user);
        request.then((data) => {
          res.send(data);
        });
        request.catch((err) => {
          res.status(503).send("Sintax error in the query");
        });
        request.finally(() => {
          req["client"].close();
        });
      }
    })
  }
})

app.post("/api/uploadBase64", (req, res, next) => {
  let db = req["client"].db(DB_NAME) as mongodb.Db;
  let collection = db.collection("images");
  let request = collection.insertOne(req.body);
  request.then((data) => {
    res.send(data);
  });
  request.catch((err) => {
    res.status(503).send("Sintax error in the query");
  });
  request.finally(() => {
    req["client"].close();
  });
})

app.post("/api/cloudinaryBase64", function (req, res, next) {
  cloudinary.v2.uploader.upload(req.body.image, { folder: "Ese03upload" })
  .catch((error) => {
    res.status(500).send("error uploading file to cloudinary")
  })
  .then((result: UploadApiResponse) => {
    //res.send({"url":result.secure_url})
    let db = req["client"].db(DB_NAME) as mongodb.Db;
    let collection = db.collection("images");
    let user = {
      "username": req.body.username,
      "img": result.secure_url
    }
    let request = collection.insertOne(user);
    request.then((data) => {
      res.send(data);
    });
    request.catch((err) => {
      res.status(503).send("Sintax error in the query");
    });
    request.finally(() => {
      req["client"].close();
    });
  })

})




app.post("/api/cloudinaryBinario", function (req, res, next) {
  if (!req.files || Object.keys(req.files).length == 0 || !req.body.username)
    res.status(400).send('Manca immagine o username');
  else {
    let file = req.files.img as UploadedFile;
    let path = './static/img/' + file["name"];
    file.mv(path, function (err) {
      if (err){
        res.status(500).json(err.message);
      }
      else {
        cloudinary.v2.uploader.upload(path, { folder: "Ese03upload", use_filename: true })
        .catch((error) => {
          res.status(500).send("error uploading file to cloudinary")
        })
        .then((result: UploadApiResponse) => {
          //res.send({"url":result.secure_url})
          let db = req["client"].db(DB_NAME) as mongodb.Db;
          let collection = db.collection("images");
          let user = {
            "username": req.body.username,
            "img": result.secure_url
          }
          let request = collection.insertOne(user);
          request.then((data) => {
            res.send(data);
          });
          request.catch((err) => {
            res.status(503).send("Sintax error in the query");
          });
          request.finally(() => {
            req["client"].close();
          });
        })
      }
    })
  }
})

//****************************************************************
//default route(risorse non trovate) e route di gestione degli errori
//****************************************************************
app.use("/", function (req, res, next) {
  res.status(404);
  res.send("Risorsa non trovata");
});

app.use("/", function (err, req, res, next) {
  console.log("***************  ERRORE CODICE SERVER ", err.message, "  *****************");
})

