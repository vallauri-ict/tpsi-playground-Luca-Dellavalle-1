import express from "express";
import * as fs from "fs";
import * as http from "http";
import * as body_parser from "body-parser";
import { inherits } from "util";
import HEADERS from "./headers.json";

let port : number = 1337;
let app = express();

let server = http.createServer(app);

server.listen(port,function(){
    console.log("Server in ascolto sulla porta " + port)
    init();
});

let paginaErrore="";
function init(){
    fs.readFile("./static/error.html",function(err, data){
        if(!err){
            paginaErrore = data.toString();
        }
        else{
            paginaErrore = "<h2>Risorsa non trovata</h2>";
        }
    });
}


//****************************************************************
//elenco delle routes di tipo middleware
//****************************************************************
// 1.log 
app.use("/",function(req, res, next){
    console.log("---->" + req.method + ":"+ req.originalUrl);
    next();
});

// 2.static route
//il next lo fa automaticamente quando non trova la risorsa
app.use("/", express.static("./static"));

// 3.route lettura parametri post
app.use("/", body_parser.json());
app.use("/", body_parser.urlencoded({"extended":true}));

// 4.log parametri
app.use("/", function(req, res, next){
    if(Object.keys(req.query).length > 0){
        console.log("Parametri GET: ",req.query);
    }
    if(Object.keys(req.body).length > 0){
        console.log("Parametri BODY: ",req.body);
    }
    next();
})


//****************************************************************
//elenco delle routes di risposta al client
//****************************************************************
app.get("/api/risorsa1", function(req, res, next){
    let nome = req.query.nome;
    res.send({"nome":nome});
})

app.post("/api/risorsa1", function(req, res, next){
    let nome = req.body.nome;
    res.send({"nome":nome});
})

//****************************************************************
//default route(risorse non trovate) e route di gestione degli errori
//****************************************************************
app.use("/", function(req, res, next){
    res.status(404);
    if(req.originalUrl.startsWith("/api/")){
        res.send("Servizio non trovato");
    }
    else{
        res.send(paginaErrore);
    }
})



