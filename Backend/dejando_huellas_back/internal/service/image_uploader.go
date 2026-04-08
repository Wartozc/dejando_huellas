package service

import (
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"

	appconfig "dejando_huellas_back/internal/config"
)

// ImageUploader handles uploading images to GitHub repository
type ImageUploader struct {
	owner      string
	repo       string
	branch     string
	token      string
	imagesPath string
	client     *http.Client
}

// NewImageUploader creates a new ImageUploader instance
func NewImageUploader(owner, repo, branch, token, imagesPath string) *ImageUploader {
	// Default to "trunk" if branch is empty (GitHub default for new repos)
	if branch == "" {
		branch = "trunk"
	}
	return &ImageUploader{
		owner:      owner,
		repo:       repo,
		branch:     branch,
		token:      token,
		imagesPath: imagesPath,
		client:     &http.Client{Timeout: 30 * time.Second},
	}
}

// UploadImage uploads an image to GitHub and returns the raw URL
// The filename should include the extension (e.g., "photo.jpg")
func (u *ImageUploader) UploadImage(filename string, content []byte) (string, error) {
	if u.token == "" {
		return "", fmt.Errorf("GitHub token not configured")
	}

	// Validate content
	if len(content) == 0 {
		return "", fmt.Errorf("image content is empty")
	}

	// Generate unique filename with timestamp
	uniqueFilename := u.generateUniqueFilename(filename)

	// Build the path in the repository
	githubPath := fmt.Sprintf("%s/%s", u.imagesPath, uniqueFilename)

	// Upload to GitHub using the Contents API
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/contents/%s", u.owner, u.repo, githubPath)

	// Create request body with base64 encoded content
	contentEncoded := base64.StdEncoding.EncodeToString(content)
	
	body := fmt.Sprintf(`{
		"message": "Upload image: %s",
		"content": "%s"
	}`, uniqueFilename, contentEncoded)

	req, err := http.NewRequest(http.MethodPut, url, strings.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Authorization", "Bearer "+u.token)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Set("Content-Type", "application/json")

	resp, err := u.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to upload image: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("GitHub API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	// Return the raw URL for the uploaded file
	rawURL := fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/%s/%s", u.owner, u.repo, u.branch, githubPath)
	
	return rawURL, nil
}

// UploadMultipleImages uploads multiple images and returns their URLs
func (u *ImageUploader) UploadMultipleImages(files map[string][]byte) ([]string, error) {
	urls := make([]string, 0, len(files))
	
	for filename, content := range files {
		url, err := u.uploadImageToGitHub(filename, content)
		if err != nil {
			return nil, fmt.Errorf("failed to upload %s: %w", filename, err)
		}
		urls = append(urls, url)
	}
	
	return urls, nil
}

// uploadImageToGitHub is the internal method that does the actual upload
func (u *ImageUploader) uploadImageToGitHub(filename string, content []byte) (string, error) {
	if u.token == "" {
		return "", fmt.Errorf("GitHub token not configured")
	}

	// Generate unique filename with timestamp
	uniqueFilename := u.generateUniqueFilename(filename)

	// Build the path in the repository
	githubPath := fmt.Sprintf("%s/%s", u.imagesPath, uniqueFilename)

	// Upload to GitHub using the Contents API
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/contents/%s", u.owner, u.repo, githubPath)

	// Create request body with base64 encoded content
	contentEncoded := base64.StdEncoding.EncodeToString(content)
	
	body := fmt.Sprintf(`{
		"message": "Upload image: %s",
		"content": "%s"
	}`, uniqueFilename, contentEncoded)

	req, err := http.NewRequest(http.MethodPut, url, strings.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Authorization", "Bearer "+u.token)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Set("Content-Type", "application/json")

	resp, err := u.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to upload image: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("GitHub API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	// Return the raw URL for the uploaded file
	rawURL := fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/%s/%s", u.owner, u.repo, u.branch, githubPath)
	
	return rawURL, nil
}

// generateUniqueFilename creates a unique filename with timestamp and UUID
func (u *ImageUploader) generateUniqueFilename(filename string) string {
	// Get the file extension
	ext := strings.ToLower(filepath.Ext(filename))
	if ext == "" {
		ext = ".jpg" // Default extension
	}
	
	// Get base name without extension
	baseName := strings.TrimSuffix(filepath.Base(filename), ext)
	
	// Clean the base name
	baseName = strings.ReplaceAll(baseName, " ", "_")
	baseName = strings.ReplaceAll(baseName, "-", "_")
	
	// Generate unique identifier
	timestamp := time.Now().Unix()
	uniqueID := uuid.New().String()[:8]
	
	return fmt.Sprintf("%s_%d_%s%s", baseName, timestamp, uniqueID, ext)
}

// ReadFile reads a file from the local filesystem
func ReadFile(path string) ([]byte, error) {
	return os.ReadFile(path)
}

// ValidateImage validates the image content and returns the file extension
func ValidateImage(content []byte, filename string) (string, error) {
	if len(content) == 0 {
		return "", fmt.Errorf("image content is empty")
	}

	// Check for minimum size (1KB)
	if len(content) < 1024 {
		return "", fmt.Errorf("image content is too small")
	}

	// Check for maximum size (10MB)
	if len(content) > 10*1024*1024 {
		return "", fmt.Errorf("image content exceeds maximum size (10MB)")
	}

	// Get file extension
	ext := strings.ToLower(filepath.Ext(filename))
	if ext == "" {
		return "", fmt.Errorf("image filename has no extension")
	}

	// Validate extension
	validExtensions := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}
	isValid := false
	for _, validExt := range validExtensions {
		if ext == validExt {
			isValid = true
			break
		}
	}
	
	if !isValid {
		return "", fmt.Errorf("invalid image format: %s (supported: jpg, jpeg, png, gif, webp)", ext)
	}

	// Basic image format validation
	// JPEG: starts with FF D8 FF
	// PNG: starts with 89 50 4E 47
	// GIF: starts with 47 49 46 38
	// WEBP: starts with 52 49 46 46
	
	switch ext {
	case ".jpg", ".jpeg":
		if len(content) < 3 || content[0] != 0xFF || content[1] != 0xD8 || content[2] != 0xFF {
			return "", fmt.Errorf("invalid JPEG image")
		}
	case ".png":
		if len(content) < 8 || content[0] != 0x89 || content[1] != 0x50 || content[2] != 0x4E || content[3] != 0x47 {
			return "", fmt.Errorf("invalid PNG image")
		}
	case ".gif":
		if len(content) < 6 || content[0] != 0x47 || content[1] != 0x49 || content[2] != 0x46 {
			return "", fmt.Errorf("invalid GIF image")
		}
	case ".webp":
		if len(content) < 12 || string(content[:4]) != "RIFF" || string(content[8:12]) != "WEBP" {
			return "", fmt.Errorf("invalid WEBP image")
		}
	}

	return ext, nil
}

// UploadFromMultipart processes a multipart form file and uploads it
func (u *ImageUploader) UploadFromMultipart(filename string, content []byte) (string, error) {
	// Validate the image
	ext, err := ValidateImage(content, filename)
	if err != nil {
		return "", err
	}

	// Ensure the file has the correct extension
	filename = ensureExtension(filename, ext)

	// Upload to GitHub
	return u.UploadImage(filename, content)
}

// ensureExtension ensures the filename has the correct extension
func ensureExtension(filename, expectedExt string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	if ext != expectedExt {
		return strings.TrimSuffix(filename, ext) + expectedExt
	}
	return filename
}

// NewImageUploaderFromConfig creates an ImageUploader from config
func NewImageUploaderFromConfig(cfg *appconfig.Config) *ImageUploader {
	return NewImageUploader(
		cfg.GitHubOwner,
		cfg.GitHubRepo,
		cfg.GitHubBranch,
		cfg.GitHubToken,
		cfg.GitHubImagesPath,
	)
}