package usecase

import (
	"context"
	"errors"

	"dejando_huellas_back/internal/domain"
	"dejando_huellas_back/internal/repository"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

var (
	ErrChatBotOptionNotFound = errors.New("chatbot option not found")
)

type ChatBotUseCase struct {
	repo *repository.ChatBotRepository
}

func NewChatBotUseCase(repo *repository.ChatBotRepository) *ChatBotUseCase {
	return &ChatBotUseCase{repo: repo}
}

func (uc *ChatBotUseCase) Create(ctx context.Context, req *domain.CreateChatBotRequest) (*domain.ChatBotOption, error) {
	// Validate parent_id if provided
	var parentID *string
	if req.ParentID != nil && *req.ParentID != "" {
		parentObjID, err := primitive.ObjectIDFromHex(*req.ParentID)
		if err != nil {
			return nil, ErrInvalidInput
		}
		parentIDStr := parentObjID.Hex()
		parentID = &parentIDStr
	}

	option := &domain.ChatBotOption{
		Question: req.Question,
		Answer:   req.Answer,
		ParentID: parentID,
		Order:    req.Order,
	}

	if err := uc.repo.Create(ctx, option); err != nil {
		return nil, err
	}

	return option, nil
}

func (uc *ChatBotUseCase) GetByID(ctx context.Context, id string) (*domain.ChatBotOption, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, ErrInvalidInput
	}

	option, err := uc.repo.GetByID(ctx, objID)
	if err != nil {
		return nil, ErrChatBotOptionNotFound
	}

	return option, nil
}

func (uc *ChatBotUseCase) GetAll(ctx context.Context) ([]*domain.ChatBotOption, error) {
	return uc.repo.GetAll(ctx)
}

// GetTree returns the chatbot options as a tree structure
func (uc *ChatBotUseCase) GetTree(ctx context.Context) ([]domain.ChatBotTreeNode, error) {
	allOptions, err := uc.repo.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	// Build the tree
	return buildTree(allOptions), nil
}

// buildTree builds a hierarchical tree from flat options
func buildTree(options []*domain.ChatBotOption) []domain.ChatBotTreeNode {
	// First, get all root options (parent_id is nil or empty)
	optionMap := make(map[string]*domain.ChatBotOption)
	for _, opt := range options {
		optionMap[opt.ID.Hex()] = opt
	}

	// Build tree recursively
	var buildNode func(opt *domain.ChatBotOption) domain.ChatBotTreeNode
	buildNode = func(opt *domain.ChatBotOption) domain.ChatBotTreeNode {
		node := domain.ChatBotTreeNode{
			ChatBotOption: *opt,
			Children:      []domain.ChatBotTreeNode{},
		}

		// Find all children
		for _, child := range options {
			if child.ParentID != nil && *child.ParentID == opt.ID.Hex() {
				node.Children = append(node.Children, buildNode(child))
			}
		}

		return node
	}

	// Get root options (no parent)
	var rootNodes []domain.ChatBotTreeNode
	for _, opt := range options {
		if opt.ParentID == nil || *opt.ParentID == "" {
			rootNodes = append(rootNodes, buildNode(opt))
		}
	}

	return rootNodes
}

func (uc *ChatBotUseCase) Update(ctx context.Context, id string, req *domain.UpdateChatBotRequest) (*domain.ChatBotOption, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, ErrInvalidInput
	}

	option, err := uc.repo.GetByID(ctx, objID)
	if err != nil {
		return nil, ErrChatBotOptionNotFound
	}

	// Update fields if provided
	if req.Question != "" {
		option.Question = req.Question
	}
	if req.Answer != "" {
		option.Answer = req.Answer
	}
	if req.Order != 0 {
		option.Order = req.Order
	}
	if req.ParentID != nil {
		if *req.ParentID == "" {
			option.ParentID = nil
		} else {
			parentID := *req.ParentID
			option.ParentID = &parentID
		}
	}

	if err := uc.repo.Update(ctx, objID, option); err != nil {
		return nil, err
	}

	return option, nil
}

func (uc *ChatBotUseCase) Delete(ctx context.Context, id string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return ErrInvalidInput
	}

	return uc.repo.Delete(ctx, objID)
}
