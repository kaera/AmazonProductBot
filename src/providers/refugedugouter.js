const axios = require('axios');

const RefugeDuGouter = {};

RefugeDuGouter.getTitleMessage = function () {
  return 'Hi. I\'m here to help you find available places in Refuge du Goûter.\n\n';
};

RefugeDuGouter.getHelpMessage = function () {
  return 'I can understand the following commands:\n' +
    '	/status: List current polling processes.\n' +
    '	poll [date]: Init polling for a date in format YYYY-MM-DD, e.g. poll 2018-07-10.\n' +
    '	stop [date]: Stop polling for a date in format YYYY-MM-DD, e.g. stop 2018-07-10.\n' +
    '	/clear: Stop all polling processes.';
};

RefugeDuGouter.runPollCommand = function (chatId, message, callbacks) {
  const date = message.text.match(/20\d\d-\d\d-\d\d/);
  return date ?
    callbacks.handleStartPolling(chatId, date[0]) :
    callbacks.sendMessage(chatId, 'Couldn\'t parse the date. ' +
      'Please enter the date in format YYYY-MM-DD, e.g. "poll 2018-07-10".');
};

RefugeDuGouter.runStopCommand = function (chatId, message, callbacks) {
  const date = message.text.match(/20\d\d-\d\d-\d\d/);
  return date ?
    callbacks.handleStopPolling(chatId, date[0]) :
    callbacks.sendMessage(chatId, 'Couldn\'t parse the date. ' +
      'Please enter the date in format YYYY-MM-DD, e.g. "stop 2018-07-10".');
};

/**
 * Send a request to refugedugoute website
 * to fetch the list of available dates
 */
RefugeDuGouter.getData = async function (url, data) {
  console.log('Sending request to', url);
  const response = await axios({
    method: 'post',
    url: url,
    data: data
  });
  const result = response.data.match(/globalAvailability = (.*?);/)[1];
  return JSON.parse(result);
};

/**
 * @param chatId
 * @param items - List of dates observed by user
 * @param data - Updated data
 * @param callbacks
 */
RefugeDuGouter.handleUpdate = async function (chatId, items, data, callbacks) {
  const invalidDates = [];
  const availableDates = [];
  console.log('Checking data for chat id:', chatId, 'dates: ', items.join(', '));
  items.forEach(item => {
    if (data[item] === undefined) {
      invalidDates.push(item);
      callbacks.removeItem(chatId, item);
    } else if (data[item] > 0) {
      availableDates.push(item);
      // callbacks.removeItem(chatId, item);
    }
  });
  if (invalidDates.length) {
    callbacks.sendMessage(chatId, 'Unable to poll for date ' + invalidDates.join(', ') + ' as it\'s out of range');
  }
  if (availableDates.length) {
    callbacks.sendMessage(chatId, 'Places found for date ' + availableDates.join(', ') + '.\n\n' +
      'You can book them here: http://refugedugouter.ffcam.fr/resapublic.html.');
    console.log('Sending success message for chat id:', chatId, 'dates:', availableDates.join(', '));
  }
};

module.exports = RefugeDuGouter;
