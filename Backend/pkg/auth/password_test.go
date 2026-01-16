package auth

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHashPassword(t *testing.T) {
	password := "testpassword123"
	
	hash, err := HashPassword(password)
	assert.NoError(t, err)
	assert.NotEmpty(t, hash)
	assert.NotEqual(t, password, hash)
}

func TestVerifyPassword(t *testing.T) {
	password := "testpassword123"
	
	hash, err := HashPassword(password)
	assert.NoError(t, err)
	
	// Test correct password
	err = VerifyPassword(hash, password)
	assert.NoError(t, err)
	
	// Test incorrect password
	err = VerifyPassword(hash, "wrongpassword")
	assert.Error(t, err)
}
