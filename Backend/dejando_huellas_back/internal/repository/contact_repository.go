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

type ContactRepository struct {
	collection *mongo.Collection
	client     *mongo.Client
}

func NewContactRepository(ctx context.Context, mongoURI, dbName string) *ContactRepository {
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to MongoDB: %v", err))
	}

	collection := client.Database(dbName).Collection("contacts")
	return &ContactRepository{
		collection: collection,
		client:    client,
	}
}

func (r *ContactRepository) Create(ctx context.Context, contact *domain.Contact) error {
	contact.CreatedAt = time.Now()

	result, err := r.collection.InsertOne(ctx, contact)
	if err != nil {
		return err
	}

	contact.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *ContactRepository) GetAll(ctx context.Context) ([]*domain.Contact, error) {
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
	cursor, err := r.collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var contacts []*domain.Contact
	if err := cursor.All(ctx, &contacts); err != nil {
		return nil, err
	}
	return contacts, nil
}

func (r *ContactRepository) Close(ctx context.Context) error {
	return r.client.Disconnect(ctx)
}
