const { MongoClient } = require('mongodb');
const nodemailer = require('nodemailer');

// MongoDB Connection URI from Vercel Environment Variables
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'janaral_tech';

let cachedClient = null;

async function connectToDatabase() {
    if (cachedClient) return cachedClient;
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    cachedClient = client;
    return client;
}

module.exports = async (req, res) => {
    // Enable CORS headers so your frontend can talk to this API
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, country } = req.body;

    if (!name || !email || !country) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const client = await connectToDatabase();
        const db = client.db(DB_NAME);
        const collection = db.collection('waitlist');

        // Check if email already exists in the database
        const existing = await collection.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ error: 'This email is already registered on the waitlist.' });
        }

        // Insert new subscriber into MongoDB Atlas Database
        await collection.insertOne({
            name,
            email: email.toLowerCase(),
            country,
            createdAt: new Date()
        });

        // Send Email notification to your inbox via Nodemailer & Gmail
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: `"JANARAL Tech Bot" <${process.env.EMAIL_USER}>`,
            to: process.env.RECIPIENT_EMAIL,
            subject: `🚀 New JAI Waitlist Submission: ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #ffffff; border-radius: 8px;">
                    <h2 style="color: #38bdf8;">New JAI Waitlist Subscriber</h2>
                    <p>A new user has secured their spot:</p>
                    <hr style="border-color: #334155;">
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Country:</strong> ${country}</p>
                    <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">Saved to MongoDB Atlas Cloud Database.</p>
                </div>
            `
        });

        return res.status(200).json({ success: true, message: 'Success! Your spot is secured.' });

    } catch (error) {
        console.error('Database/Email error:', error);
        return res.status(500).json({ error: 'Internal server error. Please try again later.' });
    }
};