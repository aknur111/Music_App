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
	d := gomail.NewDialer(cfg.Host, cfg.Port, cfg.User, cfg.Password)
	return &Sender{cfg: cfg, dialer: d}
}

func (s *Sender) Send(to, subject, body string, isHTML bool) error {
	m := gomail.NewMessage()
	m.SetHeader("From", s.cfg.From)
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)

	contentType := "text/plain"
	if isHTML {
		contentType = "text/html"
	}
	m.SetBody(contentType, body)

	if err := s.dialer.DialAndSend(m); err != nil {
		return fmt.Errorf("smtp send to %s: %w", to, err)
	}
	return nil
}
