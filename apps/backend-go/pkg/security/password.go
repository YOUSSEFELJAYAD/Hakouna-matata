package security

import (
	"errors"
	"regexp"
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

// Password validation constants
const (
	MinPasswordLength = 8
	MaxPasswordLength = 128
	BcryptCost        = 12 // Recommended by OWASP
)

var (
	ErrPasswordTooShort   = errors.New("password must be at least 8 characters")
	ErrPasswordTooLong    = errors.New("password must not exceed 128 characters")
	ErrPasswordTooWeak    = errors.New("password must contain uppercase, lowercase, number, and special character")
	ErrInvalidPassword    = errors.New("invalid password")
)

// PasswordStrength represents the strength of a password
type PasswordStrength struct {
	Score    int
	Feedback []string
}

// HashPassword hashes a password using bcrypt
func HashPassword(password string) (string, error) {
	// Validate password strength
	if err := ValidatePassword(password); err != nil {
		return "", err
	}

	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), BcryptCost)
	if err != nil {
		return "", err
	}

	return string(hashedBytes), nil
}

// VerifyPassword verifies a password against a hash
func VerifyPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// ValidatePassword validates password strength
func ValidatePassword(password string) error {
	// Length check
	if len(password) < MinPasswordLength {
		return ErrPasswordTooShort
	}
	if len(password) > MaxPasswordLength {
		return ErrPasswordTooLong
	}

	// Character diversity check
	var (
		hasUpper   bool
		hasLower   bool
		hasNumber  bool
		hasSpecial bool
	)

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	if !hasUpper || !hasLower || !hasNumber || !hasSpecial {
		return ErrPasswordTooWeak
	}

	return nil
}

// CalculatePasswordStrength calculates the strength score of a password
func CalculatePasswordStrength(password string) PasswordStrength {
	score := 0
	feedback := []string{}

	// Length checks
	if len(password) >= 8 {
		score += 20
	}
	if len(password) >= 12 {
		score += 10
	}
	if len(password) >= 16 {
		score += 10
	}

	// Character diversity
	var hasUpper, hasLower, hasNumber, hasSpecial bool
	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	if hasUpper {
		score += 15
	} else {
		feedback = append(feedback, "Add uppercase letters")
	}

	if hasLower {
		score += 15
	} else {
		feedback = append(feedback, "Add lowercase letters")
	}

	if hasNumber {
		score += 15
	} else {
		feedback = append(feedback, "Add numbers")
	}

	if hasSpecial {
		score += 15
	} else {
		feedback = append(feedback, "Add special characters")
	}

	// Check for common passwords
	commonPasswords := []string{"password", "12345678", "qwerty", "admin", "letmein"}
	for _, common := range commonPasswords {
		if regexp.MustCompile("(?i)" + common).MatchString(password) {
			score -= 30
			feedback = append(feedback, "Avoid common passwords")
			break
		}
	}

	// Ensure score is between 0-100
	if score < 0 {
		score = 0
	}
	if score > 100 {
		score = 100
	}

	return PasswordStrength{
		Score:    score,
		Feedback: feedback,
	}
}
