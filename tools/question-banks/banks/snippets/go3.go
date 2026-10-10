package main

import "fmt"

func main() {
	var m map[string]int
	fmt.Println(m["missing"], len(m), m == nil)
	fmt.Println(len("héllo"), len([]rune("héllo")))
}
