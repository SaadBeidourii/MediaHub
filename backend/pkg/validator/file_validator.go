package validator

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"strings"

	"github.com/gabriel-vasile/mimetype"
)

const (
	// MaxPDFSize defines the maximum allowed size for PDF uploads (10MB)
	MaxPDFSize int64 = 10 * 1024 * 1024
)

var (
	// ErrFileTooLarge is returned when the file exceeds the maximum allowed size
	ErrFileTooLarge = errors.New("file too large")
	// ErrInvalidFileType is returned when the file type is not allowed
	ErrInvalidFileType = errors.New("invalid file type")
	// ErrEmptyFile is returned when an empty file is uploaded
	ErrEmptyFile = errors.New("empty file")
)

// IsPDF checks if a file is a valid PDF by examining its content
func IsPDF(file multipart.File) (bool, error) {
	// Reset file to beginning
	fmt.Printf("Checking if file is PDF...\n")
	if seeker, ok := file.(io.Seeker); ok {
		_, err := seeker.Seek(0, io.SeekStart)
		if err != nil {
			return false, err
		}
	}

	// Read the first 512 bytes of the file to detect the content type
	fmt.Printf("Reading file content...\n")
	buffer := make([]byte, 512)
	_, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return false, err
	}

	// Reset file again
	if seeker, ok := file.(io.Seeker); ok {
		_, err := seeker.Seek(0, io.SeekStart)
		if err != nil {
			return false, err
		}
	}

	// Check mime type using mimetype library for more reliable detection
	mime, err := mimetype.DetectReader(file)
	if err != nil {
		return false, err
	}

	// Reset file again
	if seeker, ok := file.(io.Seeker); ok {
		_, err := seeker.Seek(0, io.SeekStart)
		if err != nil {
			return false, err
		}
	}

	fmt.Printf("Detected MIME type: %s\n", mime.String())

	// Check if the file is a PDF
	return mime.String() == "application/pdf" ||
		strings.HasPrefix(mime.String(), "application/pdf"), nil
}

// ValidatePDFFile validates a file for PDF upload
func ValidatePDFFile(fileHeader *multipart.FileHeader) error {
	// Check if file is empty
	if fileHeader.Size == 0 {
		return ErrEmptyFile
	}

	// Check file size
	if fileHeader.Size > MaxPDFSize {
		return ErrFileTooLarge
	}

	// Open the file
	file, err := fileHeader.Open()
	if err != nil {
		return err
	}
	defer file.Close()

	fmt.Printf("File name: %s\n", fileHeader.Filename)

	// Validate is PDF
	isPDF, err := IsPDF(file)
	if err != nil {
		return err
	}

	if !isPDF {
		return ErrInvalidFileType
	}

	return nil
}
