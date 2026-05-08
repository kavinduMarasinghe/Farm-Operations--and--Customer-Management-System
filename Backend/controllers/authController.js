const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Farmer = require('../models/Farmer.js');
const transporter = require('../nodemailer.js');
const { trusted } = require('mongoose');

const register = async (req, res) => {
    const {first_name, last_name, email, password, contact, farm_type } = req.body;

    if (!first_name || !last_name || !email || !password || !contact || !farm_type) {
        return res.json({ success: false, message: 'Missing details' });
    }

    try {
        const existingFarmer = await Farmer.findOne({ email });
        if (existingFarmer) {
            return res.json({ success: false, message: 'Farmer already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const farmer = new Farmer({
            first_name,
            last_name,
            email,
            password: hashedPassword,
            contact,
            farm_type
        });

        await farmer.save();

        // generate token
        const token = jwt.sign({ id: farmer._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        //welcome email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: `Welcome to Farm Operations and Customer Management System`,
            text: `Welcome to Farm Operations and Customer Management System! We are glad to have you here.
            You can now login to your account and start using our services.
            Your account has been created with email id: ${email}`
                  
        }
            await transporter.sendMail(mailOptions); 

        // send success 
        return res.json({success: true});

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ success: false, message: 'Email and password are required' });
    }

    try {
        const farmer = await Farmer.findOne({ email });
        if (!farmer) {
            return res.json({ success: false, message: 'User does not exist' });
        }

        const isMatch = await bcrypt.compare(password, farmer.password);
        if (!isMatch) {
            return res.json({ success: false, message: 'Incorrect password' });
        }

        const token = jwt.sign({ id: farmer._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({
            success: true,
            message: 'User logged in successfully',
            token
        });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });

        return res.json({ success: true, message: 'User logged out successfully' });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

module.exports = { register, login, logout };


//send verification otp to user
const sendVerifyOtp = async (req, res) => {
       try {

         const {farmerID} = req.body;
         const farmer = await Farmer.findById(farmerID);

         if(farmerID.isAccountVerified) {
            return res.json({success: false, message: 'User already verified'});
         }

         const otp = String(Math.floor (100000 + Math.random() * 900000));

         farmerID.verifyOtp = otp;
         farmerID.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

         await farmer.save();

         const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: farmer.email,
            subject: `Welcome to Farm Operations and Customer Management System`,
            text: `Welcome to Farm Operations and Customer Management System! We are glad to have you here.
            You can now login to your account and start using our services.
            Your account has been created with email id: ${email}`
         }

       } catch(error) {
         res.json({success: false, message: error.message});
       }





}