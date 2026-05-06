package smtp

import (
	"fmt"

	"gopkg.in/gomail.v2"
)

type Config struct {
	Host     string
	Port     int
	User     string
	Password string
	From     string
}

type Sender struct {
	cfg    Config
	dialer *gomail.Dialer
}

func NewSender(cfg Config) *Sender {
	return &Sender{
		cfg:    cfg,
		dialer: gomail.NewDialer(cfg.Host, cfg.Port, cfg.User, cfg.Password),
	}
}

// Send delivers an email. Set isHTML=true for HTML body, false for plain text.
func (s *Sender) Send(to, subject, body string, isHTML bool) error {
	m := gomail.NewMessage()
	m.SetHeader("From", s.cfg.From)
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)

	ct := "text/plain"
	if isHTML {
		ct = "text/html"
	}
	m.SetBody(ct, body)

	if err := s.dialer.DialAndSend(m); err != nil {
		return fmt.Errorf("smtp send to %s: %w", to, err)
	}
	return nil
}
