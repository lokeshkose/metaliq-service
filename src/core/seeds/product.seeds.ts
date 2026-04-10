import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  ProductCategory,
  ProductCategoryDocument,
} from '../database/mongo/schema/product-category.schema';

import { Product, ProductDocument } from '../database/mongo/schema/product.schema';

import { Price, PriceDocument } from '../database/mongo/schema/price.schema';

import { ProductCategoryTypes } from 'src/shared/enums/product-category.enums';
import { PriceType } from 'src/shared/enums/price.enums';
import { IdGenerator } from 'src/shared/utils/id-generator.utils';

@Injectable()
export class ProductSeeder {
  constructor(
    @InjectModel(ProductCategory.name)
    private readonly productCategoryModel: Model<ProductCategoryDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(Price.name)
    private readonly priceModel: Model<PriceDocument>,
  ) {}

  async seedProductData() {
    console.log('🚀 Product seeding started...');

    /* ======================================================
     * STEP 1: CREATE PARENT CATEGORIES
     * ====================================================== */

    const parentCategories = ['Metals Scrap', 'Tyre Scrap'];

    for (const name of parentCategories) {
      const exists = await this.productCategoryModel.findOne({ name });

      if (!exists) {
        await this.productCategoryModel.insertOne({
          name,
          type: ProductCategoryTypes.PARENT,
          categoryId: IdGenerator.generate('CAT', 8) as any,
          // parentId: null,
        });
      }
    }

    /* ======================================================
     * STEP 2: FETCH ALL CATEGORIES (FOR MAPPING)
     * ====================================================== */

    const allCategories = await this.productCategoryModel.find();

    const categoryMap = new Map<string, ProductCategoryDocument>();

    allCategories.forEach((cat) => {
      categoryMap.set(cat.name, cat);
    });

    /* ======================================================
     * STEP 3: CREATE CHILD CATEGORIES
     * ====================================================== */

    const childCategories = {
      'Metals Scrap': [
        'Iron',
        'Copper Scrap',
        'Brass',
        'Aluminium',
        'LEAD',
        'NICKEL',
        'ZINC',
        'TIN',
        'SS',
        'LME',
      ],
      'Tyre Scrap': ['Tyre Scrap', 'High carbon steel mesh wire'],
    };

    for (const parentName of Object.keys(childCategories)) {
      const parent = categoryMap.get(parentName);
      if (!parent) continue;

      for (const childName of childCategories[parentName]) {
        const exists = await this.productCategoryModel.findOne({
          name: childName,
          parentId: parent.categoryId,
        });

        if (!exists) {
          await this.productCategoryModel.create({
            name: childName,
            parentId: parent.categoryId,
            type: ProductCategoryTypes.CHILD,
            categoryId: IdGenerator.generate('CAT', 8) as any,
          });
        }
      }
    }

    /* ======================================================
     * STEP 4: REFETCH UPDATED CATEGORY MAP
     * ====================================================== */

    const updatedCategories = await this.productCategoryModel.find();

    const updatedCategoryMap = new Map<string, ProductCategoryDocument>();

    updatedCategories.forEach((cat) => {
      updatedCategoryMap.set(`${cat.name}_${cat.parentId || 'root'}`, cat);
    });

    /* ======================================================
     * STEP 5: DEFINE PRODUCTS
     * ====================================================== */

    const productsData = [
      // IRON
      {
        category: 'Iron',
        parent: 'Metals Scrap',
        products: [
          { name: 'Piece to Piece', price: 35 },
          { name: 'Mixed', price: 34 },
          { name: 'Selected', price: 34 },
          { name: 'MS Scrap(New)', price: 37.6 },
          { name: 'MS Scrap(Old)', price: 33.5 },
          { name: 'Billet', price: 45.8 },
          { name: 'MS Ingot', price: 44.8 },
          { name: 'Cast Iron(Local)', price: 39.2 },
        ],
      },

      // COPPER
      {
        category: 'Copper Scrap',
        parent: 'Metals Scrap',
        products: [
          { name: 'COPPER NO 1 SCRAP( MILLBERY)', price: 1058 },
          { name: 'COPPER NO 2 SCRAP', price: 1049 },
          { name: 'COPPER NO 3', price: 1034 },
          { name: 'Kalaiyya MIX', price: 927 },
          { name: 'CC', price: 1325 },
          { name: 'SD', price: 1276 },
          { name: 'ZERO', price: 1272 },
          { name: 'CCR', price: 1300 },
        ],
      },

      // BRASS (all price 0)
      {
        category: 'Brass',
        parent: 'Metals Scrap',
        products: ['Purja(AC)', 'HONEY', 'CHADRI', 'GUNMETAL', 'LOCAL', 'MIX', 'JALANDHAR'].map(
          (name) => ({ name, price: 0 }),
        ),
      },

      // ALUMINIUM
      {
        category: 'Aluminium',
        parent: 'Metals Scrap',
        products: [
          { name: 'Wire Scrap', price: 0 },
          { name: 'Section', price: 278 },
          { name: 'PURJA', price: 264 },
          { name: 'COMPANY', price: 0 },
          { name: 'LOCAL', price: 0 },
          { name: 'INGOT 99.99%', price: 0 },
          { name: 'BARTAN', price: 0 },
        ],
      },

      // LEAD
      {
        category: 'LEAD',
        parent: 'Metals Scrap',
        products: [
          { name: 'SOFT', price: 0 },
          { name: 'HARD', price: 0 },
        ],
      },

      // NICKEL
      {
        category: 'NICKEL',
        parent: 'Metals Scrap',
        products: [
          { name: 'RUSSIAN', price: 0 },
          { name: 'NORWAY', price: 0 },
        ],
      },

      // ZINC
      {
        category: 'ZINC',
        parent: 'Metals Scrap',
        products: [
          { name: 'INGOT', price: 0 },
          { name: 'DROSS', price: 0 },
          { name: 'TUKDA', price: 0 },
          { name: 'PMI', price: 0 },
        ],
      },

      // TIN
      {
        category: 'TIN',
        parent: 'Metals Scrap',
        products: [{ name: 'Tin', price: 0 }],
      },

      // SS
      {
        category: 'SS',
        parent: 'Metals Scrap',
        products: ['MIXMH', '202', '304', '309', '310', '316', '410'].map((name) => ({
          name,
          price: 0,
        })),
      },

      // LME
      {
        category: 'LME',
        parent: 'Metals Scrap',
        products: [
          'COPPER',
          'ALUMINIUM',
          'NICKLE',
          'ZINC',
          'LEAD',
          'SILVER',
          'GOLD',
          'TIN',
          'CRUDE',
        ].map((name) => ({ name, price: 0 })),
      },
    ];

    /* ======================================================
     * STEP 6: CREATE PRODUCTS + PRICE
     * ====================================================== */

    for (const group of productsData) {
      const key = `${group.category}_${updatedCategoryMap.get(`${group.parent}_root`)?.categoryId}`;

      const category = [...updatedCategories].find(
        (c) =>
          c.name === group.category &&
          updatedCategoryMap.get(`${group.parent}_root`)?.categoryId === c.parentId,
      );

      if (!category) continue;

      for (const product of group.products) {
        const exists = await this.productModel.findOne({
          name: product.name,
          categoryId: category.categoryId,
        });

        if (!exists) {
          const createdProduct = await this.productModel.create({
            name: product.name,
            categoryId: category.categoryId,
            productId: IdGenerator.generate('PROD', 8),
          });

          await this.priceModel.create({
            productId: createdProduct.productId,
            priceId: IdGenerator.generate('PRIC', 8),
            price: product.price || 0,
            type: PriceType.STANDARD,
            effectiveAt: new Date(),
          });
        }
      }
    }

    console.log('✅ Product seeding completed.');
  }
}
