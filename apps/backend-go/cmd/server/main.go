package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/hakounamatata/backend-go/internal/delivery/http/router"
	"github.com/hakounamatata/backend-go/internal/infrastructure/config"
	"github.com/hakounamatata/backend-go/internal/infrastructure/database"
	"github.com/hakounamatata/backend-go/pkg/logger"
)

func main() {
	// Initialize logger
	log := logger.NewLogger()
	defer log.Sync()

	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal("Failed to load configuration", "error", err)
	}

	// Initialize databases
	postgresDB, err := database.NewPostgresConnection(cfg)
	if err != nil {
		log.Fatal("Failed to connect to PostgreSQL", "error", err)
	}

	mongoDB, err := database.NewMongoConnection(cfg)
	if err != nil {
		log.Fatal("Failed to connect to MongoDB", "error", err)
	}
	defer mongoDB.Disconnect(context.Background())

	// Initialize router
	r := router.NewRouter(cfg, postgresDB, mongoDB, log)

	// Create server
	srv := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Info("Starting server", "port", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Failed to start server", "error", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown", "error", err)
	}

	log.Info("Server exited")
}
