const { StatusCodes } = require('http-status-codes');
const { Op, where } = require("sequelize");

const { Booking } = require('../models');
const CrudRepository = require('./crud-repository');
const {Enums} = require('../utils/common');
const { response } = require('express');
const AppError = require('../utils/errors/app-error');
const { CANCELLED, BOOKED } = Enums.BOOKING_STATUS;

class BookingRepository extends CrudRepository {
    constructor() {
        super(Booking);
    }

    async createBooking(data, transaction) {
        const response = await Booking.create(data.userId, {transaction: transaction});
        return response;
    }
    
    async get(data, transaction) {
        const response = await Booking.findByPk(data, {transaction: transaction});
        if(!response) {
            throw new AppError('Not able to fund the resource', StatusCodes.NOT_FOUND);
        }
        return response;
    }

    async update(id, data, transaction) { // data -> {col: value, ....}
        const response = await Booking.update(data, {
            where: {
                id: id
            }
        }, {transaction: transaction});
        return response;
    }
    
}

module.exports = BookingRepository;