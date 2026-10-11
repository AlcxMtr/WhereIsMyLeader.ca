export interface Trip {
    id: number;
    city: string;
    coords: [number, number];
    arrival: string;
    departure: string;
    desc: string;
    summary: string;
    citations: string[];
}

export const trips: Trip[] = [
    {
        id: 1,
        city: "Toronto, Ontario, Canada",
        coords: [43.6532, -79.3832],
        arrival: "2025-05-01",
        departure: "2025-05-06",
        desc: "",
        summary: "Home",
        citations: []
    },
    {
        id: 2,
        city: "Abu Dhabi, UAE",
        coords: [24.4539, 54.3773],
        arrival: "2025-05-07",
        departure: "2025-05-08",
        desc: "",
        summary: "Quick Layover",
        citations: []
    },
    {
        id: 3,
        city: "Dubai, UAE",
        coords: [25.2048, 55.2708],
        arrival: "2025-05-07",
        departure: "2025-05-07",
        desc: "",
        summary: "Drove here from Abu Dhabi and drove around",
        citations: []
    },
    {
        id: 4,
        city: "Jakarta, Indonesia",
        coords: [-6.2088, 106.8456],
        arrival: "2025-05-08",
        departure: "2025-05-10",
        desc: "",
        summary: "The megacity and capital of Indonesia",
        citations: []
    },
    {
        id: 5,
        city: "Yogyakarta, Indonesia",
        coords: [-7.7956, 110.3695],
        arrival: "2025-05-10",
        departure: "2025-05-12",
        desc: "",
        summary: "The cultural capital of Java",
        citations: []
    },
    {
        id: 6,
        city: "Surabaya, East Java, Indonesia",
        coords: [-7.2575, 112.7521],
        arrival: "2025-05-12",
        departure: "2025-05-13",
        desc: "",
        summary: "Second largest city",
        citations: []
    },
    {
        id: 7,
        city: "Kuta, Bali, Indonesia",
        coords: [-8.7233, 115.1723],
        arrival: "2025-05-13",
        departure: "2025-05-15",
        desc: "",
        summary: "Too many drunk Australians",
        citations: []
    },
    {
        id: 8,
        city: "Singapore, Singapore",
        coords: [1.3521, 103.8198],
        arrival: "2025-05-15",
        departure: "2025-05-17",
        desc: "",
        summary: "Expensive and boring",
        citations: []
    },
    {
        id: 9,
        city: "Johor Bahru, Johor, Malaysia",
        coords: [1.4927, 103.7414],
        arrival: "2025-05-17",
        departure: "2025-05-18",
        desc: "",
        summary: "Cheap!!",
        citations: []
    },
    {
        id: 10,
        city: "Malacca, Malacca, Malaysia",
        coords: [2.1896, 102.2501],
        arrival: "2025-05-18",
        departure: "2025-05-19",
        desc: "",
        summary: "Lots of history",
        citations: []
    },
    {
        id: 11,
        city: "Kuala Lumpur, Malaysia",
        coords: [3.139, 101.6869],
        arrival: "2025-05-19",
        departure: "2025-05-21",
        desc: "",
        summary: "This place is car dependent. Thanks Petronas and Proton/Perodua!",
        citations: []
    },
    {
        id: 12,
        city: "George Town, Penang, Malaysia",
        coords: [5.4141, 100.3288],
        arrival: "2025-05-21",
        departure: "2025-05-23",
        desc: "",
        summary: "More history and Chinese",
        citations: []
    },
    {
        id: 13,
        city: "Phuket, Thailand",
        coords: [7.8804, 98.3923],
        arrival: "2025-05-23",
        departure: "2025-05-25",
        desc: "",
        summary: "Comfortable resort island",
        citations: []
    },
    {
        id: 14,
        city: "Chiang Mai, Thailand",
        coords: [18.7883, 98.9853],
        arrival: "2025-05-25",
        departure: "2025-05-26",
        desc: "",
        summary: "Northern Thai",
        citations: []
    },
    {
        id: 15,
        city: "Pattaya, Thailand",
        coords: [12.9276, 100.8771],
        arrival: "2025-05-26",
        departure: "2025-05-27",
        desc: "",
        summary: "Prostitution!",
        citations: []
    },
    {
        id: 16,
        city: "Bangkok, Thailand",
        coords: [13.7563, 100.5018],
        arrival: "2025-05-27",
        departure: "2025-05-30",
        desc: "",
        summary: "Amazing place, globalized, convenient",
        citations: []
    },
    {
        id: 17,
        city: "Siem Reap, Cambodia",
        coords: [13.3671, 103.8448],
        arrival: "2025-05-30",
        departure: "2025-06-01",
        desc: "",
        summary: "Angkor Wat",
        citations: []
    },
    {
        id: 18,
        city: "Phnom Penh, Cambodia",
        coords: [11.5564, 104.9282],
        arrival: "2025-06-01",
        departure: "2025-06-03",
        desc: "",
        summary: "The capital with gigantic wealth gaps",
        citations: []
    },
    {
        id: 19,
        city: "Ho Chi Minh City, Vietnam",
        coords: [10.8231, 106.6297],
        arrival: "2025-06-03",
        departure: "2025-06-05",
        desc: "",
        summary: "This place is place to make money in Vietnam",
        citations: []
    },
    {
        id: 20,
        city: "Hue, Vietnam",
        coords: [16.4637, 107.5909],
        arrival: "2025-06-05",
        departure: "2025-06-06",
        desc: "",
        summary: "The old imperial capital",
        citations: []
    },
    {
        id: 21,
        city: "Da Nang, Vietnam",
        coords: [16.0544, 108.2022],
        arrival: "2025-06-06",
        departure: "2025-06-07",
        desc: "",
        summary: "Lots of Koreans here",
        citations: []
    },
    {
        id: 22,
        city: "Hoi An, Vietnam",
        coords: [15.8801, 108.338],
        arrival: "2025-06-07",
        departure: "2025-06-08",
        desc: "",
        summary: "A \"cute touristy\" town",
        citations: []
    },
    {
        id: 23,
        city: "Hanoi, Vietnam",
        coords: [21.0285, 105.8542],
        arrival: "2025-06-08",
        departure: "2025-06-10",
        desc: "",
        summary: "The capital! Fun!",
        citations: []
    },
    {
        id: 24,
        city: "Macau, China",
        coords: [22.1987, 113.5439],
        arrival: "2025-06-10",
        departure: "2025-06-11",
        desc: "",
        summary: "Casinos",
        citations: []
    },
    {
        id: 25,
        city: "Hong Kong, China",
        coords: [22.3193, 114.1694],
        arrival: "2025-06-11",
        departure: "2025-06-13",
        desc: "",
        summary: "I miss the old Hong Kong",
        citations: []
    },
    {
        id: 26,
        city: "Shenzhen, Guangdong, China",
        coords: [22.5431, 114.0579],
        arrival: "2025-06-13",
        departure: "2025-06-14",
        desc: "",
        summary: "There's nothing to do here except make money",
        citations: []
    },
    {
        id: 27,
        city: "Guangzhou, Guangdong, China",
        coords: [23.1291, 113.2644],
        arrival: "2025-06-14",
        departure: "2025-06-17",
        desc: "",
        summary: "I love Canto food",
        citations: []
    },
    {
        id: 28,
        city: "Quanzhou, Fujian, China",
        coords: [24.8741, 118.6757],
        arrival: "2025-06-17",
        departure: "2025-06-17",
        desc: "",
        summary: "Most people in Taiwan trace their ancestry to here",
        citations: []
    },
    {
        id: 29,
        city: "Xiamen, Fujian, China",
        coords: [24.4798, 118.0894],
        arrival: "2025-06-17",
        departure: "2025-06-19",
        desc: "",
        summary: "Amoy, historic port",
        citations: []
    },
    {
        id: 30,
        city: "Kinmen, Fukien, Taiwan",
        coords: [24.4493, 118.3766],
        arrival: "2025-06-19",
        departure: "2025-06-20",
        desc: "",
        summary: "Part of Fukien Province, Republic of China",
        citations: []
    },
    {
        id: 31,
        city: "Kaohsiung, Taiwan",
        coords: [22.6273, 120.3014],
        arrival: "2025-06-20",
        departure: "2025-06-20",
        desc: "",
        summary: "Industrial City",
        citations: []
    },
    {
        id: 32,
        city: "Tainan, Taiwan",
        coords: [22.9997, 120.227],
        arrival: "2025-06-20",
        departure: "2025-06-21",
        desc: "",
        summary: "Amazing, historic place",
        citations: []
    },
    {
        id: 33,
        city: "Taipei, Taiwan",
        coords: [25.033, 121.5654],
        arrival: "2025-06-21",
        departure: "2025-06-25",
        desc: "",
        summary: "Taiwan is amazing",
        citations: []
    },
    {
        id: 34,
        city: "Shanghai, China",
        coords: [31.2304, 121.4737],
        arrival: "2025-06-25",
        departure: "2025-06-28",
        desc: "",
        summary: "The motherland",
        citations: []
    },
    {
        id: 35,
        city: "Hangzhou, Zhejiang, China",
        coords: [30.2741, 120.1551],
        arrival: "2025-06-28",
        departure: "2025-06-28",
        desc: "",
        summary: "I'm not sure what's so interesting here",
        citations: []
    },
    {
        id: 36,
        city: "Suzhou, Jiangsu, China",
        coords: [31.299, 120.5853],
        arrival: "2025-06-29",
        departure: "2025-06-30",
        desc: "",
        summary: "The original centre of Wu culture",
        citations: []
    },
    {
        id: 37,
        city: "Nanjing, Jiangsu, China",
        coords: [32.0603, 118.7969],
        arrival: "2025-06-30",
        departure: "2025-07-01",
        desc: "",
        summary: "The former capital",
        citations: []
    },
    {
        id: 38,
        city: "Qingdao, Shandong, China",
        coords: [36.0671, 120.3826],
        arrival: "2025-07-01",
        departure: "2025-07-03",
        desc: "",
        summary: "Very well preserved German area",
        citations: []
    },
    {
        id: 39,
        city: "Seoul, South Korea",
        coords: [37.5665, 126.978],
        arrival: "2025-07-03",
        departure: "2025-07-07",
        desc: "",
        summary: "The capital. Many tourists",
        citations: []
    },
    {
        id: 40,
        city: "Jeju, South Korea",
        coords: [33.4996, 126.5312],
        arrival: "2025-07-07",
        departure: "2025-07-08",
        desc: "",
        summary: "Not great if you don't like resorts",
        citations: []
    },
    {
        id: 41,
        city: "Gyeongju, South Korea",
        coords: [35.8562, 129.2247],
        arrival: "2025-07-08",
        departure: "2025-07-09",
        desc: "",
        summary: "Historic city",
        citations: []
    },
    {
        id: 42,
        city: "Busan, South Korea",
        coords: [35.1796, 129.0756],
        arrival: "2025-07-09",
        departure: "2025-07-10",
        desc: "",
        summary: "Hills!",
        citations: []
    },
    {
        id: 43,
        city: "Fukuoka, Japan",
        coords: [33.5904, 130.4017],
        arrival: "2025-07-10",
        departure: "2025-07-11",
        desc: "",
        summary: "A place for shopping",
        citations: []
    },
    {
        id: 44,
        city: "Nagasaki, Japan",
        coords: [32.7503, 129.8779],
        arrival: "2025-07-11",
        departure: "2025-07-13",
        desc: "",
        summary: "Historic!",
        citations: []
    },
    {
        id: 45,
        city: "Hiroshima, Japan",
        coords: [34.3853, 132.4553],
        arrival: "2025-07-13",
        departure: "2025-07-14",
        desc: "",
        summary: "Also bombed",
        citations: []
    },
    {
        id: 46,
        city: "Osaka, Japan",
        coords: [34.6937, 135.5023],
        arrival: "2025-07-14",
        departure: "2025-07-16",
        desc: "",
        summary: "A place for shopping",
        citations: []
    },
    {
        id: 47,
        city: "Kyoto, Japan",
        coords: [35.0116, 135.7681],
        arrival: "2025-07-16",
        departure: "2025-07-18",
        desc: "",
        summary: "Historic capital",
        citations: []
    },
    {
        id: 48,
        city: "Nara, Japan",
        coords: [34.6851, 135.8048],
        arrival: "2025-07-18",
        departure: "2025-07-18",
        desc: "",
        summary: "Aggressive deer",
        citations: []
    },
    {
        id: 49,
        city: "Nagoya, Japan",
        coords: [35.1815, 136.9066],
        arrival: "2025-07-18",
        departure: "2025-07-19",
        desc: "",
        summary: "Automotive industry",
        citations: []
    },
    {
        id: 50,
        city: "Tokyo, Japan",
        coords: [35.6762, 139.6503],
        arrival: "2025-07-19",
        departure: "2025-07-23",
        desc: "",
        summary: "Capital",
        citations: []
    },
    {
        id: 51,
        city: "Sapporo, Japan",
        coords: [43.0618, 141.3545],
        arrival: "2025-07-23",
        departure: "2025-07-24",
        desc: "",
        summary: "Unique",
        citations: []
    },
    {
        id: 52,
        city: "Honolulu, Hawaii, United States",
        coords: [21.3069, -157.8583],
        arrival: "2025-07-24",
        departure: "2025-07-26",
        desc: "",
        summary: "Expensive",
        citations: []
    },
    {
        id: 53,
        city: "Vancouver, British Columbia, Canada",
        coords: [49.2827, -123.1207],
        arrival: "2025-07-27",
        departure: "2025-07-27",
        desc: "",
        summary: "Vancouver",
        citations: []
    },
    {
        id: 54,
        city: "Toronto, Ontario, Canada",
        coords: [43.6532, -79.3832],
        arrival: "2025-07-28",
        departure: "2026-05-10",
        desc: "",
        summary: "Home",
        citations: []
    },
    {
        id: 55,
        city: "Glasgow, Scotland, United Kingdom",
        coords: [55.8642, -4.2518],
        arrival: "2026-05-11",
        departure: "2026-05-11",
        desc: "",
        summary: "Working class",
        citations: []
    },
    {
        id: 56,
        city: "Edinburgh, Scotland, United Kingdom",
        coords: [55.9533, -3.1883],
        arrival: "2026-05-11",
        departure: "2026-05-12",
        desc: "",
        summary: "Scottish capital",
        citations: []
    },
    {
        id: 57,
        city: "York, England, United Kingdom",
        coords: [53.959, -1.0815],
        arrival: "2026-05-12",
        departure: "2026-05-13",
        desc: "",
        summary: "Historic town",
        citations: []
    },
    {
        id: 58,
        city: "Manchester, England, United Kingdom",
        coords: [53.4808, -2.2426],
        arrival: "2026-05-13",
        departure: "2026-05-13",
        desc: "",
        summary: "Medium City",
        citations: []
    },
    {
        id: 59,
        city: "Liverpool, England, United Kingdom",
        coords: [53.4084, -2.9916],
        arrival: "2026-05-13",
        departure: "2026-05-14",
        desc: "",
        summary: "Beatles",
        citations: []
    },
    {
        id: 60,
        city: "Birmingham, England, United Kingdom",
        coords: [52.4862, -1.8904],
        arrival: "2026-05-14",
        departure: "2026-05-15",
        desc: "",
        summary: "Detroit",
        citations: []
    },
    {
        id: 61,
        city: "Oxford, England, United Kingdom",
        coords: [51.752, -1.2577],
        arrival: "2026-05-15",
        departure: "2026-05-15",
        desc: "",
        summary: "University City",
        citations: []
    },
    {
        id: 62,
        city: "London, England, United Kingdom",
        coords: [51.5074, -0.1278],
        arrival: "2026-05-15",
        departure: "2026-05-18",
        desc: "",
        summary: "London!",
        citations: []
    },
    {
        id: 63,
        city: "Tirana, Albania",
        coords: [41.3275, 19.8187],
        arrival: "2026-05-18",
        departure: "2026-05-19",
        desc: "",
        summary: "The capital",
        citations: []
    },
    {
        id: 64,
        city: "Durres, Albania",
        coords: [41.3246, 19.4565],
        arrival: "2026-05-19",
        departure: "2026-05-20",
        desc: "",
        summary: "Seaside",
        citations: []
    },
    {
        id: 65,
        city: "Berat, Albania",
        coords: [40.7086, 19.9525],
        arrival: "2026-05-20",
        departure: "2026-05-21",
        desc: "",
        summary: "Quaint town",
        citations: []
    },
    {
        id: 66,
        city: "Gjirokaster, Albania",
        coords: [40.0758, 20.1388],
        arrival: "2026-05-21",
        departure: "2026-05-22",
        desc: "",
        summary: "More touristy version of Berat",
        citations: []
    },
    {
        id: 67,
        city: "Ohrid, North Macedonia",
        coords: [41.1172, 20.8016],
        arrival: "2026-05-22",
        departure: "2026-05-23",
        desc: "",
        summary: "Tourists!",
        citations: []
    },
    {
        id: 68,
        city: "Skopje, North Macedonia",
        coords: [41.9981, 21.4254],
        arrival: "2026-05-23",
        departure: "2026-05-24",
        desc: "",
        summary: "Everything here is kitsch",
        citations: []
    },
    {
        id: 69,
        city: "Pristina, Kosovo",
        coords: [42.6629, 21.1655],
        arrival: "2026-05-24",
        departure: "2026-05-25",
        desc: "",
        summary: "Capital",
        citations: []
    },
    {
        id: 70,
        city: "Prizren, Kosovo",
        coords: [42.2139, 20.7397],
        arrival: "2026-05-25",
        departure: "2026-05-26",
        desc: "",
        summary: "Tourist area",
        citations: []
    },
    {
        id: 71,
        city: "Shkoder, Albania",
        coords: [42.0693, 19.5033],
        arrival: "2026-05-26",
        departure: "2026-05-27",
        desc: "",
        summary: "Lots of backpackers",
        citations: []
    },
    {
        id: 72,
        city: "Podgorica, Montenegro",
        coords: [42.4304, 19.2594],
        arrival: "2026-05-27",
        departure: "2026-05-27",
        desc: "",
        summary: "Sleepy administrative capital",
        citations: []
    },
    {
        id: 73,
        city: "Cetinje, Montenegro",
        coords: [42.3931, 18.9116],
        arrival: "2026-05-27",
        departure: "2026-05-27",
        desc: "",
        summary: "Old royal capital, president lives here",
        citations: []
    },
    {
        id: 74,
        city: "Budva, Montenegro",
        coords: [42.2911, 18.8403],
        arrival: "2026-05-27",
        departure: "2026-05-28",
        desc: "",
        summary: "Tourists!",
        citations: []
    },
    {
        id: 75,
        city: "Kotor, Montenegro",
        coords: [42.4247, 18.7712],
        arrival: "2026-05-28",
        departure: "2026-05-29",
        desc: "",
        summary: "More tourists!",
        citations: []
    },
    {
        id: 76,
        city: "Dubrovnik, Croatia",
        coords: [42.6507, 18.0944],
        arrival: "2026-05-29",
        departure: "2026-05-30",
        desc: "",
        summary: "Too many tourists!",
        citations: []
    },
    {
        id: 77,
        city: "Split, Croatia",
        coords: [43.5081, 16.4402],
        arrival: "2026-05-30",
        departure: "2026-05-31",
        desc: "",
        summary: "Ah much better, less tourists",
        citations: []
    },
    {
        id: 78,
        city: "Mostar, Bosnia & Herzegovina",
        coords: [43.3438, 17.8078],
        arrival: "2026-05-31",
        departure: "2026-06-01",
        desc: "",
        summary: "Very interesting history",
        citations: []
    },
    {
        id: 79,
        city: "Sarajevo, Bosnia & Herzegovina",
        coords: [43.8563, 18.4131],
        arrival: "2026-06-01",
        departure: "2026-06-02",
        desc: "",
        summary: "Good vibes, more interesting history",
        citations: []
    },
    {
        id: 80,
        city: "Banja Luka, Republic of Srpska, Bosnia & Herzegovina",
        coords: [44.7722, 17.191],
        arrival: "2026-06-02",
        departure: "2026-06-03",
        desc: "",
        summary: "Republic of Srpska",
        citations: []
    },
    {
        id: 81,
        city: "Zagreb, Croatia",
        coords: [45.815, 15.9819],
        arrival: "2026-06-03",
        departure: "2026-06-04",
        desc: "",
        summary: "Capital",
        citations: []
    },
    {
        id: 82,
        city: "Ljubljana, Slovenia",
        coords: [46.0569, 14.5058],
        arrival: "2026-06-04",
        departure: "2026-06-05",
        desc: "",
        summary: "Capital",
        citations: []
    },
    {
        id: 83,
        city: "Trieste, Italy",
        coords: [45.6495, 13.7768],
        arrival: "2026-06-05",
        departure: "2026-06-06",
        desc: "",
        summary: "No tourists! Yay!",
        citations: []
    },
    {
        id: 84,
        city: "Graz, Austria",
        coords: [47.0707, 15.4395],
        arrival: "2026-06-06",
        departure: "2026-06-06",
        desc: "",
        summary: "A town",
        citations: []
    },
    {
        id: 85,
        city: "Vienna, Austria",
        coords: [48.2082, 16.3738],
        arrival: "2026-06-06",
        departure: "2026-06-08",
        desc: "",
        summary: "There's a lot fewer tourists here than I expected",
        citations: []
    },
    {
        id: 86,
        city: "Bratislava, Slovakia",
        coords: [48.1486, 17.1077],
        arrival: "2026-06-08",
        departure: "2026-06-09",
        desc: "",
        summary: "Another capital \"behind the iron curtain\" less than an hour away from Wien",
        citations: []
    },
    {
        id: 87,
        city: "Budapest, Hungary",
        coords: [47.4979, 19.0402],
        arrival: "2026-06-09",
        departure: "2026-06-11",
        desc: "",
        summary: "Very lively place",
        citations: []
    },
    {
        id: 88,
        city: "Szeged, Hungary",
        coords: [46.253, 20.1414],
        arrival: "2026-06-11",
        departure: "2026-06-11",
        desc: "",
        summary: "A town",
        citations: []
    },
    {
        id: 89,
        city: "Novi Sad, Serbia",
        coords: [45.2671, 19.8335],
        arrival: "2026-06-11",
        departure: "2026-06-12",
        desc: "",
        summary: "Capital of Vojvodina",
        citations: []
    },
    {
        id: 90,
        city: "Belgrade, Serbia",
        coords: [44.7866, 20.4489],
        arrival: "2026-06-12",
        departure: "2026-06-14",
        desc: "",
        summary: "interesting place and former federal capital",
        citations: []
    },
    {
        id: 91,
        city: "Sofia, Bulgaria",
        coords: [42.6977, 23.3219],
        arrival: "2026-06-14",
        departure: "2026-06-15",
        desc: "",
        summary: "Capital",
        citations: []
    },
    {
        id: 92,
        city: "Thessaloniki, Greece",
        coords: [40.6401, 22.9444],
        arrival: "2026-06-15",
        departure: "2026-06-16",
        desc: "",
        summary: "Second largest city and few tourists",
        citations: []
    },
    {
        id: 93,
        city: "Bucharest, Romania",
        coords: [44.4268, 26.1025],
        arrival: "2026-06-16",
        departure: "2026-06-17",
        desc: "",
        summary: "Very car oriented",
        citations: []
    },
    {
        id: 94,
        city: "Chisinau, Moldova",
        coords: [47.0105, 28.8638],
        arrival: "2026-06-17",
        departure: "2026-06-18",
        desc: "",
        summary: "No tourists",
        citations: []
    },
    {
        id: 95,
        city: "Tiraspol, Transnistria",
        coords: [46.8403, 29.6433],
        arrival: "2026-06-18",
        departure: "2026-06-18",
        desc: "",
        summary: "Unrecognized country",
        citations: []
    },
    {
        id: 96,
        city: "Brussels, Belgium",
        coords: [50.8503, 4.3517],
        arrival: "2026-06-19",
        departure: "2026-06-20",
        desc: "",
        summary: "Chaotic",
        citations: []
    },
    {
        id: 97,
        city: "Amsterdam, Netherlands",
        coords: [52.3676, 4.9041],
        arrival: "2026-06-20",
        departure: "2026-06-21",
        desc: "",
        summary: "Not much time here",
        citations: []
    },
    {
        id: 98,
        city: "Toronto, Ontario, Canada",
        coords: [43.6532, -79.3832],
        arrival: "2026-06-22",
        departure: "2026-07-13",
        desc: "",
        summary: "Home",
        citations: []
    },
    {
        id: 99,
        city: "Detroit, Michigan",
        coords: [42.3314, -83.0458],
        arrival: "2026-07-14",
        departure: "2026-07-14",
        desc: "",
        summary: "Layover",
        citations: []
    },
    {
        id: 100,
        city: "Shanghai, China",
        coords: [31.2304, 121.4737],
        arrival: "2026-07-15",
        departure: "2026-07-17",
        desc: "",
        summary: "Back in the motherland",
        citations: []
    },
    {
        id: 101,
        city: "Xi'an, Shaanxi, China",
        coords: [34.3416, 108.9398],
        arrival: "2026-07-17",
        departure: "2026-07-19",
        desc: "",
        summary: "Ancient city",
        citations: []
    },
    {
        id: 102,
        city: "Kashgar, Xinjiang, China",
        coords: [39.4677, 75.9898],
        arrival: "2026-07-19",
        departure: "2026-07-21",
        desc: "",
        summary: "Uyghur centre",
        citations: []
    },
    {
        id: 103,
        city: "Urumqi, Xinjiang, China",
        coords: [43.8256, 87.6168],
        arrival: "2026-07-21",
        departure: "2026-07-24",
        desc: "",
        summary: "Majority-han city",
        citations: []
    },
    {
        id: 104,
        city: "Astana, Kazakhstan",
        coords: [51.1694, 71.4491],
        arrival: "2026-07-24",
        departure: "2026-07-25",
        desc: "",
        summary: "Many monuments",
        citations: []
    },
    {
        id: 105,
        city: "Almaty, Kazakhstan",
        coords: [43.222, 76.8512],
        arrival: "2026-07-25",
        departure: "2026-07-27",
        desc: "",
        summary: "Livable place",
        citations: []
    },
    {
        id: 106,
        city: "Bishkek, Kyrgyzstan",
        coords: [42.8746, 74.5698],
        arrival: "2026-07-27",
        departure: "2026-07-28",
        desc: "",
        summary: "Boring",
        citations: []
    },
    {
        id: 107,
        city: "Tashkent, Uzbekistan",
        coords: [41.2995, 69.2401],
        arrival: "2026-07-28",
        departure: "2026-07-30",
        desc: "",
        summary: "Very hot and car-dependent",
        citations: []
    },
    {
        id: 108,
        city: "Samarkand, Uzbekistan",
        coords: [39.6542, 66.9597],
        arrival: "2026-07-30",
        departure: "2026-08-01",
        desc: "",
        summary: "Historic city",
        citations: []
    },
    {
        id: 109,
        city: "Bukhara, Uzbekistan",
        coords: [39.7681, 64.4556],
        arrival: "2026-08-01",
        departure: "2026-08-03",
        desc: "",
        summary: "Historic town",
        citations: []
    },
    {
        id: 110,
        city: "Khiva, Uzbekistan",
        coords: [41.3783, 60.3639],
        arrival: "2026-08-03",
        departure: "2026-08-04",
        desc: "",
        summary: "Ichan Kala",
        citations: []
    },
    {
        id: 111,
        city: "Dashoguz, Turkmenistan",
        coords: [41.8333, 59.9667],
        arrival: "2026-08-04",
        departure: "2026-08-05",
        desc: "",
        summary: "A place",
        citations: []
    },
    {
        id: 112,
        city: "Derweze, Turkmenistan",
        coords: [40.2526, 58.4397],
        arrival: "2026-08-05",
        departure: "2026-08-06",
        desc: "",
        summary: "Natural gas crater",
        citations: []
    },
    {
        id: 113,
        city: "Ashgabat, Turkmenistan",
        coords: [37.9601, 58.3261],
        arrival: "2026-08-06",
        departure: "2026-08-07",
        desc: "",
        summary: "The marble city",
        citations: []
    },
    {
        id: 114,
        city: "Mary, Turkmenistan",
        coords: [37.5997, 61.8317],
        arrival: "2026-08-07",
        departure: "2026-08-08",
        desc: "",
        summary: "See ancient Merv",
        citations: []
    },
    {
        id: 115,
        city: "Bukhara, Uzbekistan",
        coords: [39.7681, 64.4556],
        arrival: "2026-08-08",
        departure: "2026-08-09",
        desc: "",
        summary: "Just transiting",
        citations: []
    },
    {
        id: 116,
        city: "Dushanbe, Tajikistan",
        coords: [38.5598, 68.787],
        arrival: "2026-08-09",
        departure: "2026-08-11",
        desc: "",
        summary: "The capital!",
        citations: []
    },
    {
        id: 117,
        city: "Baku, Azerbaijan",
        coords: [40.4093, 49.8671],
        arrival: "2026-08-11",
        departure: "2026-08-12",
        desc: "",
        summary: "Very impressive",
        citations: []
    },
    {
        id: 118,
        city: "Ankara, Turkey",
        coords: [39.9334, 32.8597],
        arrival: "2026-08-12",
        departure: "2026-08-14",
        desc: "",
        summary: "Another tourist-free capital!",
        citations: []
    },
    {
        id: 119,
        city: "Istanbul, Turkey",
        coords: [41.0082, 28.9784],
        arrival: "2026-08-14",
        departure: "2026-08-17",
        desc: "",
        summary: "Expensive and chaotic",
        citations: []
    },
    {
        id: 120,
        city: "Riga, Latvia",
        coords: [56.9496, 24.1052],
        arrival: "2026-08-17",
        departure: "2026-08-18",
        desc: "",
        summary: "Seems very poor",
        citations: []
    },
    {
        id: 121,
        city: "Stockholm, Sweden",
        coords: [59.3293, 18.0686],
        arrival: "2026-08-18",
        departure: "2026-08-19",
        desc: "",
        summary: "Too expensive!",
        citations: []
    },
    {
        id: 122,
        city: "Toronto, Ontario, Canada",
        coords: [43.6532, -79.3832],
        arrival: "2026-08-20",
        departure: "2026-08-21",
        desc: "",
        summary: "Home",
        citations: []
    }
];