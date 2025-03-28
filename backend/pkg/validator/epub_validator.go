package validator

import (
	"errors"
	"io"
	"mime/multipart"
	"strings"

	"github.com/gabriel-vasile/mimetype"
)

const (
	MaxEPUBSize int64 = 20 * 1024 * 1024
)

var (
	ErrInvalidEPUB = errors.New("invalid EPUB file")
)

func IsEPUB(file multipart.File) (bool, error) {
	// Reset file to beginning
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

	// Check if the file is an EPUB (application/epub+zip)
	// Some systems might recognize it as "application/octet-stream" or "application/zip"
	mimeStr := mime.String()
	return mimeStr == "application/epub+zip" ||
		strings.HasSuffix(mimeStr, "epub+zip") ||
		(mimeStr == "application/zip" && strings.HasSuffix(strings.ToLower(mime.Extension()), ".epub")), nil
}

// ValidateEPUBFile validates a file for EPUB upload
func ValidateEPUBFile(fileHeader *multipart.FileHeader) error {
	// Check if file is empty
	if fileHeader.Size == 0 {
		return ErrEmptyFile
	}

	// Check file size
	if fileHeader.Size > MaxEPUBSize {
		return ErrFileTooLarge
	}

	// Open the file
	file, err := fileHeader.Open()
	if err != nil {
		return err
	}
	defer file.Close()

	// Validate is EPUB
	isEPUB, err := IsEPUB(file)
	if err != nil {
		return err
	}

	if !isEPUB {
		return ErrInvalidFileType
	}

	return nil
}
