const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail', // or your preferred email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// GET: Render the money donation form
router.get('/moneydonation', (req, res) => {
  res.render('moneydonation'); // Ensure you have views/moneydonation.ejs
});

// POST: Process money donation and create a Stripe Checkout session
router.post('/moneydonation', async (req, res) => {
  try {
    const { name, email, amount, message } = req.body.donor;
    const donationAmount = parseInt(amount) * 100; // Convert dollars to cents
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Donation from ${name}`,
            description: message || 'Money Donation'
          },
          unit_amount: donationAmount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: email,
      success_url: `${process.env.BASE_URL}/donations/success?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&amount=${donationAmount}`,
      cancel_url: `${process.env.BASE_URL}/donations/cancel`,
    });

    res.redirect(303, session.url);
  } catch (error) {
    console.error("Error creating Stripe session:", error);
    req.flash('error', 'Error processing donation. Please try again.');
    res.redirect('/moneydonation');
  }
});

// GET: Render the donation success page and send an email notification using Nodemailer
router.get('/donations/success', (req, res) => {
  // Retrieve donor details from query parameters (sent via success_url)
  const { name, email, amount } = req.query;
  const donationAmount = (amount / 100).toFixed(2); // Convert cents back to dollars

  const adminEmail = process.env.ADMIN_EMAIL || 'bossinpune200@gmail.com'; // Fallback to a default email
  // Build email details
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL, // Set your admin email in .env
    subject: 'New Money Donation Received',
    text:  `
    Hello Admin,
    
    We are delighted to inform you that a new donation has been received through Feeding Hands. Below are the details of the donation:
    
    Donor Name: ${name}
    Donor Email: ${email}
    Donation Amount: Rs.${donationAmount}
    
    This generous contribution will go a long way in helping us reduce food waste and feed communities in need.
    
    Please log into your admin dashboard for more details and to review this donation further.
    
    Thank you for your ongoing support!
    
    Best regards,
    The Feeding Hands Team
      `
  };

  // Send the email using Nodemailer
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending donation email:', error);
    } else {
      console.log('Donation email sent:', info.response);
    }
  });

  res.render('donationSuccess', { name, donationAmount });
});

// GET: Render the donation cancel page
router.get('/donations/cancel', (req, res) => {
  res.render('donationCancel');
});

module.exports = router;
