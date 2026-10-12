'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {listCards,selectGroups,makeVariants,pages}=require('../scripts/scorpio_garden_parser.cjs');
test('three known supplier pages are configured',()=>assert.equal(pages.length,3));
test('product card extraction keeps exact WooCommerce product URL, name and image',()=>{
 const html='<li class="product type-product post-123 instock product-type-variable"><a href="https://scorpioplast.com/dom-i-gradina/test/test-product/" class="product-images" aria-label="Мрежа за градина 1&#215;2м."><img data-orig-src="https://scorpioplast.com/wp-content/uploads/2024/06/net-500x500.jpg"></a><span class="price"><span class="woocommerce-Price-amount amount"><bdi>12.40&nbsp;<span>€</span></bdi></span></span></li>';
 const x=listCards(html,1);
 assert.equal(x.length,1);assert.equal(x[0].name,'Мрежа за градина 1×2м.');
 assert.equal(x[0].url,'https://scorpioplast.com/dom-i-gradina/test/test-product/');
 assert.equal(x[0].nominal[0],12.40);assert.ok(x[0].image.includes('wp-content/uploads/'));
 assert.equal(x[0].variable,true);
});
test('variant groups produce exact customer choice keys without selling prices',()=>{
 const html='<form class="variations_form cart"><label for="pa_size">Размер</label><select id="pa_size" name="attribute_pa_size"><option value="">Избери</option><option value="small">Малък</option><option value="large">Голям</option></select></form>';
 const groups=selectGroups(html),v=makeVariants(groups);assert.equal(groups.length,1);
 assert.equal(v.length,2);assert.equal(v[0].variant_key,'attribute_pa_size=small');
 assert.equal(v[0].sale_price,null);assert.equal(v[1].label,'Размер: Голям');
});
