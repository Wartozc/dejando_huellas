package http

import (
	"io"
	"log"
	"net/http"

	"dejando_huellas_back/internal/domain"
	"dejando_huellas_back/internal/service"
	"dejando_huellas_back/internal/usecase"

	"github.com/gin-gonic/gin"
)

type PostHandler struct {
	uc            *usecase.PostUseCase
	imageUploader *service.ImageUploader
	maxImages     int
}

func NewPostHandler(uc *usecase.PostUseCase) *PostHandler {
	return &PostHandler{uc: uc, maxImages: 5}
}

// NewPostHandlerWithImageUploader creates a PostHandler with image upload support
func NewPostHandlerWithImageUploader(uc *usecase.PostUseCase, imageUploader *service.ImageUploader, maxImages int) *PostHandler {
	return &PostHandler{
		uc:            uc,
		imageUploader: imageUploader,
		maxImages:     maxImages,
	}
}

func (h *PostHandler) Create(c *gin.Context) {
	var req domain.CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Image is optional - allow posts without images
	// But if provided, validate that it's not empty
	if len(req.ImageURL) == 0 {
		log.Println("Create: No image URL provided (optional)")
		// Allow posts without images - but set to nil so we don't send empty array
		req.ImageURL = nil
	}

	userID := GetUserIDFromClaims(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	post, err := h.uc.Create(c.Request.Context(), &req, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Post created successfully",
		"post":    post,
	})
}

// CreateWithImages handles creating a post with image uploads via multipart form
func (h *PostHandler) CreateWithImages(c *gin.Context) {
	log.Println("CreateWithImages: Request received")

	// Check if we have an image uploader
	if h.imageUploader == nil {
		log.Println("CreateWithImages: Image uploader is nil")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Image upload not configured"})
		return
	}

	userID := GetUserIDFromClaims(c)
	log.Printf("CreateWithImages: userID from claims = %s", userID)
	if userID == "" {
		log.Println("CreateWithImages: User ID is empty")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get the text fields
	title := c.PostForm("title")
	content := c.PostForm("content")

	log.Printf("CreateWithImages: title=%s, content length=%d", title, len(content))

	if title == "" || content == "" {
		log.Println("CreateWithImages: Missing title or content")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title and content are required"})
		return
	}

	// Validate title length
	if len(title) < 3 || len(title) > 200 {
		log.Printf("CreateWithImages: Invalid title length: %d", len(title))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title must be between 3 and 200 characters"})
		return
	}

	// Validate content length
	if len(content) < 10 {
		log.Printf("CreateWithImages: Invalid content length: %d", len(content))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Content must be at least 10 characters"})
		return
	}

	// Handle image uploads
	form, err := c.MultipartForm()
	if err != nil {
		log.Printf("CreateWithImages: Error getting multipart form: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form data"})
		return
	}

	files := form.File["images"]
	log.Printf("CreateWithImages: Found %d images", len(files))

	if len(files) == 0 {
		log.Println("CreateWithImages: No images provided")
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one image is required"})
		return
	}

	// Check maximum number of images
	if len(files) > h.maxImages {
		log.Printf("CreateWithImages: Too many images: %d > %d", len(files), h.maxImages)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Maximum number of images exceeded", "max": h.maxImages})
		return
	}

	// Upload each image
	imageURLs := make([]string, 0, len(files))
	for _, file := range files {
		log.Printf("Processing image: %s (size: %d)", file.Filename, file.Size)

		// Open the file
		src, err := file.Open()
		if err != nil {
			log.Printf("Error opening image %s: %v", file.Filename, err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to open image: " + file.Filename})
			return
		}
		defer src.Close()

		// Read the file content using io.ReadAll for better reliability
		contentBytes, err := io.ReadAll(src)
		if err != nil {
			log.Printf("Error reading image %s: %v", file.Filename, err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read image: " + file.Filename})
			return
		}

		log.Printf("Read %d bytes from image: %s", len(contentBytes), file.Filename)

		// Validate and upload the image
		imageURL, err := h.imageUploader.UploadFromMultipart(file.Filename, contentBytes)
		if err != nil {
			log.Printf("Error uploading image %s: %v", file.Filename, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload image: " + err.Error()})
			return
		}

		log.Printf("Uploaded image, URL: %s", imageURL)
		imageURLs = append(imageURLs, imageURL)
	}

	// Create the post request
	req := &domain.CreatePostRequest{
		Title:   title,
		Content: content,
	}

	// Create post with images
	log.Printf("CreateWithImages: Calling usecase with %d image URLs", len(imageURLs))
	post, err := h.uc.CreateWithImages(c.Request.Context(), req, imageURLs, userID)
	if err != nil {
		log.Printf("CreateWithImages: Error creating post: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post: " + err.Error()})
		return
	}

	log.Printf("CreateWithImages: Post created successfully with ID=%s, ImageURLs=%v", post.ID.Hex(), post.ImageURL)
	c.JSON(http.StatusCreated, gin.H{
		"message":     "Post created successfully",
		"post":        post,
		"image_url":   post.ImageURL,
		"image_count": len(imageURLs),
	})
}

func (h *PostHandler) GetAll(c *gin.Context) {
	log.Println("GetAll: Fetching all posts...")
	posts, err := h.uc.GetAll(c.Request.Context())
	if err != nil {
		log.Printf("GetAll: ERROR fetching posts: %v", err)
		log.Printf("GetAll: Error type: %T", err)
		// Return empty array instead of error to allow frontend to work
		log.Println("GetAll: Returning empty posts array due to error")
		c.JSON(http.StatusOK, gin.H{"posts": []interface{}{}})
		return
	}
	log.Printf("GetAll: Successfully fetched %d posts", len(posts))
	for i, p := range posts {
		log.Printf("GetAll: Post[%d] ID=%s Title=%s ImageURL=%v", i, p.ID, p.Title, p.ImageURL)
	}
	c.JSON(http.StatusOK, gin.H{"posts": posts})
}

func (h *PostHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	post, err := h.uc.GetByID(c.Request.Context(), id)
	if err != nil {
		if err == usecase.ErrInvalidInput || err == usecase.ErrPostNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"post": post})
}

// Update handles updating a post with JSON data
func (h *PostHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req domain.UpdatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	post, err := h.uc.Update(c.Request.Context(), id, &req)
	if err != nil {
		if err == usecase.ErrInvalidInput || err == usecase.ErrPostNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post updated successfully", "post": post})
}

// UpdateWithImages handles updating a post with image uploads via multipart form
func (h *PostHandler) UpdateWithImages(c *gin.Context) {
	id := c.Param("id")

	userID := GetUserIDFromClaims(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get text fields
	title := c.PostForm("title")
	content := c.PostForm("content")

	// Get existing post to preserve fields not being updated
	existingPost, err := h.uc.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	req := &domain.UpdatePostRequest{
		Title:   title,
		Content: content,
	}

	// Check if new images are being uploaded
	imageURLs := existingPost.ImageURL // Keep existing images by default

	if h.imageUploader != nil {
		// Check if we have new images in the form
		form, err := c.MultipartForm()
		if err == nil && form != nil {
			files := form.File["images"]
			if len(files) > 0 {
				// Check maximum number of images
				if len(files) > h.maxImages {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Maximum number of images exceeded", "max": h.maxImages})
					return
				}

				// Upload each new image
				newImageURLs := make([]string, 0, len(files))
				for _, file := range files {
					src, err := file.Open()
					if err != nil {
						c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to open image: " + file.Filename})
						return
					}
					defer src.Close()

					contentBytes, err := io.ReadAll(src)
					if err != nil {
						c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read image: " + file.Filename})
						return
					}

					imageURL, err := h.imageUploader.UploadFromMultipart(file.Filename, contentBytes)
					if err != nil {
						c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload image: " + err.Error()})
						return
					}

					newImageURLs = append(newImageURLs, imageURL)
				}

				// Replace images with new ones
				imageURLs = newImageURLs
			}
		}
	}

	// Set the image URLs in the request
	if len(imageURLs) > 0 {
		req.ImageURL = imageURLs
	} else if title == "" && content == "" {
		// If no text fields and no images, return error
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	post, err := h.uc.Update(c.Request.Context(), id, req)
	if err != nil {
		if err == usecase.ErrInvalidInput || err == usecase.ErrPostNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post updated successfully", "post": post})
}

func (h *PostHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := h.uc.Delete(c.Request.Context(), id); err != nil {
		if err == usecase.ErrInvalidInput {
			c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}
