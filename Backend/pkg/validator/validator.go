package validator

import (
	"fmt"
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
)

// ValidationError represents a single field validation error
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
	Tag     string `json:"tag"`
	Value   string `json:"value,omitempty"`
}

// ValidationErrors represents multiple validation errors
type ValidationErrors struct {
	Errors []ValidationError `json:"errors"`
}

func (v *ValidationErrors) Error() string {
	var msgs []string
	for _, e := range v.Errors {
		msgs = append(msgs, fmt.Sprintf("%s: %s", e.Field, e.Message))
	}
	return strings.Join(msgs, "; ")
}

// ToMap converts validation errors to map for response
func (v *ValidationErrors) ToMap() map[string]interface{} {
	result := make(map[string]interface{})
	fieldErrors := make(map[string]string)
	for _, e := range v.Errors {
		fieldErrors[e.Field] = e.Message
	}
	result["fields"] = fieldErrors
	result["count"] = len(v.Errors)
	return result
}

// ParseValidationErrors parses validator.ValidationErrors into our custom format
func ParseValidationErrors(err error, obj interface{}) *ValidationErrors {
	var validationErrors []ValidationError

	if ve, ok := err.(validator.ValidationErrors); ok {
		for _, fe := range ve {
			fieldName := getJSONFieldName(obj, fe.StructField())
			validationErrors = append(validationErrors, ValidationError{
				Field:   fieldName,
				Message: getErrorMessage(fe),
				Tag:     fe.Tag(),
				Value:   fmt.Sprintf("%v", fe.Value()),
			})
		}
	} else {
		// Generic parsing error
		validationErrors = append(validationErrors, ValidationError{
			Field:   "body",
			Message: "Invalid JSON format or missing required fields",
			Tag:     "json",
		})
	}

	return &ValidationErrors{Errors: validationErrors}
}

// getJSONFieldName gets the JSON tag name for a struct field
func getJSONFieldName(obj interface{}, fieldName string) string {
	if obj == nil {
		return toSnakeCase(fieldName)
	}

	t := reflect.TypeOf(obj)
	if t.Kind() == reflect.Ptr {
		t = t.Elem()
	}

	if t.Kind() != reflect.Struct {
		return toSnakeCase(fieldName)
	}

	field, found := t.FieldByName(fieldName)
	if !found {
		return toSnakeCase(fieldName)
	}

	jsonTag := field.Tag.Get("json")
	if jsonTag == "" || jsonTag == "-" {
		return toSnakeCase(fieldName)
	}

	// Handle json tag with options like `json:"name,omitempty"`
	parts := strings.Split(jsonTag, ",")
	return parts[0]
}

// getErrorMessage returns a human-readable error message for validation tag
func getErrorMessage(fe validator.FieldError) string {
	field := fe.Field()
	param := fe.Param()

	switch fe.Tag() {
	case "required":
		return fmt.Sprintf("%s wajib diisi", field)
	case "email":
		return "Format email tidak valid"
	case "min":
		if fe.Kind() == reflect.String {
			return fmt.Sprintf("%s minimal %s karakter", field, param)
		}
		return fmt.Sprintf("%s minimal %s", field, param)
	case "max":
		if fe.Kind() == reflect.String {
			return fmt.Sprintf("%s maksimal %s karakter", field, param)
		}
		return fmt.Sprintf("%s maksimal %s", field, param)
	case "oneof":
		return fmt.Sprintf("%s harus salah satu dari: %s", field, param)
	case "uuid":
		return fmt.Sprintf("%s harus berformat UUID yang valid", field)
	case "url":
		return fmt.Sprintf("%s harus berformat URL yang valid", field)
	case "numeric":
		return fmt.Sprintf("%s harus berupa angka", field)
	case "alphanum":
		return fmt.Sprintf("%s hanya boleh berisi huruf dan angka", field)
	case "gt":
		return fmt.Sprintf("%s harus lebih besar dari %s", field, param)
	case "gte":
		return fmt.Sprintf("%s harus lebih besar atau sama dengan %s", field, param)
	case "lt":
		return fmt.Sprintf("%s harus lebih kecil dari %s", field, param)
	case "lte":
		return fmt.Sprintf("%s harus lebih kecil atau sama dengan %s", field, param)
	case "len":
		return fmt.Sprintf("%s harus memiliki panjang %s", field, param)
	case "datetime":
		return fmt.Sprintf("%s harus berformat tanggal yang valid", field)
	default:
		return fmt.Sprintf("%s tidak valid", field)
	}
}

// toSnakeCase converts CamelCase to snake_case
func toSnakeCase(s string) string {
	var result strings.Builder
	for i, r := range s {
		if i > 0 && r >= 'A' && r <= 'Z' {
			result.WriteRune('_')
		}
		result.WriteRune(r)
	}
	return strings.ToLower(result.String())
}
