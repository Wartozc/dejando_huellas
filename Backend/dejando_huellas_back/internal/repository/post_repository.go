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
		client:     client,
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
	log.Println("Repository.GetAll: Fetching all posts from database...")

	// First, let's check if we can connect to the collection
	db := r.collection.Database()
	log.Printf("Repository.GetAll: Database=%s, Collection=posts", db.Name())

	// Get the database name from config
	// Also count total documents in the collection
	count, err := r.collection.CountDocuments(ctx, bson.M{})
	log.Printf("Repository.GetAll: Total documents in collection: %d, err=%v", count, err)

	// Use manual decoding to handle image_url properly
	cursor, err := r.collection.Find(ctx, bson.M{})
	if err != nil {
		log.Printf("Repository.GetAll: Find error: %v", err)
		return nil, err
	}
	defer cursor.Close(ctx)

	// Manually decode each document to handle the image_url field correctly
	var posts []*domain.Post
	for cursor.Next(ctx) {
		// Use bson.M to get raw document first
		var rawDoc bson.M
		if err := cursor.Decode(&rawDoc); err != nil {
			log.Printf("Repository.GetAll: Raw decode error: %v", err)
			continue
		}

		// Create a Post and manually map fields
		post := &domain.Post{}

		// Handle ID
		if id, ok := rawDoc["_id"]; ok {
			post.ID = id.(primitive.ObjectID)
		}

		// Handle simple string fields
		if title, ok := rawDoc["title"].(string); ok {
			post.Title = title
		}
		if content, ok := rawDoc["content"].(string); ok {
			post.Content = content
		}

		// Handle image_url - this is where the problem is
		if imageURL, ok := rawDoc["image_url"]; ok && imageURL != nil {
			log.Printf("Repository.GetAll: Raw image_url type: %T, value: %v", imageURL, imageURL)

			// Try different ways to convert to []string
			switch v := imageURL.(type) {
			case []interface{}:
				// MongoDB array stored as []interface{}
				imageURLs := make([]string, 0, len(v))
				for _, item := range v {
					if s, ok := item.(string); ok {
						imageURLs = append(imageURLs, s)
					}
				}
				post.ImageURL = imageURLs
				log.Printf("Repository.GetAll: Converted from []interface{}: %v", post.ImageURL)
			case primitive.A:
				// MongoDB array stored as primitive.A (bson.A)
				imageURLs := make([]string, 0, len(v))
				for _, item := range v {
					if s, ok := item.(string); ok {
						imageURLs = append(imageURLs, s)
					}
				}
				post.ImageURL = imageURLs
				log.Printf("Repository.GetAll: Converted from primitive.A: %v", post.ImageURL)
			case []string:
				// Already []string
				post.ImageURL = v
			case string:
				// Single string - could be legacy data, convert to slice
				post.ImageURL = []string{v}
				log.Printf("Repository.GetAll: Converted from string: %v", post.ImageURL)
			default:
				log.Printf("Repository.GetAll: Unexpected image_url type: %T", imageURL)
			}
		}

		// Handle created_by
		if createdBy, ok := rawDoc["created_by"]; ok && createdBy != nil {
			post.CreatedBy = createdBy.(primitive.ObjectID)
		}

		// Handle dates
		if createdAt, ok := rawDoc["created_at"]; ok {
			if t, ok := createdAt.(primitive.DateTime); ok {
				post.CreatedAt = t.Time()
			}
		}
		if updatedAt, ok := rawDoc["updated_at"]; ok {
			if t, ok := updatedAt.(primitive.DateTime); ok {
				post.UpdatedAt = t.Time()
			}
		}

		posts = append(posts, post)
		log.Printf("Repository.GetAll: Decoded post[%d] ID=%s Title=%s ImageURL=%v",
			len(posts)-1, post.ID.Hex(), post.Title, post.ImageURL)
	}

	if err := cursor.Err(); err != nil {
		log.Printf("Repository.GetAll: Cursor error: %v", err)
		return nil, err
	}

	log.Printf("Repository.GetAll: Found %d posts", len(posts))
	return posts, nil
}

func (r *PostRepository) Update(ctx context.Context, id primitive.ObjectID, post *domain.Post) error {
	post.UpdatedAt = time.Now()

	update := bson.M{
		"$set": bson.M{
			"title":      post.Title,
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
