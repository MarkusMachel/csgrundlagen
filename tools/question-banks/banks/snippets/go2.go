package main

import "fmt"

func main() {
	s := []int{1, 2, 3}
	t := s[:2]
	t = append(t, 99)
	fmt.Println(s, t)
}
