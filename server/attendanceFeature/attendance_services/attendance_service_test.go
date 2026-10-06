package attendanceservices

import (
	"math"
	"testing"
	"time"
)

func TestHaversineMeters(t *testing.T) {
	// One degree of longitude at the equator is approximately 111.2 km.
	distance := haversineMeters(0, 0, 0, 1)
	if math.Abs(distance-111194.9) > 100 {
		t.Fatalf("unexpected distance: %.2f", distance)
	}
}

func TestValidateTimeWindow(t *testing.T) {
	base := time.Date(2026, 8, 24, 8, 30, 0, 0, time.UTC)
	if err := validateTimeWindow(base, "05:00:00", "12:00:00", "ลงเวลาเข้างาน"); err != nil {
		t.Fatalf("expected allowed time: %v", err)
	}
	if err := validateTimeWindow(base, "09:00:00", "12:00:00", "ลงเวลาเข้างาน"); err == nil {
		t.Fatal("expected time before window to be rejected")
	}
}

func TestValidateOvernightTimeWindow(t *testing.T) {
	now := time.Date(2026, 8, 24, 23, 30, 0, 0, time.UTC)
	if err := validateTimeWindow(now, "22:00:00", "02:00:00", "ลงเวลา"); err != nil {
		t.Fatalf("expected overnight time to be allowed: %v", err)
	}
}

func TestHaversineSamePoint(t *testing.T) {
	if distance := haversineMeters(13.7563, 100.5018, 13.7563, 100.5018); distance != 0 {
		t.Fatalf("same point should be zero, got %.2f", distance)
	}
}
