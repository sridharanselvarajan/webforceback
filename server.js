    const express = require('express');
    const bodyParser = require('body-parser');
    const mongoose = require('mongoose');
    const cors = require('cors');
    const bcrypt = require('bcryptjs');
    const app = express();
    app.use(bodyParser.json());
    app.use(cors());

    mongoose
    .connect('mongodb://127.0.0.1:27017/webforce', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected!'))
    .catch((err) => console.error('MongoDB connection error:', err));

    // User Schema
    const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    schedule: [
        {
        date: { type: String, required: true },
        time: { type: String, required: true },
        address: { type: String, required: true },
        landmark: { type: String, required: true },
        pincode: { type: String, required: true },
        weight: { type: String, required: true },
        remarks: { type: String },
        },
    ],
    });

    userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10); // Hash the password
    }
    next();
    });

    const User = mongoose.model('User', userSchema);

    // Register API
    app.post('/api/register', async (req, res) => {
    const { name, email, phone, password, confirmPassword, role } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = new User({
        name,
        email,
        phone,
        password,
        role,
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
    });

    // Login API
    app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
        return res.status(400).json({ message: 'No user found with this email' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
        }
        res.status(200).json({
        message: 'Login successful!',
        user: {
            name: user.name,
            email: user.email,
            role: user.role,
        },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
    });

   // Schedule Pickup API
app.post('/api/schedule', async (req, res) => {
    const { email, date, time, address, landmark, pincode, weight, remarks } = req.body;

    if (!email || !date || !time || !address || !landmark || !pincode || !weight) {
        return res.status(400).json({ message: 'All fields except remarks are required.' });
    }

    try {
        console.log("request body:", req.body);
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Add the schedule entry
        const newSchedule = {
            date,
            time,
            address,
            landmark,
            pincode,
            weight,
            remarks,
        };
        console.log("New schedule entry", newSchedule)
        user.schedule.push(newSchedule); // Push the schedule to the array
        await user.save(); // Save the user document

        res.status(200).json({ message: 'Pickup scheduled successfully!' });
    } catch (error) {
        console.error('Error scheduling pickup:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});


    // Get Scheduled Pickups API
    app.get('/api/schedule/:email', async (req, res) => {
    const { email } = req.params;

    try {
        const user = await User.findOne({ email });
        if (!user) {
        return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ schedule: user.schedule });
    } catch (error) {
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
    });

    const PORT = 5000;
    app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    });
