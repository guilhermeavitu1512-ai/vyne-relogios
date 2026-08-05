export type Product = {
  brand: "SEIKO" | "CASIO" | "CITIZEN" | "ORIENT" | "TIMEX";
  model: string;
  descriptor: string;
  price: string;
  image: string;
  tag: string;
  category: "Automático" | "Digital" | "Quartzo";
  specs: string[];
};

export const products: Product[] = [
  {
    brand: "SEIKO",
    model: "5 Sports",
    descriptor: "Automático · presença esportiva",
    price: "R$ 2.490*",
    image:
      "https://images.unsplash.com/photo-1654544705636-2b6ddd388d96?auto=format&fit=crop&w=1800&q=88",
    tag: "Escolha do curador",
    category: "Automático",
    specs: ["Movimento automático", "Caixa em aço", "Estilo versátil"],
  },
  {
    brand: "CASIO",
    model: "Vintage",
    descriptor: "Digital · design que atravessa gerações",
    price: "R$ 349*",
    image:
      "https://images.unsplash.com/photo-1622527241521-a48f190a35cc?auto=format&fit=crop&w=1600&q=88",
    tag: "Ícone acessível",
    category: "Digital",
    specs: ["Display digital", "Bracelete metálico", "Perfil urbano"],
  },
  {
    brand: "CITIZEN",
    model: "Tsuyosa",
    descriptor: "Automático · cor e precisão",
    price: "R$ 2.790*",
    image:
      "https://images.unsplash.com/photo-1753620022899-f0aa1c34e331?auto=format&fit=crop&w=1800&q=88",
    tag: "Novo ritmo",
    category: "Automático",
    specs: ["Movimento automático", "Mostrador marcante", "Aço integrado"],
  },
  {
    brand: "ORIENT",
    model: "Bambino",
    descriptor: "Automático · elegância sem excesso",
    price: "R$ 1.890*",
    image:
      "https://images.unsplash.com/photo-1654544705636-2b6ddd388d96?auto=format&fit=crop&w=1600&q=88&sat=-22",
    tag: "Essencial clássico",
    category: "Automático",
    specs: ["Estética clássica", "Perfil refinado", "Uso social"],
  },
  {
    brand: "TIMEX",
    model: "Q Reissue",
    descriptor: "Quartzo · herança reinterpretada",
    price: "R$ 1.290*",
    image:
      "https://images.unsplash.com/photo-1708651145401-6be804cd02d4?auto=format&fit=crop&w=1600&q=88",
    tag: "Design de arquivo",
    category: "Quartzo",
    specs: ["Movimento a quartzo", "Caixa em aço", "Visual atemporal"],
  },
];

export const brandNames = ["SEIKO", "CASIO", "CITIZEN", "ORIENT", "TIMEX"];
