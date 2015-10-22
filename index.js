/* global __dirname, Buffer */
var fs = require('fs');
var url = require('url');
var server = require('http');
var unzip = require('unzip');
var Stream = require('stream');
var config = require('./config');
var formidable = require('formidable');
var dateFormat = require('dateformat');

var port = config.port;
var output = config.output;

var response_end = function(response, data) {
    response.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    return response.end(data);
};

server.createServer(function(request, response) {
    var pathname = url.parse(request.url).pathname;

    console.log(dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss"), pathname);

    if (pathname !== '/sourcemap') return response_end(request, 'It works');

    var form = new formidable.IncomingForm();
    form.encoding = 'binary';
    form.parse(request, function(err, fields) {
        if (err) return response_end(response, 'error');

        if (fields && fields.zip) {

            var data = new Buffer(fields.zip.length);
            data.write(fields.zip, 0, 'binary');

            var zip_data = new Stream.PassThrough();
            zip_data.end(new Buffer(data));
            zip_data.pipe(unzip.Extract({
                path: output
            }));

            return response_end(response, 'success');
        }
    });

}).listen(port);

console.log('Server is listening port ' + port + '...');