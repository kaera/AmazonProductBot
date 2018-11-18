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
  const rawPrice = parser.parse(response.data).querySelector('#buybox .offer-price').text;
  console.log('Price fetched:', rawPrice);
  const price = parseFloat(rawPrice.replace(/EUR /, '').replace(/,/, '.'));
  console.log('Price parsed:', price);
  return price;
};

Amazon.getData = async function (urls) {
  const prices = await Promise.all(urls.map(fetchPrice))
  const result = {};
  urls.forEach((url, i) => {
    result[url] = prices[i];
  });
  return result;
};

/**
 * @param chatId
 * @param items - List of items observed by user
 * @param data - Updated data
 * @param callbacks
 *
 * data format: {
 *   url1: price1,
 *   url2: price2
 * }
 *
 * items format: [
 *   url1#price1,
 *   url2#price2
 * ]
 */
Amazon.handleUpdate = async function (chatId, items, data, callbacks) {
  const invalidItems = [];
  const availableItems = [];
  console.log('Checking data for chat id:', chatId, 'dates: ', items.join(', '));
  items.forEach(item => {
    const [url, price] = item.split('#');
    if (data[url] === undefined) {
      invalidItems.push(item);
      callbacks.removeItem(chatId, item);
    } else if (data[url] < price) {
      availableItems.push(item);
    }
  });
  if (invalidItems.length) {
    callbacks.sendMessage(chatId, 'Unable to fetch data for items: ' + invalidItems.join(', '));
  }
  if (availableItems.length) {
    callbacks.sendMessage(chatId, 'Prices for items ' + availableItems.join(', ') + ' have dropped!');
    console.log('Sending success message for chat id:', chatId, 'items:', availableItems.join(', '));
  }
};

module.exports = Amazon;
