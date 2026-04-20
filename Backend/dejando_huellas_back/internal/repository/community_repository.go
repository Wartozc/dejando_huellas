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

type CommunityRepository struct {
	collection *mongo.Collection
	client     *mongo.Client
}

func NewCommunityRepository(ctx context.Context, mongoURI, dbName string) *CommunityRepository {
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to MongoDB: %v", err))
	}

	collection := client.Database(dbName).Collection("communities")
	return &CommunityRepository{
		collection: collection,
		client:     client,
	}
}

func (r *CommunityRepository) EnsureIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	indexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "name", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	}

	_, err := r.collection.Indexes().CreateMany(ctx, indexes)
	return err
}

func (r *CommunityRepository) Create(ctx context.Context, community *domain.Community) error {
	community.CreatedAt = time.Now()
	community.UpdatedAt = time.Now()

	result, err := r.collection.InsertOne(ctx, community)
	if err != nil {
		return err
	}

	community.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *CommunityRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*domain.Community, error) {
	var community domain.Community
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&community)
	if err != nil {
		return nil, err
	}
	return &community, nil
}

func (r *CommunityRepository) GetByName(ctx context.Context, name string) (*domain.Community, error) {
	var community domain.Community
	err := r.collection.FindOne(ctx, bson.M{"name": name}).Decode(&community)
	if err != nil {
		return nil, err
	}
	return &community, nil
}

func (r *CommunityRepository) GetAll(ctx context.Context) ([]*domain.Community, error) {
	cursor, err := r.collection.Find(ctx, bson.M{}, options.Find().SetSort(bson.D{{Key: "name", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var communities []*domain.Community
	if err := cursor.All(ctx, &communities); err != nil {
		return nil, err
	}
	return communities, nil
}

func (r *CommunityRepository) Update(ctx context.Context, id primitive.ObjectID, community *domain.Community) error {
	community.UpdatedAt = time.Now()

	update := bson.M{
		"$set": bson.M{
			"name":       community.Name,
			"updated_at": community.UpdatedAt,
		},
	}

	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": id}, update)
	return err
}

func (r *CommunityRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

func (r *CommunityRepository) ExistsByName(ctx context.Context, name string) (bool, error) {
	count, err := r.collection.CountDocuments(ctx, bson.M{"name": name})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *CommunityRepository) Close(ctx context.Context) error {
	return r.client.Disconnect(ctx)
}
