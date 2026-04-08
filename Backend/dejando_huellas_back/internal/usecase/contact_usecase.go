package usecase

import (
	"context"

	"dejando_huellas_back/internal/domain"
	"dejando_huellas_back/internal/repository"
)

type ContactUseCase struct {
	repo *repository.ContactRepository
}

func NewContactUseCase(repo *repository.ContactRepository) *ContactUseCase {
	return &ContactUseCase{repo: repo}
}

func (uc *ContactUseCase) Create(ctx context.Context, req *domain.CreateContactRequest) (*domain.Contact, error) {
	contact := &domain.Contact{
		Name:    req.Name,
		Email:   req.Email,
		Message: req.Message,
	}

	if err := uc.repo.Create(ctx, contact); err != nil {
		return nil, err
	}

	return contact, nil
}

func (uc *ContactUseCase) GetAll(ctx context.Context) ([]*domain.Contact, error) {
	return uc.repo.GetAll(ctx)
}
