export interface DzikirItem {
  id: string;
  title: string;
  category: 'pagi' | 'petang' | 'keduanya';
  targetCount: number;
  arabicText: string;
  latinText: string;
  translationId: string;
  benefit: string;
  reference: string;
}

export interface DoaTahfizItem {
  id: string;
  title: string;
  category: 'sebelum_hafalan' | 'keteguhan_hafalan' | 'sesudah_hafalan' | 'khotmil_quran' | 'kedua_orangtua';
  arabicText: string;
  latinText: string;
  translationId: string;
  notes: string;
}

export const DZIKIR_PAGI_PETANG_LIST: DzikirItem[] = [
  {
    id: 'dzikir_ayat_kursi',
    title: 'Ayat Kursi (QS. Al-Baqarah: 255)',
    category: 'keduanya',
    targetCount: 1,
    arabicText: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    latinText: 'Allahu laa ilaaha illaa huwal-hayyul qayyuum, laa ta\'khudzuhuu sinatuw-wa laa naum, lahuu maa fis-samaawaati wa maa fil-ardh, man dzalladzii yasyfa\'u \'indahuu illaa bi-idznih, ya\'lamu maa baina aidiihim wa maa khalfahum, wa laa yuhiithuuna bi syai-im min \'ilmihii illaa bimaa syaa\', wasi\'a kursiyyuhus-samaawaati wal-ardh, wa laa ya-uuduhuu hifzhuhumaa, wa huwal-\'aliyyul-\'azhiim.',
    translationId: 'Allah, tidak ada tuhan selain Dia, Yang Mahahidup, yang terus-menerus mengurus makhluk-Nya, tidak mengantuk dan tidak tidur. Milik-Nya apa yang ada di langit dan bumi. Tidak ada yang dapat memberi syafaat di sisi-Nya tanpa izin-Nya. Dia mengetahui apa yang di hadapan dan belakang mereka... Dan Dia Mahatinggi lagi Mahabesar.',
    benefit: 'Siapa yang membacanya di pagi hari akan dilindungi dari gangguan setan hingga petang, dan yang membacanya di petang hari dilindungi hingga pagi hari.',
    reference: 'HR. An-Nasa\'i & Ibnu Hibban'
  },
  {
    id: 'dzikir_muawwidzatain',
    title: 'Tiga Surat Perlindungan (Al-Ikhlas, Al-Falaq, An-Nas)',
    category: 'keduanya',
    targetCount: 3,
    arabicText: 'قُلْ هُوَ اللَّهُ أَحَدٌ ... قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ... قُلْ أَعُوذُ بِرَبِّ النَّاسِ ...',
    latinText: 'Membaca Surat Al-Ikhlas, Surat Al-Falaq, dan Surat An-Nas masing-masing sebanyak 3 kali.',
    translationId: 'Membaca Surat Al-Ikhlas, Al-Falaq, dan An-Nas secara lengkap.',
    benefit: 'Barangsiapa membaca ketiganya sebanyak 3 kali setiap pagi dan petang, niscaya Allah mencukupkan baginya dari segala keburukan dan marabahaya.',
    reference: 'HR. Abu Dawud & At-Tirmidzi (Hasan Shahih)'
  },
  {
    id: 'dzikir_sayyidul_istighfar',
    title: 'Sayyidul Istighfar (Rajanya Istighfar)',
    category: 'keduanya',
    targetCount: 1,
    arabicText: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    latinText: 'Allaahumma anta robbii laa ilaaha illaa anta, kholaqtanii wa ana \'abduka, wa ana \'alaa \'ahdika wa wa\'dika mastatho\'tu, a\'uudzu bika min syarri maa shona\'tu, abuu-u laka bini\'matika \'alayya, wa abuu-u bidzambii faghfir lii fa-innahuu laa yaghfirudz-dzunuuba illaa anta.',
    translationId: 'Ya Allah, Engkau adalah Tuhanku, tidak ada Tuhan selain Engkau. Engkau yang menciptakan aku dan aku adalah hamba-Mu. Aku berada dalam janji dan ikrar-Mu semampuku. Aku berlindung kepada-Mu dari keburukan apa yang kuperbuat. Aku mengakui segala nikmat-Mu kepadaku dan aku mengakui dosaku, maka ampunilah aku, sesungguhnya tidak ada yang mengampuni dosa-dosa selain Engkau.',
    benefit: 'Barangsiapa membacanya di pagi hari dengan penuh keyakinan lalu meninggal sebelum petang, ia termasuk penghuni surga; demikian pula bila dibaca di petang hari.',
    reference: 'HR. Al-Bukhari no. 6306'
  },
  {
    id: 'dzikir_ashbahna_mulku',
    title: 'Dzikir Masuk Pagi',
    category: 'pagi',
    targetCount: 1,
    arabicText: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ',
    latinText: 'Ash-bahnaa wa ash-bahal mulku lillaahi wal-hamdu lillaah, laa ilaaha illallaahu wahdahuu laa syariika lah, lahul-mulku wa lahul-hamdu wa huwa \'alaa kulli syai-in qodiir, Robbi as-aluka khoiro maa fii haadzal-yaumi wa khoiro maa ba\'dahuu, wa a\'uudzu bika min syarri maa fii haadzal-yaumi wa syarri maa ba\'dahuu.',
    translationId: 'Kami telah memasuki waktu pagi dan kerajaan hanya milik Allah, segala puji bagi Allah. Tidak ada sesembahan yang berhak disembah kecuali Allah semata, tidak ada sekutu bagi-Nya. Bagi-Nya kerajaan dan bagi-Nya pujian, dan Dia Mahakuasa atas segala sesuatu. Wahai Rabbku, aku memohon kepada-Mu kebaikan yang ada pada hari ini dan kebaikan setelahnya...',
    benefit: 'Menyerahkan diri seutuhnya kepada Allah sejak fajar menyingsing, memohon berkah hari dan perlindungan dari malas & takdir buruk.',
    reference: 'HR. Muslim no. 2723'
  },
  {
    id: 'dzikir_amsayna_mulku',
    title: 'Dzikir Masuk Petang',
    category: 'petang',
    targetCount: 1,
    arabicText: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا',
    latinText: 'Amsaynaa wa amsal mulku lillaahi wal-hamdu lillaah, laa ilaaha illallaahu wahdahuu laa syariika lah, lahul-mulku wa lahul-hamdu wa huwa \'alaa kulli syai-in qodiir, Robbi as-aluka khoiro maa fii haadzihil-lailati wa khoiro maa ba\'dahaa, wa a\'uudzu bika min syarri maa fii haadzihil-lailati wa syarri maa ba\'dahaa.',
    translationId: 'Kami telah memasuki waktu petang dan kerajaan hanya milik Allah, segala puji bagi Allah...',
    benefit: 'Menutup aktivitas siang dengan bersyukur dan memohon penjagaan sepanjang malam.',
    reference: 'HR. Muslim no. 2723'
  },
  {
    id: 'dzikir_bismillah_la_yadhurru',
    title: 'Perlindungan Dari Segala Bahaya',
    category: 'keduanya',
    targetCount: 3,
    arabicText: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    latinText: 'Bismillaahilladzii laa yadhurru ma\'asmihii syai-un fil-ardhi wa laa fis-samaa-i wa huwas-samii\'ul \'aliim.',
    translationId: 'Dengan nama Allah yang bersama nama-Nya tidak ada sesuatu pun di bumi maupun di langit yang dapat membahayakan, dan Dia Maha Mendengar lagi Maha Mengetahui.',
    benefit: 'Barangsiapa membacanya 3 kali pada pagi dan petang, maka tidak ada sesuatu pun yang dapat membahayakannya (racun, sihir, penyakit, dan marabahaya).',
    reference: 'HR. Abu Dawud & At-Tirmidzi'
  },
  {
    id: 'dzikir_radhitu_billah',
    title: 'Keridhaan Kepada Allah, Islam & Nabi',
    category: 'keduanya',
    targetCount: 3,
    arabicText: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا',
    latinText: 'Rodhiitu billaahi robbaa, wa bil-Islaami diinaa, wa bi Muhammadin shollallaahu \'alaihi wa sallama nabiyyaa.',
    translationId: 'Aku ridha Allah sebagai Tuhanku, Islam sebagai agamaku, dan Nabi Muhammad shallallahu \'alaihi wa sallam sebagai Nabiku.',
    benefit: 'Barangsiapa membacanya 3 kali di pagi dan petang hari, Allah berhak untuk meridhai hamba tersebut pada hari kiamat.',
    reference: 'HR. At-Tirmidzi & Ahmad'
  },
  {
    id: 'dzikir_tasbih_100',
    title: 'Tasbih & Tahmid 100 Kali',
    category: 'keduanya',
    targetCount: 100,
    arabicText: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    latinText: 'Subhaanallaahi wa bihamdih.',
    translationId: 'Maha Suci Allah dan segala puji bagi-Nya.',
    benefit: 'Barangsiapa membacanya 100 kali dalam sehari, maka dosa-dosanya akan diampuni meskipun sebanyak buih di lautan.',
    reference: 'HR. Al-Bukhari & Muslim'
  },
  {
    id: 'dzikir_istighfar_100',
    title: 'Istighfar Harian',
    category: 'keduanya',
    targetCount: 100,
    arabicText: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    latinText: 'Astaghfirullaaha wa atuubu ilayh.',
    translationId: 'Aku memohon ampun kepada Allah dan bertaubat kepada-Nya.',
    benefit: 'Membuka pintu rezeki, melapangkan dada, menghapus dosa, dan menjernihkan hati santri dalam menghafal Al-Qur\'an.',
    reference: 'HR. Al-Bukhari'
  },
  {
    id: 'dzikir_tahmid_tahlil',
    title: 'Tahlil 10x / 100x',
    category: 'keduanya',
    targetCount: 10,
    arabicText: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    latinText: 'Laa ilaaha illallaahu wahdahuu laa syariika lah, lahul-mulku wa lahul-hamdu wa huwa \'alaa kulli syai-in qodiir.',
    translationId: 'Tidak ada Tuhan selain Allah semata, tidak ada sekutu bagi-Nya. Milik-Nya segenap kerajaan dan pujian, dan Dia Mahakuasa atas segala sesuatu.',
    benefit: 'Pahala seperti memerdekakan sepuluh orang budak, dicatatkan seratus kebaikan, dan dihapuskan seratus keburukan.',
    reference: 'HR. Al-Bukhari & Muslim'
  },
];

export const DOA_TAHFIZ_LIST: DoaTahfizItem[] = [
  {
    id: 'doa_sebelum_hafalan',
    title: 'Doa Sebelum Mulai Menghafal Al-Qur\'an',
    category: 'sebelum_hafalan',
    arabicText: 'اللَّهُمَّ افْتَحْ عَلَيَّ حِكْمَتَكَ، وَانْشُرْ عَلَيَّ رَحْمَتَكَ، وَذَكِّرْنِي مَا نَسِيتُ، يَا ذَا الْجَلَالِ وَالْإِكْرَامِ. رَبِّ اشْرَحْ لِي صَدْرِي، وَيَسِّرْ لِي أَمْرِي، وَاحْلُلْ عُقْدَةً مِنْ لِسَانِي، يَفْقَهُوا قَوْلِي.',
    latinText: 'Allaahummaftah \'alayya hikmataka, wansyur \'alayya rohmataka, wa dzakkirnii maa nasiitu, yaa Dzal-jalaali wal-ikraam. Robbisroh lii shodrii, wa yassir lii amrii, wahlul \'uqdatam mil-lisaanii, yafqohuu qoulii.',
    translationId: 'Ya Allah, bukakanlah hikmah-Mu untukku, bentangkanlah rahmat-Mu atasku, dan ingatkanlah aku apa yang aku lupa, wahai Dzat Pemilik Keagungan dan Kemuliaan. Wahai Tuhanku, lapangkanlah dadaku, mudahkanlah urusanku, dan lepaskanlah kekakuan dari lidahku agar mereka mengerti perkataanku.',
    notes: 'Dibaca setiap kali hendak membuka mushaf, memulai ziyadah ayat baru, atau mengaji bersama ustadz/orang tua.'
  },
  {
    id: 'doa_keteguhan_hafalan',
    title: 'Doa Memohon Kekuatan Daya Ingat & Keteguhan Hafalan',
    category: 'keteguhan_hafalan',
    arabicText: 'اللَّهُمَّ إِنِّي أَسْتَوْدِعُكَ مَا قَرَأْتُ وَمَا حَفِظْتُ وَمَا تَعَلَّمْتُ، فَرُدَّهُ عَلَيَّ عِنْدَ حَاجَتِي إِلَيْهِ، وَلَا تُنْسِنِيهِ يَا رَبَّ الْعَالَمِينَ.',
    latinText: 'Allaahumma innii astaudi\'uka maa qoro\'tu wa maa hafizhtu wa maa ta\'allamtu, fa ruddahu \'alayya \'inda haajatii ilaih, wa laa tunsiniihi yaa Robbal-\'aalamiin.',
    translationId: 'Ya Allah, sesungguhnya aku menitipkan kepada-Mu apa yang telah aku baca, aku hafal, dan aku pelajari, maka kembalikanlah ia kepadaku ketika aku membutuhkannya, dan janganlah Engkau buat aku melupakannya wahai Tuhan seluruh alam.',
    notes: 'Sangat dianjurkan dibaca setelah selesai sesi ziyadah hafalan atau sebelum ujian/setoran hafalan.'
  },
  {
    id: 'doa_sesudah_hafalan',
    title: 'Doa Syukur Sesudah Menghafal',
    category: 'sesudah_hafalan',
    arabicText: 'الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ. اللَّهُمَّ اجْعَلِ الْقُرْآنَ رَبِيعَ قَلْبِي، وَنُورَ صَدْرِي، وَجَلَاءَ حُزْنِي، وَذَهَابَ هَمِّي.',
    latinText: 'Alhamdu lillaahilladzii bini\'matihii tatimmush-shoolihaat. Allaahummaj\'alil-Qur-aana robii\'a qalbii, wa nuura shodrii, wa jalaa-a huznii, wa dzahaaba hammii.',
    translationId: 'Segala puji bagi Allah yang dengan kenikmatan-Nya sempurnalah segala amal saleh. Ya Allah, jadikanlah Al-Qur\'an sebagai penyejuk hatiku, cahaya di dadaku, pelipur kesedihanku, dan penghilang rasa gundahku.',
    notes: 'Dibaca setelah merapikan mushaf agar hafalan senantiasa membimbing akhlak keseharian.'
  },
  {
    id: 'doa_khotmil_quran',
    title: 'Doa Khotmil Qur\'an (Khatam Hafalan / Juz)',
    category: 'khotmil_quran',
    arabicText: 'اللَّهُمَّ ارْحَمْنَا بِالْقُرْآنِ، وَاجْعَلْهُ لَنَا إِمَامًا وَنُورًا وَهُدًى وَرَحْمَةً، اللَّهُمَّ ذَكِّرْنَا مِنْهُ مَا نَسِينَا، وَعَلِّمْنَا مِنْهُ مَا جَهِلْنَا، وَارْزُقْنَا تِلَاوَتَهُ آنَاءَ اللَّيْلِ وَأَطْرَافَ النَّهَارِ، وَاجْعَلْهُ لَنَا حُجَّةً يَا رَبَّ الْعَالَمِينَ.',
    latinText: 'Allaahummarhamnaa bil-Qur-aan, waj\'al-hu lanaa imaamaw-wa nuuraw-wa hudaw-wa rohmah. Allaahumma dzakkirnaa minhu maa nasiinaa, wa \'allimnaa minhu maa jahilnaa, warzuqnaa tilaawatahuu aanaaa-al-laili wa athroofan-nahaar, waj\'al-hu lanaa hujjatan yaa Robbal-\'aalamiin.',
    translationId: 'Ya Allah, sayangilah kami dengan Al-Qur\'an. Jadikanlah ia bagi kami sebagai pemimpin, cahaya, petunjuk, dan rahmat. Ya Allah, ingatkanlah kami apa yang kami lupa darinya, ajarkanlah kami apa yang belum kami ketahui darinya, dan anugerahkanlah kami kemampuan membacanya di sepanjang malam dan di ujung-ujung siang, serta jadikanlah ia sebagai pembela kami wahai Tuhan seluruh alam.',
    notes: 'Doa agung penutup tilawah dan khatam tahfiz, mendatangkan keberkahan pada seluruh keluarga.'
  },
  {
    id: 'doa_birrul_walidain',
    title: 'Doa untuk Kedua Orang Tua & Mahkota Surga',
    category: 'kedua_orangtua',
    arabicText: 'رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا. اللَّهُمَّ أَلْبِسْ وَالِدَيَّ تَاجَ الْوَقَارِ وَحُلَّةَ الْكَرَامَةِ يَوْمَ الْقِيَامَةِ بِبَرَكَةِ حِفْظِي لِكِتَابِكَ.',
    latinText: 'Robbighfir lii wa liwaalidayya warhamhumaa kamaa robbayaanii shoghiiroo. Allaahumma albis waalidayya taajal-waqoor wa hullatal-karoomati yaumal-qiyaamati bibarakati hifzhii li-kitaabika.',
    translationId: 'Wahai Rabbku, ampunilah aku dan kedua orang tuaku, dan sayangilah mereka berdua sebagaimana mereka telah mendidikku di waktu kecil. Ya Allah, pakaikanlah kepada kedua orang tuaku mahkota kemuliaan dan jubah kehormatan pada hari kiamat kelak berkat hafalanku terhadap Kitab Suci-Mu.',
    notes: 'Niat suci setiap santri tahfiz agar dapat mempersembahkan mahkota cahaya di surga untuk ayah dan ibu tercinta.'
  }
];
