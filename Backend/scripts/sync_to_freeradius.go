package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Get database configuration
	cfg := config.LoadConfig()
	
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBSSLMode)

	// Connect to database
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Connected to database successfully")

	// Create FreeRADIUS sync service
	syncService := usecase.NewFreeRADIUSSyncService(db)

	// Sync all RADIUS users
	log.Println("\n=== Syncing RADIUS Users ===")
	var users []entity.RadiusUser
	if err := db.Where("is_active = ?", true).Find(&users).Error; err != nil {
		log.Fatalf("Failed to fetch RADIUS users: %v", err)
	}

	log.Printf("Found %d active RADIUS users\n", len(users))
	successCount := 0
	errorCount := 0

	for _, user := range users {
		log.Printf("Syncing user: %s (ID: %s)", user.Username, user.ID)
		if err := syncService.SyncRadiusUser(&user); err != nil {
			log.Printf("  ❌ Error: %v", err)
			errorCount++
		} else {
			log.Printf("  ✓ Success")
			successCount++
		}
	}

	log.Printf("\nRADIUS Users sync completed: %d success, %d errors\n", successCount, errorCount)

	// Sync all hotspot vouchers
	log.Println("\n=== Syncing Hotspot Vouchers ===")
	var vouchers []entity.HotspotVoucher
	if err := db.Where("status = ?", "active").Find(&vouchers).Error; err != nil {
		log.Fatalf("Failed to fetch hotspot vouchers: %v", err)
	}

	log.Printf("Found %d active vouchers\n", len(vouchers))
	successCount = 0
	errorCount = 0

	for _, voucher := range vouchers {
		log.Printf("Syncing voucher: %s (ID: %s)", voucher.VoucherCode, voucher.ID)
		if err := syncService.SyncHotspotVoucher(&voucher); err != nil {
			log.Printf("  ❌ Error: %v", err)
			errorCount++
		} else {
			log.Printf("  ✓ Success")
			successCount++
		}
	}

	log.Printf("\nHotspot Vouchers sync completed: %d success, %d errors\n", successCount, errorCount)

	// Sync customer hotspot credentials
	log.Println("\n=== Syncing Customer Hotspot ===")
	var customers []entity.Customer
	if err := db.Where("hotspot_enabled = ?", true).Find(&customers).Error; err != nil {
		log.Fatalf("Failed to fetch customers with hotspot: %v", err)
	}

	log.Printf("Found %d customers with hotspot enabled\n", len(customers))
	successCount = 0
	errorCount = 0

	for _, customer := range customers {
		log.Printf("Syncing customer hotspot: %s (ID: %s)", customer.HotspotUsername, customer.ID)
		if err := syncService.SyncCustomerHotspot(&customer); err != nil {
			log.Printf("  ❌ Error: %v", err)
			errorCount++
		} else {
			log.Printf("  ✓ Success")
			successCount++
		}
	}

	log.Printf("\nCustomer Hotspot sync completed: %d success, %d errors\n", successCount, errorCount)

	// Summary
	log.Println("\n=== Sync Summary ===")
	log.Printf("Total RADIUS users synced: %d\n", len(users))
	log.Printf("Total vouchers synced: %d\n", len(vouchers))
	log.Printf("Total customer hotspot synced: %d\n", len(customers))
	log.Println("\n✓ All data synced to FreeRADIUS successfully!")

	// Verify sync
	log.Println("\n=== Verification ===")
	var radcheckCount, radreplyCount int64
	db.Table("radcheck").Count(&radcheckCount)
	db.Table("radreply").Count(&radreplyCount)
	
	log.Printf("radcheck entries: %d\n", radcheckCount)
	log.Printf("radreply entries: %d\n", radreplyCount)

	os.Exit(0)
}
