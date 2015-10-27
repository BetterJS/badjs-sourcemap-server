#!/usr/bin/env node

var fs = require('fs');
var url = require('url');
var server = require('http');
var unzip = require('unzip');
var Stream = require('stream');
var config = require('./config');
var package = require('./package');
var formidable = require('formidable');
var dateFormat = require('dateformat');
var querystring = require('querystring');

var program = require('commander');

program
    .version(package.version)
    .usage('[options] <value ...>')
    .option('-o, --output [./maps]', 'unzip output folder')
    .option('-p, --port <80>', 'server listen port', parseInt)
    .parse(process.argv);

var port = program.port || config.port;
var output = program.output || config.output;

console.info('Server will run at:', port);
console.info('Files will unzip at:', output);

server.createServer(function(request, response) {
    var req_url = url.parse(request.url);
    var host = (request.headers.host || '').replace(/:\d+/g, '');
    var pathname = req_url.pathname;
    var param = querystring.parse(req_url.query);

    console.log(dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss"), host, pathname, param.src);

    var pathname_match = function(path) {
        return new RegExp('^' + path + '(\\.map)?$', 'i').test(pathname);
    };

    var response_end = function(data, status_code) {
        response.writeHead(status_code || (data === '404' ? 404 : 200), {
            'Content-Type': 'text/plain'
        });
        return response.end(data);
    };

    // upload
    if (pathname_match('/upload') && request.method.toLowerCase() == 'post') {
        var form = new formidable.IncomingForm();
        form.encoding = 'binary';
        form.maxFieldsSize = 1024 * 1024 * 1024; // 1024 MB
        form.parse(request, function(err, fields) {
            if (err) return response_end('parse error', 403);

            if (fields && fields.zip) {
                var data = new Buffer(fields.zip.length);
                data.write(fields.zip, 0, 'binary');
                var zip_data = new Stream.PassThrough();
                zip_data.end(new Buffer(data));
                zip_data.pipe(unzip.Extract({
                    path: output
                }));
                return response_end('update data success: ' + data.length);
            } else {
                return response_end('update data error');
            }
        });
    } else {
        var real_path = '';
        if (pathname_match('/load') && param.src) {
            real_path = output + param.src.replace(/^(https?:)?(\/\/)?/i, '/');
        } else {
            real_path = output + host.replace(/^(map\.)?/i, '/') + pathname;
        }

        console.info('Real path:', real_path);

        fs.exists(real_path, function(exists) {
            if (!exists) return response_end('404');

            fs.readFile(real_path, function(err, file) {
                return err ? response_end('404') : response_end(file);
            });
        });
    }
}).listen(port);

console.info('Server is listening port ' + port + '...');
