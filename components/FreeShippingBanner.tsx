export default function FreeShippingBanner() {
  return (
    <div
      className="shipping-banner"
      role="status"
      aria-label="Frete grátis na compra de qualquer item"
    >
      <div className="shipping-banner-inner" aria-hidden="true">
        <span>FRETE GRÁTIS</span>
        <span>NA COMPRA DE</span>
        <span>QUALQUER ITEM</span>
      </div>
    </div>
  );
}
