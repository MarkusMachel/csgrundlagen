package main

import (
	"errors"
	"fmt"
)

type MyErr struct{}

func (*MyErr) Error() string { return "my error" }

func find() error {
	var p *MyErr = nil
	return p
}

func main() {
	err := find()
	fmt.Println(err == nil)
	wrapped := fmt.Errorf("lookup: %w", errors.New("not found"))
	fmt.Println(wrapped)
}
