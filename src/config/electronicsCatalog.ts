export type ElectronicsCategory =
  | 'phones'
  | 'tablets'
  | 'computers'
  | 'photo_video_gear'
  | 'audio'
  | 'home_appliances'
  | 'electronics_accessories';

export type ElectronicsBrand = {
  name: string;
  logoSlug: string;
  logoUrl?: string;
  models: readonly string[];
};

export const ELECTRONICS_BRANDS: Record<ElectronicsCategory, readonly ElectronicsBrand[]> = {
  phones: [
    { name: 'Apple', logoSlug: 'apple', models: ['iPhone 17', 'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14'] },
    { name: 'Samsung', logoSlug: 'samsung', models: ['Galaxy S26 Ultra', 'Galaxy S26', 'Galaxy S25 Ultra', 'Galaxy S25', 'Galaxy A56', 'Galaxy A36', 'Galaxy Z Fold7'] },
    { name: 'Xiaomi', logoSlug: 'xiaomi', models: ['Xiaomi 15 Ultra', 'Xiaomi 15', 'Xiaomi 14', 'Redmi Note 14 Pro', 'Redmi Note 14', 'Redmi Note 13 Pro', 'POCO X7 Pro'] },
    { name: 'OPPO', logoSlug: 'oppo', models: ['Find X8 Pro', 'Find X8', 'Reno16 Pro', 'Reno16', 'Reno15 Pro', 'Reno15', 'Reno14'] },
    { name: 'vivo', logoSlug: 'vivo', models: ['X300 Pro', 'X300', 'X200 Pro', 'X200', 'V70', 'V60', 'V50'] },
    { name: 'Huawei', logoSlug: 'huawei', models: ['Pura 70 Pro', 'Pura 70', 'Mate 70 Pro', 'Mate X6', 'nova 13 Pro', 'nova 13', 'P60 Pro'] },
    { name: 'HONOR', logoSlug: 'honor', models: ['Magic8 Pro', 'Magic7 Pro', 'Magic V5', 'HONOR 400 Pro', 'HONOR 400', 'X9d', 'X9c'] },
    { name: 'Motorola', logoSlug: 'motorola', models: ['razr ultra 2026', 'razr 2025', 'edge 2026', 'edge 60', 'edge 50', 'moto g power 2026', 'moto g 2025'] },
    { name: 'realme', logoSlug: 'realme', logoUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Realme_logo_SVG.svg', models: ['GT 7 Pro', 'GT 7', 'GT 6', '14 Pro+', '14 Pro', 'C85', 'C75'] },
    { name: 'Google', logoSlug: 'google', models: ['Pixel 10 Pro Fold', 'Pixel 10 Pro', 'Pixel 10', 'Pixel 9 Pro XL', 'Pixel 9 Pro', 'Pixel 9', 'Pixel 9a'] }
  ],
  tablets: [
    { name: 'Apple', logoSlug: 'apple', models: ['iPad Pro 13 M5', 'iPad Pro 11 M5', 'iPad Air 13 M4', 'iPad Air 11 M4', 'iPad mini A17 Pro', 'iPad A16', 'iPad 10th generation'] },
    { name: 'Samsung', logoSlug: 'samsung', models: ['Galaxy Tab S11 Ultra', 'Galaxy Tab S11', 'Galaxy Tab S10+', 'Galaxy Tab S10 FE+', 'Galaxy Tab S10 FE', 'Galaxy Tab S10 Lite', 'Galaxy Tab A11+'] },
    { name: 'Lenovo', logoSlug: 'lenovo', models: ['Idea Tab Pro Gen 2', 'Idea Tab Pro', 'Idea Tab', 'Yoga Tab Plus', 'Yoga Tab', 'Legion Tab', 'Tab M11'] },
    { name: 'Huawei', logoSlug: 'huawei', models: ['MatePad Pro 13.2', 'MatePad Pro 12.2', 'MatePad 12 X', 'MatePad 11.5 S', 'MatePad 11.5', 'MatePad Air', 'MatePad SE 11'] },
    { name: 'Xiaomi', logoSlug: 'xiaomi', models: ['Xiaomi Pad 8 Pro', 'Xiaomi Pad 8', 'Xiaomi Pad 7 Pro', 'Xiaomi Pad 7', 'Redmi Pad 2 Pro', 'Redmi Pad 2', 'Redmi Pad SE'] },
    { name: 'HONOR', logoSlug: 'honor', models: ['MagicPad 3', 'MagicPad 2', 'Pad 10', 'Pad 9', 'Pad X9b', 'Pad X9a', 'Pad X8a'] },
    { name: 'Amazon', logoSlug: 'amazon', logoUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Amazon_logo.svg', models: ['Fire Max 11', 'Fire HD 10', 'Fire HD 8 Plus', 'Fire HD 8', 'Fire 7', 'Fire HD 10 Kids Pro', 'Fire HD 10 Kids'] },
    { name: 'Microsoft', logoSlug: 'microsoft', logoUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Microsoft_logo.svg', models: ['Surface Pro 11', 'Surface Pro 10', 'Surface Pro 9', 'Surface Pro 8', 'Surface Go 4', 'Surface Go 3', 'Surface Pro X'] },
    { name: 'TCL', logoSlug: 'tcl', logoUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Logo_of_the_TCL_Corporation.svg', models: ['NXTPAPER 14', 'NXTPAPER 11 Plus', 'NXTPAPER 11 Gen 2', 'TAB 10 NXTPAPER', 'TAB 8 NXTPAPER', 'TAB 8 SE', 'TAB 10 Gen 4'] },
    { name: 'OPPO', logoSlug: 'oppo', models: ['Pad 5', 'Pad 4 Pro', 'Pad 3 Pro', 'Pad 3', 'Pad 2', 'Pad SE', 'Pad Neo'] }
  ],
  computers: [
    { name: 'Lenovo', logoSlug: 'lenovo', models: ['ThinkPad X1 Carbon', 'ThinkPad T14', 'ThinkPad E14', 'Yoga 9i', 'IdeaPad Slim 5', 'Legion 5', 'LOQ 15'] },
    { name: 'HP', logoSlug: 'hp', models: ['Pavilion 15', 'Envy x360 14', 'Spectre x360 14', 'OMEN 16', 'Victus 15', 'EliteBook 840', 'ProBook 450'] },
    { name: 'Dell', logoSlug: 'dell', models: ['XPS 13', 'XPS 15', 'Inspiron 15', 'Latitude 5450', 'Latitude 7440', 'Alienware m16', 'Precision 5680'] },
    { name: 'Apple', logoSlug: 'apple', models: ['MacBook Air 13 M4', 'MacBook Air 15 M4', 'MacBook Pro 14 M4', 'MacBook Pro 16 M4', 'Mac mini M4', 'iMac M4', 'Mac Studio M4'] },
    { name: 'ASUS', logoSlug: 'asus', models: ['Zenbook 14 OLED', 'Vivobook 15', 'Vivobook S 14', 'ROG Zephyrus G14', 'ROG Strix G16', 'TUF Gaming A15', 'ProArt P16'] },
    { name: 'Acer', logoSlug: 'acer', models: ['Aspire 5', 'Aspire 3', 'Swift Go 14', 'Swift 14', 'Nitro V 15', 'Predator Helios 16', 'TravelMate P2'] },
    { name: 'MSI', logoSlug: 'msi', models: ['Katana 15', 'Cyborg 15', 'Thin 15', 'Stealth 16 AI', 'Raider GE78 HX', 'Prestige 13 AI Evo', 'Modern 14'] },
    { name: 'Samsung', logoSlug: 'samsung', models: ['Galaxy Book6 Ultra', 'Galaxy Book6 Pro', 'Galaxy Book6', 'Galaxy Book5 Ultra', 'Galaxy Book5 Pro', 'Galaxy Book5', 'Galaxy Book4'] },
    { name: 'Huawei', logoSlug: 'huawei', models: ['MateBook X Pro', 'MateBook 14s', 'MateBook 14', 'MateBook 16', 'MateBook D 14', 'MateBook D 16', 'MateBook GT 14'] },
    { name: 'Microsoft', logoSlug: 'microsoft', logoUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Microsoft_logo.svg', models: ['Surface Laptop 7', 'Surface Laptop 6', 'Surface Laptop 5', 'Surface Laptop Studio 2', 'Surface Pro 11', 'Surface Pro 10', 'Surface Pro 9'] }
  ],
  photo_video_gear: [
    { name: 'Canon', logoSlug: 'canon', models: ['EOS R5 Mark II', 'EOS R6 Mark II', 'EOS R8', 'EOS R7', 'EOS R10', 'EOS R50', 'PowerShot G7 X Mark III'] },
    { name: 'Sony', logoSlug: 'sony', models: ['Alpha 1 II', 'Alpha 7 IV', 'Alpha 7R V', 'Alpha 7C II', 'Alpha 6700', 'ZV-E10 II', 'FX3'] },
    { name: 'Nikon', logoSlug: 'nikon', models: ['Z9', 'Z8', 'Z6III', 'Z5II', 'Zf', 'Z50II', 'Z30'] },
    { name: 'Fujifilm', logoSlug: 'fujifilm', models: ['X-T5', 'X-T50', 'X-S20', 'X100VI', 'X-H2', 'X-H2S', 'GFX100S II'] },
    { name: 'Panasonic', logoSlug: 'panasonic', models: ['LUMIX S1RII', 'LUMIX S5II', 'LUMIX S5IIX', 'LUMIX GH7', 'LUMIX G9II', 'LUMIX S9', 'LUMIX G100D'] },
    { name: 'DJI', logoSlug: 'dji', models: ['Osmo Pocket 3', 'Osmo Action 5 Pro', 'Osmo Action 4', 'Osmo 360', 'Mini 4 Pro', 'Air 3S', 'Mavic 3 Pro'] },
    { name: 'GoPro', logoSlug: 'gopro', models: ['HERO13 Black', 'HERO12 Black', 'HERO11 Black', 'HERO10 Black', 'HERO', 'MAX', 'MAX2'] },
    { name: 'Insta360', logoSlug: 'insta360', models: ['X5', 'X4', 'X3', 'Ace Pro 2', 'Ace Pro', 'GO 3S', 'GO 3'] },
    { name: 'OM System', logoSlug: 'omsystem', models: ['OM-1 Mark II', 'OM-1', 'OM-5', 'OM-3', 'PEN E-P7', 'Tough TG-7', 'E-M10 IV'] },
    { name: 'Blackmagic Design', logoSlug: 'blackmagicdesign', models: ['Pocket Cinema Camera 6K Pro', 'Pocket Cinema Camera 6K G2', 'Pocket Cinema Camera 4K', 'Cinema Camera 6K', 'PYXIS 6K', 'URSA Broadcast G2', 'URSA Mini Pro 12K'] }
  ],
  audio: [
    { name: 'Sony', logoSlug: 'sony', models: ['WH-1000XM6', 'WH-1000XM5', 'WF-1000XM6', 'WF-1000XM5', 'ULT WEAR', 'LinkBuds S', 'ULT FIELD 1'] },
    { name: 'JBL', logoSlug: 'jbl', models: ['Flip 7', 'Flip 6', 'Charge 6', 'Charge 5', 'Boombox 3', 'Xtreme 4', 'Tune 770NC'] },
    { name: 'Bose', logoSlug: 'bose', models: ['QuietComfort Ultra Headphones', 'QuietComfort Headphones', 'QuietComfort Ultra Earbuds', 'QuietComfort Earbuds', 'SoundLink Flex', 'SoundLink Max', 'SoundLink Revolve+ II'] },
    { name: 'Apple', logoSlug: 'apple', models: ['AirPods Pro 3', 'AirPods Pro 2', 'AirPods 4', 'AirPods Max', 'HomePod', 'HomePod mini', 'EarPods USB-C'] },
    { name: 'Samsung', logoSlug: 'samsung', models: ['Galaxy Buds3 Pro', 'Galaxy Buds3', 'Galaxy Buds2 Pro', 'Galaxy Buds2', 'Galaxy Buds FE', 'Galaxy Buds Live', 'Galaxy Buds Pro'] },
    { name: 'Marshall', logoSlug: 'marshall', models: ['Major V', 'Minor IV', 'Monitor III A.N.C.', 'Motif II A.N.C.', 'Emberton III', 'Middleton', 'Stanmore III'] },
    { name: 'Sennheiser', logoSlug: 'sennheiser', models: ['MOMENTUM 4 Wireless', 'MOMENTUM True Wireless 4', 'ACCENTUM Wireless', 'ACCENTUM Plus Wireless', 'HD 600', 'HD 650', 'HD 560S'] },
    { name: 'Soundcore', logoSlug: 'soundcore', models: ['Liberty 4 NC', 'Liberty 4 Pro', 'Space One', 'Space Q45', 'Motion 300', 'Motion Boom Plus', 'Boom 2'] },
    { name: 'Beats', logoSlug: 'beats', models: ['Studio Pro', 'Solo 4', 'Studio Buds+', 'Solo Buds', 'Powerbeats Pro 2', 'Fit Pro', 'Pill'] },
    { name: 'Audio-Technica', logoSlug: 'audiotechnica', models: ['ATH-M50x', 'ATH-M50xBT2', 'ATH-M40x', 'ATH-R70x', 'ATH-AD700X', 'ATH-SR50BT', 'AT-LP120XUSB'] }
  ],
  home_appliances: [
    { name: 'Samsung', logoSlug: 'samsung', models: ['Bespoke AI Laundry Combo', 'Bespoke Jet AI', 'Bespoke Jet Bot Combo AI', 'Bespoke 4-Door Flex', 'Bespoke Family Hub', 'Bespoke AI Oven', 'WindFree Air Conditioner'] },
    { name: 'LG', logoSlug: 'lg', models: ['WashTower', 'Styler', 'InstaView Door-in-Door', 'QuadWash', 'CordZero A9', 'PuriCare 360', 'NeoChef'] },
    { name: 'Bosch', logoSlug: 'bosch', models: ['WGG434E0ID', 'WGG444E0ID', 'WGG454E0ID', 'SMS24AI01Z', 'KFI96AXEA', 'HBG7341B1', 'BGS05AAA1'] },
    { name: 'Philips', logoSlug: 'philips', models: ['Airfryer XXL HD9650', 'Airfryer 3000 HD9252', 'Airfryer 5000 HD9285', 'AquaTrio 9000', 'SpeedPro Max', 'PerfectCare 7000', 'LatteGo 5400'] },
    { name: 'Electrolux', logoSlug: 'electrolux', models: ['UltimateHome 900', 'UltimateHome 700', 'UltimateCare 900', 'UltimateCare 500', 'UltimateTaste 700', 'UltimateTaste 500', 'Explore 6 Air Fryer'] },
    { name: 'Panasonic', logoSlug: 'panasonic', models: ['NA-F90A9', 'NR-BB211Q', 'MX-EX1011', 'NN-ST34', 'MC-CL575', 'F-PXJ30', 'Nanoe X Air Conditioner'] },
    { name: 'Xiaomi', logoSlug: 'xiaomi', models: ['Robot Vacuum X20 Max', 'Robot Vacuum X20+', 'Robot Vacuum S20+', 'Robot Vacuum S10', 'Smart Air Purifier 4', 'Smart Air Purifier 4 Lite', 'Smart Standing Fan 2 Pro'] },
    { name: 'Dyson', logoSlug: 'dyson', models: ['V8', 'Cyclone V10 Absolute', 'V11', 'V12 Detect Slim', 'V15 Detect', 'Gen5detect', 'Purifier Cool TP07'] },
    { name: 'DeLonghi', logoSlug: 'delonghi', models: ['Magnifica S', 'Magnifica Evo', 'Dinamica Plus', 'Dedica EC685', 'La Specialista Arte', 'Eletta Explore', 'Rivelia'] },
    { name: 'Ninja', logoSlug: 'ninja', models: ['Air Fryer AF100', 'Air Fryer Max AF160', 'Foodi Dual Zone AF300', 'Foodi Max Dual Zone AF400', 'Foodi Grill AG551', 'CREAMi NC301', 'Professional Blender BN701'] }
  ],
  electronics_accessories: [
    { name: 'Anker', logoSlug: 'anker', models: ['737 Power Bank', '735 Charger', '747 Charger', 'Prime 27650mAh Power Bank', 'Nano 30W Charger', 'MagGo Power Bank 10K', 'USB-C Hub 7-in-1'] },
    { name: 'UGREEN', logoSlug: 'ugreen', models: ['Nexode 145W Power Bank', 'Nexode 200W Power Bank', 'Nexode 100W Charger', 'Nexode Pro 160W Charger', 'Revodok Pro 9-in-1', 'Revodok Max 13-in-1', 'MagFlow Qi2 Power Bank'] },
    { name: 'Baseus', logoSlug: 'baseus', models: ['Blade 100W', 'Blade 2', 'Bipow 20W', 'Adaman 65W', 'GaN5 Pro 100W', 'Magnetic Mini 6000mAh', '9-in-1 USB-C Hub'] },
    { name: 'Belkin', logoSlug: 'belkin', models: ['BoostCharge Pro 3-in-1', 'BoostCharge Pro Magnetic Power Bank 10K', 'BoostCharge USB-C PD 20W', 'Connect USB-C 7-in-1', 'Connect Thunderbolt 4 Dock', 'ScreenForce UltraGlass 2', 'Auto-Tracking Stand Pro'] },
    { name: 'Logitech', logoSlug: 'logitech', models: ['MX Master 3S', 'MX Anywhere 3S', 'MX Keys S', 'MX Mechanical', 'Lift Vertical', 'Brio 4K', 'C920 HD Pro'] },
    { name: 'Apple', logoSlug: 'apple', models: ['AirTag', 'MagSafe Charger', 'Magic Keyboard', 'Magic Mouse', 'Magic Trackpad', 'USB-C Digital AV Multiport Adapter', '35W Dual USB-C Power Adapter'] },
    { name: 'Samsung', logoSlug: 'samsung', models: ['45W Power Adapter', '25W Power Adapter', 'Wireless Charger Duo', 'Battery Pack 20000mAh', 'Galaxy SmartTag2', 'Book Cover Keyboard', 'S Pen Pro'] },
    { name: 'Xiaomi', logoSlug: 'xiaomi', models: ['67W Charging Combo', '120W HyperCharge Combo', '33W Power Bank 20000mAh', 'Redmi Power Bank 20000mAh', 'Wireless Charging Stand 20W', 'Xiaomi Pad Keyboard', 'Xiaomi Smart Pen'] },
    { name: 'Spigen', logoSlug: 'spigen', models: ['Tough Armor', 'Ultra Hybrid', 'Liquid Air', 'Rugged Armor', 'Optik Armor', 'EZ Fit Tempered Glass', 'ArcStation Pro 45W'] },
    { name: 'SanDisk', logoSlug: 'sandisk', models: ['Extreme Portable SSD', 'Extreme PRO Portable SSD', 'Ultra microSDXC', 'Extreme microSDXC', 'Extreme PRO SDXC', 'Ultra Dual Drive Go', 'iXpand Flash Drive Luxe'] }
  ]
};

export const isElectronicsCategory = (subCategory: string): subCategory is ElectronicsCategory =>
  Object.prototype.hasOwnProperty.call(ELECTRONICS_BRANDS, subCategory);
