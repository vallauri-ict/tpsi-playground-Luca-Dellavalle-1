const _http = require("http");
const _url = require("url");
const _colors = require("colors");
//  "./" -> cartella corrente
const HEADERS = require("./headers.json");
const port = 1337;

const server=_http.createServer(function (req, res) {
    /*  prima prova
        //scrittura intestazione
        res.writeHead(200, HEADERS.text);
        //scrittura corpo della risposta
        res.write("richiesta eseguita correttamente");
        //invio
        res.end();
        
        console.log("richiesta eseguita");
    */

    //parsing della url ricevuta.
    //parse(url, booleana per parsificare anche i parametri)
   
    //Lettura di metodo risorsa e parametri
    let metodo = req.method; 
    let url = _url.parse(req.url, true);
    let risorsa = url.pathname;
    let parametri = url.query;
    
    let dominio = req.headers.host;

    res.writeHead(200,HEADERS.html);

    res.write("<h1> Informazioni relative alla richiesta ricevuta </h1>");
    res.write("<br>");
    res.write(`<p><b> Risorsa richiesta: </b> ${risorsa} </p>`);
    res.write(`<p><b> Metodo: </b> ${metodo} </p>`);
    res.write(`<p><b> Parametri: </b> ${JSON.stringify(parametri)} </p>`);
    res.write(`<p><b> Dominio: </b> ${dominio} </p>`);
    res.write(`<p> Grazie per la richiesta</p>`);

    res.end();
    console.log("richiesta ricevuta: "+req.url.yellow);
});

// se non si specifica l'indirizzo IP di ascolto il server viene avviato su tutte le interfacce
server.listen(port);
console.log("server in ascolto sulla porta " + port);