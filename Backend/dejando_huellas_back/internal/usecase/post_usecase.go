package usecase

import (
	"context"
	"errors"
	"log"

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

	post := &domain.Post{
		Title:     req.Title,
		Content:   req.Content,
		ImageURL:  req.ImageURL,
		CreatedBy: userObjID,
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

	post := &domain.Post{
		Title:     req.Title,
		Content:   req.Content,
		ImageURL:  imageURLs,
		CreatedBy: userObjID,
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
	return uc.repo.GetAll(ctx)
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
