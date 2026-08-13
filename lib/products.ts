export type Product = {
  id: string;
  brand: string;
  model: string;
  descriptor: string;
  price: string;
  priceValue: number;
  promotionalPriceValue: number | null;
  image: string;
  tag: string;
  category: string;
  specs: string[];
  stock: number;
  featured: boolean;
  recommended: boolean;
  active: boolean;
};

export const products: Product[] = [
  {
    id: "seiko-5-sports",
    brand: "SEIKO",
    model: "5 Sports",
    descriptor: "Automático · presença esportiva",
    price: "R$ 2.490*",
    priceValue: 2490,
    promotionalPriceValue: null,
    image: "/media/products/seiko-5-sports.jpg",
    tag: "Escolha do curador",
    category: "Automático",
    specs: ["Movimento automático", "Caixa em aço", "Estilo versátil"],
    stock: 0,
    featured: true,
    recommended: true,
    active: true,
  },
  {
    id: "casio-vintage",
    brand: "CASIO",
    model: "Vintage",
    descriptor: "Digital · design que atravessa gerações",
    price: "R$ 349*",
    priceValue: 349,
    promotionalPriceValue: null,
    image: "/media/products/casio-vintage.jpg",
    tag: "Ícone acessível",
    category: "Digital",
    specs: ["Display digital", "Bracelete metálico", "Perfil urbano"],
    stock: 0,
    featured: true,
    recommended: true,
    active: true,
  },
  {
    id: "citizen-tsuyosa",
    brand: "CITIZEN",
    model: "Tsuyosa",
    descriptor: "Automático · cor e precisão",
    price: "R$ 2.790*",
    priceValue: 2790,
    promotionalPriceValue: null,
    image: "/media/products/citizen-tsuyosa.jpg",
    tag: "Novo ritmo",
    category: "Automático",
    specs: ["Movimento automático", "Mostrador marcante", "Aço integrado"],
    stock: 0,
    featured: true,
    recommended: true,
    active: true,
  },
  {
    id: "orient-bambino",
    brand: "ORIENT",
    model: "Bambino",
    descriptor: "Automático · elegância sem excesso",
    price: "R$ 1.890*",
    priceValue: 1890,
    promotionalPriceValue: null,
    image: "/media/products/orient-bambino.jpg",
    tag: "Essencial clássico",
    category: "Automático",
    specs: ["Estética clássica", "Perfil refinado", "Uso social"],
    stock: 0,
    featured: false,
    recommended: true,
    active: true,
  },
  {
    id: "timex-q-reissue",
    brand: "TIMEX",
    model: "Q Reissue",
    descriptor: "Quartzo · herança reinterpretada",
    price: "R$ 1.290*",
    priceValue: 1290,
    promotionalPriceValue: null,
    image: "/media/products/timex-q-reissue.jpg",
    tag: "Design de arquivo",
    category: "Quartzo",
    specs: ["Movimento a quartzo", "Caixa em aço", "Visual atemporal"],
    stock: 0,
    featured: false,
    recommended: true,
    active: true,
  },
];

export const brandNames = ["SEIKO", "CASIO", "CITIZEN", "ORIENT", "TIMEX"];
