import React from 'react';
import { formatPrice } from '../services/menuService';
import './MenuItem.css';

import FreshBrew11Black from "./assets/FreshBrew_11_black.webp";
import FreshBrew11Green from "./assets/FreshBrew_11_green.webp";
import Fruity14 from "./assets/Fruity_14.webp";
import Fruity15 from "./assets/Fruity_15.webp";
import Fruity18 from "./assets/Fruity_18+(1).webp";
import MilkSeries01 from "./assets/MilkSeries_01.webp";
import MilkSeries02 from "./assets/MilkSeries_02.webp";
import MilkSeries03 from "./assets/MilkSeries_03.webp";
import MilkSeries04 from "./assets/MilkSeries_04.webp";
import MilkSeries05 from "./assets/MilkSeries_05.webp";
import MilkSeries06 from "./assets/MilkSeries_06.webp";
import MilkSeries07 from "./assets/MilkSeries_07.webp";
import MilkSeries08 from "./assets/MilkSeries_08.webp";
import MilkSeries09 from "./assets/MilkSeries_09.webp";
import MilkSeries10 from "./assets/MilkSeries_10.webp";

const MenuItem = ({ product }) => {

    const productImages = {
        "classic pearl milk tea": MilkSeries01,
        "honey pearl milk tea": MilkSeries02,
        "coffee creama": MilkSeries03,
        "coffee milk tea w/ coffee jelly": MilkSeries04,
        "hokkaido pearl milk tea": MilkSeries05,
        "thai pearl milk tea": MilkSeries06,
        "taro pearl milk tea": MilkSeries07,
        "mango green milk tea": MilkSeries08,
        "golden retriever": FreshBrew11Green,
        "coconut pearl milk tea": MilkSeries09,
        "classic tea": FreshBrew11Black,
        "honey tea": Fruity14,
        "mango green tea": Fruity15,
        "passion chess": Fruity18,
        "berry lychee burst": Fruity14,
        "peach tea w/ honey jelly": Fruity15,
        "mango & passion fruit tea": Fruity18,
        "honey lemonade": Fruity14,
        "matcha pearl milk tea": MilkSeries01,
        "matcha fresh milk": MilkSeries02,
        "strawberry matcha fresh milk": MilkSeries03,
        "mango matcha fresh milk": MilkSeries04,
        "matcha ice blended": MilkSeries05,
        "oreo w/ pearl": MilkSeries06,
        "taro w/ pudding": MilkSeries07,
        "thai tea w/ pearl": MilkSeries08,
        "coffee w/ ice cream": MilkSeries09,
        "mango w/ ice cream": MilkSeries10,
        "strawberry w/ lychee jelly & ice cream": Fruity18,
        "peach tea w/ lychee jelly": Fruity15,
        "lava flow": Fruity14,
        "tiger boba": MilkSeries10,
        "strawberry coconut": Fruity15,
        "strawberry coconut ice blended": Fruity18,
        "halo halo": MilkSeries09,
        "halo halo ice blended": MilkSeries10,
        "wintermelon lemonade": Fruity14,
        "wintermelon lemonade ice blended": Fruity15,
        "wintermelon w/ fresh milk": MilkSeries03,
    };

    const getProductImage = (productName) => {
        const normalizedName = productName.toLowerCase();
        return productImages[normalizedName];
    };

    const imageSrc = getProductImage(product.product_name);

    return (
        <div className="menu-item">
            {imageSrc ? (
                <div className="drink-icon">
                    <img 
                        src={imageSrc} 
                        alt={product.product_name}
                        style={{ width: '100%', maxWidth: '200px', height: 'auto' }}
                    />
                </div>
            ) : (
                <div className="drink-icon">🥤</div>
            )}
            <div className="product-name">{product.product_name}</div>
            <div className="product-price">{formatPrice(product.unit_price)}</div>
        </div>
    );
};

export default MenuItem;