package db

import "fmt"

// StudentInfo represents data from an external college database
type StudentInfo struct {
	StudentID string
	Name      string
	Email     string
	IsValid   bool
}

// MockCollegeDatabase simulates external college verification systems
// In production, this would be replaced with actual API calls to college databases
var MockCollegeDatabase = map[string]map[string]StudentInfo{
	"VIT": {
		"21BCE1001": {
			StudentID: "21BCE1001",
			Name:      "Alice Smith",
			Email:     "alice.smith@vitstudent.ac.in",
			IsValid:   true,
		},
		"21BCE1002": {
			StudentID: "21BCE1002",
			Name:      "Bob Johnson",
			Email:     "bob.johnson@vitstudent.ac.in",
			IsValid:   true,
		},
		"21BCE1003": {
			StudentID: "21BCE1003",
			Name:      "Charlie Brown",
			Email:     "charlie.brown@vitstudent.ac.in",
			IsValid:   true,
		},
	},
	"MIT": {
		"MIT2024001": {
			StudentID: "MIT2024001",
			Name:      "David Lee",
			Email:     "dlee@mit.edu",
			IsValid:   true,
		},
		"MIT2024002": {
			StudentID: "MIT2024002",
			Name:      "Emma Wilson",
			Email:     "ewilson@mit.edu",
			IsValid:   true,
		},
	},
	"STANFORD": {
		"STAN2024001": {
			StudentID: "STAN2024001",
			Name:      "Frank Zhang",
			Email:     "fzhang@stanford.edu",
			IsValid:   true,
		},
		"STAN2024002": {
			StudentID: "STAN2024002",
			Name:      "Grace Kim",
			Email:     "gkim@stanford.edu",
			IsValid:   true,
		},
	},
}

// VerifyStudentID checks if a student ID is valid for a given college
// Returns StudentInfo if valid, error if not found
func VerifyStudentID(collegeCode string, studentID string) (*StudentInfo, error) {
	// Check if college exists in our mock database
	collegeDB, exists := MockCollegeDatabase[collegeCode]
	if !exists {
		return nil, fmt.Errorf("college %s not found in verification system", collegeCode)
	}

	// Check if student exists in that college's database
	studentInfo, exists := collegeDB[studentID]
	if !exists || !studentInfo.IsValid {
		return nil, fmt.Errorf("student ID %s not found or invalid for college %s", studentID, collegeCode)
	}

	return &studentInfo, nil
}