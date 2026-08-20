export type Product = {
  id: string;
  name: string;
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
    name: "Seiko 5 Sports",
    brand: "SEIKO",
    model: "5 Sports",
    descriptor: "Automático · presença esportiva",
    price: "R$ 2.490*",
    priceValue: 2490,
    promotionalPriceValue: null,
    image: "/media/products/seiko-5-sports-v2.jpg",
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
    name: "Casio Vintage",
    brand: "CASIO",
    model: "Vintage",
    descriptor: "Digital · design que atravessa gerações",
    price: "R$ 349*",
    priceValue: 349,
    promotionalPriceValue: null,
    image: "/media/products/casio-vintage-v2.jpg",
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
    name: "Citizen Tsuyosa",
    brand: "CITIZEN",
    model: "Tsuyosa",
    descriptor: "Automático · cor e precisão",
    price: "R$ 2.790*",
    priceValue: 2790,
    promotionalPriceValue: null,
    image: "/media/products/citizen-tsuyosa-v2.jpg",
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
    name: "Orient Bambino",
    brand: "ORIENT",
    model: "Bambino",
    descriptor: "Automático · elegância sem excesso",
    price: "R$ 1.890*",
    priceValue: 1890,
    promotionalPriceValue: null,
    image: "/media/products/orient-bambino-v2.jpg",
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
    name: "Timex Q Reissue",
    brand: "TIMEX",
    model: "Q Reissue",
    descriptor: "Quartzo · herança reinterpretada",
    price: "R$ 1.290*",
    priceValue: 1290,
    promotionalPriceValue: null,
    image: "/media/products/timex-q-reissue-v2.jpg",
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
