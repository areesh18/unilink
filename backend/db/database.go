package db

import (
	"log"
	"os"

	"unilink-backend/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func ConnectDB() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info), // Shows SQL queries in console
	})

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("✅ Database connection established")

	// Run auto-migrations
	err = DB.AutoMigrate(
		&models.College{},
		&models.User{},
		&models.MarketplaceListing{},
		&models.Announcement{},
		&models.Friendship{},  // Module 3
		&models.Group{},       // Module 3
		&models.GroupMember{}, // Module 3
		&models.Message{},     // Module 3
	)

	if err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	log.Println("✅ Database migrations completed")

	// Seed initial colleges (only if table is empty)
	seedColleges()
	/* SeedTMSLStudents(DB) */
}

// seedColleges adds initial college data to the database
func seedColleges() {
	var count int64
	DB.Model(&models.College{}).Count(&count)

	if count > 0 {
		log.Println("ℹ️  Colleges already exist, skipping seed")
		return
	}

	colleges := []models.College{
		{
			CollegeCode: "PLTF_ADMIN",
			Name:        "PLATFORM_ADMIN",
			LogoURL:     "https://picsum.photos/200/300",
		},
		{
			CollegeCode: "VIT",
			Name:        "Vellore Institute of Technology",
			LogoURL:     "https://upload.wikimedia.org/wikipedia/en/c/c5/Vellore_Institute_of_Technology_seal_2017.svg",
		},
		{
			CollegeCode: "MIT",
			Name:        "Massachusetts Institute of Technology",
			LogoURL:     "https://upload.wikimedia.org/wikipedia/commons/0/0c/MIT_logo.svg",
		},
		{
			CollegeCode: "STANFORD",
			Name:        "Stanford University",
			LogoURL:     "https://identity.stanford.edu/wp-content/uploads/sites/3/2020/07/block-s-right.png",
		},
	}

	result := DB.Create(&colleges)
	if result.Error != nil {
		log.Fatal("Failed to seed colleges:", result.Error)
	}

	log.Printf("✅ Seeded %d colleges\n", len(colleges))
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}
