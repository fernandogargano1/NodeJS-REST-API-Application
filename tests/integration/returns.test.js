const request = require('supertest');
const mongoose = require('mongoose');

const { Rental } = require('../../models/rental');
const { User } = require('../../models/user');

describe('/api/returns', () => {
    let server;
    let customerId;
    let movieId;
    let rental;
    let token;

    // Let's define the happy path 
    const exec = () => {
        return request(server)            
            .post('/api/returns')
            .set('x-auth-token', token)
            .send({ customerId, movieId });;   
    }

    beforeEach(async () => { 
        server = require('../../index'); 

        // These are valid values for the happy path
        customerId = mongoose.Types.ObjectId();
        movieId = mongoose.Types.ObjectId();
        token = new User().generateAuthToken();

        rental = new Rental({
            customer: {
                _id: customerId,
                name: '12345',
                phone: '12345'
            },
            movie: {
                _id: movieId,
                title: '12345',
                dailyRentalRate: 2
            }
        });

        await rental.save();
    });
    afterEach(async () => { 
        await server.close(); 
        await Rental.remove({});
    });

    it('should return 401 if client is not logged in', async () => {       
        token = '';

        const res = await exec();

        expect(res.status).toBe(401);    
    });

    it('should return 400 if customerId is not provided', async () => {
        
       /* Another alternative is to defined an object payload and 
          delete customer id 

                delete payload.customerId

          Either way if we don't have a customer id in the code of a request
          our current implementation is going to return a 400 error
       */
       customerId = '';
                
       const res = await exec();
            
        expect(res.status).toBe(400);
    });

    it('should return 400 if movieId is not provided', async () => {
        
        movieId = '';
        
        const res = await exec();
            
        expect(res.status).toBe(400);
    });

    it('should return 404 is not rental found for the customer/movie', async () => {

        await Rental.remove({});       

        const res = await exec();

        expect(res.status).toBe(404);
    });

    it('should return 400 is rental already processed', async () => {      
        
        rental.dateReturned = Date();
        await rental.save();

        const res = await exec();

        expect(res.status).toBe(400);
    })
});