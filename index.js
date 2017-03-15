const request = require("request");
const cheerio = require("cheerio");

exports.scrape = (config) => {
    if (typeof config.url === "string")
        return launch(config.url, config);
    return Promise.all(config.url.map( url => launch(url, config)));
};

const launch = (url, config) => {
    if (config.pagination) {
        return getPaginatedHTML(url, config.pagination)
            .then( (pages) => {
                return Promise.all(pages.map(page => parse(page, config.data)));
            })
            .catch(err => console.error(err));
    }
    return getHTML(url)
        .then( cheerio.load )
        .then( html => parse(html, config.data))
        .catch(err => console.error(err));
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
    else if (Array.isArray(data))
        return $(data[0]).map( (index, elem) => parse(cheerio.load(elem), data[1])).get();
    else
        return getValue($, data.selector, data.scrape[0], data.scrape[1]);
};

const getValue = ($, selector, attribute, param) => {
    return $(selector)[attribute](param);
};

const getPaginatedHTML = (url, pagination, acc = []) => {

    return new Promise( (resolve, reject) => {
        getHTML(url)
            .then( cheerio.load)
            .then( $ => {
                acc.push($);
                const nextButton = $(pagination);
                if (nextButton.length > 0) {

                    resolve(getPaginatedHTML(nextButton.attr('href'), pagination, acc))
                }
                else {
                    resolve(acc);
                }

            })
            .catch((err) => console.log("error : ", err));
    })
}

const getHTML = (url) => {
    console.log("Fecthing page : ", url);
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