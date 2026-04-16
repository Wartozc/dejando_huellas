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

type MessageRepository struct {
	collection *mongo.Collection
	client     *mongo.Client
}

func NewMessageRepository(ctx context.Context, mongoURI, dbName string) *MessageRepository {
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to MongoDB: %v", err))
	}

	collection := client.Database(dbName).Collection("messages")
	return &MessageRepository{
		collection: collection,
		client:     client,
	}
}

func (r *MessageRepository) EnsureIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	indexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "created_at", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "user_id", Value: 1}},
		},
	}

	_, err := r.collection.Indexes().CreateMany(ctx, indexes)
	return err
}

func (r *MessageRepository) Create(ctx context.Context, message *domain.Message) error {
	message.CreatedAt = time.Now()

	log.Printf("MessageRepository.Create: Content=%s, UserID=%s, UserName=%s",
		message.Content, message.UserID.Hex(), message.UserName)

	result, err := r.collection.InsertOne(ctx, message)
	if err != nil {
		log.Printf("MessageRepository.Create: InsertOne error: %v", err)
		return err
	}

	message.ID = result.InsertedID.(primitive.ObjectID)
	log.Printf("MessageRepository.Create: Message created with ID=%s", message.ID.Hex())
	return nil
}

func (r *MessageRepository) GetAll(ctx context.Context) ([]*domain.Message, error) {
	log.Println("MessageRepository.GetAll: Fetching all messages from database...")

	// Find all messages, sorted by created_at ascending (oldest first)
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: 1}})

	cursor, err := r.collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		log.Printf("MessageRepository.GetAll: Find error: %v", err)
		return nil, err
	}
	defer cursor.Close(ctx)

	var messages []*domain.Message
	for cursor.Next(ctx) {
		var message domain.Message
		if err := cursor.Decode(&message); err != nil {
			log.Printf("MessageRepository.GetAll: Decode error: %v", err)
			continue
		}
		messages = append(messages, &message)
	}

	if err := cursor.Err(); err != nil {
		log.Printf("MessageRepository.GetAll: Cursor error: %v", err)
		return nil, err
	}

	log.Printf("MessageRepository.GetAll: Found %d messages", len(messages))
	return messages, nil
}

func (r *MessageRepository) GetSince(ctx context.Context, since time.Time) ([]*domain.Message, error) {
	log.Printf("MessageRepository.GetSince: Fetching messages since %v", since)

	// Find messages created after the given time, sorted ascending
	filter := bson.M{
		"created_at": bson.M{
			"$gt": since,
		},
	}
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: 1}})

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		log.Printf("MessageRepository.GetSince: Find error: %v", err)
		return nil, err
	}
	defer cursor.Close(ctx)

	var messages []*domain.Message
	for cursor.Next(ctx) {
		var message domain.Message
		if err := cursor.Decode(&message); err != nil {
			log.Printf("MessageRepository.GetSince: Decode error: %v", err)
			continue
		}
		messages = append(messages, &message)
	}

	if err := cursor.Err(); err != nil {
		log.Printf("MessageRepository.GetSince: Cursor error: %v", err)
		return nil, err
	}

	log.Printf("MessageRepository.GetSince: Found %d new messages", len(messages))
	return messages, nil
}

// GetByID retrieves a single message by ID
func (r *MessageRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*domain.Message, error) {
	log.Printf("MessageRepository.GetByID: Fetching message with ID=%s", id.Hex())

	var message domain.Message
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&message)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			log.Printf("MessageRepository.GetByID: No message found with ID=%s", id.Hex())
			return nil, nil
		}
		log.Printf("MessageRepository.GetByID: Error fetching message: %v", err)
		return nil, err
	}

	log.Printf("MessageRepository.GetByID: Found message ID=%s", id.Hex())
	return &message, nil
}

// Update updates an existing message
func (r *MessageRepository) Update(ctx context.Context, message *domain.Message) error {
	log.Printf("MessageRepository.Update: Updating message ID=%s", message.ID.Hex())

	now := time.Now()
	message.IsEdited = true
	message.UpdatedAt = &now

	filter := bson.M{"_id": message.ID}
	update := bson.M{
		"$set": bson.M{
			"content":    message.Content,
			"is_edited":  true,
			"updated_at": now,
		},
	}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		log.Printf("MessageRepository.Update: Update error: %v", err)
		return err
	}

	if result.MatchedCount == 0 {
		log.Printf("MessageRepository.Update: No message found with ID=%s", message.ID.Hex())
		return mongo.ErrNoDocuments
	}

	log.Printf("MessageRepository.Update: Message updated successfully")
	return nil
}

// Delete removes a message by ID
func (r *MessageRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	log.Printf("MessageRepository.Delete: Deleting message ID=%s", id.Hex())

	result, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		log.Printf("MessageRepository.Delete: Delete error: %v", err)
		return err
	}

	if result.DeletedCount == 0 {
		log.Printf("MessageRepository.Delete: No message found with ID=%s", id.Hex())
		return mongo.ErrNoDocuments
	}

	log.Printf("MessageRepository.Delete: Message deleted successfully")
	return nil
}

// AddReaction adds or updates a reaction on a message
func (r *MessageRepository) AddReaction(ctx context.Context, messageID primitive.ObjectID, reaction *domain.Reaction) error {
	log.Printf("MessageRepository.AddReaction: === START ===")
	log.Printf("MessageRepository.AddReaction: messageID=%s", messageID.Hex())
	log.Printf("MessageRepository.AddReaction: reaction.UserID=%s", reaction.UserID.Hex())
	log.Printf("MessageRepository.AddReaction: reaction.UserName=%s", reaction.UserName)
	log.Printf("MessageRepository.AddReaction: reaction.Emoji=%s", reaction.Emoji)

	// Verify collection is not nil
	if r.collection == nil {
		log.Printf("MessageRepository.AddReaction: ERROR - collection is nil!")
		return fmt.Errorf("database collection is not initialized")
	}
	log.Printf("MessageRepository.AddReaction: Collection verified OK")

	filter := bson.M{"_id": messageID}

	// Step 1: Use $set only if the field doesn't exist (uses dot notation)
	// This sets reactions to an empty array only if reactions field is missing entirely
	// Using try/catch equivalent - we'll check if the message exists first and handle accordingly
	log.Printf("MessageRepository.AddReaction: Step 1 - Checking if message exists...")

	var message domain.Message
	err := r.collection.FindOne(ctx, bson.M{"_id": messageID}).Decode(&message)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			log.Printf("MessageRepository.AddReaction: No message found with ID=%s", messageID.Hex())
			return mongo.ErrNoDocuments
		}
		log.Printf("MessageRepository.AddReaction: ERROR checking message: %v", err)
		return err
	}
	log.Printf("MessageRepository.AddReaction: Message found, reactions field: %+v", message.Reactions)

	// Step 2: If reactions is nil/nonexistent, set it to empty array first
	if message.Reactions == nil {
		log.Printf("MessageRepository.AddReaction: Step 2 - reactions is nil, ensuring array exists...")
		ensureUpdate := bson.M{
			"$set": bson.M{
				"reactions": bson.A{},
			},
		}
		_, err := r.collection.UpdateOne(ctx, filter, ensureUpdate)
		if err != nil {
			log.Printf("MessageRepository.AddReaction: ERROR in Step 2: %v", err)
			return err
		}
		log.Printf("MessageRepository.AddReaction: Reactions array ensured")
	}

	// Step 3: Now safe to $pull - remove any existing reaction from same user with same emoji
	pullUpdate := bson.M{
		"$pull": bson.M{
			"reactions": bson.M{
				"user_id": reaction.UserID,
				"emoji":   reaction.Emoji,
			},
		},
	}

	log.Printf("MessageRepository.AddReaction: Step 3 - Executing $pull operation...")
	result1, err := r.collection.UpdateOne(ctx, filter, pullUpdate)
	if err != nil {
		log.Printf("MessageRepository.AddReaction: ERROR in $pull: %v", err)
		return err
	}
	log.Printf("MessageRepository.AddReaction: $pull result - ModifiedCount=%d", result1.ModifiedCount)

	// Step 4: Now add the new reaction
	pushUpdate := bson.M{
		"$push": bson.M{
			"reactions": bson.M{
				"user_id":   reaction.UserID,
				"user_name": reaction.UserName,
				"emoji":     reaction.Emoji,
			},
		},
	}

	log.Printf("MessageRepository.AddReaction: Step 4 - Executing $push operation...")
	result2, err := r.collection.UpdateOne(ctx, filter, pushUpdate)
	if err != nil {
		log.Printf("MessageRepository.AddReaction: ERROR in $push: %v", err)
		return err
	}

	if result2.MatchedCount == 0 {
		log.Printf("MessageRepository.AddReaction: No message found with ID=%s", messageID.Hex())
		return mongo.ErrNoDocuments
	}
	log.Printf("MessageRepository.AddReaction: $push result - ModifiedCount=%d, MatchedCount=%d",
		result2.ModifiedCount, result2.MatchedCount)

	log.Printf("MessageRepository.AddReaction: SUCCESS")
	return nil
}

// RemoveReaction removes a reaction from a message
func (r *MessageRepository) RemoveReaction(ctx context.Context, messageID primitive.ObjectID, userID primitive.ObjectID, emoji string) error {
	log.Printf("MessageRepository.RemoveReaction: Removing reaction from message ID=%s", messageID.Hex())

	filter := bson.M{"_id": messageID}

	// First, fetch the message to check if reactions array exists
	var message domain.Message
	err := r.collection.FindOne(ctx, bson.M{"_id": messageID}).Decode(&message)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			log.Printf("MessageRepository.RemoveReaction: No message found with ID=%s", messageID.Hex())
			return mongo.ErrNoDocuments
		}
		log.Printf("MessageRepository.RemoveReaction: ERROR checking message: %v", err)
		return err
	}

	// If reactions is nil/nonexistent, set it to empty array first
	if message.Reactions == nil {
		log.Printf("MessageRepository.RemoveReaction: reactions is nil, ensuring array exists...")
		ensureUpdate := bson.M{
			"$set": bson.M{
				"reactions": bson.A{},
			},
		}
		_, err := r.collection.UpdateOne(ctx, filter, ensureUpdate)
		if err != nil {
			log.Printf("MessageRepository.RemoveReaction: ERROR ensuring reactions array: %v", err)
			return err
		}
	}

	// Now remove the reaction
	update := bson.M{
		"$pull": bson.M{
			"reactions": bson.M{
				"user_id": userID,
				"emoji":   emoji,
			},
		},
	}

	result, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		log.Printf("MessageRepository.RemoveReaction: Error removing reaction: %v", err)
		return err
	}

	if result.MatchedCount == 0 {
		log.Printf("MessageRepository.RemoveReaction: No message found with ID=%s", messageID.Hex())
		return mongo.ErrNoDocuments
	}

	log.Printf("MessageRepository.RemoveReaction: Reaction removed successfully")
	return nil
}

// DeleteAll removes all messages (admin only)
func (r *MessageRepository) DeleteAll(ctx context.Context) error {
	log.Println("MessageRepository.DeleteAll: Deleting all messages...")

	result, err := r.collection.DeleteMany(ctx, bson.M{})
	if err != nil {
		log.Printf("MessageRepository.DeleteAll: Delete error: %v", err)
		return err
	}

	log.Printf("MessageRepository.DeleteAll: Deleted %d messages", result.DeletedCount)
	return nil
}

func (r *MessageRepository) Close(ctx context.Context) error {
	return r.client.Disconnect(ctx)
}
