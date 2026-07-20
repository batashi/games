/* ============================================
   إعدادات المنصة والألعاب
   ============================================ */

export const PEER_CONFIG = {
  host: '0.peerjs.com',
  port: 443,
  secure: true,
  debug: 1
};

export const GAMES = [
  { id: 'frankincense', name: 'مغامرة جامع اللبان', desc: 'قفز وتفادي العقبات في وادي اللبان.', icon: '🏃‍♂️', supportsSingle: true, supportsOnline: false },
  { id: 'camelrace', name: 'سباق الهجن في رمال الشرقية', desc: 'سباق مثير في الصحراء العمانية.', icon: '🐪', supportsSingle: false, supportsOnline: false },
  { id: 'candy', name: 'صائد الحلوى العمانية', desc: 'التقاط العناصر الساقطة قبل أن تختفي.', icon: '🍬', supportsSingle: false, supportsOnline: false },
  { id: 'castle', name: 'تحدي القلاع والحصون', desc: 'استراتيجية دفاع عن القلعة ضد صديق.', icon: '🏰', supportsSingle: false, supportsOnline: false },
  { id: 'explorer', name: 'مستكشف وادي شعيض/صلالة', desc: 'استكشاف وقفز بين المنصات الطبيعية.', icon: '🌄', supportsSingle: false, supportsOnline: false },
  { id: 'dagger', name: 'لغز الخنجر المفقود', desc: 'حل الألغاز وتركيب الصور التاريخية.', icon: '🗡️', supportsSingle: false, supportsOnline: false },
  { id: 'memory', name: 'تحدي الذاكرة التراثية', desc: 'طابق الصور والرموز العمانية.', icon: '🧠', supportsSingle: false, supportsOnline: false },
  { id: 'beachfootball', name: 'كرة القدم الشاطئية - صور', desc: 'مباراة سريعة ضد لاعب آخر عبر الإنترنت.', icon: '⚽', supportsSingle: false, supportsOnline: false },
  { id: 'nakhal', name: 'حارس قلعة نخل', desc: 'حماية القلعة من الرموز المعادية.', icon: '🏯', supportsSingle: false, supportsOnline: false },
  { id: 'archery', name: 'معركة قلاع الرماة', desc: 'وجه سهامك نحو قلعة الخصم ودمرها قبل أن يدمر قلعتك.', icon: '🏰', supportsSingle: true, supportsOnline: true },
  { id: 'boats', name: 'سباق السفن التقليدية (المواش)', desc: 'سباق بحري ثنائي عبر الإنترنت.', icon: '⛵', supportsSingle: false, supportsOnline: false },
  { id: 'farm', name: 'مزارع الجبل الأخضر', desc: 'زراعة الورد والرمان وجمع المخصب.', icon: '🌳', supportsSingle: false, supportsOnline: false },
  { id: 'trivia', name: 'تحدي الكلمات والعواصم', desc: 'أسئلة ثقافية عمانية سريعة.', icon: '❓', supportsSingle: false, supportsOnline: false },
  { id: 'sudoku', name: 'سودوكو الفرسان الصغار', desc: 'أرقام وأشكال مبسطة للأطفال.', icon: '🔢', supportsSingle: false, supportsOnline: false },
  { id: 'rally', name: 'مغرم الرالي الجبلي', desc: 'قيادة سيارة في الطرق الجبلية الوعرة.', icon: '🚗', supportsSingle: false, supportsOnline: false },
  { id: 'tictactoe', name: 'تيك تاك تو العمانية (X-O)', desc: 'لعبة XO بثيم الخنجر والمصار.', icon: '⚔️', supportsSingle: true, supportsOnline: true },
  { id: 'falaj', name: 'متاهة الفلج العماني', desc: 'توصيل المياه للمزارع عبر أزقة المتاهة.', icon: '🌀', supportsSingle: false, supportsOnline: false },
  { id: 'balloons', name: 'فرقعة البالونات العمانية', desc: 'سرعة البديهة لفرقعة البالونات.', icon: '🎈', supportsSingle: false, supportsOnline: false },
  { id: 'fishing', name: 'تحدي صيد الأسماك في شاطئ مطرح', desc: 'التوقيت الدقيق لجمع الأسماك.', icon: '🎣', supportsSingle: false, supportsOnline: false },
  { id: 'pottery', name: 'صانع الفخار', desc: 'تشكيل وتلوين الفخاريات العمانية.', icon: '🏺', supportsSingle: false, supportsOnline: false }
];

export const ARCHERY = {
  WIDTH: 1600,
  HEIGHT: 900,
  GROUND_Y: 760,
  FORT_WIDTH: 120,
  FORT_HEIGHT: 160,
  ARCHER_Y_OFFSET: 20,
  LEFT_FORT_X: 150,
  RIGHT_FORT_X: 1450,
  MAX_ARROW_POWER: 1300,
  MIN_ARROW_POWER: 700,
  ARROW_DAMAGE: 20,
  BLOCK_COLS: 4,
  BLOCK_ROWS: 5,
  WIND_MIN: -180,
  WIND_MAX: 180
};

export const ARCHER_POS = {
  left: { x: ARCHERY.LEFT_FORT_X, y: ARCHERY.GROUND_Y - ARCHERY.FORT_HEIGHT - ARCHERY.ARCHER_Y_OFFSET },
  right: { x: ARCHERY.RIGHT_FORT_X, y: ARCHERY.GROUND_Y - ARCHERY.FORT_HEIGHT - ARCHERY.ARCHER_Y_OFFSET }
};
