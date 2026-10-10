package useragent

import "testing"

func TestParse(t *testing.T) {
	cases := []struct {
		ua   string
		want Info
	}{
		{"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
			Info{"Chrome 129", "macOS 10.15", "desktop"}},
		{"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.2792.79",
			Info{"Edge 129", "Windows 10/11", "desktop"}},
		{"Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0",
			Info{"Firefox 131", "Linux", "desktop"}},
		{"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
			Info{"Safari 18.0", "iOS 18.0", "mobile"}},
		{"Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0 Mobile/15E148 Safari/604.1",
			Info{"Chrome 129", "iPadOS 17.5", "tablet"}},
		{"Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36",
			Info{"Samsung Internet 26", "Android 14", "mobile"}},
		{"Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
			Info{"Chrome 129", "Android 13", "tablet"}},
		{"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/129.0.0.0 Safari/537.36",
			Info{"Chrome 129", "Linux", "bot"}},
		{"curl/8.5.0", Info{"curl 8.5", "Unknown", "bot"}},
		{"", Info{"Unknown", "Unknown", "desktop"}},
	}
	for _, c := range cases {
		if got := Parse(c.ua); got != c.want {
			t.Errorf("Parse(%q)\n got  %+v\n want %+v", c.ua, got, c.want)
		}
	}
}
