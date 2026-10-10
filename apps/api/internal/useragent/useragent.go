// Package useragent turns a User-Agent header into the browser, operating
// system and device type shown in the device lists. It recognises the common
// browsers and platforms only; anything else reads as "Unknown".
package useragent

import (
	"regexp"
	"strings"
)

// Info is the parsed form of a User-Agent header.
type Info struct {
	Browser string `json:"browser"` // e.g. "Chrome 129"
	OS      string `json:"os"`      // e.g. "macOS 10.15", "Android 14"
	Device  string `json:"device"`  // desktop, mobile, tablet or bot
}

type rule struct {
	name string
	re   *regexp.Regexp
}

// Order matters: Edge, Opera and Samsung Internet also claim to be Chrome,
// and Chrome claims to be Safari.
var browsers = []rule{
	{"Edge", regexp.MustCompile(`Edg(?:e|A|iOS)?/(\d+)`)},
	{"Opera", regexp.MustCompile(`(?:OPR|Opera)/(\d+)`)},
	{"Samsung Internet", regexp.MustCompile(`SamsungBrowser/(\d+)`)},
	{"Firefox", regexp.MustCompile(`(?:Firefox|FxiOS)/(\d+)`)},
	{"Chrome", regexp.MustCompile(`(?:Chrome|CriOS)/(\d+)`)},
	{"Safari", regexp.MustCompile(`Version/(\d+(?:\.\d+)?).*Safari/`)},
	{"curl", regexp.MustCompile(`^curl/(\d+(?:\.\d+)?)`)},
}

var (
	iosVersion     = regexp.MustCompile(`OS (\d+)[_.](\d+)`)
	androidVersion = regexp.MustCompile(`Android (\d+(?:\.\d+)?)`)
	macVersion     = regexp.MustCompile(`Mac OS X (\d+)[_.](\d+)`)
	botPattern     = regexp.MustCompile(`(?i)bot|crawler|spider|headless`)
)

var windowsVersions = map[string]string{
	"10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7",
}

// Parse never fails; unknown parts are reported as "Unknown".
func Parse(ua string) Info {
	info := Info{Browser: "Unknown", OS: "Unknown", Device: "desktop"}
	if ua == "" {
		return info
	}
	for _, b := range browsers {
		if m := b.re.FindStringSubmatch(ua); m != nil {
			info.Browser = b.name + " " + m[1]
			break
		}
	}

	switch {
	case strings.Contains(ua, "iPad"):
		info.OS, info.Device = "iPadOS"+version(iosVersion, ua), "tablet"
	case strings.Contains(ua, "iPhone") || strings.Contains(ua, "iPod"):
		info.OS, info.Device = "iOS"+version(iosVersion, ua), "mobile"
	case strings.Contains(ua, "Android"):
		info.OS = "Android"
		if m := androidVersion.FindStringSubmatch(ua); m != nil {
			info.OS += " " + m[1]
		}
		// Android tablets leave "Mobile" out of the UA.
		info.Device = "tablet"
		if strings.Contains(ua, "Mobile") {
			info.Device = "mobile"
		}
	case strings.Contains(ua, "Windows NT"):
		info.OS = "Windows"
		for nt, name := range windowsVersions {
			if strings.Contains(ua, "Windows NT "+nt) {
				info.OS += " " + name
			}
		}
	case strings.Contains(ua, "Mac OS X"):
		info.OS = "macOS" + version(macVersion, ua)
	case strings.Contains(ua, "CrOS"):
		info.OS = "ChromeOS"
	case strings.Contains(ua, "Linux"):
		info.OS = "Linux"
	}

	if botPattern.MatchString(ua) || strings.HasPrefix(info.Browser, "curl") {
		info.Device = "bot"
	}
	return info
}

// version formats a "major_minor" match as " major.minor", or "" if absent.
func version(re *regexp.Regexp, ua string) string {
	if m := re.FindStringSubmatch(ua); m != nil {
		return " " + m[1] + "." + m[2]
	}
	return ""
}
