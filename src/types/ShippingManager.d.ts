export {};

declare global {
  interface ShippingManagerShipperProduct {
    is_active: boolean;
    shipper_product_desc: string;
    shipper_product_id: number;
    shipper_product_name: string;
  }

  interface ShippingManagerShipper {
    feature_info: string[];
    image: string;
    is_active: boolean;
    is_whitelabel: boolean;
    shipper_id: number;
    shipper_name: string;
    text_promo: string;
    shipper_product: ShippingManagerShipperProduct[];
  }

  interface ShippingManagerShipperResult {
    ondemand: ShippingManagerShipper[];
    conventional: ShippingManagerShipper[];
  }
}
