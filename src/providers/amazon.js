const axios = require('axios');
const parser = require('node-html-parser');

const Amazon = {};

/**
 * Returns current price of a product by a given url on Amazon
 */
async function fetchPrice (url) {
  console.log('Sending request to', url);
  const response = await axios(url);
  console.log('Parsing the html for', url);
  const price = parser.parse(response.data).querySelector('#buybox .offer-price').text
  console.log('Done');
  return price;
};

Amazon.getData = async function (urls) {
  const result = await Promise.all(urls.map(fetchPrice))
  return result.map((price, i) => ({
    url: urls[i],
    price
  }));
};

module.exports = Amazon;
