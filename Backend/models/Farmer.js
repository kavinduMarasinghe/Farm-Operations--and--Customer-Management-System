const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
        first_name: {type: String, required: true},
        last_name: {type: String, required: true},
        email: {type: String, required: true, unique: true},
        password: {type: String, required: true},
        contact: {type: String, required: true},
        farm_type: {type: String, required: true},
        verifyOTP: {type: String, default: ''},
        verifyOTPExpireAt: {type: Number, default: 0},
        isAccountVerified: {type: Boolean, default: false},
        resetOTP: {type: String, default: ''},
        resetOTPExpireAt: {type: Number, default: 0},
})
       
const farmerModel = mongoose.models.farmer || mongoose.model('farmer', farmerSchema);

module.exports = farmerModel;