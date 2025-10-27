package db

import "fmt"

// StudentInfo represents data from an external college database
type StudentInfo struct {
	StudentID  string
	Name       string
	Email      string
	Department string // NEW: Student's department
	Semester   int    // NEW: Current semester
	IsValid    bool
}

// MockCollegeDatabase simulates external college verification systems
// In production, this would be replaced with actual API calls to college databases
var MockCollegeDatabase = map[string]map[string]StudentInfo{
	"TMSL": {
		// --- Information Technology (IT) - 35 Students ---
		// IT - Semester 2 (10 Students)
		"TMSL23IT001": {StudentID: "TMSL23IT001", Name: "Aarav Sharma", Email: "aarav.sharma@tmsl.edu", Department: "Information Technology", Semester: 2, IsValid: true},
		"TMSL23IT002": {StudentID: "TMSL23IT002", Name: "Vivaan Singh", Email: "vivaan.singh@tmsl.edu", Department: "Information Technology", Semester: 2, IsValid: true},
		"TMSL23IT003": {StudentID: "TMSL23IT003", Name: "Aditya Kumar", Email: "aditya.kumar@tmsl.edu", Department: "Information Technology", Semester: 2, IsValid: true},
		"TMSL23IT004": {StudentID: "TMSL23IT004", Name: "Vihaan Gupta", Email: "vihaan.gupta@tmsl.edu", Department: "Information Technology", Semester: 2, IsValid: true},
		"TMSL23IT005": {StudentID: "TMSL23IT005", Name: "Arjun Patel", Email: "arjun.patel@tmsl.edu", Department: "Information Technology", Semester: 2, IsValid: true},
		"TMSL23IT006": {StudentID: "TMSL23IT006", Name: "Sai Reddy", Email: "sai.reddy@tmsl.edu", Department: "Information Technology", Semester: 2, IsValid: true},
		"TMSL23IT007": {StudentID: "TMSL23IT007", Name: "Reyansh Mishra", Email: "reyansh.mishra@tmsl.edu", Department: "Information Technology", Semester: 2, IsValid: true},
		"TMSL23IT008": {StudentID: "TMSL23IT008", Name: "Ayaan Khan", Email: "ayaan.khan@tmsl.edu", Department: "Information Technology", Semester: 2, IsValid: true},
		"TMSL23IT009": {StudentID: "TMSL23IT009", Name: "Krishna Yadav", Email: "krishna.yadav@tmsl.edu", Department: "Information Technology", Semester: 2, IsValid: true},
		"TMSL23IT010": {StudentID: "TMSL23IT010", Name: "Ishaan Jain", Email: "ishaan.jain@tmsl.edu", Department: "Information Technology", Semester: 2, IsValid: true},
		// IT - Semester 4 (10 Students)
		"TMSL22IT001": {StudentID: "TMSL22IT001", Name: "Diya Sharma", Email: "diya.sharma@tmsl.edu", Department: "Information Technology", Semester: 4, IsValid: true},
		"TMSL22IT002": {StudentID: "TMSL22IT002", Name: "Saanvi Singh", Email: "saanvi.singh@tmsl.edu", Department: "Information Technology", Semester: 4, IsValid: true},
		"TMSL22IT003": {StudentID: "TMSL22IT003", Name: "Ananya Kumar", Email: "ananya.kumar@tmsl.edu", Department: "Information Technology", Semester: 4, IsValid: true},
		"TMSL22IT004": {StudentID: "TMSL22IT004", Name: "Aadhya Gupta", Email: "aadhya.gupta@tmsl.edu", Department: "Information Technology", Semester: 4, IsValid: true},
		"TMSL22IT005": {StudentID: "TMSL22IT005", Name: "Myra Patel", Email: "myra.patel@tmsl.edu", Department: "Information Technology", Semester: 4, IsValid: true},
		"TMSL22IT006": {StudentID: "TMSL22IT006", Name: "Pari Reddy", Email: "pari.reddy@tmsl.edu", Department: "Information Technology", Semester: 4, IsValid: true},
		"TMSL22IT007": {StudentID: "TMSL22IT007", Name: "Anika Mishra", Email: "anika.mishra@tmsl.edu", Department: "Information Technology", Semester: 4, IsValid: true},
		"TMSL22IT008": {StudentID: "TMSL22IT008", Name: "Navya Khan", Email: "navya.khan@tmsl.edu", Department: "Information Technology", Semester: 4, IsValid: true},
		"TMSL22IT009": {StudentID: "TMSL22IT009", Name: "Siya Yadav", Email: "siya.yadav@tmsl.edu", Department: "Information Technology", Semester: 4, IsValid: true},
		"TMSL22IT010": {StudentID: "TMSL22IT010", Name: "Prisha Jain", Email: "prisha.jain@tmsl.edu", Department: "Information Technology", Semester: 4, IsValid: true},
		// IT - Semester 6 (10 Students)
		"TMSL21IT001": {StudentID: "TMSL21IT001", Name: "Rohan Verma", Email: "rohan.verma@tmsl.edu", Department: "Information Technology", Semester: 6, IsValid: true},
		"TMSL21IT002": {StudentID: "TMSL21IT002", Name: "Advik Das", Email: "advik.das@tmsl.edu", Department: "Information Technology", Semester: 6, IsValid: true},
		"TMSL21IT003": {StudentID: "TMSL21IT003", Name: "Kabir Roy", Email: "kabir.roy@tmsl.edu", Department: "Information Technology", Semester: 6, IsValid: true},
		"TMSL21IT004": {StudentID: "TMSL21IT004", Name: "Ansh Mehta", Email: "ansh.mehta@tmsl.edu", Department: "Information Technology", Semester: 6, IsValid: true},
		"TMSL21IT005": {StudentID: "TMSL21IT005", Name: "Kian Shah", Email: "kian.shah@tmsl.edu", Department: "Information Technology", Semester: 6, IsValid: true},
		"TMSL21IT006": {StudentID: "TMSL21IT006", Name: "Atharv Agarwal", Email: "atharv.agarwal@tmsl.edu", Department: "Information Technology", Semester: 6, IsValid: true},
		"TMSL21IT007": {StudentID: "TMSL21IT007", Name: "Vivaan Joshi", Email: "vivaan.joshi@tmsl.edu", Department: "Information Technology", Semester: 6, IsValid: true},
		"TMSL21IT008": {StudentID: "TMSL21IT008", Name: "Dev Rajput", Email: "dev.rajput@tmsl.edu", Department: "Information Technology", Semester: 6, IsValid: true},
		"TMSL21IT009": {StudentID: "TMSL21IT009", Name: "Aryan Nair", Email: "aryan.nair@tmsl.edu", Department: "Information Technology", Semester: 6, IsValid: true},
		"TMSL21IT010": {StudentID: "TMSL21IT010", Name: "Veer Pillai", Email: "veer.pillai@tmsl.edu", Department: "Information Technology", Semester: 6, IsValid: true},
		// IT - Semester 8 (5 Students)
		"TMSL20IT001": {StudentID: "TMSL20IT001", Name: "Zara Ali", Email: "zara.ali@tmsl.edu", Department: "Information Technology", Semester: 8, IsValid: true},
		"TMSL20IT002": {StudentID: "TMSL20IT002", Name: "Inaya Kaur", Email: "inaya.kaur@tmsl.edu", Department: "Information Technology", Semester: 8, IsValid: true},
		"TMSL20IT003": {StudentID: "TMSL20IT003", Name: "Aayat Bose", Email: "aayat.bose@tmsl.edu", Department: "Information Technology", Semester: 8, IsValid: true},
		"TMSL20IT004": {StudentID: "TMSL20IT004", Name: "Kiara Dutta", Email: "kiara.dutta@tmsl.edu", Department: "Information Technology", Semester: 8, IsValid: true},
		"TMSL20IT005": {StudentID: "TMSL20IT005", Name: "Samaira Ghosh", Email: "samaira.ghosh@tmsl.edu", Department: "Information Technology", Semester: 8, IsValid: true},

		// --- Computer Science and Engineering (CSE) - 35 Students ---
		// CSE - Semester 2 (10 Students)
		"TMSL23CS001": {StudentID: "TMSL23CS001", Name: "Liam Kumar", Email: "liam.kumar@tmsl.edu", Department: "Computer Science and Engineering", Semester: 2, IsValid: true},
		"TMSL23CS002": {StudentID: "TMSL23CS002", Name: "Noah Singh", Email: "noah.singh@tmsl.edu", Department: "Computer Science and Engineering", Semester: 2, IsValid: true},
		"TMSL23CS003": {StudentID: "TMSL23CS003", Name: "Oliver Sharma", Email: "oliver.sharma@tmsl.edu", Department: "Computer Science and Engineering", Semester: 2, IsValid: true},
		"TMSL23CS004": {StudentID: "TMSL23CS004", Name: "Elijah Gupta", Email: "elijah.gupta@tmsl.edu", Department: "Computer Science and Engineering", Semester: 2, IsValid: true},
		"TMSL23CS005": {StudentID: "TMSL23CS005", Name: "James Patel", Email: "james.patel@tmsl.edu", Department: "Computer Science and Engineering", Semester: 2, IsValid: true},
		"TMSL23CS006": {StudentID: "TMSL23CS006", Name: "William Reddy", Email: "william.reddy@tmsl.edu", Department: "Computer Science and Engineering", Semester: 2, IsValid: true},
		"TMSL23CS007": {StudentID: "TMSL23CS007", Name: "Benjamin Mishra", Email: "benjamin.mishra@tmsl.edu", Department: "Computer Science and Engineering", Semester: 2, IsValid: true},
		"TMSL23CS008": {StudentID: "TMSL23CS008", Name: "Lucas Khan", Email: "lucas.khan@tmsl.edu", Department: "Computer Science and Engineering", Semester: 2, IsValid: true},
		"TMSL23CS009": {StudentID: "TMSL23CS009", Name: "Henry Yadav", Email: "henry.yadav@tmsl.edu", Department: "Computer Science and Engineering", Semester: 2, IsValid: true},
		"TMSL23CS010": {StudentID: "TMSL23CS010", Name: "Theodore Jain", Email: "theodore.jain@tmsl.edu", Department: "Computer Science and Engineering", Semester: 2, IsValid: true},
		// CSE - Semester 4 (10 Students)
		"TMSL22CS001": {StudentID: "TMSL22CS001", Name: "Olivia Kumar", Email: "olivia.kumar@tmsl.edu", Department: "Computer Science and Engineering", Semester: 4, IsValid: true},
		"TMSL22CS002": {StudentID: "TMSL22CS002", Name: "Emma Singh", Email: "emma.singh@tmsl.edu", Department: "Computer Science and Engineering", Semester: 4, IsValid: true},
		"TMSL22CS003": {StudentID: "TMSL22CS003", Name: "Ava Sharma", Email: "ava.sharma@tmsl.edu", Department: "Computer Science and Engineering", Semester: 4, IsValid: true},
		"TMSL22CS004": {StudentID: "TMSL22CS004", Name: "Sophia Gupta", Email: "sophia.gupta@tmsl.edu", Department: "Computer Science and Engineering", Semester: 4, IsValid: true},
		"TMSL22CS005": {StudentID: "TMSL22CS005", Name: "Isabella Patel", Email: "isabella.patel@tmsl.edu", Department: "Computer Science and Engineering", Semester: 4, IsValid: true},
		"TMSL22CS006": {StudentID: "TMSL22CS006", Name: "Mia Reddy", Email: "mia.reddy@tmsl.edu", Department: "Computer Science and Engineering", Semester: 4, IsValid: true},
		"TMSL22CS007": {StudentID: "TMSL22CS007", Name: "Amelia Mishra", Email: "amelia.mishra@tmsl.edu", Department: "Computer Science and Engineering", Semester: 4, IsValid: true},
		"TMSL22CS008": {StudentID: "TMSL22CS008", Name: "Harper Khan", Email: "harper.khan@tmsl.edu", Department: "Computer Science and Engineering", Semester: 4, IsValid: true},
		"TMSL22CS009": {StudentID: "TMSL22CS009", Name: "Evelyn Yadav", Email: "evelyn.yadav@tmsl.edu", Department: "Computer Science and Engineering", Semester: 4, IsValid: true},
		"TMSL22CS010": {StudentID: "TMSL22CS010", Name: "Abigail Jain", Email: "abigail.jain@tmsl.edu", Department: "Computer Science and Engineering", Semester: 4, IsValid: true},
		// CSE - Semester 6 (10 Students)
		"TMSL21CS001": {StudentID: "TMSL21CS001", Name: "Mateo Verma", Email: "mateo.verma@tmsl.edu", Department: "Computer Science and Engineering", Semester: 6, IsValid: true},
		"TMSL21CS002": {StudentID: "TMSL21CS002", Name: "Leo Das", Email: "leo.das@tmsl.edu", Department: "Computer Science and Engineering", Semester: 6, IsValid: true},
		"TMSL21CS003": {StudentID: "TMSL21CS003", Name: "Luca Roy", Email: "luca.roy@tmsl.edu", Department: "Computer Science and Engineering", Semester: 6, IsValid: true},
		"TMSL21CS004": {StudentID: "TMSL21CS004", Name: "Asher Mehta", Email: "asher.mehta@tmsl.edu", Department: "Computer Science and Engineering", Semester: 6, IsValid: true},
		"TMSL21CS005": {StudentID: "TMSL21CS005", Name: "Ethan Shah", Email: "ethan.shah@tmsl.edu", Department: "Computer Science and Engineering", Semester: 6, IsValid: true},
		"TMSL21CS006": {StudentID: "TMSL21CS006", Name: "Aiden Agarwal", Email: "aiden.agarwal@tmsl.edu", Department: "Computer Science and Engineering", Semester: 6, IsValid: true},
		"TMSL21CS007": {StudentID: "TMSL21CS007", Name: "Michael Joshi", Email: "michael.joshi@tmsl.edu", Department: "Computer Science and Engineering", Semester: 6, IsValid: true},
		"TMSL21CS008": {StudentID: "TMSL21CS008", Name: "Daniel Rajput", Email: "daniel.rajput@tmsl.edu", Department: "Computer Science and Engineering", Semester: 6, IsValid: true},
		"TMSL21CS009": {StudentID: "TMSL21CS009", Name: "Kai Nair", Email: "kai.nair@tmsl.edu", Department: "Computer Science and Engineering", Semester: 6, IsValid: true},
		"TMSL21CS010": {StudentID: "TMSL21CS010", Name: "Axel Pillai", Email: "axel.pillai@tmsl.edu", Department: "Computer Science and Engineering", Semester: 6, IsValid: true},
		// CSE - Semester 8 (5 Students)
		"TMSL20CS001": {StudentID: "TMSL20CS001", Name: "Luna Ali", Email: "luna.ali@tmsl.edu", Department: "Computer Science and Engineering", Semester: 8, IsValid: true},
		"TMSL20CS002": {StudentID: "TMSL20CS002", Name: "Mila Kaur", Email: "mila.kaur@tmsl.edu", Department: "Computer Science and Engineering", Semester: 8, IsValid: true},
		"TMSL20CS003": {StudentID: "TMSL20CS003", Name: "Aria Bose", Email: "aria.bose@tmsl.edu", Department: "Computer Science and Engineering", Semester: 8, IsValid: true},
		"TMSL20CS004": {StudentID: "TMSL20CS004", Name: "Aurora Dutta", Email: "aurora.dutta@tmsl.edu", Department: "Computer Science and Engineering", Semester: 8, IsValid: true},
		"TMSL20CS005": {StudentID: "TMSL20CS005", Name: "Ellie Ghosh", Email: "ellie.ghosh@tmsl.edu", Department: "Computer Science and Engineering", Semester: 8, IsValid: true},

		// --- Electronics and Communication Engineering (ECE) - 35 Students ---
		// ECE - Semester 2 (10 Students)
		"TMSL23EC001": {StudentID: "TMSL23EC001", Name: "Jayden Kumar", Email: "jayden.kumar@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 2, IsValid: true},
		"TMSL23EC002": {StudentID: "TMSL23EC002", Name: "Dylan Singh", Email: "dylan.singh@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 2, IsValid: true},
		"TMSL23EC003": {StudentID: "TMSL23EC003", Name: "Grayson Sharma", Email: "grayson.sharma@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 2, IsValid: true},
		"TMSL23EC004": {StudentID: "TMSL23EC004", Name: "Levi Gupta", Email: "levi.gupta@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 2, IsValid: true},
		"TMSL23EC005": {StudentID: "TMSL23EC005", Name: "Isaac Patel", Email: "isaac.patel@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 2, IsValid: true},
		"TMSL23EC006": {StudentID: "TMSL23EC006", Name: "Gabriel Reddy", Email: "gabriel.reddy@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 2, IsValid: true},
		"TMSL23EC007": {StudentID: "TMSL23EC007", Name: "Julian Mishra", Email: "julian.mishra@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 2, IsValid: true},
		"TMSL23EC008": {StudentID: "TMSL23EC008", Name: "Mateo Khan", Email: "mateo.khan@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 2, IsValid: true},
		"TMSL23EC009": {StudentID: "TMSL23EC009", Name: "Anthony Yadav", Email: "anthony.yadav@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 2, IsValid: true},
		"TMSL23EC010": {StudentID: "TMSL23EC010", Name: "Jaxon Jain", Email: "jaxon.jain@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 2, IsValid: true},
		// ECE - Semester 4 (10 Students)
		"TMSL22EC001": {StudentID: "TMSL22EC001", Name: "Layla Kumar", Email: "layla.kumar@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 4, IsValid: true},
		"TMSL22EC002": {StudentID: "TMSL22EC002", Name: "Paisley Singh", Email: "paisley.singh@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 4, IsValid: true},
		"TMSL22EC003": {StudentID: "TMSL22EC003", Name: "Willow Sharma", Email: "willow.sharma@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 4, IsValid: true},
		"TMSL22EC004": {StudentID: "TMSL22EC004", Name: "Nora Gupta", Email: "nora.gupta@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 4, IsValid: true},
		"TMSL22EC005": {StudentID: "TMSL22EC005", Name: "Mila Patel", Email: "mila.patel@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 4, IsValid: true},
		"TMSL22EC006": {StudentID: "TMSL22EC006", Name: "Avery Reddy", Email: "avery.reddy@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 4, IsValid: true},
		"TMSL22EC007": {StudentID: "TMSL22EC007", Name: "Scarlett Mishra", Email: "scarlett.mishra@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 4, IsValid: true},
		"TMSL22EC008": {StudentID: "TMSL22EC008", Name: "Penelope Khan", Email: "penelope.khan@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 4, IsValid: true},
		"TMSL22EC009": {StudentID: "TMSL22EC009", Name: "Riley Yadav", Email: "riley.yadav@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 4, IsValid: true},
		"TMSL22EC010": {StudentID: "TMSL22EC010", Name: "Chloe Jain", Email: "chloe.jain@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 4, IsValid: true},
		// ECE - Semester 6 (10 Students)
		"TMSL21EC001": {StudentID: "TMSL21EC001", Name: "Lincoln Verma", Email: "lincoln.verma@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 6, IsValid: true},
		"TMSL21EC002": {StudentID: "TMSL21EC002", Name: "Miles Das", Email: "miles.das@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 6, IsValid: true},
		"TMSL21EC003": {StudentID: "TMSL21EC003", Name: "Christopher Roy", Email: "christopher.roy@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 6, IsValid: true},
		"TMSL21EC004": {StudentID: "TMSL21EC004", Name: "Nathan Mehta", Email: "nathan.mehta@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 6, IsValid: true},
		"TMSL21EC005": {StudentID: "TMSL21EC005", Name: "Isaiah Shah", Email: "isaiah.shah@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 6, IsValid: true},
		"TMSL21EC006": {StudentID: "TMSL21EC006", Name: "Andrew Agarwal", Email: "andrew.agarwal@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 6, IsValid: true},
		"TMSL21EC007": {StudentID: "TMSL21EC007", Name: "Josiah Joshi", Email: "josiah.joshi@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 6, IsValid: true},
		"TMSL21EC008": {StudentID: "TMSL21EC008", Name: "Charles Rajput", Email: "charles.rajput@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 6, IsValid: true},
		"TMSL21EC009": {StudentID: "TMSL21EC009", Name: "Caleb Nair", Email: "caleb.nair@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 6, IsValid: true},
		"TMSL21EC010": {StudentID: "TMSL21EC010", Name: "Ryan Pillai", Email: "ryan.pillai@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 6, IsValid: true},
		// ECE - Semester 8 (5 Students)
		"TMSL20EC001": {StudentID: "TMSL20EC001", Name: "Eleanor Ali", Email: "eleanor.ali@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 8, IsValid: true},
		"TMSL20EC002": {StudentID: "TMSL20EC002", Name: "Hannah Kaur", Email: "hannah.kaur@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 8, IsValid: true},
		"TMSL20EC003": {StudentID: "TMSL20EC003", Name: "Lillian Bose", Email: "lillian.bose@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 8, IsValid: true},
		"TMSL20EC004": {StudentID: "TMSL20EC004", Name: "Addison Dutta", Email: "addison.dutta@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 8, IsValid: true},
		"TMSL20EC005": {StudentID: "TMSL20EC005", Name: "Aubrey Ghosh", Email: "aubrey.ghosh@tmsl.edu", Department: "Electronics and Communication Engineering", Semester: 8, IsValid: true},
	},
	"VIT": {
		"21BCE1001": {StudentID: "21BCE1001", Name: "Alice Smith", Email: "alice.smith@vitstudent.ac.in", Department: "Computer Science and Engineering", Semester: 4, IsValid: true},
		"21BCE1002": {StudentID: "21BCE1002", Name: "Bob Johnson", Email: "bob.johnson@vitstudent.ac.in", Department: "Electronics and Communication Engineering", Semester: 6, IsValid: true},
		"21BCE1003": {StudentID: "21BCE1003", Name: "Charlie Brown", Email: "charlie.brown@vitstudent.ac.in", Department: "Computer Science and Engineering", Semester: 4, IsValid: true},
		"21BCE1004": {StudentID: "21BCE1004", Name: "Diana Prince", Email: "diana.prince@vitstudent.ac.in", Department: "Mechanical Engineering", Semester: 2, IsValid: true},
		"21BME1105": {StudentID: "21BME1105", Name: "Ethan Hunt", Email: "ethan.hunt@vitstudent.ac.in", Department: "Mechanical Engineering", Semester: 6, IsValid: true},
		"21BEC1206": {StudentID: "21BEC1206", Name: "Fiona Glenanne", Email: "fiona.glenanne@vitstudent.ac.in", Department: "Electronics and Communication Engineering", Semester: 4, IsValid: true},
		"21BCI1307": {StudentID: "21BCI1307", Name: "George Mason", Email: "george.mason@vitstudent.ac.in", Department: "Information Technology", Semester: 2, IsValid: true},
		"21BCI1308": {StudentID: "21BCI1308", Name: "Hannah Wells", Email: "hannah.wells@vitstudent.ac.in", Department: "Information Technology", Semester: 2, IsValid: true},
		"21BEE1409": {StudentID: "21BEE1409", Name: "Ian Shaw", Email: "ian.shaw@vitstudent.ac.in", Department: "Electrical and Electronics Engineering", Semester: 8, IsValid: true},
		"21BCE1010": {StudentID: "21BCE1010", Name: "Julia Robert", Email: "julia.robert@vitstudent.ac.in", Department: "Computer Science and Engineering", Semester: 6, IsValid: true},
	},
	"MIT": {
		"MIT2024001": {StudentID: "MIT2024001", Name: "David Lee", Email: "dlee@mit.edu", Department: "Computer Science", Semester: 6, IsValid: true},
		"MIT2024002": {StudentID: "MIT2024002", Name: "Emma Wilson", Email: "ewilson@mit.edu", Department: "Electrical Engineering", Semester: 4, IsValid: true},
		"MIT2024003": {StudentID: "MIT2024003", Name: "Frank Miller", Email: "fmiller@mit.edu", Department: "Physics", Semester: 8, IsValid: true},
		"MIT2024004": {StudentID: "MIT2024004", Name: "Grace Hall", Email: "ghall@mit.edu", Department: "Mechanical Engineering", Semester: 4, IsValid: true},
		"MIT2024005": {StudentID: "MIT2024005", Name: "Henry Scott", Email: "hscott@mit.edu", Department: "Electrical Engineering", Semester: 4, IsValid: true},
		"MIT2024006": {StudentID: "MIT2024006", Name: "Isabel Adams", Email: "iadams@mit.edu", Department: "Chemical Engineering", Semester: 2, IsValid: true},
		"MIT2024007": {StudentID: "MIT2024007", Name: "Jack White", Email: "jwhite@mit.edu", Department: "Computer Science", Semester: 6, IsValid: true},
		"MIT2024008": {StudentID: "MIT2024008", Name: "Kate Green", Email: "kgreen@mit.edu", Department: "Physics", Semester: 8, IsValid: true},
		"MIT2024009": {StudentID: "MIT2024009", Name: "Liam King", Email: "lking@mit.edu", Department: "Mechanical Engineering", Semester: 2, IsValid: true},
		"MIT2024010": {StudentID: "MIT2024010", Name: "Mia Clark", Email: "mclark@mit.edu", Department: "Chemical Engineering", Semester: 2, IsValid: true},
	},
	"STANFORD": {
		"STAN2024001": {StudentID: "STAN2024001", Name: "Noah Young", Email: "nyoung@stanford.edu", Department: "Computer Science", Semester: 8, IsValid: true},
		"STAN2024002": {StudentID: "STAN2024002", Name: "Olivia Harris", Email: "oharris@stanford.edu", Department: "Bioengineering", Semester: 2, IsValid: true},
		"STAN2024003": {StudentID: "STAN2024003", Name: "Peter Allen", Email: "pallen@stanford.edu", Department: "Economics", Semester: 4, IsValid: true},
		"STAN2024004": {StudentID: "STAN2024004", Name: "Quinn Nelson", Email: "qnelson@stanford.edu", Department: "Political Science", Semester: 6, IsValid: true},
		"STAN2024005": {StudentID: "STAN2024005", Name: "Rachel Lewis", Email: "rlewis@stanford.edu", Department: "Computer Science", Semester: 8, IsValid: true},
		"STAN2024006": {StudentID: "STAN2024006", Name: "Sam Evans", Email: "sevans@stanford.edu", Department: "Bioengineering", Semester: 2, IsValid: true},
		"STAN2024007": {StudentID: "STAN2024007", Name: "Tina Walker", Email: "twalker@stanford.edu", Department: "Economics", Semester: 4, IsValid: true},
		"STAN2024008": {StudentID: "STAN2024008", Name: "Uma Davis", Email: "udavis@stanford.edu", Department: "Political Science", Semester: 6, IsValid: true},
		"STAN2024009": {StudentID: "STAN2024009", Name: "Victor Perez", Email: "vperez@stanford.edu", Department: "Mathematics", Semester: 8, IsValid: true},
		"STAN2024010": {StudentID: "STAN2024010", Name: "Wendy Moore", Email: "wmoore@stanford.edu", Department: "Mathematics", Semester: 8, IsValid: true},
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
