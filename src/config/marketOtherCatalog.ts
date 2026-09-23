import { MARKET_SPORTS_BRANDS } from './marketSportsCatalog';

type SevenModels = readonly [string, string, string, string, string, string, string];
export type MarketOtherBrand = { name: string; models: SevenModels };

const catalog = (entries: Record<string, SevenModels>): readonly MarketOtherBrand[] =>
  Object.entries(entries).map(([name, models]) => ({ name, models }));

export const MARKET_OTHER_BRANDS = {
  furniture: catalog({
    IKEA: ['BILLY', 'KALLAX', 'MALM', 'PAX', 'HEMNES', 'POANG', 'BESTA'],
    Informa: ['Kane', 'Cally', 'Mavis', 'Alden', 'Olaf', 'Morris', 'Carlo'],
    MUJI: ['Stacking Shelf', 'Oak Bed', 'Oak Table', 'Oak Chair', 'Steel Unit Shelf', 'Body Fit Sofa', 'Polypropylene Storage'],
    Nitori: ['N-Pocket', 'N-Sleep', 'N-Cool', 'N-Poli', 'N-Sheild', 'N-Fit', 'N-Collection'],
    'Herman Miller': ['Aeron', 'Embody', 'Sayl', 'Mirra 2', 'Eames Lounge', 'Cosm', 'Nelson Bench'],
    Steelcase: ['Leap', 'Gesture', 'Series 1', 'Think', 'Amia', 'Karman', 'Migration SE'],
    'Ashley Furniture': ['Altari', 'Darcy', 'Larkinhurst', 'Bladen', 'Draycoll', 'Realyn', 'Wynnlow'],
    'La-Z-Boy': ['Pinnacle', 'Rowan', 'Morrison', 'Collage', 'Trouper', 'Finley', 'Maverick'],
    Cellini: ['Kelvin', 'Cooper', 'Lorenzo', 'Aston', 'Mika', 'Vita', 'Cleo'],
    Olympic: ['Helsinki', 'Scandinavia', 'New York', 'Tokyo', 'London', 'Paris', 'Melbourne']
  }),
  kitchenware: catalog({
    IKEA: ['365+', 'VARDAGEN', 'HEMLAGAD', 'IKEA 365+ HJALTE', 'OFTAST', 'DINERA', 'FAVORISERA'],
    Tefal: ['Ingenio', 'Jamie Oliver', 'Unlimited', 'Daily Cook', 'Cook & Clean', 'Duetto', 'Easy Cook'],
    Zwilling: ['Four Star', 'Pro', 'Twin Gourmet', 'Simplify', 'Vitality', 'Enfinigy', 'Fresh & Save'],
    'Le Creuset': ['Signature', 'Classic', 'Toughened Nonstick', 'Stoneware', '3-Ply', 'TNS Pro', 'Kone'],
    Oxo: ['Good Grips', 'Steel', 'POP', 'Tot', 'SoftWorks', 'On', 'Prep & Go'],
    'LocknLock': ['Classic', 'Bisfree', 'Metro', 'Eco', 'Modular', 'Salad', 'Cookplus'],
    Pyrex: ['Simply Store', 'Easy Grab', 'Freshlock', 'Bake & Store', 'Prepware', 'Smart Essentials', 'Deep'],
    Luminarc: ['Carine', 'Diwali', 'Harena', 'Arcopal', 'Pure Box', 'Empilable', 'Quadro'],
    'Joseph Joseph': ['Nest', 'Elevate', 'Folio', 'Podium', 'Extend', 'DrawerStore', 'Index'],
    Bormioli: ['Rocco', 'Fido', 'Quattro Stagioni', 'Oxford', 'Electra', 'Nexo', 'Rock Bar']
  }),
  home_equipment: catalog({
    Philips: ['PowerPro', 'SpeedPro', 'AquaTrio', 'PerfectCare', 'Airfryer', 'Series 3000', 'Series 5000'],
    Bosch: ['Unlimited 7', 'Unlimited 8', 'Serie 4', 'Serie 6', 'Serie 8', 'Athlet', 'Flexxo'],
    Dyson: ['V8', 'V10', 'V11', 'V12 Detect Slim', 'V15 Detect', 'Gen5detect', 'WashG1'],
    Electrolux: ['Pure Q9', 'Ergorapido', 'UltimateHome', 'Well Q6', 'Pure D9', 'PowerForce', 'UltraOne'],
    Panasonic: ['MC-CG371', 'MC-CG373', 'MC-CJ915', 'NI-WL30', 'NI-GSE050', 'F-M14C5', 'F-409K'],
    Xiaomi: ['Robot Vacuum X20+', 'Robot Vacuum S20+', 'Vacuum Cleaner G10', 'Vacuum Cleaner G11', 'Smart Air Purifier 4', 'Smart Fan 2', 'Garment Steamer'],
    Midea: ['V12', 'V15', 'M7 Pro', 'M6', 'YGD20D7', 'FZ10-17JR', 'WHS-120'],
    Sharp: ['FP-J30Y', 'FP-J80Y', 'EC-NS16', 'EC-CW60', 'PJ-A26MY', 'KI-L80Y', 'IG-GC2Y'],
    Karcher: ['WD 3', 'WD 4', 'WD 5', 'VC 3', 'VC 4', 'FC 5', 'SC 2'],
    'Black+Decker': ['Dustbuster', 'Powerseries', 'Steam-Mop', 'Pivot', 'Flex', 'BHHV320', 'BHFEV182']
  }),
  decor: catalog({
    IKEA: ['FEJKA', 'KOPPARBJORK', 'RIBBA', 'LOMVIKEN', 'SKURAR', 'BERAKNA', 'LACK'],
    'H&M Home': ['Stoneware Vase', 'Cotton Cushion', 'Scented Candle', 'Wooden Tray', 'Metal Mirror', 'Glass Lantern', 'Ceramic Pot'],
    'Zara Home': ['Rattan Basket', 'Linen Cushion', 'Glass Vase', 'Ceramic Lamp', 'Wooden Mirror', 'Marble Tray', 'Textured Rug'],
    MUJI: ['Aroma Diffuser', 'Oak Frame', 'Wall Clock', 'Glass Vase', 'Jute Rug', 'Wire Basket', 'LED Lantern'],
    Umbra: ['Hub Mirror', 'Prisma Frame', 'Trigg Planter', 'Estique', 'Bellwood', 'Woodrow', 'Tesora'],
    'Bloomingville': ['Sandrine', 'Rani', 'Kendi', 'Mura', 'Sanga', 'Baldur', 'Tacey'],
    KaveHome: ['Nereida', 'Jena', 'Marga', 'Dalila', 'Elvia', 'Naila', 'Abilen'],
    'West Elm': ['Mid-Century', 'Organic', 'Marble', 'Metallic', 'Sculptural', 'Cove', 'Harmony'],
    'Pottery Barn': ['Reese', 'Lucca', 'Toscana', 'Benchwright', 'Faux', 'Pearce', 'Cambria'],
    'Krisbow': ['LED Decor Lamp', 'Wall Mirror', 'Artificial Plant', 'Wall Clock', 'Photo Frame', 'Storage Basket', 'Table Lamp']
  }),
  textiles: catalog({
    IKEA: ['DVALA', 'NATTJASMIN', 'VITMOSSA', 'SANELA', 'MAJGULL', 'GURLI', 'FARGKLAR'],
    'H&M Home': ['Washed Linen', 'Cotton Percale', 'Muslin', 'Waffle', 'Velvet', 'Tufted', 'Jacquard'],
    'Zara Home': ['Linen', 'Cotton Sateen', 'Percale', 'Seersucker', 'Waffle', 'Faux Fur', 'Cashmere Blend'],
    MUJI: ['Washed Cotton', 'Organic Cotton', 'Linen', 'Flannel', 'Jersey', 'Indian Cotton', 'Cool Touch'],
    Sorella: ['Royal', 'Classic', 'Luxury', 'Premium', 'Hotel', 'Bloom', 'Signature'],
    'King Koil': ['Signature', 'Chiro Endorsed', 'World Luxury', 'Natural', 'Comfort', 'Royal', 'Hotel'],
    'Tencel': ['Lyocell', 'Modal', 'Micro', 'Luxe', 'Blend', 'Home', 'Eco'],
    Kintakun: ["D'Luxe", 'Lite', 'Cotton', 'Sprei', 'Comforter', 'Kids', 'Jacquard'],
    'My Love': ['Premium', 'Classic', 'Luxury', 'Kids', 'Duvet', 'Pillowcase', 'Bedcover'],
    'Serta': ['Perfect Sleeper', 'iComfort', 'Hotel', 'SleepTrue', 'Comfort', 'Classic', 'Luxury']
  }),
  tools: catalog({
    Bosch: ['GSR 12V-15', 'GSB 18V-55', 'GWS 750', 'GBH 2-26', 'GKS 190', 'GSA 18V-LI', 'GLM 50 C'],
    Makita: ['DDF482', 'DHP482', 'DHR242', 'GA4030', 'HS7600', 'HR2470', 'TD110'],
    DeWalt: ['DCD771', 'DCD796', 'DCF887', 'DWE4057', 'DWE575', 'DCH273', 'DW088K'],
    Stanley: ['STDR5510', 'STGS7100', 'STEL345', 'STDH7213', 'STSC1718', 'STHT0-51309', 'STHT77410'],
    'Black+Decker': ['BDCDD12', 'BDCHD18', 'BEG010', 'BES610', 'KX1800', 'KR504', 'MT218'],
    Milwaukee: ['M12 FUEL', 'M18 FUEL', 'M18 ONE-KEY', 'M12 HACKZALL', 'M18 SAWZALL', 'SHOCKWAVE', 'PACKOUT'],
    Ryobi: ['ONE+ Drill', 'ONE+ Impact', 'ONE+ Circular Saw', 'ONE+ Jigsaw', 'ONE+ Sander', 'ONE+ Multi-Tool', 'ONE+ Light'],
    INGCO: ['CIDLI20608', 'AG750282', 'RH10508', 'JS80028', 'CS18528', 'CDLI200518', 'MCD12115'],
    Krisbow: ['Cordless Drill', 'Impact Drill', 'Angle Grinder', 'Rotary Hammer', 'Jigsaw', 'Circular Saw', 'Heat Gun'],
    TOTAL: ['TIDLI20608', 'TG1081006', 'TRHLI20288', 'TS1141856', 'TJSLI8501', 'TOSLI2301', 'THKTHP1152']
  }),
  mens_clothing: catalog({
    Uniqlo: ['AIRism', 'HEATTECH', 'Ultra Light Down', 'Supima Cotton', 'U Crew Neck', 'Dry-EX', 'Smart Ankle Pants'],
    Nike: ['Tech Fleece', 'Club Fleece', 'Dri-FIT', 'Sportswear', 'Pro', 'ACG', 'Jordan Essentials'],
    Adidas: ['Originals', 'Tiro', 'Essentials', 'Terrex', 'Z.N.E.', 'Own The Run', 'Designed for Training'],
    Levis: ['501 Original', '511 Slim', '512 Slim Taper', '505 Regular', '502 Taper', 'Trucker Jacket', 'Western Shirt'],
    HM: ['Regular Fit', 'Slim Fit', 'Relaxed Fit', 'Loose Fit', 'Premium Selection', 'Move', 'Divided'],
    Zara: ['Basic', 'Man', 'Relaxed', 'Athleticz', 'Studio', 'Origins', 'Utility'],
    Lacoste: ['L.12.12', 'Sport', 'Classic Fit', 'Paris Polo', 'Live', 'Original', 'Heritage'],
    'Tommy Hilfiger': ['1985', 'Essential', 'Core', 'Global Stripe', 'Flex', 'Performance', 'New York'],
    'Ralph Lauren': ['Polo', 'Classic Fit', 'Custom Slim Fit', 'Oxford', 'Big Pony', 'Purple Label', 'Double RL'],
    'The North Face': ['Nuptse', 'Denali', 'Antora', 'Apex Bionic', 'Mountain', 'ThermoBall', 'Base Camp']
  }),
  womens_clothing: catalog({
    Uniqlo: ['AIRism', 'HEATTECH', 'Ultra Light Down', 'Bra Top', 'Smart Ankle Pants', 'Linen Blend', 'U Crew Neck'],
    Zara: ['Woman', 'TRF', 'Studio', 'Basic', 'Knitwear', 'Limited Edition', 'ZW Collection'],
    HM: ['Divided', 'Move', 'Premium Selection', 'Conscious', 'Mama', 'Studio', 'Basics'],
    Mango: ['Suit', 'Selection', 'Comitted', 'Teen', 'Mom', 'Party', 'Essentials'],
    Nike: ['Pro', 'Dri-FIT', 'Sportswear', 'One', 'Zenvy', 'Go', 'Phoenix Fleece'],
    Adidas: ['Originals', 'Optime', 'Essentials', 'Z.N.E.', 'Terrex', 'Own The Run', 'Designed for Training'],
    'Massimo Dutti': ['Studio', 'Limited Edition', 'Essentials', 'Soft', 'Travel', 'Knitwear', 'Tailoring'],
    'Marks & Spencer': ['Autograph', 'Per Una', 'Goodmove', 'Collection', 'Rosie', 'Flexifit', 'Linen'],
    CottonOn: ['Body', 'Active', 'Classic', 'Essentials', 'Denim', 'Knitwear', 'Rubi'],
    'Levi Strauss': ['501 Original', 'Ribcage', 'Wedgie', '721 High Rise', '724 High Rise', 'Baggy Dad', 'Trucker Jacket']
  }),
  shoes: catalog({
    Nike: ['Air Force 1', 'Air Max 90', 'Dunk Low', 'Pegasus 41', 'Vomero 18', 'Metcon 9', 'Blazer Mid'],
    Adidas: ['Samba OG', 'Gazelle', 'Superstar', 'Ultraboost 5', 'Stan Smith', 'Campus 00s', 'Forum Low'],
    NewBalance: ['574', '530', '550', '990v6', '2002R', '9060', '327'],
    Converse: ['Chuck Taylor All Star', 'Chuck 70', 'Run Star Hike', 'One Star', 'Weapon', 'Jack Purcell', 'CONS AS-1 Pro'],
    Vans: ['Old Skool', 'Authentic', 'Classic Slip-On', 'Sk8-Hi', 'Knu Skool', 'Era', 'UltraRange'],
    Puma: ['Suede Classic', 'Palermo', 'Speedcat', 'RS-X', 'Clyde', 'Deviate Nitro', 'Carina'],
    ASICS: ['GEL-KAYANO 14', 'GEL-NYC', 'GEL-1130', 'GEL-LYTE III', 'GEL-NIMBUS 27', 'NOVABLAST 5', 'GT-2000'],
    Skechers: ['D-Lites', 'Go Walk', 'Arch Fit', 'Max Cushioning', 'Slip-ins', 'Uno', 'Summits'],
    Birkenstock: ['Arizona', 'Boston', 'Gizeh', 'Madrid', 'Mayari', 'Milano', 'Kyoto'],
    Crocs: ['Classic Clog', 'Echo Clog', 'Crocband', 'LiteRide', 'Bayaband', 'Brooklyn', 'Mega Crush']
  }),
  bags: catalog({
    Coach: ['Tabby', 'Brooklyn', 'Rogue', 'Willow', 'Cassie', 'Lana', 'Swinger'],
    Longchamp: ['Le Pliage Original', 'Le Pliage Green', 'Le Pliage City', 'Roseau', 'Box-Trot', 'Epure', 'Le Foulonne'],
    MichaelKors: ['Jet Set', 'Mercer', 'Hamilton', 'Soho', 'Tribeca', 'Mirella', 'Voyager'],
    KateSpade: ['Knott', 'Sam', 'Hudson', 'Staci', 'Leila', 'Katy', 'Morgan'],
    Fossil: ['Rachel', 'Jolie', 'Kinley', 'Harwell', 'Sydney', 'Tessa', 'Lennox'],
    Kipling: ['Art', 'Gabbie', 'Defea', 'Seoul', 'Delia', 'Abanu', 'City Pack'],
    Herschel: ['Little America', 'Retreat', 'Classic', 'Nova', 'Pop Quiz', 'Settlement', 'Heritage'],
    Fjallraven: ['Kanken', 'Kanken Mini', 'Kanken Laptop', 'Raven 20', 'High Coast', 'Skule', 'Totepack No. 1'],
    'Charles & Keith': ['Gabine', 'Petra', 'Duo', 'Cesia', 'Aubrielle', 'Calla', 'Ally'],
    Samsonite: ['Red', 'Openroad', 'Pro-DLX', 'GuardIT', 'Karissa', 'XBR', 'Move 4']
  }),
  fashion_accessories: catalog({
    Casio: ['G-SHOCK', 'BABY-G', 'Edifice', 'Vintage', 'Pro Trek', 'Oceanus', 'Enticer'],
    Seiko: ['Seiko 5', 'Prospex', 'Presage', 'Astron', 'King Seiko', 'Lukia', 'Premier'],
    Fossil: ['Grant', 'Nate', 'Machine', 'Neutra', 'Jacqueline', 'Carlie', 'Raquel'],
    Swatch: ['Originals', 'BIG BOLD', 'Skin', 'Irony', 'Sistem51', 'Gent', 'New Gent'],
    RayBan: ['Aviator', 'Wayfarer', 'Clubmaster', 'Round Metal', 'Justin', 'Erika', 'Hexagonal'],
    Oakley: ['Holbrook', 'Frogskins', 'Sutro', 'Radar EV', 'Jawbreaker', 'Flak 2.0', 'Latch'],
    Pandora: ['Moments', 'Timeless', 'ME', 'Essence', 'Reflexions', 'Signature', 'Rose'],
    Swarovski: ['Matrix', 'Millenia', 'Una', 'Dextera', 'Hyperbola', 'Constella', 'Imber'],
    Garmin: ['Forerunner 265', 'Forerunner 965', 'Venu 3', 'vivoactive 5', 'fēnix 8', 'Instinct 3', 'Lily 2'],
    DanielWellington: ['Classic', 'Petite', 'Iconic', 'Quadro', 'Elan', 'Emalie', 'Evergold']
  }),
  beauty_care_items: catalog({
    "L'Oreal": ['Revitalift', 'Hyaluron Expert', 'Elseve', 'Excellence', 'True Match', 'Infallible', 'Glycolic Bright'],
    Maybelline: ['Fit Me', 'Super Stay', 'Sky High', 'Lash Sensational', 'Vinyl Ink', 'Instant Age Rewind', 'Color Sensational'],
    Nivea: ['Nivea Creme', 'Soft', 'MicellAIR', 'Sun Protect', 'Extra White', 'Body Serum', 'Men Deep'],
    Cetaphil: ['Gentle Skin Cleanser', 'Daily Facial Cleanser', 'Moisturizing Cream', 'Moisturizing Lotion', 'PRO AD', 'Sun SPF 50', 'Bright Healthy Radiance'],
    CeraVe: ['Hydrating Cleanser', 'Foaming Cleanser', 'Moisturizing Cream', 'SA Smoothing', 'PM Lotion', 'AM SPF 30', 'Resurfacing Retinol'],
    'The Ordinary': ['Niacinamide 10%', 'Hyaluronic Acid 2%', 'AHA 30%', 'Glycolic Acid 7%', 'Retinol 0.5%', 'Caffeine Solution', 'Squalane Cleanser'],
    'La Roche-Posay': ['Effaclar', 'Cicaplast', 'Anthelios', 'Toleriane', 'Lipikar', 'Hyalu B5', 'Mela B3'],
    Wardah: ['Lightening', 'Colorfit', 'Instaperfect', 'UV Shield', 'Crystal Secret', 'Renew You', 'Acnederm'],
    Somethinc: ['Niacinamide', 'Ceramide', 'Glow Maker', 'Level 1%', 'Copy Paste', 'Holyshield', 'Hooman'],
    Emina: ['Bright Stuff', 'Ms. Pimple', 'Sun Battle', 'Glossy Stain', 'Cheeklit', 'Bare With Me', 'Magic Potion']
  }),
  strollers_car_seats: catalog({
    Cybex: ['Priam', 'Mios', 'Balios S Lux', 'Gazelle S', 'Libelle', 'Cloud T', 'Sirona T'],
    Joie: ['Pact', 'Parcel', 'Versatrax', 'Litetrax', 'Mimzy', 'Spin 360', 'i-Spin 360'],
    Chicco: ['Bravo', 'Goody XPlus', 'Bellagio', 'One4Ever', 'KeyFit 35', 'Fit360', 'Unico Evo'],
    'Maxi-Cosi': ['Zelia', 'Lara2', 'Leona2', 'Pebble 360', 'Mica 360', 'Pearl 360', 'Titan Pro'],
    'Bugaboo': ['Fox 5', 'Butterfly', 'Dragonfly', 'Donkey 5', 'Bee 6', 'Cameleon 3', 'Turtle Air'],
    'Nuna': ['TRVL', 'MIXX next', 'TRIV next', 'DEMI next', 'PIPA urbn', 'REVV', 'RAVA'],
    'UPPAbaby': ['Vista V3', 'Cruz V2', 'Minu V3', 'G-Luxe', 'Mesa Max', 'Aria', 'Knox'],
    'Graco': ['Modes', 'FastAction', 'Ready2Grow', 'NimbleLite', 'SnugRide', 'Extend2Fit', '4Ever DLX'],
    'Babyzen': ['YOYO2', 'YOYO3', 'YOYO Connect', 'YOYO Bassinet', 'YOYO Newborn Pack', 'YOYO Board', 'YOYO Bag'],
    'Doona': ['Doona+', 'Doona i', 'Doona X', 'Liki Trike S3', 'Liki Trike S5', 'SensAlert', 'Doona Base']
  }),
  kids_clothing: catalog({
    "Carter's": ['Little Planet', 'Just One You', 'Simple Joys', 'Original Bodysuits', 'Sleep & Play', '2-Piece Set', '4-Piece Set'],
    'OshKosh': ["B'gosh", "World's Best Overalls", 'Active', 'Denim', 'Everyday', 'Graphic Tee', 'Fleece'],
    'H&M Kids': ['Baby', 'Kids', 'Divided', 'Conscious', 'MAMA', 'Move', 'Disney Collection'],
    'Zara Kids': ['Baby', 'Mini', 'Girl', 'Boy', 'Newborn', 'Denim', 'Special Edition'],
    'Uniqlo Kids': ['AIRism', 'HEATTECH', 'UT', 'Ultra Stretch', 'Fluffy Yarn', 'Dry-EX', 'Fleece'],
    'Nike Kids': ['Dri-FIT', 'Sportswear', 'Club Fleece', 'Jordan', 'Tech Fleece', 'Pro', 'Little Kids'],
    'Adidas Kids': ['Originals', 'Essentials', 'Tiro', 'Disney', 'Future Icons', 'Z.N.E.', 'Terrex'],
    'Mothercare': ['My First', 'All We Know', 'Little Ones', 'Baby K', 'Newborn', 'Toddler', 'Basics'],
    'Mamas & Papas': ['Welcome to the World', 'Dream Upon a Cloud', 'Little Jungle', 'Once Upon a Time', 'Essential', 'Cotton', 'Baby'],
    'Gap Kids': ['GapKids', 'BabyGap', 'Toddler', 'Logo', 'Vintage Soft', 'Organic Cotton', 'Denim']
  }),
  toys: catalog({
    LEGO: ['Classic', 'City', 'Friends', 'Technic', 'Duplo', 'Star Wars', 'Ninjago'],
    Mattel: ['Barbie', 'Hot Wheels', 'Fisher-Price', 'Matchbox', 'Polly Pocket', 'Monster High', 'UNO'],
    Hasbro: ['Nerf', 'Play-Doh', 'Transformers', 'Monopoly', 'My Little Pony', 'Peppa Pig', 'Baby Alive'],
    'Fisher-Price': ['Little People', 'Laugh & Learn', 'Imaginext', 'Linkimals', 'Thomas & Friends', 'Rock-a-Stack', 'Kick & Play'],
    Playmobil: ['City Life', 'Country', 'Family Fun', 'Pirates', 'Novelmore', 'Space', 'Wiltopia'],
    VTech: ['KidiZoom', 'KidiBeats', 'Touch & Learn', 'Go! Go! Smart Wheels', 'LeapFrog', 'KidiStar', 'Kidi DJ'],
    Ravensburger: ['GraviTrax', 'tiptoi', 'BRIO', 'ThinkFun', 'Labyrinth', 'Puzzle', 'Rush Hour'],
    MelissaDoug: ['Wooden Puzzles', 'Food Groups', 'Water WOW!', 'Role Play', 'Magnetic Dress-Up', 'Stacking Toys', 'Arts & Crafts'],
    Hape: ['Quadrilla', 'Easel', 'Baby Einstein', 'Railway', 'Cook & Serve', 'Pound & Tap', 'Music Set'],
    Schleich: ['Farm World', 'Wild Life', 'Horse Club', 'Bayala', 'Dinosaurs', 'Eldrador', 'Sofia Beauties']
  }),
  kids_furniture: catalog({
    IKEA: ['SUNDVIK', 'SNIGLAR', 'GULLIVER', 'SMAGORA', 'KURA', 'TROFAST', 'FLISAT'],
    Stokke: ['Tripp Trapp', 'Steps', 'Clikk', 'Sleepi', 'Flexi Bath', 'Nomi', 'MuTable'],
    'Mamas & Papas': ['Lua', 'Harwell', 'Atlas', 'Franklin', 'Mia', 'Barton', 'Ocarro'],
    'Chicco': ['Next2Me', 'Polly', 'Baby Hug', 'Lullago', 'Pocket Snack', 'Chairy', 'Boppy'],
    'Babyletto': ['Hudson', 'Gelato', 'Lolly', 'Origami', 'Modo', 'Kiwi', 'Yuzu'],
    'Delta Children': ['Emery', 'Tribeca', 'Simmons', 'Abby', 'Poppy', 'Canton', 'Bennett'],
    'Dream On Me': ['Synergy', 'Ashton', 'Anna', 'Karley', 'Aden', 'Jett', 'Violet'],
    'Tutti Bambini': ['CoZee', 'Rio', 'Modena', 'Katie', 'Lucas', 'Oscar', 'Roma'],
    'Pottery Barn Kids': ['Kendall', 'Larkin', 'Catalina', 'Sloan', 'Camp', 'Blythe', 'Ava'],
    'Sebra': ['Baby & Jr.', 'Kili', 'Changing Unit', 'Classic', 'Bed Linen', 'Storage', 'Play Kitchen']
  }),
  ...MARKET_SPORTS_BRANDS
} as const;

export type MarketOtherCategory = keyof typeof MARKET_OTHER_BRANDS;

export const isMarketOtherCategory = (subCategory: string): subCategory is MarketOtherCategory =>
  Object.prototype.hasOwnProperty.call(MARKET_OTHER_BRANDS, subCategory);
