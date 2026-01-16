-- Create email_otps table for OTP verification
CREATE TABLE IF NOT EXISTS email_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX idx_email_otps_email_purpose ON email_otps(email, purpose);
CREATE INDEX idx_email_otps_expires_at ON email_otps(expires_at);

-- Comment
COMMENT ON TABLE email_otps IS 'Stores OTP codes for email verification';
