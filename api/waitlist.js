// Insert new subscriber into MongoDB Atlas Database
await collection.insertOne({
    name,
    email: email.toLowerCase(),
    country,
    createdAt: new Date()
});

// Send Email notification safely with its own try/catch
try {
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
        html: `...`
    });
} catch (emailError) {
    console.error('Failed to send notification email:', emailError);
    // We log the email error, but we DO NOT return a 500 error 
    // so the user's registration still succeeds and saves to MongoDB.
}

return res.status(200).json({ success: true, message: 'Success! Your spot is secured.' });