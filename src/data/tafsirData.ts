export interface SurahTafsirInfo {
  surahId: number;
  theme: string;
  asbabunNuzul: string;
  keyLessons: string[];
  moralVirtue: string;
}

export const TAFSIR_KANDUNGAN_MAP: Record<number, SurahTafsirInfo> = {
  1: {
    surahId: 1,
    theme: "Induk Al-Qur'an (Ummul Kitab) yang merangkum tauhid, ibadah, permohonan hidayah jalan lurus, dan hari pembalasan.",
    asbabunNuzul: "Diturunkan di Makkah pada awal masa kenabian. Malaikat Jibril mengajarkan bacaan ini sebagai rukun utama shalat yang tidak sah shalat tanpanya.",
    keyLessons: [
      "Setiap perbuatan baik harus diawali dengan Basmalah.",
      "Segala puji dan syukur sejati hanya tertuju kepada Allah semata.",
      "Hanya kepada Allah kita menyembah dan hanya kepada-Nya kita memohon pertolongan (Iyyaka na'budu wa iyyaka nasta'in).",
      "Doa terbaik adalah memohon istiqomah di jalan orang-orang yang diberi nikmat (para nabi, syuhada, dan orang shalih)."
    ],
    moralVirtue: "Menjadi obat (Asy-Syifa) bagi hati dan jasmani, penawar kegelisahan, dan pembuka segala kebaikan."
  },
  78: {
    surahId: 78,
    theme: "Berita Besar (An-Naba') mengenai Hari Kebangkitan, hisab amal, serta gambaran neraka dan surga yang kekal.",
    asbabunNuzul: "Kaum musyrikin Quraisy saling bertanya-tanya dan mendustakan kabar tentang hari kebangkitan setelah kematian yang dibawa oleh Rasulullah ﷺ. Maka Allah menurunkan surat ini sebagai penegasan mutlak.",
    keyLessons: [
      "Alam semesta (gunung sebagai pasak, siang untuk mencari rezeki, malam untuk istirahat) adalah bukti kekuasaan Allah membangkitkan manusia.",
      "Tiada satu amal perbuatan pun yang luput dari catatan malaikat pencatat amal.",
      "Pahala agung bagi orang yang bertakwa di surga penuh dengan mata air dan kenikmatan abadi.",
      "Penyesalan orang kafir di hari kiamat hingga mereka berangan-angan menjadi tanah saja."
    ],
    moralVirtue: "Mengingatkan anak dan santri agar senantiasa beramal shalih karena semua perbuatan akan dipertanggungjawabkan di hadapan Allah."
  },
  79: {
    surahId: 79,
    theme: "Malaikat-malaikat yang mencabut nyawa, kisah Nabi Musa menghadapi Fir'aun yang sombong, dan peristiwa dahsyat Hari Kiamat.",
    asbabunNuzul: "Diturunkan sebagai peringatan keras kepada kaum musyrikin yang merasa berkuasa dan menolak dakwah tauhid, berkaca pada kehancuran Fir'aun.",
    keyLessons: [
      "Kematian adalah kepastian; malaikat mencabut nyawa orang beriman dengan lembut dan orang kafir dengan keras.",
      "Kisah Fir'aun mengajarkan bahwa kesombongan dan kezaliman pasti berakhir dengan kehancuran.",
      "Barangsiapa melampaui batas dan mengutamakan duniawi, neraka Jahim tempatnya.",
      "Barangsiapa takut pada keagungan Tuhannya dan menahan hawa nafsu, surga adalah tempat kembalinya."
    ],
    moralVirtue: "Menumbuhkan rasa takut kepada dosa (khauf) dan mendidik jiwa agar mampu menahan hawa nafsu sejak usia dini."
  },
  80: {
    surahId: 80,
    theme: "Teguran penuh kasih kepada Nabi ﷺ terkait Ibnu Ummi Maktum (sahabat tunanetra), kemuliaan Al-Qur'an, dan nikmat rezeki dari Allah.",
    asbabunNuzul: "Rasulullah ﷺ sedang sibuk mendakwahi para pembesar Quraisy dengan harapan mereka masuk Islam. Datanglah Abdullah bin Ummi Maktum yang buta memohon diajarkan ayat Al-Qur'an. Rasulullah sempat bermuka masam karena terpotong bicaranya. Allah menegur dengan penuh kelembutan.",
    keyLessons: [
      "Islam tidak memandang status sosial, kekayaan, atau fisik seseorang; yang mulia di sisi Allah adalah ketakwaannya.",
      "Al-Qur'an berada di lembaran-lembaran yang mulia, ditinggikan, disucikan, di tangan para malaikat utusan yang mulia.",
      "Renungan penciptaan manusia dari setetes air mani dan kemudahan jalan hidup yang Allah berikan.",
      "Pada hari kiamat, setiap orang lari dari saudara, ibu, ayah, istri, dan anak-anaknya karena sibuk dengan urusannya sendiri."
    ],
    moralVirtue: "Mendidik santri untuk selalu menghormati siapapun tanpa membedakan fisik atau harta, serta menyayangi sesama penuntut ilmu."
  },
  93: {
    surahId: 93,
    theme: "Penghiburan dan janji kasih sayang Allah kepada Rasulullah ﷺ bahwa waktu akhirat jauh lebih baik dari duniawi.",
    asbabunNuzul: "Wahyu sempat terputus selama beberapa waktu (fatratul wahyi), kaum kafir mengejek bahwa Muhammad telah ditinggalkan Tuhannya. Allah menurunkan Adh-Dhuha untuk membantah mereka dan menghibur hati Nabi.",
    keyLessons: [
      "Allah tidak pernah meninggalkan hamba-Nya yang beriman dan bertakwa.",
      "Kehidupan akhirat jauh lebih utama dan kekal dibanding kesenangan semu dunia.",
      "Mengingat nikmat Allah saat kita lemah dan membutuhkan pertolongan.",
      "Larangan bersikap sewenang-wenang kepada anak yatim dan menghardik orang yang meminta-minta.",
      "Kewajiban mensyukuri dan menyebut-nyebut nikmat Allah (tahadduts bin ni'mah)."
    ],
    moralVirtue: "Menghadirkan ketenangan batin, optimisme tinggi saat menghadapi kesulitan belajar atau menghafal, dan kasih sayang kepada anak yatim."
  },
  94: {
    surahId: 94,
    theme: "Kelapangan dada, penghapusan beban, dan kepastian bahwa di balik setiap kesulitan selalu ada kemudahan.",
    asbabunNuzul: "Diturunkan sebagai kelanjutan dari Surat Adh-Dhuha untuk menenangkan dada Rasulullah ﷺ dalam mengemban risalah dakwah yang berat.",
    keyLessons: [
      "Allah yang melapangkan dada orang beriman dan mengangkat beban berat dari pundaknya.",
      "Janji pasti Allah: 'Fa inna ma'al 'usri yusroo, inna ma'al 'usri yusroo' (Sesungguhnya bersama kesulitan ada kemudahan).",
      "Kaidah manajemen waktu seorang muslim: apabila telah selesai suatu urusan, bersegeralah beribadah dan bersungguh-sungguh pada urusan berikutnya.",
      "Hanya kepada Allah semata hendaknya kita berharap dan menggantungkan cita-cita."
    ],
    moralVirtue: "Pemberi motivasi terkuat bagi santri saat merasa ayat hafalan terasa berat; bahwa pertolongan dan kemudahan Allah pasti tiba."
  },
  97: {
    surahId: 97,
    theme: "Kemuliaan malam Lailatul Qadr tempat Al-Qur'an pertama kali diturunkan, yang lebih baik dari seribu bulan.",
    asbabunNuzul: "Rasulullah ﷺ menceritakan seorang pejuang dari kalangan Bani Israil yang berjuang siang dan malam selama 1000 bulan. Para sahabat merasa iri karena umur umat Islam lebih pendek. Maka Allah menganugerahkan satu malam yang nilainya melebihi 1000 bulan.",
    keyLessons: [
      "Al-Qur'an adalah mukjizat teragung yang diturunkan pada malam penuh berkah (Lailatul Qadr).",
      "Malam tersebut lebih utama dari seribu bulan (lebih dari 83 tahun ibadah).",
      "Para malaikat dan Malaikat Jibril turun ke bumi membawa ketenangan, kedamaian, dan ampunan hingga terbit fajar."
    ],
    moralVirtue: "Menumbuhkan kecintaan mendalam pada Al-Qur'an dan semangat beribadah khususnya di sepuluh malam terakhir Ramadhan."
  },
  103: {
    surahId: 103,
    theme: "Sumpah demi waktu dan empat pilar utama agar manusia selamat dari kerugian hakiki.",
    asbabunNuzul: "Imam Asy-Syafi'i berkata: 'Seandainya Allah hanya menurunkan surat ini kepada manusia, niscaya telah mencukupi mereka sebagai petunjuk hidup.'",
    keyLessons: [
      "Waktu adalah modal hidup paling berharga yang tidak dapat diputar kembali.",
      "Semua manusia berada dalam kerugian, kecuali yang memiliki empat sifat:",
      "1. Beriman dengan benar.",
      "2. Beramal shalih secara ikhlas.",
      "3. Saling menasihati dalam kebenaran.",
      "4. Saling menasihati dalam kesabaran."
    ],
    moralVirtue: "Menumbuhkan disiplin waktu belajar tahfiz, istiqomah muraja'ah, dan saling menyemangati antar santri dan keluarga."
  },
  108: {
    surahId: 108,
    theme: "Nikmat yang berlimpah (Telaga Al-Kautsar), perintah shalat dan berqurban, serta kehancuran orang yang membenci Nabi ﷺ.",
    asbabunNuzul: "Ketika putra Rasulullah ﷺ (Al-Qasim dan Abdullah) wafat saat masih kecil, kaum kafir Quraisy mengejek bahwa Nabi 'Abtar' (terputus keturunan dan nama baiknya). Allah menurunkan surat ini membantah mereka.",
    keyLessons: [
      "Allah menganugerahkan nikmat yang melimpah (Al-Kautsar) kepada Rasulullah ﷺ dan umatnya.",
      "Wujud syukur atas nikmat Allah adalah dengan mendirikan shalat secara ikhlas dan menyembelih hewan qurban.",
      "Orang yang membenci syariat Islam dan Al-Qur'an dialah yang hakikatnya terputus dari segala kebaikan."
    ],
    moralVirtue: "Menanamkan rasa cinta mendalam kepada Rasulullah ﷺ dan mengajarkan keikhlasan dalam berkorban dan bersedekah."
  },
  112: {
    surahId: 112,
    theme: "Kemurnian tauhid (Al-Ikhlas) bahwa Allah Maha Esa, bergantung kepada-Nya segala sesuatu, tidak beranak dan tidak diperanakkan.",
    asbabunNuzul: "Kaum musyrikin Makkah datang kepada Nabi ﷺ bertanya: 'Wahai Muhammad, sebutkan kepada kami silsilah nasab Tuhanmu! Apakah dari emas, perak, atau tembaga?' Maka Allah menurunkan surat Al-Ikhlas.",
    keyLessons: [
      "Allah Maha Esa (Ahad) dalam dzat, sifat, dan perbuatan-Nya.",
      "As-Samad: Allah tempat bergantung seluruh makhluk memenuhi segala hajat dan kebutuhan.",
      "Allah suci dari memiliki anak, orang tua, ataupun tandingan.",
      "Pahala membaca surat ini setara dengan sepertiga Al-Qur'an."
    ],
    moralVirtue: "Fondasi aqidah paling kokoh bagi seorang muslim dan hafiz Qur'an dalam memurnikan ibadah hanya kepada Allah Ta'ala."
  },
  113: {
    surahId: 113,
    theme: "Memohon perlindungan kepada Penguasa Waktu Subuh dari kejahatan malam yang gelap, sihir, dan kedengkian orang yang hasad.",
    asbabunNuzul: "Rasulullah ﷺ pernah disihir oleh Labid bin Al-A'sham (seorang Yahudi) dengan simpul tali. Allah menurunkan Al-Falaq dan An-Nas sebagai ruqyah penawar yang menyembuhkan Nabi secara sempurna.",
    keyLessons: [
      "Perlindungan sejati dari segala kegelapan dan marabahaya ghaib hanya bersumber dari Allah.",
      "Bahaya penyakit hati berupa rasa iri dan dengki (hasad) yang dapat merusak amal.",
      "Bimbingan syariat untuk senantiasa membentengi diri dengan dzikir dan ruqyah syar'iyyah."
    ],
    moralVirtue: "Menjaga hati santri agar bersih dari iri dengki dan senantiasa merasa aman dalam lindungan Allah kapan pun dan di mana pun."
  },
  114: {
    surahId: 114,
    theme: "Memohon perlindungan kepada Raja dan Tuhan manusia dari bisikan jahat setan yang bersembunyi (Al-Waswas Al-Khannas).",
    asbabunNuzul: "Surat penutup mushaf Al-Qur'an yang berpasangan dengan Al-Falaq sebagai sebaik-baik perisai diri yang diturunkan kepada manusia.",
    keyLessons: [
      "Allah adalah Rabb (Pencipta), Malik (Raja Pemilik), dan Ilah (Sesembahan) segenap umat manusia.",
      "Musuh terbesar manusia adalah bisikan was-was setan yang membujuk kepada kemaksiatan, keraguan, dan rasa malas beribadah.",
      "Bisikan setan bisa datang dari golongan jin maupun dari manusia yang mengajak pada keburukan."
    ],
    moralVirtue: "Menjadi senjata harian penghafal Al-Qur'an untuk menepis rasa malas, bisikan mengantuk saat mengaji, dan godaan meninggalkan muraja'ah."
  }
};

export function getSurahTafsir(surahId: number): SurahTafsirInfo {
  if (TAFSIR_KANDUNGAN_MAP[surahId]) {
    return TAFSIR_KANDUNGAN_MAP[surahId];
  }
  return {
    surahId,
    theme: `Surat ke-${surahId} dalam Al-Qur'an yang sarat akan petunjuk, hikmah keimanan, dan kemuliaan syariat Allah Ta'ala.`,
    asbabunNuzul: `Diturunkan sebagai kalamullah yang suci untuk membimbing umat manusia menuju keselamatan dunia dan akhirat.`,
    keyLessons: [
      "Meningkatkan keimanan kepada Allah dan Rasul-Nya.",
      "Menjadikan Al-Qur'an sebagai pedoman dan akhlak utama dalam kehidupan.",
      "Menjaga hafalan dengan istiqomah mengulang (muraja'ah) dan mengamalkan kandungannya."
    ],
    moralVirtue: `Membaca dan menghafalnya mendatangkan pahala berlipat ganda, syafa'at di hari kiamat, serta ketenteraman jiwa.`
  };
}
