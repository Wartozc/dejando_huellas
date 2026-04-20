package http

import (
	"net/http"

	"dejando_huellas_back/internal/domain"
	"dejando_huellas_back/internal/usecase"

	"github.com/gin-gonic/gin"
)

type HabeasDataHandler struct {
	uc *usecase.HabeasDataUseCase
}

func NewHabeasDataHandler(uc *usecase.HabeasDataUseCase) *HabeasDataHandler {
	return &HabeasDataHandler{uc: uc}
}

func (h *HabeasDataHandler) Get(c *gin.Context) {
	habeasData, err := h.uc.Get(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get habeas data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"habeasData": habeasData})
}

func (h *HabeasDataHandler) Update(c *gin.Context) {
	var req domain.UpdateHabeasDataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	habeasData, err := h.uc.Update(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update habeas data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Habeas data updated successfully", "habeasData": habeasData})
}
