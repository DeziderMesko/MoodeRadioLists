package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
)

func main() {
	list := loadWWRadio("./ww-radio/content/stations/cz.json")

	for _, radio := range list.Cz {
		fmt.Println(radio.Name)
	}

}

type WWRadio struct {
	Name        string `json:"name"`
	Image       string `json:"image"`
	SiteURL     string `json:"site_url"`
	RadioURL    string `json:"radio_url"`
	Description string `json:"description"`
}
type WWRadioList struct {
	Cz []WWRadio `json:"cz"`
}

func loadWWRadio(fileName string) WWRadioList {
	// read file
	data, err := ioutil.ReadFile(fileName)
	if err != nil {
		fmt.Print(err)
	}

	var wwRadioList WWRadioList
	// unmarshall it
	err = json.Unmarshal(data, &wwRadioList)
	if err != nil {
		fmt.Println("error:", err)
	}
	return wwRadioList
}
