const axios = require('axios');

const RefugeDuGouter = {};

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
  return response.data.match(/globalAvailability = (.*?);/)[1];
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
