package db // Or your chosen package

/* import (
	"fmt"
	"log"
	"time" // Needed for autoJoinGroups

	"unilink-backend/models"
	"unilink-backend/utils" // For HashPassword

	// Add gorm if not already imported in this file
	"gorm.io/gorm"
) */

// NOTE: The autoJoinGroups function logic is copied here from handlers/auth_handlers.go
// If you prefer, you could export it from the handlers package or move it to a shared utils package.
/* func autoJoinGroups(user *models.User, db *gorm.DB) {
	// Only auto-join for students
	if user.Role != "student" {
		return
	}
	log.Printf("Attempting to auto-join groups for %s (Dept: %s, Sem: %d)", user.StudentID, user.Department, user.Semester)

	// Ensure Department and Semester are valid before proceeding
	if user.Department == "" || user.Semester <= 0 {
		log.Printf("Skipping auto-join for %s due to missing Department or invalid Semester.", user.StudentID)
		return
	}

	// 1. Find or create department group (e.g., "Computer Science and Engineering")
	deptGroupName := user.Department
	var deptGroup models.Group

	result := db.Where("college_id = ? AND type = ? AND department = ? AND semester IS NULL",
		user.CollegeID, "auto", user.Department).First(&deptGroup)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			// Create the department group if it doesn't exist
			deptGroup = models.Group{
				Name:        deptGroupName,
				Description: "Official group for all " + user.Department + " students",
				Type:        "auto",
				CollegeID:   user.CollegeID,
				Department:  &user.Department,
				Semester:    nil, // Department-wide group
			}
			if err := db.Create(&deptGroup).Error; err != nil {
				log.Printf("Error creating department group '%s': %v", deptGroupName, err)
				return // Stop if group creation fails
			}
			log.Printf("Created department group: %s (ID: %d)", deptGroup.Name, deptGroup.ID)
		} else {
			log.Printf("Error finding department group '%s': %v", deptGroupName, result.Error)
			return // Stop if DB query fails
		}
	} else {
		log.Printf("Found department group: %s (ID: %d)", deptGroup.Name, deptGroup.ID)
	}

	// Add user to department group if not already a member
	var deptMembership models.GroupMember
	memResult := db.Where("group_id = ? AND user_id = ?", deptGroup.ID, user.ID).First(&deptMembership)
	if memResult.Error != nil && memResult.Error == gorm.ErrRecordNotFound {
		if err := db.Create(&models.GroupMember{
			GroupID:  deptGroup.ID,
			UserID:   user.ID,
			Role:     "member",
			JoinedAt: time.Now(),
		}).Error; err != nil {
			log.Printf("Error adding user %d to department group %d: %v", user.ID, deptGroup.ID, err)
		} else {
			log.Printf("Added user %s to department group %s", user.StudentID, deptGroup.Name)
		}
	} else if memResult.Error == nil {
		log.Printf("User %s already in department group %s", user.StudentID, deptGroup.Name)
	} else {
		log.Printf("Error checking department group membership for user %d group %d: %v", user.ID, deptGroup.ID, memResult.Error)
	}

	// 2. Find or create department + semester group (e.g., "CSE - Semester 4")
	semGroupName := fmt.Sprintf("%s - Semester %d", user.Department, user.Semester)
	var semGroup models.Group

	result = db.Where("college_id = ? AND type = ? AND department = ? AND semester = ?",
		user.CollegeID, "auto", user.Department, user.Semester).First(&semGroup)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			// Create the semester group if it doesn't exist
			semGroup = models.Group{
				Name:        semGroupName,
				Description: fmt.Sprintf("Official group for %s Semester %d students", user.Department, user.Semester),
				Type:        "auto",
				CollegeID:   user.CollegeID,
				Department:  &user.Department,
				Semester:    &user.Semester,
			}
			if err := db.Create(&semGroup).Error; err != nil {
				log.Printf("Error creating semester group '%s': %v", semGroupName, err)
				return // Stop if group creation fails
			}
			log.Printf("Created semester group: %s (ID: %d)", semGroup.Name, semGroup.ID)
		} else {
			log.Printf("Error finding semester group '%s': %v", semGroupName, result.Error)
			return // Stop if DB query fails
		}
	} else {
		log.Printf("Found semester group: %s (ID: %d)", semGroup.Name, semGroup.ID)
	}

	// Add user to semester group if not already a member
	var semMembership models.GroupMember
	memResult = db.Where("group_id = ? AND user_id = ?", semGroup.ID, user.ID).First(&semMembership)
	if memResult.Error != nil && memResult.Error == gorm.ErrRecordNotFound {
		if err := db.Create(&models.GroupMember{
			GroupID:  semGroup.ID,
			UserID:   user.ID,
			Role:     "member",
			JoinedAt: time.Now(),
		}).Error; err != nil {
			log.Printf("Error adding user %d to semester group %d: %v", user.ID, semGroup.ID, err)
		} else {
			log.Printf("Added user %s to semester group %s", user.StudentID, semGroup.Name)
		}
	} else if memResult.Error == nil {
		log.Printf("User %s already in semester group %s", user.StudentID, semGroup.Name)
	} else {
		log.Printf("Error checking semester group membership for user %d group %d: %v", user.ID, semGroup.ID, memResult.Error)
	}
} */

// SeedTMSLStudents registers all students from the TMSL mock database.
/* func SeedTMSLStudents(db *gorm.DB) {
	log.Println("🌱 Starting TMSL student seeding...")

	// 1. Get TMSL College ID
	var tmslCollege models.College
	result := db.Where("college_code = ?", "TMSL").First(&tmslCollege)
	if result.Error != nil {
		log.Printf("❌ Error finding TMSL college: %v. Aborting TMSL student seed.", result.Error)
		return
	}
	log.Printf("ℹ️ Found TMSL College (ID: %d)", tmslCollege.ID)

	// 2. Get TMSL student data from mock DB
	tmslStudents, exists := MockCollegeDatabase["TMSL"]
	if !exists {
		log.Println("❌ TMSL student data not found in MockCollegeDatabase. Aborting.")
		return
	}
	log.Printf("ℹ️ Found %d student records for TMSL in mock data.", len(tmslStudents))

	registeredCount := 0
	skippedCount := 0

	// 3. Iterate and register each student
	for studentID, studentInfo := range tmslStudents {
		if !studentInfo.IsValid {
			log.Printf("⚠️ Skipping invalid record for StudentID %s", studentID)
			skippedCount++
			continue
		}

		// Check if user already exists
		var existingUser models.User
		db.Where("student_id = ? AND college_id = ?", studentInfo.StudentID, tmslCollege.ID).First(&existingUser)

		if existingUser.ID != 0 {
			// log.Printf("ℹ️ Skipping existing student: %s (%s)", studentInfo.StudentID, studentInfo.Name)
			skippedCount++
			continue
		}

		// Generate unique password and hash it
		password := studentInfo.StudentID + "_Pass!" // Simple unique password
		passwordHash, err := utils.HashPassword(password)
		if err != nil {
			log.Printf("❌ Error hashing password for %s: %v. Skipping.", studentInfo.StudentID, err)
			skippedCount++
			continue
		}

		// Create new user model
		newUser := models.User{
			Name:         studentInfo.Name,
			Email:        studentInfo.Email,
			PasswordHash: passwordHash,
			Role:         "student",
			StudentID:    studentInfo.StudentID,
			CollegeID:    tmslCollege.ID,
			Department:   studentInfo.Department,
			Semester:     studentInfo.Semester,
			IsPublic:     true,     // Default to public
			Status:       "active", // Default to active
			// Let CreatedAt, UpdatedAt be handled by GORM
		}

		// Save user to DB
		creationResult := db.Create(&newUser)
		if creationResult.Error != nil {
			log.Printf("❌ Error creating user %s (%s): %v. Skipping.", studentInfo.StudentID, studentInfo.Name, creationResult.Error)
			skippedCount++
			continue
		}

		// Auto-join groups (using the copied/adapted function)
		autoJoinGroups(&newUser, db) // Pass the db instance

		// log.Printf("✅ Registered student: %s (%s)", newUser.StudentID, newUser.Name)
		registeredCount++
	}

	log.Printf("🌱 Finished TMSL student seeding. Registered: %d, Skipped: %d", registeredCount, skippedCount)
} */
