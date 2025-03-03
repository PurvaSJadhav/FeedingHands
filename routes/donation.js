const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Listing = require('../models/listing');

// Create a nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail', // or your preferred email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Donation route: send an email notification when a donor donates food
router.post('/:id/donate', async (req, res) => {
    try {
        const listingId = req.params.id;
        // Retrieve the listing details using its ID
        const listing = await Listing.findById(listingId);
        if (!listing) {
            req.flash('error', 'Listing not found');
            return res.redirect('/listings');
        }
        
        // Use NGO email stored in the listing or fallback to the environment variable
        const ngoEmail = listing.ngoEmail || process.env.NGO_EMAIL;
        if (!ngoEmail) {
            console.error('NGO email not provided.');
        } else {
            // Build the notification email
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: ngoEmail,
                subject: 'New Food Donation Notification',
                text:`
Hello,

We are excited to inform you that a new food donation has been received for the listing: "${listing.title}".

Below are the details of the donation:
------------------------------------------------------
Donor: ${req.user.username}
Donation Date: ${new Date().toLocaleString()}
------------------------------------------------------

Please review the donation details and contact the donor if further coordination is needed regarding pickup or additional instructions. This donation helps us continue our mission to reduce food waste and support communities in need.

For more information, please log into your admin dashboard to view the full details and update the status as necessary.

Thank you for your ongoing support and dedication.

Best regards,
The Feeding Hands Team
`

            };

            // Send the email notification
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                } else {
                    console.log('Notification email sent:', info.response);
                }
            });
        }

        req.flash('success', 'Thank you for your donation!');
        res.redirect(`/listings/${listingId}`);
    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong with your donation.');
        res.redirect('/listings');
    }
});

module.exports = router;
