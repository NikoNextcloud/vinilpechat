'use strict';
const copy = require('../data/product-seo-copy.json');

function withProductCopy(product) {
 const entry = copy[product.id];
 // Preserve owner edits and never reuse copy after an article is renamed.
 return entry && product.name === entry.name && product.description === entry.previous
  ? {...product, description: entry.description}
  : product;
}

module.exports = {withProductCopy};
