const axios = require('axios');
const parser = require('node-html-parser');

const Amazon = {};

Amazon.getTitleMessage = function () {
  return 'Hi. I\'m here to help you monitor the prices on Amazon.\n\n';
};

Amazon.getHelpMessage = function () {
  return 'I can understand the following commands:\n' +
    '	/status: List current polling processes.\n' +
    '	poll [url] [price]: Init polling for a product with given price in EUR,\n' +
    '		e.g. poll https://amazon.de/dp/0123456789 25.00\n' +
    '	stop [url]: Stop polling for a product,\n' +
    '		e.g. stop https://amazon.de/dp/0123456789\n' +
    '	/clear: Stop all polling processes.';
};

Amazon.runPollCommand = function (chatId, message, callbacks) {
  const params = message.text.match(/poll (https:\S+) (\d+\S*)/);
  return params ?
    callbacks.handleStartPolling(chatId, [params[1].replace(/#.*/, ''), params[2]].join('#')) :
    callbacks.sendMessage(chatId, 'Couldn\'t parse the params. Please type the message in format "poll [url] [price]",\n' +
    '		e.g. poll https://amazon.de/dp/0123456789 25.00');
};

Amazon.runStopCommand = function (chatId, message, callbacks) {
  const params = message.text.match(/stop (https:\S+)/);
  return params ?
    callbacks.handleStopPolling(chatId, params[1].replace(/#.*/, '')) :
    callbacks.sendMessage(chatId, 'Couldn\'t parse the params. Please type the message in format "stop [url]",\n' +
    '		e.g. stop https://amazon.de/dp/0123456789');
};

/**
 * Returns current price of a product by a given url on Amazon
 */
async function fetchPrice (url) {
  console.log('Sending request to', url);
  const response = await axios({
    url: url,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebkit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36'
    }
  });
  console.log('Parsing the html for', url);
  const buyboxContent = parser.parse(response.data).querySelector('#buybox').text;
  const rawPrice = buyboxContent.match(/EUR \d+,\d+/);
  if (!rawPrice) {
    console.log('No price found for', url);
    return;
  }
  console.log('Price fetched:', rawPrice[0]);
  const price = parseFloat(rawPrice[0].replace(/EUR /, '').replace(/,/, '.'));
  console.log('Price parsed:', price);
  return price;
};

Amazon.getData = async function (db) {
  const urls = await db.getAllDates();
  console.log(urls);
  const prices = await Promise.all(urls.map(fetchPrice));
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
  console.log('Checking data for chat id:', chatId, 'items: ', items.join(', '));
  items.forEach(item => {
    const [url, price] = item.split('#');
    if (data[item] === undefined) {
      invalidItems.push(item);
      callbacks.removeItem(chatId, item);
    } else if (data[item] < price) {
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