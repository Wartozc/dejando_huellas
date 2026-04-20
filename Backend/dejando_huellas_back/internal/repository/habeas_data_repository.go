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

type HabeasDataRepository struct {
	collection *mongo.Collection
	client     *mongo.Client
}

func NewHabeasDataRepository(ctx context.Context, mongoURI, dbName string) *HabeasDataRepository {
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to MongoDB: %v", err))
	}

	collection := client.Database(dbName).Collection("habeas_data")
	return &HabeasDataRepository{
		collection: collection,
		client:     client,
	}
}

func (r *HabeasDataRepository) EnsureIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Index on updated_at to get most recent
	indexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "updated_at", Value: -1}},
		},
	}

	_, err := r.collection.Indexes().CreateMany(ctx, indexes)
	return err
}

func (r *HabeasDataRepository) Get(ctx context.Context) (*domain.HabeasData, error) {
	var habeasData domain.HabeasData
	err := r.collection.FindOne(ctx, bson.M{}).Decode(&habeasData)
	if err != nil {
		// If no document exists, create default one
		if err == mongo.ErrNoDocuments {
			defaultContent := `Dejando Huellas - Tratamiento de Datos Personales

De acuerdo con la Ley 1581 de 2012 y sus Decretos reglamentarios, le informamos que los datos personales recolectados serán tratados con las siguientes finalidades:

1. Gestión de membresía y participación en la asociación
2. Comunicación de actividades y eventos
3. Prestación de servicios asociados a nuestra labor social
4. Cumplimiento de obligaciones legales

Derechos del titular:
- Conocer, actualizar y rectificar sus datos personales
- Solicitar prueba de la autorización otorgada
- Ser informado sobre el uso de sus datos
- Presegar quejas ante la Superintendencia de Industria y Comercio
- Revocar la autorización

Para ejercer sus derechos, contactenos a través de los medios disponibles en nuestra sección de contacto.`

			newHabeas := &domain.HabeasData{
				Content:   defaultContent,
				UpdatedAt: time.Now(),
			}

			result, err := r.collection.InsertOne(ctx, newHabeas)
			if err != nil {
				return nil, err
			}

			newHabeas.ID = result.InsertedID.(primitive.ObjectID)
			return newHabeas, nil
		}
		return nil, err
	}
	return &habeasData, nil
}

func (r *HabeasDataRepository) Update(ctx context.Context, habeasData *domain.HabeasData) error {
	habeasData.UpdatedAt = time.Now()

	// Use upsert to create or update
	update := bson.M{
		"$set": bson.M{
			"content":    habeasData.Content,
			"updated_at": habeasData.UpdatedAt,
		},
	}

	opts := options.Update().SetUpsert(true)
	_, err := r.collection.UpdateOne(ctx, bson.M{}, update, opts)
	return err
}

func (r *HabeasDataRepository) Close(ctx context.Context) error {
	return r.client.Disconnect(ctx)
}
