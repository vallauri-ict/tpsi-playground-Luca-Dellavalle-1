import * as mongodb from "mongodb";

const mongoClient = mongodb.MongoClient;
const CONNECTION_STRING = "mongodb://127.0.0.1:27017";
const DB_NAME = "5B"

//PROMISE
//query 1
mongoClient.connect(CONNECTION_STRING, (err, client) => {
  if (!err) {
    let db = client.db(DB_NAME);
    let collection = db.collection("orders");
    //i nomi dei campi devono essere preceduti da "$" se sono usati come valore 
    // a destra dei ':'

    //dopo aver fatto i gruppi con $group il recordset risultante avrà solo 2 colonne
    //  che sono _id e totale, tutti gli altri campi non sono visibili

    let req = collection.aggregate([
      {"$match": {"status":"A"}},
      {"$group": {"_id":"$cust_id", "totale":{"$sum": "$amount"}}},
      {"$sort": {"totale":-1}}
    ]).toArray();
    req.then(function (data){
      console.log("Query 1 ", data);
    })
    req.catch(function(err){
      console.log("Errore esecuzione query: " + err.message);
    })
    req.finally(function(){
      client.close();
    });
  } else {
    console.log("Errore connessione al db: " + err.message);
  }
});


//query 2
mongoClient.connect(CONNECTION_STRING, (err, client) => {
  if (!err) {
    let db = client.db(DB_NAME);
    let collection = db.collection("orders");
    let req = collection.aggregate([
      {"$group": {
        "_id": "$cust_id",
        "avgAmount" : {"$avg": "$amount"},
        "avgTotal": {"$avg" : {"$multiply": ["$qta", "$amount"]}}
      }} 
    ]).toArray();
    req.then(function (data){
      console.log("Query 2 ", data);
    })
    req.catch(function(err){
      console.log("Errore esecuzione query: " + err.message);
    })
    req.finally(function(){
      client.close();
    });
  } else {
    console.log("Errore connessione al db: " + err.message);
  }
});