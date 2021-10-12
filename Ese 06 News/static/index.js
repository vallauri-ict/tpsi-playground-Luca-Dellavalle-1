"use strict"
$(document).ready(function() {
    let _lstNazioni = $("#lstNazioni");
    let _tabStudenti = $("#tabStudenti");
    let _divDettagli = $("#divDettagli");

    _divDettagli.hide();
    let requestNazioni = inviaRichiesta("GET", "/api/Nazioni");
    requestNazioni.fail(errore);
    requestNazioni.done(function(data){
        for (let i=0;i<data.nazioni.length;i++) {
            $('<a>',{
                'class':'dropdown-item',
                'href':'/?nation='+data.nazioni[i],
                'text':data.nazioni[i]
            }).appendTo(_lstNazioni);
        }
    });

})