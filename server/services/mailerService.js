const nodemailer = require('nodemailer');

// Validate SMTP credentials on startup
const requiredEnvVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing SMTP Credentials. Required environment variables:', missingVars.join(', '));
  console.error('Please set these variables in your .env file and restart the server.');
  process.exit(1);
}

// Create the Transporter with proper TLS configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587, // Explicitly set to 587
  secure: false, // Use TLS (Port 587)
  tls: {
    rejectUnauthorized: false // Prevent local network handshake refusals
  },
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter connection on startup
const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log('✅ SMTP transporter is ready to send emails');
    console.log(`📧 Using SMTP host: ${process.env.SMTP_HOST}:${587}`);
    return true;
  } catch (error) {
    console.error('❌ SMTP transporter verification failed:', error);
    console.error('Please check your SMTP credentials and network connection.');
    throw error; // Throw real error instead of returning false
  }
};

// The function to send the OTP
const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"ASTU Support" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Your ASTU Verification Code",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding: 40px 20px; background-color: #f8fafc; border-radius: 8px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="margin-bottom: 30px;">
              <h1 style="color: #1e40af; font-size: 28px; margin-bottom: 10px;">ASTU Complaint System</h1>
              <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #3b82f6, #1e40af); margin: 0 auto;"></div>
            </div>
            
            <!-- Main Content -->
            <h2 style="color: #374151; font-size: 24px; margin-bottom: 15px;">Verify Your Email</h2>
            <p style="color: #6b7280; font-size: 16px; margin-bottom: 30px; line-height: 1.5;">
              Use the code below to complete your registration. This code will expire in <strong>10 minutes</strong>.
            </p>
            
            <!-- OTP Code -->
            <div style="background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 20px; border-radius: 8px; margin: 30px 0; letter-spacing: 8px; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              ${otp}
            </div>
            
            <!-- Instructions -->
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;">
              <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">How to use this code:</h3>
              <ol style="color: #6b7280; font-size: 14px; margin: 0; padding-left: 20px;">
                <li>Go back to the ASTU Complaint System</li>
                <li>Enter this 6-digit code in the verification field</li>
                <li>Click "Verify" to complete your registration</li>
              </ol>
            </div>
            
            <!-- Security Notice -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                <strong>Security Notice:</strong> If you didn't request this verification code, please ignore this email. 
                Your account remains secure.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0;">
                This code was requested from IP address: <span style="font-family: monospace;">[REDACTED]</span>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                © 2024 ASTU (Adama Science and Technology University). All rights reserved.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${email}`, {
      messageId: result.messageId,
      response: result.response
    });
    
    return {
      success: true,
      messageId: result.messageId,
      response: result.response
    };
    
  } catch (error) {
    console.error(`❌ Failed to send OTP email to ${email}:`, error);
    throw error;
  }
};

// Send welcome email after successful registration
const sendWelcomeEmail = async (email, fullName) => {
  try {
    const mailOptions = {
      from: `"ASTU Support" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Welcome to ASTU Complaint System",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding: 40px 20px; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #1e40af; font-size: 28px; margin-bottom: 10px;">Welcome to ASTU!</h1>
            <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #3b82f6, #1e40af); margin: 0 auto 30px;"></div>
            
            <h2 style="color: #374151; font-size: 24px; margin-bottom: 15px;">Hello ${fullName}!</h2>
            <p style="color: #6b7280; font-size: 16px; margin-bottom: 30px; line-height: 1.5;">
              Your account has been successfully created. You can now submit complaints, track their status, and communicate with the relevant departments.
            </p>
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;">
              <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">What you can do:</h3>
              <ul style="color: #6b7280; font-size: 14px; margin: 0; padding-left: 20px;">
                <li>Submit academic and administrative complaints</li>
                <li>Track the status of your complaints</li>
                <li>Receive notifications about updates</li>
                <li>Communicate directly with department staff</li>
              </ul>
            </div>
            
            <div style="margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" style="background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Go to Dashboard
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent successfully to ${email}`);
    
    return {
      success: true,
      messageId: result.messageId
    };
    
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, fullName, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;
    
    const mailOptions = {
      from: `"ASTU Support" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Reset Your ASTU Password",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding: 40px 20px; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #dc2626; font-size: 28px; margin-bottom: 10px;">Password Reset</h1>
            <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #ef4444, #dc2626); margin: 0 auto 30px;"></div>
            
            <h2 style="color: #374151; font-size: 24px; margin-bottom: 15px;">Reset Your Password</h2>
            <p style="color: #6b7280; font-size: 16px; margin-bottom: 30px; line-height: 1.5;">
              Hello ${fullName},<br><br>
              We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour.
            </p>
            
            <div style="margin: 30px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
              <p style="color: #991b1b; font-size: 14px; margin: 0;">
                <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure.
              </p>
            </div>
            
            <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
              This link will expire in 1 hour for security reasons.
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent successfully to ${email}`);
    
    return {
      success: true,
      messageId: result.messageId
    };
    
  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${email}:`, error);
    throw error;
  }
};

module.exports = {
  transporter,
  verifyTransporter,
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
};
