package repository

import (
	"context"
	"fmt"
	"log"
	"time"

	"dejando_huellas_back/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type PostRepository struct {
	collection *mongo.Collection
	client     *mongo.Client
}

func NewPostRepository(ctx context.Context, mongoURI, dbName string) *PostRepository {
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to MongoDB: %v", err))
	}

	collection := client.Database(dbName).Collection("posts")
	return &PostRepository{
		collection: collection,
		client:    client,
	}
}

func (r *PostRepository) EnsureIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	indexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "created_at", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "created_by", Value: 1}},
		},
	}

	_, err := r.collection.Indexes().CreateMany(ctx, indexes)
	return err
}

func (r *PostRepository) Create(ctx context.Context, post *domain.Post) error {
	post.CreatedAt = time.Now()
	post.UpdatedAt = time.Now()

	log.Printf("Repository.Create: Title=%s, ImageURLs=%v, CreatedBy=%s", post.Title, post.ImageURL, post.CreatedBy.Hex())

	result, err := r.collection.InsertOne(ctx, post)
	if err != nil {
		log.Printf("Repository.Create: InsertOne error: %v", err)
		return err
	}

	post.ID = result.InsertedID.(primitive.ObjectID)
	log.Printf("Repository.Create: Post created with ID=%s", post.ID.Hex())
	return nil
}

func (r *PostRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*domain.Post, error) {
	var post domain.Post
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&post)
	if err != nil {
		return nil, err
	}
	return &post, nil
}

func (r *PostRepository) GetAll(ctx context.Context) ([]*domain.Post, error) {
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
	cursor, err := r.collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var posts []*domain.Post
	if err := cursor.All(ctx, &posts); err != nil {
		return nil, err
	}
	return posts, nil
}

func (r *PostRepository) Update(ctx context.Context, id primitive.ObjectID, post *domain.Post) error {
	post.UpdatedAt = time.Now()

	update := bson.M{
		"$set": bson.M{
			"title":       post.Title,
			"content":    post.Content,
			"image_url":  post.ImageURL,
			"updated_at": post.UpdatedAt,
		},
	}

	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": id}, update)
	return err
}

func (r *PostRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

func (r *PostRepository) Close(ctx context.Context) error {
	return r.client.Disconnect(ctx)
}
