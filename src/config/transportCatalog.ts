export type MarketTransportCategory =
  | 'ads_scooters'
  | 'ads_motorcycles'
  | 'ads_cars'
  | 'bicycles'
  | 'water_transport'
  | 'transport_parts';

export type MarketTransportBrand = {
  name: string;
  logoSlug: string;
  logoUrl?: string;
  models: readonly string[];
};

export const MARKET_TRANSPORT_BRANDS: Record<MarketTransportCategory, readonly MarketTransportBrand[]> = {
  ads_scooters: [
    { name: 'Honda', logoSlug: 'honda', models: ['BeAT', 'Scoopy', 'Vario 125', 'Vario 160', 'PCX 160', 'ADV 160', 'Genio'] },
    { name: 'Yamaha', logoSlug: 'yamaha', models: ['NMAX 155', 'Aerox 155', 'Fazzio', 'Grand Filano', 'LEXi LX 155', 'XMAX 250', 'FreeGo 125'] },
    { name: 'Vespa', logoSlug: 'vespa', models: ['Primavera 150', 'Sprint 150', 'LX 125', 'S 125', 'GTS 300', 'GTV 300', 'Elettrica'] },
    { name: 'Piaggio', logoSlug: 'piaggio', models: ['Liberty 125', 'Liberty 150', 'Medley 125', 'Medley 150', 'Beverly 300', 'Beverly 400', 'MP3 530'] },
    { name: 'Suzuki', logoSlug: 'suzuki', models: ['Address FI', 'Avenis 125', 'Burgman Street 125EX', 'Access 125', 'NEX II', 'Lets', 'Burgman 400'] },
    { name: 'Kymco', logoSlug: 'kymco', models: ['Like 150i', 'Like 125', 'Agility 125', 'People S 150', 'X-Town 300i', 'Downtown 350i', 'AK 550'] },
    { name: 'SYM', logoSlug: 'sym', models: ['Jet X 150', 'Jet 14 125', 'Symphony ST 200', 'Fiddle 125', 'Cruisym 300', 'Maxsym TL 508', 'ADX 125'] },
    { name: 'Peugeot Motocycles', logoSlug: 'peugeot', models: ['Django 150', 'Django 125', 'Tweet 125', 'Speedfight 4', 'Kisbee 50', 'Pulsion 125', 'Metropolis 400'] },
    { name: 'TVS', logoSlug: 'tvs', models: ['Ntorq 125', 'Jupiter 125', 'Jupiter 110', 'iQube', 'Zest 110', 'Scooty Pep+', 'XL100'] },
    { name: 'NIU', logoSlug: 'niu', models: ['NQi Sport', 'NQi GTS', 'MQi GT', 'UQi Sport', 'KQi3 Pro', 'KQi3 Max', 'KQi2 Pro'] }
  ],
  ads_motorcycles: [
    { name: 'Honda', logoSlug: 'honda', models: ['CB150R StreetFire', 'CB650R', 'CBR150R', 'CBR250RR', 'CRF150L', 'CRF250 Rally', 'Rebel 500'] },
    { name: 'Yamaha', logoSlug: 'yamaha', models: ['MT-07', 'MT-09', 'XSR155', 'R15', 'R25', 'WR155R', 'Tenere 700'] },
    { name: 'Kawasaki', logoSlug: 'kawasaki', models: ['Ninja ZX-25R', 'Ninja 250', 'Ninja 650', 'Z900', 'W175', 'KLX150', 'Versys 650'] },
    { name: 'Suzuki', logoSlug: 'suzuki', models: ['GSX-R150', 'GSX-S150', 'V-Strom 250 SX', 'V-Strom 650', 'SV650', 'Hayabusa', 'Katana'] },
    { name: 'Ducati', logoSlug: 'ducati', models: ['Monster', 'Scrambler Icon', 'Panigale V2', 'Panigale V4', 'Multistrada V4', 'DesertX', 'Diavel V4'] },
    { name: 'BMW Motorrad', logoSlug: 'bmw', models: ['G 310 R', 'G 310 GS', 'F 900 R', 'F 900 GS', 'R 1300 GS', 'S 1000 RR', 'R 12 nineT'] },
    { name: 'KTM', logoSlug: 'ktm', models: ['Duke 200', 'Duke 250', 'Duke 390', 'RC 390', 'Adventure 390', '690 Enduro R', '890 Adventure'] },
    { name: 'Triumph', logoSlug: 'triumph', models: ['Speed 400', 'Scrambler 400 X', 'Street Triple 765 R', 'Tiger 900 GT', 'Bonneville T120', 'Trident 660', 'Rocket 3 R'] },
    { name: 'Royal Enfield', logoSlug: 'royalenfield', models: ['Classic 350', 'Hunter 350', 'Meteor 350', 'Himalayan 450', 'Interceptor 650', 'Continental GT 650', 'Super Meteor 650'] },
    { name: 'Harley-Davidson', logoSlug: 'harleydavidson', models: ['Iron 883', 'Street Bob 114', 'Fat Boy 114', 'Sportster S', 'Nightster', 'Pan America 1250', 'Road Glide'] }
  ],
  ads_cars: [
    { name: 'Toyota', logoSlug: 'toyota', models: ['Avanza', 'Veloz', 'Raize', 'Rush', 'Kijang Innova Zenix', 'Fortuner', 'Yaris Cross'] },
    { name: 'Honda', logoSlug: 'honda', models: ['Brio', 'City Hatchback', 'HR-V', 'CR-V', 'WR-V', 'BR-V', 'Civic'] },
    { name: 'Suzuki', logoSlug: 'suzuki', models: ['XL7', 'Ertiga', 'Jimny', 'Baleno', 'Grand Vitara', 'S-Presso', 'Carry'] },
    { name: 'Mitsubishi', logoSlug: 'mitsubishi', models: ['Xpander', 'Xpander Cross', 'Pajero Sport', 'Triton', 'Xforce', 'Outlander PHEV', 'Mirage'] },
    { name: 'Hyundai', logoSlug: 'hyundai', models: ['Creta', 'Stargazer', 'Santa Fe', 'Ioniq 5', 'Ioniq 6', 'Palisade', 'Kona Electric'] },
    { name: 'Daihatsu', logoSlug: 'daihatsu', models: ['Ayla', 'Sigra', 'Terios', 'Xenia', 'Rocky', 'Gran Max', 'Luxio'] },
    { name: 'Wuling', logoSlug: 'wuling', models: ['Air ev', 'BinguoEV', 'Cloud EV', 'Alvez', 'Almaz', 'Confero', 'Cortez'] },
    { name: 'Nissan', logoSlug: 'nissan', models: ['Magnite', 'Livina', 'Kicks', 'X-Trail', 'Serena', 'Leaf', 'Terra'] },
    { name: 'BMW', logoSlug: 'bmw', models: ['3 Series', '5 Series', 'X1', 'X3', 'X5', 'i4', 'iX'] },
    { name: 'Mercedes-Benz', logoSlug: 'mercedesbenz', models: ['C-Class', 'E-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'EQE'] }
  ],
  bicycles: [
    { name: 'Polygon', logoSlug: 'polygon', models: ['Helios A7', 'Strattos S5', 'Xtrada 7', 'Siskiu T8', 'Cascade 4', 'Path X5', 'Premier 5'] },
    { name: 'Giant', logoSlug: 'giant', models: ['TCR Advanced Pro', 'Defy Advanced', 'Propel Advanced', 'Revolt Advanced', 'Talon 1', 'Trance X', 'Escape 3'] },
    { name: 'Trek', logoSlug: 'trek', models: ['Marlin 5', 'Marlin 7', 'Domane AL 2', 'Domane SL 5', 'Emonda ALR 5', 'Fuel EX 8', 'FX 3'] },
    { name: 'Specialized', logoSlug: 'specialized', models: ['Allez', 'Tarmac SL8', 'Roubaix SL8', 'Diverge E5', 'Rockhopper', 'Stumpjumper', 'Sirrus X'] },
    { name: 'Cannondale', logoSlug: 'cannondale', models: ['CAAD13', 'SuperSix EVO', 'Synapse', 'Topstone', 'Trail', 'Scalpel', 'Quick'] },
    { name: 'Scott', logoSlug: 'scott', models: ['Addict RC', 'Foil RC', 'Speedster', 'Scale 970', 'Spark 940', 'Aspect 940', 'Sub Cross 50'] },
    { name: 'Bianchi', logoSlug: 'bianchi', models: ['Oltre RC', 'Specialissima', 'Infinito', 'Impulso', 'Arcadex', 'Via Nirone 7', 'C-Sport 2'] },
    { name: 'Brompton', logoSlug: 'brompton', models: ['C Line Explore', 'C Line Urban', 'P Line Explore', 'T Line Urban', 'G Line', 'Electric C Line', 'Electric P Line'] },
    { name: 'Cervelo', logoSlug: 'cervelo', models: ['R5', 'S5', 'Caledonia', 'Soloist', 'Aspero', 'P5', 'P-Series'] },
    { name: 'Merida', logoSlug: 'merida', models: ['Scultura 400', 'Scultura 6000', 'Reacto 4000', 'Silex 400', 'Big.Nine 300', 'One-Twenty 600', 'Crossway 100'] }
  ],
  water_transport: [
    { name: 'Yamaha', logoSlug: 'yamaha', models: ['FX Cruiser SVHO', 'FX Cruiser HO', 'VX Cruiser HO', 'GP SVHO', 'VX Deluxe', 'JetBlaster', 'SuperJet'] },
    { name: 'Sea-Doo', logoSlug: 'seadoo', models: ['Spark', 'Spark Trixx', 'GTI SE 170', 'GTX 170', 'RXP-X 325', 'RXT-X 325', 'FishPro Sport'] },
    { name: 'Kawasaki', logoSlug: 'kawasaki', models: ['STX 160', 'STX 160LX', 'Ultra 160LX', 'Ultra 310LX', 'Ultra 310X', 'SX-R 160', 'Ultra 310LX-S'] },
    { name: 'Bayliner', logoSlug: 'bayliner', models: ['Element M15', 'Element E16', 'Element E18', 'VR4', 'VR5', 'VR6', 'Trophy T20CC'] },
    { name: 'Quicksilver', logoSlug: 'quicksilver', models: ['Activ 505 Open', 'Activ 555 Open', 'Activ 605 Open', 'Activ 675 Open', 'Activ 755 Open', 'Activ 805 Open', 'Activ 875 Sundeck'] },
    { name: 'Beneteau', logoSlug: 'beneteau', models: ['Antares 7', 'Antares 7 Fishing', 'Antares 8', 'Antares 8 Fishing', 'Antares 9', 'Antares 11 Fly', 'Antares 12 Fly'] },
    { name: 'Jeanneau', logoSlug: 'jeanneau', models: ['Cap Camarat 5.5 CC', 'Cap Camarat 6.5 CC', 'Cap Camarat 7.5 CC', 'Merry Fisher 695', 'Merry Fisher 795', 'Merry Fisher 895', 'Sun Odyssey 349'] },
    { name: 'Axopar', logoSlug: 'axopar', models: ['22 Spyder', '25 Cross Top', '28 Cabin', '29 Sun Top', '37 Sun Top', '37 XC', '45 XC'] },
    { name: 'Highfield', logoSlug: 'highfield', models: ['Classic 260', 'Classic 310', 'Classic 340', 'Sport 360', 'Sport 420', 'Sport 520', 'Sport 660'] },
    { name: 'Zodiac', logoSlug: 'zodiac', models: ['Cadet 270 Aero', 'Cadet 310 Aero', 'Open 3.1', 'Open 4.2', 'Open 5.5', 'Medline 6.8', 'Pro 5.5'] }
  ],
  transport_parts: [
    { name: 'Bosch', logoSlug: 'bosch', models: ['S4 Battery', 'S5 Battery', 'Aerotwin', 'ICON Wiper Blades', 'QuietCast Brake Pads', 'Premium Oil Filter', 'Cabin Air Filter'] },
    { name: 'NGK', logoSlug: 'ngk', models: ['CR7HSA', 'CPR8EA-9', 'CPR9EA-9', 'BPR6ES', 'BPR7ES', 'CR8EIX', 'IFR6T11'] },
    { name: 'Brembo', logoSlug: 'brembo', models: ['Stylema', 'Hypure', 'GP4-RS', 'M4 Monoblock', 'RCS 19', 'Serie Oro', 'Prime Brake Disc'] },
    { name: 'Michelin', logoSlug: 'michelin', models: ['Pilot Street 2', 'City Grip 2', 'Road 6', 'Power 6', 'Anakee Adventure 2', 'Primacy 4+', 'Energy XM2+'] },
    { name: 'Pirelli', logoSlug: 'pirelli', models: ['Angel Scooter', 'Diablo Rosso Scooter', 'Diablo Rosso IV', 'Scorpion Rally STR', 'Cinturato P7', 'P Zero', 'Scorpion Verde'] },
    { name: 'Bridgestone', logoSlug: 'bridgestone', models: ['Battlax SC2', 'Battlax S23', 'Battlax T33', 'Battlax A41', 'Turanza T005', 'Ecopia EP150', 'Dueler H/T 684'] },
    { name: 'Ohlins', logoSlug: 'ohlins', models: ['STX 36', 'STX 46', 'TTX 22 M', 'TTX GP', 'TTX 36', 'FGR 250', 'RXF 36 M.2'] },
    { name: 'KYB', logoSlug: 'kyb', models: ['Excel-G', 'Gas-a-Just', 'AGX', 'Ultra SR', 'New SR Special', 'MonoMax', 'Skorched4s'] },
    { name: 'YSS', logoSlug: 'yss', models: ['G-Sport', 'G-Plus', 'G-Racing', 'Z-Series', 'DTG', 'Hybrid', 'TopLine'] },
    { name: 'K&N', logoSlug: 'kn', models: ['High-Flow Air Filter', 'Premium Oil Filter', 'Performance Gold Oil Filter', 'Universal Clamp-On Air Filter', 'Cabin Air Filter', 'Cold Air Intake', 'Typhoon Intake System'] }
  ]
};

export const isMarketTransportCategory = (subCategory: string): subCategory is MarketTransportCategory =>
  Object.prototype.hasOwnProperty.call(MARKET_TRANSPORT_BRANDS, subCategory);
