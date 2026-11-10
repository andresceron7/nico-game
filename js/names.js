/* =========================================================
   Nombres: ¿es Nico? ¿niño o niña?
   ---------------------------------------------------------
   - Nico: alguna palabra del nombre empieza por "nico" o "niko"
     (Nico, Nico Pro, Nicolás, Niko) o es exactamente "nic" / "nik".
     Nicole, Nicol, Nicolle, Nikol... NO cuentan (son niñas).
   - Género: lista de nombres comunes en español; si no está,
     termina en "a" = niña, si no = niño. Es una aproximación.
   ========================================================= */
const Names = (() => {
  'use strict';

  const norm = (s) => String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
  const words = (s) => norm(s).split(/[^a-z]+/).filter(Boolean);

  const GIRLS = new Set([
    'sofia', 'sofi', 'valentina', 'vale', 'isabella', 'isabela', 'isa', 'mariana', 'gabriela', 'gaby', 'valeria',
    'daniela', 'sara', 'sarah', 'salome', 'luciana', 'antonella', 'camila', 'cami', 'maria', 'martina', 'emilia',
    'samantha', 'victoria', 'juliana', 'manuela', 'manu', 'paula', 'pau', 'laura', 'lau', 'natalia', 'nati', 'andrea',
    'carolina', 'caro', 'catalina', 'cata', 'alejandra', 'aleja', 'ana', 'lucia', 'elena', 'julieta', 'renata', 'abril',
    'isabel', 'ximena', 'jimena', 'violeta', 'amelia', 'emma', 'olivia', 'mia', 'zoe', 'chloe', 'nicole', 'nicol',
    'nicolle', 'nikol', 'nikole', 'luna', 'celeste', 'irene', 'carmen', 'rocio', 'pilar', 'luz', 'ines', 'raquel',
    'beatriz', 'ivonne', 'yuliana', 'maite', 'belen', 'noelia', 'ester', 'esther', 'ruth', 'abigail', 'miriam', 'karen',
    'jennifer', 'tatiana', 'angie', 'mafe', 'majo', 'allison', 'ashley', 'evelyn', 'madison', 'scarlett', 'hannah',
    'raquel', 'margarita', 'rosa', 'dulce', 'consuelo', 'mercedes', 'dolores', 'soledad', 'marisol', 'maribel',
    'liz', 'lizeth', 'yuli', 'heidy', 'nicoll', 'aitana', 'ainhoa', 'noa', 'zoey', 'kim', 'grace', 'jazmin', 'mila',
  ]);
  // Nombres de niño que terminan en "a"
  const BOYS = new Set(['luca', 'joshua', 'borja', 'jona', 'elia', 'bautista', 'nikita']);

  function isNico(name) {
    return words(name).some((w) => {
      if (w === 'nic' || w === 'nik') return true;
      if (!(w.startsWith('nico') || w.startsWith('niko'))) return false;
      // "nicol..." / "nikol..." solo cuenta si es Nicolás
      if (/^ni[ck]ol/.test(w) && !/^ni[ck]olas/.test(w)) return false;
      return true;
    });
  }

  function gender(name) {
    const w = words(name)[0] || '';
    if (GIRLS.has(w)) return 'girl';
    if (BOYS.has(w)) return 'boy';
    if (w.endsWith('a')) return 'girl';
    return 'boy';
  }

  function hash(name) {
    let h = 2166136261;
    for (const ch of norm(name)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  return { isNico, gender, hash };
})();
