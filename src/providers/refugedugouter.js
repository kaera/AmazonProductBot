const axios = require('axios');

const RefugeDuGouter = {};

RefugeDuGouter.getData = async function (url, data) {
  console.log('Sending request to', url);
  const response = await axios({
    method: 'post',
    url: url,
    data: data
  });
  return response.data.match(/globalAvailability = (.*?);/)[1];
};

module.exports = RefugeDuGouter;
