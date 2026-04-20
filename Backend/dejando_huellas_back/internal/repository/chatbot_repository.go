package repository

import (
	"context"
	"fmt"
	"time"

	"dejando_huellas_back/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ChatBotRepository struct {
	collection *mongo.Collection
	client     *mongo.Client
}

func NewChatBotRepository(ctx context.Context, mongoURI, dbName string) *ChatBotRepository {
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to MongoDB: %v", err))
	}

	collection := client.Database(dbName).Collection("chatbot")
	return &ChatBotRepository{
		collection: collection,
		client:     client,
	}
}

func (r *ChatBotRepository) EnsureIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	indexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "parent_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "order", Value: 1}},
		},
	}

	_, err := r.collection.Indexes().CreateMany(ctx, indexes)
	return err
}

func (r *ChatBotRepository) Create(ctx context.Context, option *domain.ChatBotOption) error {
	option.CreatedAt = time.Now()
	option.UpdatedAt = time.Now()

	result, err := r.collection.InsertOne(ctx, option)
	if err != nil {
		return err
	}

	option.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *ChatBotRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*domain.ChatBotOption, error) {
	var option domain.ChatBotOption
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&option)
	if err != nil {
		return nil, err
	}
	return &option, nil
}

func (r *ChatBotRepository) GetAll(ctx context.Context) ([]*domain.ChatBotOption, error) {
	cursor, err := r.collection.Find(ctx, bson.M{}, options.Find().SetSort(bson.D{{Key: "order", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var options []*domain.ChatBotOption
	for cursor.Next(ctx) {
		var option domain.ChatBotOption
		if err := cursor.Decode(&option); err != nil {
			return nil, err
		}
		options = append(options, &option)
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return options, nil
}

func (r *ChatBotRepository) GetByParentID(ctx context.Context, parentID *string) ([]*domain.ChatBotOption, error) {
	var filter bson.M
	if parentID == nil || *parentID == "" {
		filter = bson.M{"parent_id": nil}
	} else {
		filter = bson.M{"parent_id": *parentID}
	}

	cursor, err := r.collection.Find(ctx, filter, options.Find().SetSort(bson.D{{Key: "order", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var options []*domain.ChatBotOption
	for cursor.Next(ctx) {
		var option domain.ChatBotOption
		if err := cursor.Decode(&option); err != nil {
			return nil, err
		}
		options = append(options, &option)
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return options, nil
}

func (r *ChatBotRepository) Update(ctx context.Context, id primitive.ObjectID, option *domain.ChatBotOption) error {
	option.UpdatedAt = time.Now()

	update := bson.M{
		"$set": bson.M{
			"question":   option.Question,
			"answer":     option.Answer,
			"parent_id":  option.ParentID,
			"order":      option.Order,
			"updated_at": option.UpdatedAt,
		},
	}

	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": id}, update)
	return err
}

func (r *ChatBotRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	// First, delete all children of this option
	_, err := r.collection.DeleteMany(ctx, bson.M{"parent_id": id.Hex()})
	if err != nil {
		return err
	}

	// Then delete the option itself
	_, err = r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

func (r *ChatBotRepository) Close(ctx context.Context) error {
	return r.client.Disconnect(ctx)
}
