package usecase

import (
	"context"
	"errors"
	"log"
	"os"

	"dejando_huellas_back/internal/domain"
	"dejando_huellas_back/internal/repository"
	"dejando_huellas_back/internal/service"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

var (
	ErrPostNotFound = errors.New("post not found")
)

type PostUseCase struct {
	repo          *repository.PostRepository
	imageUploader *service.ImageUploader
}

func NewPostUseCase(repo *repository.PostRepository) *PostUseCase {
	return &PostUseCase{repo: repo}
}

// NewPostUseCaseWithImageUploader creates a PostUseCase with image upload support
func NewPostUseCaseWithImageUploader(repo *repository.PostRepository, imageUploader *service.ImageUploader) *PostUseCase {
	return &PostUseCase{
		repo:          repo,
		imageUploader: imageUploader,
	}
}

func (uc *PostUseCase) Create(ctx context.Context, req *domain.CreatePostRequest, userID string) (*domain.Post, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidInput
	}

	// Parse author ID if provided
	var authorObjID primitive.ObjectID
	if req.AuthorID != "" {
		authorObjID, err = primitive.ObjectIDFromHex(req.AuthorID)
		if err != nil {
			// If invalid, use userID
			authorObjID = userObjID
		}
	} else {
		authorObjID = userObjID
	}

	// Use community from request, or default to user's community if available
	community := req.Community
	if community == "" {
		// Try to get community from user if available in context
		// The community will be empty if not provided in request
		log.Printf("Community not provided in request, using empty string")
	}

	post := &domain.Post{
		Title:      req.Title,
		Content:    req.Content,
		ImageURL:   req.ImageURL,
		CreatedBy:  userObjID,
		AuthorID:   authorObjID,
		AuthorName: req.AuthorName,
		Community:  community,
	}

	if err := uc.repo.Create(ctx, post); err != nil {
		return nil, err
	}

	return post, nil
}

// CreateWithImages creates a post with uploaded image URLs
// This is called after images have been uploaded to GitHub
func (uc *PostUseCase) CreateWithImages(ctx context.Context, req *domain.CreatePostRequest, imageURLs []string, userID string) (*domain.Post, error) {
	log.Printf("CreateWithImages called: userID=%s, title=%s, imageCount=%d", userID, req.Title, len(imageURLs))

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		log.Printf("Error converting userID to ObjectID: %v", err)
		return nil, ErrInvalidInput
	}

	// Parse author ID if provided
	var authorObjID primitive.ObjectID
	if req.AuthorID != "" {
		authorObjID, err = primitive.ObjectIDFromHex(req.AuthorID)
		if err != nil {
			// If invalid, use userID
			authorObjID = userObjID
		}
	} else {
		authorObjID = userObjID
	}

	// Use community from request
	community := req.Community
	log.Printf("CreateWithImages: community from request = %q", community)

	post := &domain.Post{
		Title:      req.Title,
		Content:    req.Content,
		ImageURL:   imageURLs,
		CreatedBy:  userObjID,
		AuthorID:   authorObjID,
		AuthorName: req.AuthorName,
		Community:  community,
	}

	log.Printf("Post struct created: Title=%s, ImageURLs=%v", post.Title, post.ImageURL)

	if err := uc.repo.Create(ctx, post); err != nil {
		log.Printf("Error creating post in repository: %v", err)
		return nil, err
	}

	log.Printf("Post created successfully with ID: %s", post.ID.Hex())
	return post, nil
}

func (uc *PostUseCase) GetByID(ctx context.Context, id string) (*domain.Post, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, ErrInvalidInput
	}

	post, err := uc.repo.GetByID(ctx, objID)
	if err != nil {
		return nil, ErrPostNotFound
	}

	return post, nil
}

func (uc *PostUseCase) GetAll(ctx context.Context) ([]*domain.Post, error) {
	// Create a log file for debugging
	logFile, err := os.OpenFile("usecase_debug.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err == nil {
		defer logFile.Close()
		log.SetOutput(logFile)
		log.Println("=== PostUseCase.GetAll: Starting ===")
	} else {
		log.Println("PostUseCase.GetAll: Could not create log file:", err)
	}

	log.Println("PostUseCase.GetAll: Fetching all posts...")
	posts, err := uc.repo.GetAll(ctx)
	if err != nil {
		log.Printf("PostUseCase.GetAll: ERROR from repository: %v", err)
		log.Printf("PostUseCase.GetAll: Error type: %T", err)
		// Return error so we can see it
		return nil, err
	}
	log.Printf("PostUseCase.GetAll: Got %d posts from repository", len(posts))

	// Debug: log each post
	for i, p := range posts {
		log.Printf("PostUseCase.GetAll: Post[%d] ID=%s Title=%s ImageURL=%v CreatedAt=%v",
			i, p.ID.Hex(), p.Title, p.ImageURL, p.CreatedAt)
	}

	log.Println("=== PostUseCase.GetAll: Done ===")
	return posts, nil
}

func (uc *PostUseCase) Update(ctx context.Context, id string, req *domain.UpdatePostRequest) (*domain.Post, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, ErrInvalidInput
	}

	post, err := uc.repo.GetByID(ctx, objID)
	if err != nil {
		return nil, ErrPostNotFound
	}

	if req.Title != "" {
		post.Title = req.Title
	}
	if req.Content != "" {
		post.Content = req.Content
	}
	// Only update ImageURL if explicitly provided (non-nil and non-empty)
	if req.ImageURL != nil && len(req.ImageURL) > 0 {
		post.ImageURL = req.ImageURL
	}

	if err := uc.repo.Update(ctx, objID, post); err != nil {
		return nil, err
	}

	return post, nil
}

func (uc *PostUseCase) Delete(ctx context.Context, id string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return ErrInvalidInput
	}

	return uc.repo.Delete(ctx, objID)
}
