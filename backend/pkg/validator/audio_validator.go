package validator

import (
	"errors"
	"io"
	"mime/multipart"
	"strings"

	"github.com/gabriel-vasile/mimetype"
)

const (
	// MaxAudioSize defines the maximum allowed size for audio uploads (30MB)
	MaxAudioSize int64 = 30 * 1024 * 1024
)

var (
	// ErrInvalidAudio is returned when the file is not a valid audio file
	ErrInvalidAudio = errors.New("invalid audio file")

	// List of allowed audio MIME types
	allowedAudioMimeTypes = []string{
		"audio/mpeg",     // MP3
		"audio/mp3",      // MP3 (alternative)
		"audio/mp4",      // M4A
		"audio/wav",      // WAV
		"audio/x-wav",    // WAV (alternative)
		"audio/vnd.wave", // WAV (alternative)
		"audio/ogg",      // OGG
		"audio/flac",     // FLAC
		"audio/x-flac",   // FLAC (alternative)
		"audio/aac",      // AAC
		"audio/x-m4a",    // M4A (alternative)
		"audio/webm",     // WEBM audio
	}
)

// IsAudio checks if a file is a valid audio file by examining its content
func IsAudio(file multipart.File) (bool, error) {
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

	// Check if the file's MIME type is in our list of allowed audio types
	mimeStr := mime.String()
	for _, allowedType := range allowedAudioMimeTypes {
		if strings.HasPrefix(mimeStr, allowedType) {
			return true, nil
		}
	}

	// Also check file extension for common audio extensions
	ext := strings.ToLower(mime.Extension())
	switch ext {
	case ".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a", ".webm":
		return true, nil
	}

	return false, nil
}

// ValidateAudioFile validates a file for audio upload
func ValidateAudioFile(fileHeader *multipart.FileHeader) error {
	// Check if file is empty
	if fileHeader.Size == 0 {
		return ErrEmptyFile
	}

	// Check file size
	if fileHeader.Size > MaxAudioSize {
		return ErrFileTooLarge
	}

	// Open the file
	file, err := fileHeader.Open()
	if err != nil {
		return err
	}
	defer file.Close()

	// Validate is audio
	isAudio, err := IsAudio(file)
	if err != nil {
		return err
	}

	if !isAudio {
		return ErrInvalidFileType
	}

	return nil
}
