#! /usr/bin/env node
/* global __dirname, Buffer */
var fs = require('fs');
var url = require('url');
var server = require('http');
var unzip = require('unzip');
var Stream = require('stream');
var config = require('./config');
var formidable = require('formidable');
var dateFormat = require('dateformat');

var program = require('commander');
 
program
  .version('0.0.4')
  .usage('[options] <value ...>')
  .option('-o, --output [./maps]', 'unzip output folder')
  .option('-p, --port <80>', 'server listen port', parseInt)
  .parse(process.argv);
 
var port = program.port || config.port;
var output = program.output || config.output;

console.info('Server will run at:', port);
console.info('Files will unzip at:', output);

server.createServer(function(request, response) {
    var host = request.headers.host;
    var pathname = url.parse(request.url).pathname;

    console.log(dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss"), host, pathname);

    var response_end = function(data) {
        response.writeHead(data === '404' ? 404 : 200, {
            'Content-Type': 'text/plain'
        });
        return response.end(data);
    };

    // upload
    if (pathname === '/upload') {
        var form = new formidable.IncomingForm();
        form.encoding = 'binary';
        form.parse(request, function(err, fields) {
            if (err) return response_end('error');

            if (fields && fields.zip) {

                var data = new Buffer(fields.zip.length);
                data.write(fields.zip, 0, 'binary');

                var zip_data = new Stream.PassThrough();
                zip_data.end(new Buffer(data));
                zip_data.pipe(unzip.Extract({
                    path: output
                }));

                return response_end('success');
            }
        });
    } else {
        var realPath = output + host.replace(/^(map\.)?/i, '/') + pathname;
        fs.exists(realPath, function(exists) {
            if (!exists) {
                return response_end('404');
            }
            fs.readFile(realPath, function(err, file) {
                if (err) {
                    return response_end('404');
                } else {
                    return response_end(file);
                }
            });
        });
    }
}).listen(port);

console.info('Server is listening port ' + port + '...');