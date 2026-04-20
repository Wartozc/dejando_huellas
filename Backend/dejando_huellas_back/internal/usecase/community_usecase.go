package usecase

import (
	"context"

	"dejando_huellas_back/internal/domain"
	"dejando_huellas_back/internal/repository"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CommunityUseCase struct {
	repo *repository.CommunityRepository
}

func NewCommunityUseCase(repo *repository.CommunityRepository) *CommunityUseCase {
	return &CommunityUseCase{repo: repo}
}

func (uc *CommunityUseCase) Create(ctx context.Context, req *domain.CreateCommunityRequest) (*domain.Community, error) {
	exists, err := uc.repo.ExistsByName(ctx, req.Name)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrCommunityAlreadyExists
	}

	community := &domain.Community{
		Name: req.Name,
	}

	if err := uc.repo.Create(ctx, community); err != nil {
		return nil, err
	}

	return community, nil
}

func (uc *CommunityUseCase) GetByID(ctx context.Context, id string) (*domain.Community, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, ErrInvalidInput
	}

	community, err := uc.repo.GetByID(ctx, objID)
	if err != nil {
		return nil, ErrCommunityNotFound
	}

	return community, nil
}

func (uc *CommunityUseCase) GetAll(ctx context.Context) ([]*domain.Community, error) {
	return uc.repo.GetAll(ctx)
}

func (uc *CommunityUseCase) Update(ctx context.Context, id string, req *domain.UpdateCommunityRequest) (*domain.Community, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, ErrInvalidInput
	}

	community, err := uc.repo.GetByID(ctx, objID)
	if err != nil {
		return nil, ErrCommunityNotFound
	}

	if req.Name != "" {
		// Check if new name already exists
		if req.Name != community.Name {
			exists, err := uc.repo.ExistsByName(ctx, req.Name)
			if err != nil {
				return nil, err
			}
			if exists {
				return nil, ErrCommunityAlreadyExists
			}
		}
		community.Name = req.Name
	}

	if err := uc.repo.Update(ctx, objID, community); err != nil {
		return nil, err
	}

	return community, nil
}

func (uc *CommunityUseCase) Delete(ctx context.Context, id string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return ErrInvalidInput
	}

	return uc.repo.Delete(ctx, objID)
}
