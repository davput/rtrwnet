package email

import (
	"crypto/tls"
	"fmt"
	"net/smtp"
	"strings"
)

// Config holds email configuration
type Config struct {
	SMTPHost     string
	SMTPPort     int
	SMTPUsername string
	SMTPPassword string
	FromEmail    string
	FromName     string
	UseTLS       bool
}

// Service handles email sending
type Service struct {
	config *Config
}

// NewService creates a new email service
func NewService(config *Config) *Service {
	return &Service{config: config}
}

// SendOTP sends OTP verification email
func (s *Service) SendOTP(to, otp, purpose string) error {
	subject := "Kode Verifikasi Email"
	purposeText := "registrasi"
	
	switch purpose {
	case "registration":
		purposeText = "registrasi akun"
	case "reset_password":
		purposeText = "reset password"
		subject = "Kode Reset Password"
	case "email_change":
		purposeText = "perubahan email"
		subject = "Kode Verifikasi Perubahan Email"
	}

	body := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #4F46E5; text-align: center; 
                    padding: 20px; background: white; border-radius: 8px; margin: 20px 0;
                    letter-spacing: 8px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        .warning { color: #dc2626; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>RT/RW Net SaaS</h1>
        </div>
        <div class="content">
            <h2>Kode Verifikasi</h2>
            <p>Halo,</p>
            <p>Anda menerima email ini karena ada permintaan %s pada platform RT/RW Net SaaS.</p>
            <p>Gunakan kode OTP berikut untuk melanjutkan:</p>
            <div class="otp-code">%s</div>
            <p class="warning">⚠️ Kode ini akan kadaluarsa dalam 10 menit.</p>
            <p>Jika Anda tidak melakukan permintaan ini, abaikan email ini.</p>
        </div>
        <div class="footer">
            <p>Email ini dikirim secara otomatis. Mohon tidak membalas email ini.</p>
            <p>&copy; 2024 RT/RW Net SaaS. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`, purposeText, otp)

	return s.SendHTML(to, subject, body)
}

// SendHTML sends an HTML email
func (s *Service) SendHTML(to, subject, htmlBody string) error {
	from := s.config.FromEmail
	if s.config.FromName != "" {
		from = fmt.Sprintf("%s <%s>", s.config.FromName, s.config.FromEmail)
	}

	headers := make(map[string]string)
	headers["From"] = from
	headers["To"] = to
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=UTF-8"

	var msg strings.Builder
	for k, v := range headers {
		msg.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	msg.WriteString("\r\n")
	msg.WriteString(htmlBody)

	addr := fmt.Sprintf("%s:%d", s.config.SMTPHost, s.config.SMTPPort)
	auth := smtp.PlainAuth("", s.config.SMTPUsername, s.config.SMTPPassword, s.config.SMTPHost)

	if s.config.UseTLS {
		return s.sendWithTLS(addr, auth, s.config.FromEmail, to, msg.String())
	}

	return smtp.SendMail(addr, auth, s.config.FromEmail, []string{to}, []byte(msg.String()))
}

func (s *Service) sendWithTLS(addr string, auth smtp.Auth, from, to, msg string) error {
	tlsConfig := &tls.Config{
		InsecureSkipVerify: true,
		ServerName:         s.config.SMTPHost,
	}

	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, s.config.SMTPHost)
	if err != nil {
		return fmt.Errorf("failed to create client: %w", err)
	}
	defer client.Close()

	if err := client.Auth(auth); err != nil {
		return fmt.Errorf("failed to authenticate: %w", err)
	}

	if err := client.Mail(from); err != nil {
		return fmt.Errorf("failed to set sender: %w", err)
	}

	if err := client.Rcpt(to); err != nil {
		return fmt.Errorf("failed to set recipient: %w", err)
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to get writer: %w", err)
	}

	if _, err := w.Write([]byte(msg)); err != nil {
		return fmt.Errorf("failed to write message: %w", err)
	}

	if err := w.Close(); err != nil {
		return fmt.Errorf("failed to close writer: %w", err)
	}

	return client.Quit()
}
