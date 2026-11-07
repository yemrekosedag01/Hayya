// Kur'an sesini iki yer çalabilir (Kuran sekmesi, ana sayfa kartı). Son çalan sahibi olur.
let owner = null;
export const getOwner = () => owner;
export const setOwner = (o) => { owner = o; };
