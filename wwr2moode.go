package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"image/jpeg"
	"image/png"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/disintegration/imaging"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Println("Use country code as a parameter")
	}
	countryCode := os.Args[1]

	if countryCode == "all" {
		files, err := ioutil.ReadDir("./ww-radio/content/stations/")
		if err != nil {
			log.Fatal(err)
		}
		for _, f := range files {
			countryCode = strings.Replace(f.Name(), ".json", "", -1)
			fmt.Println()
			fmt.Println(countryCode)
			list := loadWWRadio(fmt.Sprintf("./ww-radio/content/stations/%s.json", countryCode), countryCode)
			writeMoodeRadio(countryCode+"-output", countryCode, list)
		}
	} else {
		list := loadWWRadio(fmt.Sprintf("./ww-radio/content/stations/%s.json", countryCode), countryCode)
		writeMoodeRadio(countryCode+"-output", countryCode, list)
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

func writeMoodeRadio(outputDir, countryCode string, wwRadioList WWRadioList) {
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

	os.Mkdir(outputDir, os.ModeDir)
	rootDir, _ := os.Getwd()

	for idx, radio := range wwRadioList.Country {

		station := Station{
			ID:       int64(idx + 1),
			Name:     radio.Name,
			HomePage: radio.SiteURL,
			Station:  radio.RadioURL,
			Logo:     "local",
			Type:     "r",
		}

		mr.Stations = append(mr.Stations, station)
		err := saveLogo(outputDir, radio.Image, countryCode, radio.Name)
		if err != nil {
			fmt.Println("Error saving radio logo: ", radio.Name, err)
		}
	}

	result, err := mr.Marshal()
	if err != nil {
		fmt.Print(err)
	}
	os.Chdir(rootDir)
	ioutil.WriteFile(filepath.Join(outputDir, "station_data.json"), result, os.ModePerm)

}

func saveLogo(targetDir, wwrName, countryCode, MoodeName string) error {
	if countryCode == "us_2" {
		countryCode = "us"
	}
	imagesURL := fmt.Sprintf("https://www.s3blog.org/s3radio-files/stations/%s/", countryCode)
	jpegFileName := MoodeName + ".jpg"
	logoDir := filepath.Join(targetDir, "radio-logos")

	os.Mkdir(logoDir, os.ModeDir)

	err := os.Chdir(logoDir)

	// dont download if you have it
	if FileExists(jpegFileName) {
		fmt.Print("x")
		return nil
	}

	// download
	fmt.Print(".")
	response, err := http.Get(imagesURL + wwrName)
	if err != nil {
		return err
	}
	defer response.Body.Close()

	if response.StatusCode != 200 {
		return errors.New("Received non 200 response code")
	}

	//convert png to jpeg
	pngImage, _ := png.Decode(response.Body)

	scaledImage := imaging.Resize(pngImage, 400, 0, imaging.Lanczos)

	file, err := os.Create(jpegFileName)
	jpeg.Encode(file, scaledImage, nil)
	if err != nil {
		return err
	}
	defer file.Close()

	// save file
	_, err = io.Copy(file, response.Body)
	if err != nil {
		return err
	}

	// copy to thumbnails
	input, err := ioutil.ReadFile(jpegFileName)
	if err != nil {
		return err
	}

	os.Mkdir("thumbs", os.ModeDir)
	err = ioutil.WriteFile(filepath.Join("thumbs", MoodeName+"_sm"+".jpg"), input, 0644)
	if err != nil {
		return err
	}

	return nil
}

func FileExists(name string) bool {
	if _, err := os.Stat(name); err != nil {
		if os.IsNotExist(err) {
			return false
		}
	}
	return true
}
