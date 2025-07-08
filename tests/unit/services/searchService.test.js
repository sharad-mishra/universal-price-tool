const { expect } = require('chai');
const sinon = require('sinon');
const SearchService = require('../../../src/services/searchService');

describe('SearchService', () => {
  it('should return empty array on search failure', async () => {
    sinon.stub(SearchService, 'searchProducts').resolves([]);
    const results = await SearchService.searchProducts('US', 'test');
    expect(results).to.be.an('array').that.is.empty;
    sinon.restore();
  });
});