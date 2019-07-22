// Here is a function to return a list of gene candidates from Monarch based on phenotypes
function httpGet(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
    console.log(xmlHttp.responseText);
}
