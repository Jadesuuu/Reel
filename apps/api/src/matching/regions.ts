export type RegionLabel =
  | 'us'
  | 'canada'
  | 'latam'
  | 'uk'
  | 'europe'
  | 'middle east'
  | 'africa'
  | 'india'
  | 'pakistan'
  | 'australia'
  | 'new zealand'
  | 'japan'
  | 'korea'
  | 'china'
  | 'taiwan'
  | 'hong kong'
  | 'singapore'
  | 'malaysia'
  | 'indonesia'
  | 'vietnam'
  | 'thailand'
  | 'philippines'
  | 'asia'
  | 'apac'
  | 'americas'
  | 'emea';

const US_STATES = [
  'alabama',
  'alaska',
  'arizona',
  'arkansas',
  'california',
  'colorado',
  'connecticut',
  'delaware',
  'florida',
  'georgia',
  'hawaii',
  'idaho',
  'illinois',
  'indiana',
  'iowa',
  'kansas',
  'kentucky',
  'louisiana',
  'maine',
  'maryland',
  'massachusetts',
  'michigan',
  'minnesota',
  'mississippi',
  'missouri',
  'montana',
  'nebraska',
  'nevada',
  'new hampshire',
  'new jersey',
  'new mexico',
  'new york',
  'north carolina',
  'north dakota',
  'ohio',
  'oklahoma',
  'oregon',
  'pennsylvania',
  'rhode island',
  'south carolina',
  'south dakota',
  'tennessee',
  'texas',
  'utah',
  'vermont',
  'virginia',
  'washington',
  'west virginia',
  'wisconsin',
  'wyoming',
];

const US_CITIES = [
  'san francisco',
  'bay area',
  'silicon valley',
  'new york city',
  'nyc',
  'manhattan',
  'brooklyn',
  'los angeles',
  'san diego',
  'san jose',
  'palo alto',
  'mountain view',
  'sunnyvale',
  'menlo park',
  'redwood city',
  'oakland',
  'berkeley',
  'santa monica',
  'irvine',
  'sacramento',
  'seattle',
  'bellevue',
  'portland',
  'austin',
  'dallas',
  'houston',
  'san antonio',
  'chicago',
  'boston',
  'denver',
  'boulder',
  'atlanta',
  'miami',
  'orlando',
  'tampa',
  'phoenix',
  'scottsdale',
  'las vegas',
  'salt lake city',
  'provo',
  'philadelphia',
  'pittsburgh',
  'washington dc',
  'washington, dc',
  'washington d.c.',
  'd.c.',
  'baltimore',
  'arlington',
  'minneapolis',
  'detroit',
  'ann arbor',
  'nashville',
  'raleigh',
  'durham',
  'charlotte',
  'columbus',
  'cincinnati',
  'cleveland',
  'indianapolis',
  'kansas city',
  'st. louis',
  'st louis',
  'milwaukee',
  'madison',
  'louisville',
  'new orleans',
  'richmond',
  'jacksonville',
  'fort worth',
  'fort lauderdale',
  'omaha',
  'boise',
  'reno',
  'albuquerque',
  'tucson',
  'honolulu',
  'anchorage',
  'puerto rico',
];

const US_ZONES = [
  'est',
  'edt',
  'pst',
  'pdt',
  'cst',
  'cdt',
  'mst',
  'mdt',
  'eastern time',
  'pacific time',
  'central time',
  'mountain time',
  'us time zone',
  'us time zones',
  'us hours',
  'us business hours',
  'u.s. time zones',
  'american time zones',
  'north american time zones',
  'us-based',
  'us based',
  'u.s.-based',
  'us citizen',
  'us citizens',
  'us citizenship',
  'green card',
  'us work authorization',
  'authorized to work in the us',
  'authorized to work in the united states',
  'w2',
  'w-2',
];

const GAZETTEER: ReadonlyArray<readonly [RegionLabel, ReadonlyArray<string>]> =
  [
    [
      'us',
      [
        'us',
        'usa',
        'u.s.',
        'u.s.a.',
        'united states',
        'north america',
        'north american',
        ...US_STATES,
        ...US_CITIES,
        ...US_ZONES,
      ],
    ],
    [
      'canada',
      [
        'canada',
        'canadian',
        'toronto',
        'vancouver',
        'montreal',
        'ottawa',
        'calgary',
        'edmonton',
        'waterloo',
        'quebec',
        'ontario',
        'british columbia',
        'alberta',
        'manitoba',
        'saskatchewan',
        'nova scotia',
        'new brunswick',
        'newfoundland',
        'halifax',
        'winnipeg',
        'victoria, bc',
      ],
    ],
    [
      'latam',
      [
        'latam',
        'latin america',
        'latin american',
        'south america',
        'central america',
        'mexico',
        'mexico city',
        'guadalajara',
        'monterrey',
        'brazil',
        'brasil',
        'sao paulo',
        'rio de janeiro',
        'argentina',
        'buenos aires',
        'colombia',
        'bogota',
        'medellin',
        'chile',
        'santiago',
        'peru',
        'lima',
        'uruguay',
        'montevideo',
        'costa rica',
        'guatemala',
        'ecuador',
        'venezuela',
        'panama',
        'dominican republic',
        'bolivia',
        'paraguay',
      ],
    ],
    [
      'uk',
      [
        'uk',
        'u.k.',
        'united kingdom',
        'britain',
        'british',
        'great britain',
        'england',
        'scotland',
        'wales',
        'northern ireland',
        'london',
        'manchester',
        'edinburgh',
        'glasgow',
        'birmingham',
        'bristol',
        'leeds',
        'cambridge',
        'oxford',
        'belfast',
        'cardiff',
        'bst',
        'uk time',
        'uk hours',
        'uk-based',
        'uk based',
        'right to work in the uk',
      ],
    ],
    [
      'europe',
      [
        'europe',
        'european',
        'eu',
        'e.u.',
        'eea',
        'schengen',
        'cet',
        'cest',
        'european time zones',
        'eu time zones',
        'cet timezone',
        'eu-based',
        'eu based',
        'right to work in the eu',
        'ireland',
        'dublin',
        'germany',
        'german',
        'berlin',
        'munich',
        'hamburg',
        'frankfurt',
        'cologne',
        'stuttgart',
        'france',
        'french',
        'paris',
        'lyon',
        'spain',
        'spanish',
        'madrid',
        'barcelona',
        'valencia',
        'portugal',
        'portuguese',
        'lisbon',
        'porto',
        'italy',
        'italian',
        'milan',
        'rome',
        'turin',
        'netherlands',
        'dutch',
        'amsterdam',
        'rotterdam',
        'utrecht',
        'eindhoven',
        'belgium',
        'brussels',
        'antwerp',
        'ghent',
        'luxembourg',
        'switzerland',
        'swiss',
        'zurich',
        'geneva',
        'basel',
        'lausanne',
        'austria',
        'vienna',
        'sweden',
        'swedish',
        'stockholm',
        'gothenburg',
        'malmo',
        'denmark',
        'danish',
        'copenhagen',
        'aarhus',
        'norway',
        'norwegian',
        'oslo',
        'finland',
        'finnish',
        'helsinki',
        'iceland',
        'reykjavik',
        'poland',
        'polish',
        'warsaw',
        'krakow',
        'wroclaw',
        'gdansk',
        'poznan',
        'czech republic',
        'czechia',
        'prague',
        'brno',
        'slovakia',
        'bratislava',
        'hungary',
        'budapest',
        'romania',
        'bucharest',
        'cluj',
        'bulgaria',
        'sofia',
        'greece',
        'athens',
        'cyprus',
        'malta',
        'croatia',
        'zagreb',
        'slovenia',
        'ljubljana',
        'serbia',
        'belgrade',
        'bosnia',
        'sarajevo',
        'north macedonia',
        'albania',
        'montenegro',
        'kosovo',
        'estonia',
        'tallinn',
        'latvia',
        'riga',
        'lithuania',
        'vilnius',
        'ukraine',
        'kyiv',
        'kiev',
        'lviv',
        'moldova',
        'tbilisi',
        'armenia',
        'yerevan',
        'turkey',
        'turkiye',
        'istanbul',
        'ankara',
      ],
    ],
    [
      'middle east',
      [
        'middle east',
        'mena',
        'israel',
        'tel aviv',
        'jerusalem',
        'uae',
        'united arab emirates',
        'dubai',
        'abu dhabi',
        'saudi arabia',
        'riyadh',
        'jeddah',
        'qatar',
        'doha',
        'bahrain',
        'kuwait',
        'oman',
        'jordan',
        'amman',
        'lebanon',
        'beirut',
        'egypt',
        'cairo',
      ],
    ],
    [
      'africa',
      [
        'africa',
        'african',
        'south africa',
        'cape town',
        'johannesburg',
        'pretoria',
        'durban',
        'nigeria',
        'lagos',
        'abuja',
        'kenya',
        'nairobi',
        'ghana',
        'accra',
        'morocco',
        'casablanca',
        'tunisia',
        'tunis',
        'rwanda',
        'kigali',
        'uganda',
        'kampala',
        'ethiopia',
        'addis ababa',
        'tanzania',
        'mauritius',
      ],
    ],
    [
      'india',
      [
        'india',
        'indian',
        'bangalore',
        'bengaluru',
        'hyderabad',
        'pune',
        'mumbai',
        'delhi',
        'new delhi',
        'gurgaon',
        'gurugram',
        'noida',
        'chennai',
        'kolkata',
        'ahmedabad',
        'kochi',
        'jaipur',
        'chandigarh',
        'indore',
        'bhubaneswar',
        'coimbatore',
        'trivandrum',
        'thiruvananthapuram',
        'ist timezone',
        'ist time zone',
      ],
    ],
    [
      'pakistan',
      [
        'pakistan',
        'lahore',
        'karachi',
        'islamabad',
        'bangladesh',
        'dhaka',
        'sri lanka',
        'colombo',
        'nepal',
        'kathmandu',
      ],
    ],
    [
      'australia',
      [
        'australia',
        'australian',
        'sydney',
        'melbourne',
        'brisbane',
        'perth',
        'adelaide',
        'canberra',
        'gold coast',
        'hobart',
        'aest',
        'aedt',
        'awst',
        'australian time zones',
      ],
    ],
    [
      'new zealand',
      ['new zealand', 'nz', 'auckland', 'wellington', 'christchurch', 'nzst'],
    ],
    [
      'japan',
      ['japan', 'japanese', 'tokyo', 'osaka', 'kyoto', 'fukuoka', 'jst'],
    ],
    ['korea', ['korea', 'south korea', 'korean', 'seoul', 'busan', 'kst']],
    [
      'china',
      [
        'china',
        'chinese',
        'shanghai',
        'beijing',
        'shenzhen',
        'hangzhou',
        'guangzhou',
        'chengdu',
        'nanjing',
      ],
    ],
    ['taiwan', ['taiwan', 'taipei', 'hsinchu', 'kaohsiung']],
    ['hong kong', ['hong kong', 'hongkong', 'hkt']],
    ['singapore', ['singapore', 'sgt']],
    [
      'malaysia',
      [
        'malaysia',
        'malaysian',
        'kuala lumpur',
        'penang',
        'johor',
        'selangor',
        'cyberjaya',
      ],
    ],
    [
      'indonesia',
      [
        'indonesia',
        'indonesian',
        'jakarta',
        'bandung',
        'surabaya',
        'bali',
        'yogyakarta',
      ],
    ],
    [
      'vietnam',
      ['vietnam', 'vietnamese', 'hanoi', 'ho chi minh', 'saigon', 'da nang'],
    ],
    ['thailand', ['thailand', 'thai', 'bangkok', 'chiang mai', 'phuket']],
    [
      'philippines',
      [
        'philippines',
        'philippine',
        'filipino',
        'pilipinas',
        'manila',
        'metro manila',
        'ncr',
        'makati',
        'taguig',
        'bgc',
        'bonifacio global city',
        'fort bonifacio',
        'pasig',
        'ortigas',
        'quezon city',
        'mandaluyong',
        'pasay',
        'paranaque',
        'muntinlupa',
        'alabang',
        'las pinas',
        'marikina',
        'san juan city',
        'caloocan',
        'valenzuela',
        'cebu',
        'cebu city',
        'mandaue',
        'davao',
        'iloilo',
        'bacolod',
        'baguio',
        'pampanga',
        'angeles city',
        'laguna',
        'santa rosa, laguna',
        'cavite',
        'bulacan',
        'batangas',
        'cagayan de oro',
        'dumaguete',
        'pht',
        'philippine time',
        'manila time',
      ],
    ],
    ['asia', ['asia', 'asian', 'south asia', 'east asia']],
    [
      'apac',
      [
        'apac',
        'asia pacific',
        'asia-pacific',
        'southeast asia',
        'south east asia',
        'sea region',
        'oceania',
      ],
    ],
    ['americas', ['americas', 'western hemisphere']],
    ['emea', ['emea']],
  ];

const OPEN_TERMS = [
  'worldwide',
  'world wide',
  'anywhere',
  'anywhere in the world',
  'any country',
  'any location',
  'all countries',
  'any time zone',
  'any timezone',
  'all time zones',
  'globally distributed',
  'work from anywhere',
  'international candidates welcome',
  'open to international',
  'no location restrictions',
  'no location restriction',
  'location independent',
  'location-independent',
];

export const REGION_LABELS: ReadonlyArray<RegionLabel> = GAZETTEER.map(
  ([label]) => label,
);

export const REGION_TERMS: ReadonlyArray<string> = GAZETTEER.flatMap(
  ([, terms]) => terms,
);

const SHORT_TERM = 3;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const patternCache = new Map<string, RegExp>();

function patternFor(term: string): RegExp {
  const cached = patternCache.get(term);
  if (cached) {
    return cached;
  }
  const trimmed = term.trim();
  const escaped = escapeRegExp(trimmed);
  const pattern =
    trimmed.length <= SHORT_TERM
      ? new RegExp(`(^|[^A-Za-z0-9])${escaped.toUpperCase()}([^A-Za-z0-9]|$)`)
      : new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
  patternCache.set(term, pattern);
  return pattern;
}

export function mentionsRegion(text: string, term: string): boolean {
  if (term.trim().length === 0) {
    return false;
  }
  return patternFor(term).test(text);
}

export function findRegionTerms(text: string): RegionLabel[] {
  const found: RegionLabel[] = [];
  for (const [label, terms] of GAZETTEER) {
    if (terms.some((term) => mentionsRegion(text, term))) {
      found.push(label);
    }
  }
  return found;
}

export function mentionsOpenRegion(text: string): boolean {
  return OPEN_TERMS.some((term) => mentionsRegion(text, term));
}

export function regionBasis(headline: string, location: string | null): string {
  return location ? `${headline} ${location}` : headline;
}

const RESTRICTION_PATTERNS: ReadonlyArray<RegExp> = [
  /(?:must|need(?:s)? to|required to|have to|has to|should|expected to|are required to)\s+(?:be\s+)?(?:physically\s+|currently\s+|legally\s+)?(?:located|based|residing|reside|live|living|resident|authori[sz]ed to work|eligible to work|able to work)\s+(?:in|within)\s+(?:the\s+)?([^.\n;:()]{1,60})/gi,
  /(?:only|exclusively)\s+(?:open to|available to|considering|hiring|accepting|for)\s+(?:candidates|applicants|applications|people|those|engineers|developers)?\s*(?:who are\s+)?(?:in|from|within|based in|located in|residing in|living in)\s+(?:the\s+)?([^.\n;:()]{1,60})/gi,
  /(?:candidates|applicants|you)\s+(?:must|should|need to|will need to|are required to)\s+(?:be\s+)?(?:located|based|residing|reside|live|living)\s+(?:in|within)\s+(?:the\s+)?([^.\n;:()]{1,60})/gi,
  /(?:work\s+)?(?:authori[sz]ation|permit|eligibility|right)\s+to\s+work\s+in\s+(?:the\s+)?([^.\n;:()]{1,40})/gi,
  /(?:based|located|residing|living)\s+in\s+(?:the\s+)?([^.\n;:()]{1,40}?)\s+only\b/gi,
  /\b([A-Za-z.]{2,20})[- ]based\s+(?:candidates|applicants|only|role|position|team members)\b/gi,
  /(?:within|overlap(?:ping)?\s+with|with|in|across|during)\s+(?:the\s+)?([^.\n;:()]{1,30}?)\s+(?:time\s*zones?|business hours|working hours)\b/gi,
  /(?:this (?:role|position) is|we are|we're|position is|role is)\s+(?:only\s+)?(?:open|available)\s+(?:only\s+)?(?:to|for|in)\s+(?:candidates|applicants|residents|people)?\s*(?:in|from|of|within|based in|located in)?\s+(?:the\s+)?([^.\n;:()]{1,60})/gi,
];

export function restrictionSnippets(rawText: string): string[] {
  if (rawText.length === 0) {
    return [];
  }
  const text = rawText.replace(/\s+/g, ' ');
  const snippets: string[] = [];
  const seen = new Set<string>();
  for (const pattern of RESTRICTION_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const captured = match[1]?.trim();
      if (
        captured &&
        captured.length > 0 &&
        !seen.has(captured.toLowerCase())
      ) {
        seen.add(captured.toLowerCase());
        snippets.push(captured);
      }
      if (snippets.length >= 12) {
        return snippets;
      }
    }
  }
  return snippets;
}

export function restrictionBasis(rawText: string): string {
  return restrictionSnippets(rawText).join(' | ');
}
