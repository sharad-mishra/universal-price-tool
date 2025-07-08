const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../src/app');
const { expect } = chai;

chai.use(chaiHttp);

describe('Price API', () => {
  it('should return 400 for invalid country', async () => {
    const res = await chai.request(app).get('/api/prices').query({ country: 'XX', query: 'test' });
    expect(res).to.have.status(400);
    expect(res.body).to.have.property('error', 'Invalid request parameters');
  });

  it('should return results for valid query', async () => {
    const res = await chai.request(app).get('/api/prices').query({ country: 'US', query: 'iPhone 16 Pro' });
    expect(res).to.have.status(200);
    expect(res.body).to.be.an('array');
  });
});