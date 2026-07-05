import type { CountryCode } from 'libphonenumber-js';

export type PhoneFormatPattern = {
  mask: string;
  regex: string;
};

export type PhoneCountryFormat = {
  iso: CountryCode;
  nameRu: string;
  nameEn: string;
  countryCode: string;
  international: PhoneFormatPattern;
  national: PhoneFormatPattern;
};

const PHONE_FORMATS_TSV = String.raw`Россия	Russia	RU	+7	+7 (9XX) XXX-XX-XX	^\+7\s?\(?9\d{2}\)?\s?\d{3}-\d{2}-\d{2}$	8 (9XX) XXX-XX-XX	^8\s?\(?9\d{2}\)?\s?\d{3}-\d{2}-\d{2}$
Казахстан	Kazakhstan	KZ	+7	+7 (7XX) XXX-XX-XX	^\+7\s?\(?7\d{2}\)?\s?\d{3}-\d{2}-\d{2}$	8 (7XX) XXX-XX-XX	^8\s?\(?7\d{2}\)?\s?\d{3}-\d{2}-\d{2}$
Беларусь	Belarus	BY	+375	+375 (XX) XXX-XX-XX	^\+375\s?\(?\d{2}\)?\s?\d{3}-\d{2}-\d{2}$	8 (0XX) XXX-XX-XX	^8\s?\(?0\d{2}\)?\s?\d{3}-\d{2}-\d{2}$
Украина	Ukraine	UA	+380	+380 (XX) XXX-XX-XX	^\+380\s?\(?\d{2}\)?\s?\d{3}-\d{2}-\d{2}$	0 (XX) XXX-XX-XX	^0\s?\(?\d{2}\)?\s?\d{3}-\d{2}-\d{2}$
Узбекистан	Uzbekistan	UZ	+998	+998 (XX) XXX-XX-XX	^\+998\s?\(?\d{2}\)?\s?\d{3}-\d{2}-\d{2}$	(XX) XXX-XX-XX	^\(?\d{2}\)?\s?\d{3}-\d{2}-\d{2}$
США	United States	US	+1	+1 (XXX) XXX-XXXX	^\+1\s?\(?\d{3}\)?\s?\d{3}-\d{4}$	(XXX) XXX-XXXX	^\(?\d{3}\)?\s?\d{3}-\d{4}$
Канада	Canada	CA	+1	+1 (XXX) XXX-XXXX	^\+1\s?\(?\d{3}\)?\s?\d{3}-\d{4}$	(XXX) XXX-XXXX	^\(?\d{3}\)?\s?\d{3}-\d{4}$
Великобритания	United Kingdom	GB	+44	+44 XXXX XXXXXX	^\+44\s?\d{4}\s?\d{6}$	0XXXX XXXXXX	^0\d{4}\s?\d{6}$
Германия	Germany	DE	+49	+49 XXX XXXXXXX	^\+49\s?\d{3}\s?\d{7}$	0XXX XXXXXXX	^0\d{3}\s?\d{7}$
Франция	France	FR	+33	+33 X XX XX XX XX	^\+33\s?\d\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$	0X XX XX XX XX	^0\d\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$
Италия	Italy	IT	+39	+39 XXX XXXXXXX	^\+39\s?\d{3}\s?\d{7}$	XXX XXXXXXX	^\d{3}\s?\d{7}$
Испания	Spain	ES	+34	+34 X XXX XXXX	^\+34\s?\d\s?\d{3}\s?\d{4}$	X XXX XXXX	^\d\s?\d{3}\s?\d{4}$
Польша	Poland	PL	+48	+48 XXX XXX XXX	^\+48\s?\d{3}\s?\d{3}\s?\d{3}$	XXX XXX XXX	^\d{3}\s?\d{3}\s?\d{3}$
Индонезия	Indonesia	ID	+62	+62 XXX-XXXX-XXXX-XX	^\+62\d{9,13}$	0XXX-XXXX-XXXX-XX	^0\d{9,13}$
Афганистан	Afghanistan	AF	+93	+93 XXX XXX XXX	^\+93\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Албания	Albania	AL	+355	+355 XXX XXX XXX	^\+355\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Алжир	Algeria	DZ	+213	+213 XXX XXX XXX	^\+213\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Ангола	Angola	AO	+244	+244 XXX XXX XXX	^\+244\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Аргентина	Argentina	AR	+54	+54 XXX XXX XXX	^\+54\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Аруба	Aruba	AW	+297	+297 XXX XXX XXX	^\+297\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Багамы	Bahamas	BS	+1	+1 XXX XXX XXX	^\+1\d{7,10}$	(XXX) XXX-XXXX	^\(?\d{3}\)?\s?\d{3}-\d{4}$
Бахрейн	Bahrain	BH	+973	+973 XXX XXX XXX	^\+973\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Бангладеш	Bangladesh	BD	+880	+880 XXX XXX XXX	^\+880\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Барбадос	Barbados	BB	+1	+1 XXX XXX XXX	^\+1\d{7,10}$	(XXX) XXX-XXXX	^\(?\d{3}\)?\s?\d{3}-\d{4}$
Белиз	Belize	BZ	+501	+501 XXX XXX XXX	^\+501\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Бенин	Benin	BJ	+229	+229 XXX XXX XXX	^\+229\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Бермуды	Bermuda	BM	+1	+1 XXX XXX XXX	^\+1\d{7,10}$	(XXX) XXX-XXXX	^\(?\d{3}\)?\s?\d{3}-\d{4}$
Бутан	Bhutan	BT	+975	+975 XXX XXX XXX	^\+975\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Боливия	Bolivia	BO	+591	+591 XXX XXX XXX	^\+591\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Босния	Bosnia	BA	+387	+387 XXX XXX XXX	^\+387\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Ботсвана	Botswana	BW	+267	+267 XXX XXX XXX	^\+267\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Бруней	Brunei	BN	+673	+673 XXX XXX XXX	^\+673\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Буркина-Фасо	Burkina Faso	BF	+226	+226 XXX XXX XXX	^\+226\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Бурунди	Burundi	BI	+257	+257 XXX XXX XXX	^\+257\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Камбоджа	Cambodia	KH	+855	+855 XXX XXX XXX	^\+855\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Камерун	Cameroon	CM	+237	+237 XXX XXX XXX	^\+237\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Кабо-Верде	Cape Verde	CV	+238	+238 XXX XXX XXX	^\+238\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
ЦАР	Central African Rep	CF	+236	+236 XXX XXX XXX	^\+236\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Чад	Chad	TD	+235	+235 XXX XXX XXX	^\+235\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Чили	Chile	CL	+56	+56 XXX XXX XXX	^\+56\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Колумбия	Colombia	CO	+57	+57 XXX XXX XXX	^\+57\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Коморы	Comoros	KM	+269	+269 XXX XXX XXX	^\+269\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Конго	Congo	CG	+242	+242 XXX XXX XXX	^\+242\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Коста-Рика	Costa Rica	CR	+506	+506 XXX XXX XXX	^\+506\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Куба	Cuba	CU	+53	+53 XXX XXX XXX	^\+53\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Джибути	Djibouti	DJ	+253	+253 XXX XXX XXX	^\+253\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Доминика	Dominica	DM	+1	+1 XXX XXX XXX	^\+1\d{7,10}$	(XXX) XXX-XXXX	^\(?\d{3}\)?\s?\d{3}-\d{4}$
Доминикана	Dominican Rep	DO	+1	+1 XXX XXX XXX	^\+1\d{7,10}$	(XXX) XXX-XXXX	^\(?\d{3}\)?\s?\d{3}-\d{4}$
Эквадор	Ecuador	EC	+593	+593 XXX XXX XXX	^\+593\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Сальвадор	El Salvador	SV	+503	+503 XXX XXX XXX	^\+503\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Экваториальная Гвинея	Equatorial Guinea	GQ	+240	+240 XXX XXX XXX	^\+240\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Эритрея	Eritrea	ER	+291	+291 XXX XXX XXX	^\+291\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Эфиопия	Ethiopia	ET	+251	+251 XXX XXX XXX	^\+251\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Фиджи	Fiji	FJ	+679	+679 XXX XXX XXX	^\+679\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Габон	Gabon	GA	+241	+241 XXX XXX XXX	^\+241\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Гамбия	Gambia	GM	+220	+220 XXX XXX XXX	^\+220\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Гана	Ghana	GH	+233	+233 XXX XXX XXX	^\+233\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Гренада	Grenada	GD	+1	+1 XXX XXX XXX	^\+1\d{7,10}$	(XXX) XXX-XXXX	^\(?\d{3}\)?\s?\d{3}-\d{4}$
Гватемала	Guatemala	GT	+502	+502 XXX XXX XXX	^\+502\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Гвинея	Guinea	GN	+224	+224 XXX XXX XXX	^\+224\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Гвинея-Биссау	Guinea-Bissau	GW	+245	+245 XXX XXX XXX	^\+245\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Гайана	Guyana	GY	+592	+592 XXX XXX XXX	^\+592\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Гаити	Haiti	HT	+509	+509 XXX XXX XXX	^\+509\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Гондурас	Honduras	HN	+504	+504 XXX XXX XXX	^\+504\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Гонконг	Hong Kong	HK	+852	+852 XXX XXX XXX	^\+852\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Исландия	Iceland	IS	+354	+354 XXX XXX XXX	^\+354\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Иран	Iran	IR	+98	+98 XXX XXX XXX	^\+98\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Ирак	Iraq	IQ	+964	+964 XXX XXX XXX	^\+964\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Ямайка	Jamaica	JM	+1	+1 XXX XXX XXX	^\+1\d{7,10}$	(XXX) XXX-XXXX	^\(?\d{3}\)?\s?\d{3}-\d{4}$
Иордания	Jordan	JO	+962	+962 XXX XXX XXX	^\+962\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Кения	Kenya	KE	+254	+254 XXX XXX XXX	^\+254\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Кувейт	Kuwait	KW	+965	+965 XXX XXX XXX	^\+965\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Лаос	Laos	LA	+856	+856 XXX XXX XXX	^\+856\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Ливан	Lebanon	LB	+961	+961 XXX XXX XXX	^\+961\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Лесото	Lesotho	LS	+266	+266 XXX XXX XXX	^\+266\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Либерия	Liberia	LR	+231	+231 XXX XXX XXX	^\+231\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Ливия	Libya	LY	+218	+218 XXX XXX XXX	^\+218\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Лихтенштейн	Liechtenstein	LI	+423	+423 XXX XXX XXX	^\+423\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Макао	Macau	MO	+853	+853 XXX XXX XXX	^\+853\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Мадагаскар	Madagascar	MG	+261	+261 XXX XXX XXX	^\+261\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Малави	Malawi	MW	+265	+265 XXX XXX XXX	^\+265\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Мальдивы	Maldives	MV	+960	+960 XXX XXX XXX	^\+960\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Мали	Mali	ML	+223	+223 XXX XXX XXX	^\+223\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Мавритания	Mauritania	MR	+222	+222 XXX XXX XXX	^\+222\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Маврикий	Mauritius	MU	+230	+230 XXX XXX XXX	^\+230\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Монако	Monaco	MC	+377	+377 XXX XXX XXX	^\+377\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Монголия	Mongolia	MN	+976	+976 XXX XXX XXX	^\+976\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Черногория	Montenegro	ME	+382	+382 XXX XXX XXX	^\+382\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Марокко	Morocco	MA	+212	+212 XXX XXX XXX	^\+212\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Мозамбик	Mozambique	MZ	+258	+258 XXX XXX XXX	^\+258\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Мьянма	Myanmar	MM	+95	+95 XXX XXX XXX	^\+95\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Намибия	Namibia	NA	+264	+264 XXX XXX XXX	^\+264\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Непал	Nepal	NP	+977	+977 XXX XXX XXX	^\+977\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Никарагуа	Nicaragua	NI	+505	+505 XXX XXX XXX	^\+505\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Нигер	Niger	NE	+227	+227 XXX XXX XXX	^\+227\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Нигерия	Nigeria	NG	+234	+234 XXX XXX XXX	^\+234\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Оман	Oman	OM	+968	+968 XXX XXX XXX	^\+968\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Пакистан	Pakistan	PK	+92	+92 XXX XXX XXX	^\+92\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Панама	Panama	PA	+507	+507 XXX XXX XXX	^\+507\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Папуа-Новая Гвинея	Papua New Guinea	PG	+675	+675 XXX XXX XXX	^\+675\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Парагвай	Paraguay	PY	+595	+595 XXX XXX XXX	^\+595\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Перу	Peru	PE	+51	+51 XXX XXX XXX	^\+51\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Филиппины	Philippines	PH	+63	+63 XXX XXX XXX	^\+63\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Катар	Qatar	QA	+974	+974 XXX XXX XXX	^\+974\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Руанда	Rwanda	RW	+250	+250 XXX XXX XXX	^\+250\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Самоа	Samoa	WS	+685	+685 XXX XXX XXX	^\+685\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Сан-Марино	San Marino	SM	+378	+378 XXX XXX XXX	^\+378\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Сан-Томе	Sao Tome	ST	+239	+239 XXX XXX XXX	^\+239\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Сенегал	Senegal	SN	+221	+221 XXX XXX XXX	^\+221\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Сербия	Serbia	RS	+381	+381 XXX XXX XXX	^\+381\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Сейшелы	Seychelles	SC	+248	+248 XXX XXX XXX	^\+248\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Сьерра-Леоне	Sierra Leone	SL	+232	+232 XXX XXX XXX	^\+232\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Соломоновы Острова	Solomon Islands	SB	+677	+677 XXX XXX XXX	^\+677\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Сомали	Somalia	SO	+252	+252 XXX XXX XXX	^\+252\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Шри-Ланка	Sri Lanka	LK	+94	+94 XXX XXX XXX	^\+94\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Судан	Sudan	SD	+249	+249 XXX XXX XXX	^\+249\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Суринам	Suriname	SR	+597	+597 XXX XXX XXX	^\+597\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Эсватини	Eswatini	SZ	+268	+268 XXX XXX XXX	^\+268\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Сирия	Syria	SY	+963	+963 XXX XXX XXX	^\+963\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Тайвань	Taiwan	TW	+886	+886 XXX XXX XXX	^\+886\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Танзания	Tanzania	TZ	+255	+255 XXX XXX XXX	^\+255\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Того	Togo	TG	+228	+228 XXX XXX XXX	^\+228\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Тонга	Tonga	TO	+676	+676 XXX XXX XXX	^\+676\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Тринидад	Trinidad	TT	+1	+1 XXX XXX XXX	^\+1\d{7,10}$	(XXX) XXX-XXXX	^\(?\d{3}\)?\s?\d{3}-\d{4}$
Тунис	Tunisia	TN	+216	+216 XXX XXX XXX	^\+216\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Уганда	Uganda	UG	+256	+256 XXX XXX XXX	^\+256\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Уругвай	Uruguay	UY	+598	+598 XXX XXX XXX	^\+598\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Венесуэла	Venezuela	VE	+58	+58 XXX XXX XXX	^\+58\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Йемен	Yemen	YE	+967	+967 XXX XXX XXX	^\+967\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Замбия	Zambia	ZM	+260	+260 XXX XXX XXX	^\+260\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$
Зимбабве	Zimbabwe	ZW	+263	+263 XXX XXX XXX	^\+263\d{7,10}$	0XXX XXX XXX	^0\d{7,10}$`;

export const PHONE_COUNTRY_FORMATS = PHONE_FORMATS_TSV
  .trim()
  .split('\n')
  .map((line): PhoneCountryFormat => {
    const [
      nameRu,
      nameEn,
      iso,
      countryCode,
      internationalMask,
      internationalRegex,
      nationalMask,
      nationalRegex
    ] = line.split('\t');

    return {
      iso: iso as CountryCode,
      nameRu,
      nameEn,
      countryCode: countryCode.replace(/^\+/, ''),
      international: {
        mask: internationalMask,
        regex: internationalRegex
      },
      national: {
        mask: nationalMask,
        regex: nationalRegex
      }
    };
  });

export const PHONE_COUNTRY_FORMATS_BY_ISO = PHONE_COUNTRY_FORMATS.reduce((acc, format) => {
  acc[format.iso] = format;
  return acc;
}, {} as Partial<Record<CountryCode, PhoneCountryFormat>>);

export const getPhoneCountryFormat = (country?: CountryCode) => {
  if (!country) return undefined;
  return PHONE_COUNTRY_FORMATS_BY_ISO[country];
};
