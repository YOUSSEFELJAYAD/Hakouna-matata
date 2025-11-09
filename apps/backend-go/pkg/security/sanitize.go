package security

import (
	"html"
	"net/url"
	"regexp"
	"strings"
)

// SanitizeHTML removes potentially dangerous HTML tags and attributes
func SanitizeHTML(input string) string {
	// Escape HTML entities
	sanitized := html.EscapeString(input)
	return sanitized
}

// SanitizeSQL sanitizes SQL input (use with parameterized queries)
func SanitizeSQL(input string) string {
	// Remove SQL comment indicators
	sanitized := strings.ReplaceAll(input, "--", "")
	sanitized = strings.ReplaceAll(sanitized, "/*", "")
	sanitized = strings.ReplaceAll(sanitized, "*/", "")

	// Escape single quotes
	sanitized = strings.ReplaceAll(sanitized, "'", "''")

	// Remove semicolons
	sanitized = strings.ReplaceAll(sanitized, ";", "")

	return sanitized
}

// SanitizeEmail validates and sanitizes email addresses
func SanitizeEmail(email string) (string, bool) {
	// Email regex pattern
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

	// Trim and lowercase
	sanitized := strings.TrimSpace(strings.ToLower(email))

	// Validate format
	if !emailRegex.MatchString(sanitized) || len(sanitized) > 255 {
		return "", false
	}

	return sanitized, true
}

// SanitizeFilename removes path traversal and dangerous characters
func SanitizeFilename(filename string) string {
	// Remove path separators
	sanitized := strings.ReplaceAll(filename, "/", "")
	sanitized = strings.ReplaceAll(sanitized, "\\", "")

	// Remove parent directory references
	sanitized = strings.ReplaceAll(sanitized, "..", "")

	// Allow only alphanumeric, dots, dashes, and underscores
	reg := regexp.MustCompile(`[^a-zA-Z0-9._-]`)
	sanitized = reg.ReplaceAllString(sanitized, "_")

	// Limit length
	if len(sanitized) > 255 {
		parts := strings.Split(sanitized, ".")
		ext := ""
		if len(parts) > 1 {
			ext = "." + parts[len(parts)-1]
		}
		sanitized = sanitized[:250-len(ext)] + ext
	}

	if sanitized == "" {
		return "file"
	}

	return sanitized
}

// SanitizeURL validates and sanitizes URLs
func SanitizeURL(urlStr string, allowedDomains []string) (string, bool) {
	// Parse URL
	parsedURL, err := url.Parse(urlStr)
	if err != nil {
		return "", false
	}

	// Only allow http and https
	if parsedURL.Scheme != "http" && parsedURL.Scheme != "https" {
		return "", false
	}

	// Check allowed domains if specified
	if len(allowedDomains) > 0 {
		allowed := false
		for _, domain := range allowedDomains {
			if strings.HasSuffix(parsedURL.Hostname(), domain) {
				allowed = true
				break
			}
		}
		if !allowed {
			return "", false
		}
	}

	return parsedURL.String(), true
}

// SanitizePhone removes non-digit characters except +
func SanitizePhone(phone string) string {
	reg := regexp.MustCompile(`[^\d+]`)
	return reg.ReplaceAllString(phone, "")
}

// SanitizeAlphanumeric removes all non-alphanumeric characters
func SanitizeAlphanumeric(input string, maxLength int) string {
	reg := regexp.MustCompile(`[^a-zA-Z0-9]`)
	sanitized := reg.ReplaceAllString(input, "")

	if len(sanitized) > maxLength {
		sanitized = sanitized[:maxLength]
	}

	return sanitized
}

// RemoveScripts removes script tags and event handlers
func RemoveScripts(input string) string {
	// Remove script tags
	scriptRegex := regexp.MustCompile(`(?i)<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>`)
	cleaned := scriptRegex.ReplaceAllString(input, "")

	// Remove event handlers
	eventRegex := regexp.MustCompile(`(?i)on\w+\s*=\s*["'][^"']*["']`)
	cleaned = eventRegex.ReplaceAllString(cleaned, "")

	// Remove javascript: protocol
	jsRegex := regexp.MustCompile(`(?i)javascript:`)
	cleaned = jsRegex.ReplaceAllString(cleaned, "")

	return cleaned
}

// IsValidIP validates IPv4 or IPv6 addresses
func IsValidIP(ip string) bool {
	ipv4Regex := regexp.MustCompile(`^(\d{1,3}\.){3}\d{1,3}$`)
	ipv6Regex := regexp.MustCompile(`^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$`)

	return ipv4Regex.MatchString(ip) || ipv6Regex.MatchString(ip)
}

// TruncateString safely truncates a string to a maximum length
func TruncateString(input string, maxLength int) string {
	if len(input) <= maxLength {
		return input
	}
	return input[:maxLength]
}

// StripTags removes all HTML tags
func StripTags(input string) string {
	tagRegex := regexp.MustCompile(`<[^>]*>`)
	return tagRegex.ReplaceAllString(input, "")
}
