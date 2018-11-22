const assert = require('assert');
const sinon = require('sinon');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const mockAdapter = new MockAdapter(axios);

const amazonProvider = require('./amazon');

describe('Amazon Detail Page module', () => {

  before(() => {
    this.logStub = sinon.stub(console, 'info');
  });

  after(() => {
    this.logStub.restore();
  });

  describe('#getTitleMessage', () => {
    it('should return start message', () => {
      const message = amazonProvider.getTitleMessage();
      assert.equal(message, 'Hi. I\'m here to help you monitor the prices on Amazon.\n\n');
    });
  });

  describe('#getHelpMessage', () => {
    it('should return start message', () => {
      const message = amazonProvider.getHelpMessage();
      assert(message);
    });
  });

  describe('#getData', () => {
    const db = {};
    const item1 = 'https://amazon.de/dp/B07BZTZC6R';
    const item2 = 'https://amazon.de/dp/B07D1HRYN9';
    const item3 = 'https://amazon.de/dp/B07BGQZXTL';

    before(() => {
      mockAdapter
        .onGet(item1)
        .reply(200, '<div id="buybox"><div class="offer-price">EUR 12,50</div></div>');
      mockAdapter
        .onGet(item2)
        .reply(200, '<div id="buybox"><div id="price_inside_buybox">EUR 19,50</div></div>');
      mockAdapter
        .onGet(item3)
        .reply(200, '<div id="buybox">No price</div>');
    });

    after(() => {
      mockAdapter.restore();
    });

    it('should return an object with product prices', async () => {
      db.getAllDates = sinon.fake.returns([item1, item2]);
      const data = await amazonProvider.getData(db);
      assert.deepEqual(data, {
        [item1]: 12.5,
        [item2]: 19.5
      });
    });

    it('should set undefined value if item price is not found', async () => {
      db.getAllDates = sinon.fake.returns([item1, item3]);
      const data = await amazonProvider.getData(db);
      assert.deepEqual(data, {
        [item1]: 12.5,
        [item3]: undefined
      });
    });

  });

  describe('Amazon data', () => {
    const urls = [
      'https://amazon.de/dp/B07BZTZC6R',
      'https://amazon.de/dp/B07D1HRYN9',
      'https://amazon.de/dp/B07BGQZXTL'
    ];
    const db = {
      getAllDates: sinon.fake.returns(urls)
    };

    it('should return real data from amazon.de', async () => {
      const data = await amazonProvider.getData(db);
      console.log(data);
      assert(data);
      urls.forEach(url => {
        assert(data[url] > 0);
      });
    });
  });

  describe('#handleUpdate', () => {
    const chatId = 42;
    let items;
    let data;
    let callbacks;

    beforeEach(() => {
      items = [];
      data = {};
      callbacks = {
        removeItem: sinon.fake(),
        sendMessage: sinon.fake()
      };
    });

    it('should pass if user has no items', () => {
      amazonProvider.handleUpdate(chatId, items, data, callbacks);
      assert(true);
    });

    it('should notify the user if the item is not found in data', () => {
      items.push('item1#12');
      amazonProvider.handleUpdate(chatId, items, data, callbacks);
      sinon.assert.calledWith(callbacks.removeItem, chatId, 'item1#12');
      sinon.assert.calledWith(callbacks.sendMessage, chatId, 'Unable to fetch data for items: item1#12');
    });

    it('should notify the user if item price is lower than expected', () => {
      items.push('item1#12');
      data['item1#12'] = 10;
      amazonProvider.handleUpdate(chatId, items, data, callbacks);
      sinon.assert.calledWith(callbacks.sendMessage, chatId, 'Prices for items item1#12 have dropped!');
      sinon.assert.notCalled(callbacks.removeItem);
    });

    it('should not notify the user if item price is higher than expected', () => {
      items.push('item1#12');
      data['item1#12'] = 15;
      amazonProvider.handleUpdate(chatId, items, data, callbacks);
      sinon.assert.notCalled(callbacks.sendMessage);
    });

  });

});
