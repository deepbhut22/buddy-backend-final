import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your preferred email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
        
    }
});

// Email templates
const emailTemplates = {
    registration: (userName) => ({
        subject: 'Welcome to Our Platform - Registration Confirmation',
        html: `
            <h1>Welcome to Our Platform!</h1>
            <p>Dear ${userName},</p>
            <p>Thank you for registering with us. The Request to open an account has been successfully created.</p>
            <p>We will review your request and get back to you as soon as possible.</p>
            <p>Best regards,<br>Buddy-Deals</p>
        `
    }),

    verificationUpdate: (userName, status, message) => ({
        subject: 'Verification Status Update',
        html: `
            <h1>Verification Status Update</h1>
            <p>Dear ${userName},</p>
            <p>Your account verification status has been updated to: <strong>${status}</strong></p>
            <p>${message}</p>
            <p>Best regards,<br>Buddy-Deals</p>
        `
    }),

    newDiscount: (userName, discount) => ({
        subject: 'New Discount Alert! 🎉',
        html: `
            <h1>New Discount Available!</h1>
            <p>Dear ${userName},</p>
            <p>We're excited to inform you about a new discount:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
                <h2>${discount.name}</h2>
                <p>${discount.description}</p>
                <p>Discount: ${discount.discount}% off</p>
                <p>Valid until: ${new Date(discount.endDate).toLocaleDateString()}</p>
            </div>
            <p>Don't miss out on this amazing offer!</p>
            <p>Best regards,<br>Buddy-Deals</p>
        `
    }),

    newCoupon: (userName, coupon) => ({
        subject: 'New Coupon Available! 🎟️',
        html: `
            <h1>New Coupon Alert!</h1>
            <p>Dear ${userName},</p>
            <p>A new coupon is now available:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
                <h2>${coupon.name[0].name}</h2>
                <p>${coupon.description}</p>
                <p>Discount: ${coupon.discount}% off</p>
                <p>Valid until: ${new Date(coupon.endDate).toLocaleDateString()}</p>
            </div>
            <p>Hurry! Limited coupons available.</p>
            <p>Best regards,<br>Buddy-Deals</p>
        `
    }),

    userBanned: (userName, reason) => ({
        subject: 'Account Suspension Notice',
        html: `
            <h1>Account Suspension Notice</h1>
            <p>Dear ${userName},</p>
            <p>We regret to inform you that your account has been suspended.</p>
            <p><strong>Reason for suspension:</strong> ${reason}</p>
            <p>If you believe this is a mistake or would like to appeal this decision, please contact our support team.</p>
            <p>Best regards,<br>Buddy-Deals</p>
        `
    }),

    userUnbanned: (userName) => ({
        subject: 'Account Restoration Notice',
        html: `
            <h1>Account Restored</h1>
            <p>Dear ${userName},</p>
            <p>We're pleased to inform you that your account has been restored and is now active.</p>
            <p>You can now log in and access all our services again.</p>
            <p>Thank you for your patience and understanding.</p>
            <p>Best regards,<br>Buddy-Deals</p>
        `
    }),

    accountDeletion: (userName) => ({
        subject: 'Account Deletion Confirmation',
        html: `
            <h1>Account Deletion Confirmation</h1>
            <p>Dear ${userName},</p>
            <p>This email confirms that your account has been permanently deleted from our platform.</p>
            <p>If you didn't request this deletion or believe this is a mistake, please contact our support team immediately.</p>
            <p>Best regards,<br>Buddy-Deals</p>
        `
    })
};

// Email sending functions
export const sendRegistrationEmail = async (userEmail, userName) => {
    try {
        const template = emailTemplates.registration(userName);
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: template.subject,
            html: template.html
        });
        console.log('Registration email sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending registration email:', error);
        return false;
    }
};

export const sendVerificationUpdateEmail = async (userEmail, userName, status, message) => {
    try {
        const template = emailTemplates.verificationUpdate(userName, status, message);
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: template.subject,
            html: template.html
        });
        console.log('Verification update email sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending verification update email:', error);
        return false;
    }
};

export const sendNewDiscountEmail = async (userEmail, userName, discount) => {
    try {
        const template = emailTemplates.newDiscount(userName, discount);
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: template.subject,
            html: template.html
        });
        console.log('New discount email sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending new discount email:', error);
        return false;
    }
};

export const sendNewCouponEmail = async (userEmail, userName, coupon) => {
    try {
        const template = emailTemplates.newCoupon(userName, coupon);
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: template.subject,
            html: template.html
        });
        console.log('New coupon email sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending new coupon email:', error);
        return false;
    }
};

// Bulk email sending function for notifications
export const sendBulkEmails = async (users, emailType, data) => {
    try {
        const promises = users.map(user => {
            switch (emailType) {
                case 'newDiscount':
                    return sendNewDiscountEmail(user.email, user.firstName, data);
                case 'newCoupon':
                    return sendNewCouponEmail(user.email, user.firstName, data);
                default:
                    return Promise.resolve();
            }
        });

        await Promise.all(promises);
        console.log(`Bulk ${emailType} emails sent successfully`);
        return true;
    } catch (error) {
        console.error('Error sending bulk emails:', error);
        return false;
    }
};

export const sendBanNotification = async (userEmail, userName, reason) => {
    try {
        const template = emailTemplates.userBanned(userName, reason);
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: template.subject,
            html: template.html
        });
        console.log('Ban notification email sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending ban notification email:', error);
        return false;
    }
};

export const sendUnbanNotification = async (userEmail, userName) => {
    try {
        const template = emailTemplates.userUnbanned(userName);
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: template.subject,
            html: template.html
        });
        console.log('Unban notification email sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending unban notification email:', error);
        return false;
    }
};

export const sendDeletionNotification = async (userEmail, userName) => {
    try {
        const template = emailTemplates.accountDeletion(userName);
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: template.subject,
            html: template.html
        });
        console.log('Account deletion email sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending account deletion email:', error);
        return false;
    }
}; 