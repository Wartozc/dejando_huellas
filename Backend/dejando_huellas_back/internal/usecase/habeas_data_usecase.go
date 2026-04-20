package usecase

import (
	"context"

	"dejando_huellas_back/internal/domain"
	"dejando_huellas_back/internal/repository"
)

type HabeasDataUseCase struct {
	repo *repository.HabeasDataRepository
}

func NewHabeasDataUseCase(repo *repository.HabeasDataRepository) *HabeasDataUseCase {
	return &HabeasDataUseCase{repo: repo}
}

func (uc *HabeasDataUseCase) Get(ctx context.Context) (*domain.HabeasData, error) {
	return uc.repo.Get(ctx)
}

func (uc *HabeasDataUseCase) Update(ctx context.Context, req *domain.UpdateHabeasDataRequest) (*domain.HabeasData, error) {
	habeasData := &domain.HabeasData{
		Content: req.Content,
	}

	if err := uc.repo.Update(ctx, habeasData); err != nil {
		return nil, err
	}

	return habeasData, nil
}
