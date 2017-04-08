var fs = require('fs');
var request = require('request');
var Nightmare = require('nightmare'),
    vo = require('vo'),
    nightmare = Nightmare({show:true});
require('nightmare-upload')(Nightmare);
var cheerio = require('cheerio');

var scrape_urls = function * (i) {
    yield nightmare
        .goto('https://easy.co.il/json/list.json?c=17461&listpage=' + i + '&lat=32.059925&lng=34.785126&rad=8905&mapid=0&uid=7DF68314-A932-49C7-98E5-7E857613A5FA')
        .wait(7000)
        .evaluate(function(){
            //here is where I want to return the html body
            return document.body.innerHTML;
        })
        .then(function(body){
        //loading html body to cheerio
            var $ = cheerio.load(body);
            var data = $('pre').text();
            var JSON_DATA = JSON.parse(data);
            for(var j = 0;j < JSON_DATA['bizlist']['list'].length;j ++) {
                var url = 'https://easy.co.il/json/bizpage.json?bizid=' + JSON_DATA['bizlist']['list'][j].url.replace('/?p=', '');
                vo(scrape_data)(url);
            }
            return body;

        })
        .then(function(body){
            var $ = cheerio.load(body);
            var data = $('pre').text();
            var JSON_DATA = JSON.parse(data);
            
            if(JSON_DATA['bizlist']['nextpage'] == true){
                console.log('Now go to next page scrape');
                vo(scrape_urls)(i+1);
            } else {
                console.log('The End!!!');
            }
            
        })
}

var scrape_data = function * (url){
    console.log(url);
    yield nightmare
        .goto(url)
        .wait(7000)
        .evaluate(function(){
            //here is where I want to return the html body
            return document.body.innerHTML;
        })
        .then(function(body) {
            
            var $ = cheerio.load(body);
            var data = $('pre').text();
            var JSON_DATA = JSON.parse(data);
            fs.readFile('output.json', 'utf8', function readFileCallback(err, data){
                if (err){
                    var scrape_json = [];
                    scrape_json.push(JSON_DATA);
                    
                    fs.writeFile('output.json', JSON.stringify(scrape_json, null, 4), 'utf8', function(err){
                        console.log('File successfully written! - Check your project directory for the output.json file');
                    })
                } else {
                    var obj = JSON.parse(data); //now it an object
                    obj.push(JSON_DATA);
                    
                    fs.writeFile('output.json', JSON.stringify(obj, null, 4), 'utf8', function(err, data) {
                        console.log('File successfully written! - Check your project directory for the output.json file');
                    });
                }
            });
        })
}
vo(scrape_urls)(1);