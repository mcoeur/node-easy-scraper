const request = require("request");
const cheerio = require("cheerio");
const isArray = require('isarray');

exports.scrape = (config) => {
    return getHTML(config.url)
        .then( cheerio.load )
        .then( html => parse(html, config.data))
};

const parse = ($, config) => {
    const res = {};
    Object.keys(config).forEach( key => {
        res[key] = extract($, config[key]);
    });
    return res;
};

const extract = ($, data) => {
    if (typeof data === "string")
        return getValue($, data, 'text');
    else if (isArray(data))
        return $(data[0]).map( (index, elem) => parse(cheerio.load(elem), data[1])).get();
    else
        return getValue($, data.selector, data.scrape[0], data.scrape[1]);
};

const getValue = ($, selector, attribute, param) => {
    return $(selector)[attribute](param);
};

const getHTML = (url) => {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error)
                reject(error);
            else if (response.statusCode !== 200)
                reject(body);
            else
                resolve(body);
        })
    });
};