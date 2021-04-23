package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

func main() {
	country := "cz"
	list := loadWWRadio(fmt.Sprintf("./ww-radio/content/stations/%s.json", country), country)
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
	Country []WWRadio `json:"country"`
}

func loadWWRadio(fileName string, country string) WWRadioList {
	data, err := ioutil.ReadFile(fileName)
	if err != nil {
		fmt.Print(err)
	}

	data = bytes.Replace(data, []byte(country), []byte("country"), 1)

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
	os.Mkdir(dir, os.ModeDir)
	logoDir := filepath.Join(dir, "radio-logos")
	os.Mkdir(logoDir, os.ModeDir)
	os.Mkdir(filepath.Join(logoDir, "thumbs"), os.ModeDir)

	for idx, radio := range wwRadioList.Country {

		station := Station{
			ID:       int64(idx + 1),
			Name:     radio.Name,
			HomePage: radio.SiteURL,
			Station:  radio.RadioURL,
			Logo:     "local",
		}

		mr.Stations = append(mr.Stations, station)
		err := saveLogo(logoDir, radio.Image, radio.Name)
		if err != nil {
			fmt.Println("Error saving radio name: ", radio.Name, err)
		}
		time.Sleep(50)
	}

	result, err := mr.Marshal()
	if err != nil {
		fmt.Print(err)
	}

	ioutil.WriteFile(filepath.Join(dir, "station_data.json"), result, os.ModePerm)

}

func saveLogo(logoDir, wwrName, MoodeName string) error {
	imagesURL := "https://www.s3blog.org/s3radio-files/stations/cz/"
	err := os.Chdir(logoDir)

	if Exists(MoodeName + ".png") {
		fmt.Print("x")
		return nil
	}

	fmt.Print(".")
	response, err := http.Get(imagesURL + wwrName)
	if err != nil {
		return err
	}
	defer response.Body.Close()

	if response.StatusCode != 200 {
		return errors.New("Received non 200 response code")
	}
	//Create a empty file
	file, err := os.Create(MoodeName + ".png")
	if err != nil {
		return err
	}
	defer file.Close()

	//Write the bytes to the fiel
	_, err = io.Copy(file, response.Body)
	if err != nil {
		return err
	}

	return nil

}

func Exists(name string) bool {
	if _, err := os.Stat(name); err != nil {
		if os.IsNotExist(err) {
			return false
		}
	}
	return true
}
