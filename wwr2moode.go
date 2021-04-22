package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
)

func main() {
	list := loadWWRadio("./ww-radio/content/stations/cz.json")
	writeMoodeRadio("moode-output", list)
}

type WWRadio struct {
	Name        string `json:"name"`
	Image       string `json:"image"`
	SiteURL     string `json:"site_url"`
	RadioURL    string `json:"radio_url"`
	Description string `json:"description"`
}
type WWRadioList struct {
	Country []WWRadio `json:"cz"`
}

func loadWWRadio(fileName string) WWRadioList {
	data, err := ioutil.ReadFile(fileName)
	if err != nil {
		fmt.Print(err)
	}

	var wwRadioList WWRadioList
	err = json.Unmarshal(data, &wwRadioList)
	if err != nil {
		fmt.Println("error:", err)
	}
	return wwRadioList
}

type MoodeRadio struct {
	Fields   []string  `json:"fields"`
	Stations []Station `json:"stations"`
}

type Station struct {
	ID          int64  `json:"id"`
	Station     string `json:"station"`
	Name        string `json:"name"`
	Type        string `json:"type"`
	Logo        string `json:"logo"`
	Genre       string `json:"genre"`
	Broadcaster string `json:"broadcaster"`
	Language    string `json:"language"`
	Country     string `json:"country"`
	Region      string `json:"region"`
	Bitrate     string `json:"bitrate"`
	Format      string `json:"format"`
	GeoFenced   string `json:"geo_fenced"`
	HomePage    string `json:"home_page"`
	Reserved2   string `json:"reserved2"`
}

func (r *MoodeRadio) Marshal() ([]byte, error) {
	return json.MarshalIndent(r, "", "    ")
}

func writeMoodeRadio(dir string, wwRadioList WWRadioList) {
	var mr = &MoodeRadio{
		Fields: []string{
			"id",
			"station",
			"name",
			"type",
			"logo",
			"genre",
			"broadcaster",
			"language",
			"country",
			"region",
			"bitrate",
			"format",
			"geo_fenced",
			"home_page",
			"reserved2",
		},
		Stations: []Station{},
	}

	for idx, radio := range wwRadioList.Country {
		station := Station{
			ID:       int64(idx + 1),
			Name:     radio.Name,
			HomePage: radio.SiteURL,
			Station:  radio.RadioURL,
			Logo:     "local",
		}

		mr.Stations = append(mr.Stations, station)

	}

	result, err := mr.Marshal()
	if err != nil {
		fmt.Print(err)
	}
	os.Mkdir(dir, os.ModeDir)
	os.Mkdir(filepath.Join(dir, "radio-logos"), os.ModeDir)
	os.Mkdir(filepath.Join(dir, "radio-logos", "thumbs"), os.ModeDir)
	ioutil.WriteFile(filepath.Join(dir, "station_data.json"), result, os.ModePerm)

}
