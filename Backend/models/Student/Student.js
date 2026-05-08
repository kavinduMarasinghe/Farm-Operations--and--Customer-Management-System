const mongoose = require('mongoose');

// Student Schema
const studentSchema = new mongoose.Schema({
    first_name: { 
        type: String, 
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    last_name: { 
        type: String, 
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: { 
        type: String, 
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    contact: { 
        type: String, 
        required: [true, 'Contact number is required'],
        trim: true,
        match: [/^\+?[\d\s-()]+$/, 'Please provide a valid contact number']
    },
    role: { 
        type: String, 
        enum: ['student'], 
        default: 'student' 
    },
    isAccountVerified: { 
        type: Boolean, 
        default: false 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    // OTP fields for email verification
    verifyOTP: { 
        type: String, 
        default: '' 
    },
    verifyOTPExpireAt: { 
        type: Number, 
        default: 0 
    },
    // OTP fields for password reset
    resetOTP: { 
        type: String, 
        default: '' 
    },
    resetOTPExpireAt: { 
        type: Number, 
        default: 0 
    },
    // Additional profile fields
    profileImage: {
        type: String,
        default: ''
    },
    // List of live session IDs the student is enrolled in
    liveSessions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LiveSession',
        default: []
    }],
    lastLogin: {
        type: Date
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
studentSchema.virtual('fullName').get(function() {
    return `${this.first_name} ${this.last_name}`;
});

// Text search indexes
studentSchema.index({ 
    first_name: 'text', 
    last_name: 'text', 
    email: 'text'
});

// Compound indexes for common queries
studentSchema.index({ email: 1, isActive: 1 });

// Pre-save middleware to update lastLogin
studentSchema.pre('save', function(next) {
    if (this.isModified('password') || this.isNew) {
        // Don't update lastLogin on password changes or new users
        return next();
    }
    next();
});

// Instance method to check if OTP is valid
studentSchema.methods.isOTPValid = function(otp, type = 'verify') {
    if (type === 'verify') {
        return this.verifyOTP === otp && this.verifyOTPExpireAt > Date.now();
    } else if (type === 'reset') {
        return this.resetOTP === otp && this.resetOTPExpireAt > Date.now();
    }
    return false;
};

// Instance method to clear OTP
studentSchema.methods.clearOTP = function(type = 'verify') {
    if (type === 'verify') {
        this.verifyOTP = '';
        this.verifyOTPExpireAt = 0;
    } else if (type === 'reset') {
        this.resetOTP = '';
        this.resetOTPExpireAt = 0;
    }
};

// Static method to find active students
studentSchema.statics.findActive = function() {
    return this.find({ isActive: true });
};

// Static method to search students
studentSchema.statics.searchStudents = function(query) {
    return this.find({
        $text: { $search: query },
        isActive: true
    });
};

const studentModel = mongoose.models.Student || mongoose.model('Student', studentSchema);

module.exports = studentModel;
